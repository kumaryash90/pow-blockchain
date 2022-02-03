const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { argv, config } = require('yargs');
const fs = require('fs');

const db  = require('./utils/db');
const miner_util = require('./miner_util');
const configData = require('./utils/config');
const expReq = require('./expReq');
const Block = require('./models/Block');
const { startMining, stopMining, rollback, executeBlock, mine, broadcastBlock } = require('./mine');
const { initialize, sync } = require('./utils/initialize');
const { pollAndUpdate } = require('./utils/poller');
const TARGET_DIFFICULTY = BigInt('0x000'+'f'.repeat(61));

const { port, peer } = argv;
configData.PORT = port;
configData.MINER_PORT = port * 10;

const app = express();
app.use(cors());
app.use(express.json());


app.get('/peers', (req, res) => {
    res.send({ peers: [...db.peers] });
});

app.get('/status', (req, res) => {
    res.send({ status: true });
});

app.get('/sync', (req, res) => {
    res.send({ blocks: [...db.blockchain.blocks]});
});

app.post('/mined', (req, res) => {
    const { portId, block } = req.body;
    const { latestBlock, blockHash } = JSON.parse(block);
    if(portId === configData.MINER_PORT) {
        if(db.addMinedBlock && BigInt('0x'+blockHash) <= TARGET_DIFFICULTY) {
            res.send({ msg: "ok" });
            broadcastBlock(block);
            stopMining(latestBlock, blockHash);
        } else {

        }
    }
});

app.post('/handshake', (req, res) => {
    const { portId } = req.body;
    db.peers.push(portId);
    console.log("peers: ", db.peers);
    res.send({ portId: configData.PORT });
});

app.post('/txn', (req, res) => {
    const { txn, hash } = req.body;
    res.send({ msg: `received txn: ${txn} `});
    if(db.receivedTxns.indexOf(hash) < 0) {
        db.receivedTxns.push(hash);
        db.mempool.push(txn);
        //console.log(`received txn: ${txn}, ${hash}`);
        if(!db.mining && db.mempool.length > 3) {
            db.addMinedBlock = true;
            startMining();
        }
        db.peers.forEach(p => {
            axios.post(`http://localhost:${p}/txn`, { txn, hash});
        });
    }
    
});

app.post('/block', (req, res) => {
    const { block, blockNum, port } = req.body;
    const { latestBlock, blockHash } = JSON.parse(block);
    if(BigInt('0x'+blockHash) <= TARGET_DIFFICULTY) {
        db.addMinedBlock = false;
        res.send({ msg: "done" });
        stopMining(latestBlock, blockHash);
        console.log("my life is a lie: ", port);
        // if(db.justAdded === blockNum) {
        //     //stopMining()
        //     console.log("my timestamp: ", db.blockchain.blocks[blockNum].block.timestamp);
        //     console.log("other timestamp: ", latestBlock.timestamp);
        //     db.blockchain.blocks[blockNum].block.timestamp < latestBlock.timestamp ?
        //     console.log('ignore') :
        //     rollback(latestBlock, blockHash, blockNum);
        // } else {
            
        // }
        
    } else {
        res.send({ msg: "block difficulty not met" });
    }
});

app.listen(configData.PORT, () => {
    console.log(`listening on ${configData.PORT}`);
});

initialize(peer);
sync();

setInterval(pollAndUpdate, 10,000);


/*
    Miner process
*/

const app_miner = express();
app_miner.use(cors());
app_miner.use(express.json());

app_miner.get('/mine', (req, res) => {
    res.send({ msg: "mining now" });
    mine();
});

app_miner.listen(configData.MINER_PORT, () => {
    console.log(`miner running on ${configData.MINER_PORT}`);
});

