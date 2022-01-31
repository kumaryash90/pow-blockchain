const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { argv } = require('yargs');

const db = require('./db');
const configData = require('./config');
const expReq = require('./expReq');
const Block = require('./models/Block');
const { startMining, stopMining, rollback, executeBlock } = require('./mine');
const TARGET_DIFFICULTY = BigInt('0x00000'+'f'.repeat(59));

const { port, peer } = argv;
configData.PORT = port;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/peers', (req, res) => {
    res.send({ peers: [...db.peers] });
});

app.get('/sync', (req, res) => {

});

app.post('/handshake', (req, res) => {
    const { portId } = req.body;
    db.peers.push(portId);
    console.log("peers: ", db.peers);
    res.send({ portId: configData.PORT });
});

app.post('/txn', (req, res) => {
    const { txn, hash } = req.body;
    if(db.receivedTxns.indexOf(hash) < 0) {
        db.receivedTxns.push(hash);
        db.mempool.push(txn);
        console.log(`received txn: ${txn}, ${hash}`);
        db.peers.forEach(p => {
            axios.post(`http://localhost:${p}/txn`, { txn, hash});
        });
    }
    res.send({ msg: 'received txn '});
});

app.post('/block', (req, res) => {
    
    // const { blockData, blockHash } = JSON.parse(block);
    // console.log("blockhash is: ", blockHash);
    // if(BigInt('0x'+blockHash) <= TARGET_DIFFICULTY) {
    //     stopMining();
    //     console.log("my life is a lie");
    //     console.log("block height", db.blockchain.blockHeight());
    // }
    // res.send({ msg: "" });
    stopMining();
    const { block, blockNum, port } = req.body;
    const { latestBlock, blockHash } = JSON.parse(block);
        if(db.receivedBlocks.indexOf(blockHash) < 0) {
            db.receivedBlocks.push(blockHash);
            // db.peers.forEach(peer => {
            //     if(port !== peer.port) {
            //         console.log(`forwarding to ${peer.port}`);
            //         peer.sendBlock(block, blockNum);
            //     }
            // });
        }
        console.log("received block: ",latestBlock);
        console.log(`db.justAdded - ${db.justAdded}, blockNum - ${blockNum} `);
//---
        const newBlock = new Block(latestBlock.timestamp, 
                latestBlock.prevHash,
                latestBlock.nonce);
                newBlock.addTransaction(latestBlock.transactions);
            executeBlock(newBlock);
            db.blockchain.addBlock(newBlock, blockHash);
            db.justAdded++;
            console.log("added received block: ", '0x'+blockHash.toString());
            console.log("block nonce: ", latestBlock.nonce);
            console.log("total blocks: ", db.blockchain.blockHeight());
//---

        // if(db.justAdded === blockNum) {
        //     //stopMining()
        //     console.log("my timestamp: ", db.blockchain.blocks[blockNum].block.timestamp);
        //     console.log("other timestamp: ", latestBlock.timestamp);
        //     db.blockchain.blocks[blockNum].block.timestamp < latestBlock.timestamp ?
        //     console.log('ignore') :
        //     rollback(latestBlock, blockHash, blockNum);
        // } else if(db.justAdded < blockNum) {
        //     // const transactions = latestBlock.transactions.map(txn => {
        //     //     return new Transaction(txn.data);
        //     // });
        //     const newBlock = new Block(latestBlock.timestamp, 
        //         latestBlock.prevHash,
        //         latestBlock.transactions,
        //         latestBlock.nonce);
        //     executeBlock(newBlock);
        //     db.blockchain.addBlock(newBlock, blockHash);
        //     db.justAdded++;
        //     console.log("added received block: ", '0x'+blockHash.toString());
        //     console.log("block nonce: ", latestBlock.nonce);
        //     console.log("total blocks: ", db.blockchain.blockHeight());
        // } else {
        //     console.log("total blocks: ", db.blockchain.blockHeight());
        //     console.log("blockchain: ", db.blockchain.blocks);
        // }
        
        res.send({ msg: "done" });
});

app.listen(configData.PORT, () => {
    console.log(`listening on ${configData.PORT}`);
});

if(peer) {
    axios.post(`http://localhost:${peer}/handshake`, {portId: configData.PORT})
    .then(res => {
        db.peers.push(res.data.portId);
    })
    .then(() => {
        axios.get(`http://localhost:${peer}/peers`)
        .then(res => {
            const newPeers = [...res.data.peers];
            console.log("received peers: ", newPeers);
            newPeers.forEach(p => {
                if(db.peers.indexOf(p) < 0 && p !== configData.PORT){
                    axios.post(`http://localhost:${p}/handshake`, {portId: configData.PORT})
                    .then(res => {
                             db.peers.push(res.data.portId);
                    })
                    .then(() => console.log("updated peers: ", db.peers));
                }
            });
        });
    });   
}

startMining();

