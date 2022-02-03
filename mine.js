const SHA256 = require('crypto-js/sha256');
const axios = require('axios');

const configData = require('./utils/config');
const db = require('./utils/db');
const Block = require('./models/Block');
//const Transaction = require('./models/Transaction');
//const UTXO = require('./models/UTXO');
const TARGET_DIFFICULTY = BigInt('0x000'+'f'.repeat(61));
const BLOCK_REWARD = 10;

function mine() {
        const latestBlock = new Block();
        // const coinbaseUTXO = new UTXO(PUBLIC_KEY, BLOCK_REWARD);
        // const coinbaseTxn = JSON.stringify(new Transaction([], [coinbaseUTXO]));
        const coinbaseTxn = `miner: ${configData.PORT}`;
        const transactions = db.mempool.slice(0, 3);
        transactions.unshift(coinbaseTxn);

        latestBlock.addTransaction(transactions);
        let blockHash = SHA256(JSON.stringify(latestBlock));

        while(BigInt('0x'+blockHash.toString()) > TARGET_DIFFICULTY) {
            latestBlock.nonce++;
            blockHash = SHA256(JSON.stringify(latestBlock));
            //console.log(blockHash.toString());
        }
        const tempBlock = JSON.stringify({ latestBlock: latestBlock, blockHash: blockHash.toString() });
        axios.post(`http://localhost:${configData.PORT}/mined`, { portId: configData.MINER_PORT, block: tempBlock })
        .then(res => {

        })
        .catch(err => {

        });
}

function rollback(latestBlock, blockHash, blockNum) {
    const rollbackBlock = db.blockchain.blocks[blockNum].block;
    console.log("rolling back: ", rollbackBlock);
    rollbackBlock.transactions.shift();
    rollbackBlock.transactions.forEach(txn => {
        db.mempool.push(txn);
    });
    // const transactions = latestBlock.transactions.map(txn => {
    //     return new Transaction(txn.data);
    // });
    const newBlock = new Block(latestBlock.timestamp, 
        latestBlock.prevHash,
        latestBlock.transactions,
        latestBlock.nonce);
    executeBlock(newBlock);
    db.blockchain.blocks.pop();
    db.blockchain.addBlock(newBlock, blockHash);
    console.log("added after rolling back: ", '0x'+blockHash.toString());
    console.log("block nonce: ", latestBlock.nonce);
    console.log("total blocks: ", db.blockchain.blockHeight());
    //startMining();
}

function executeBlock(block) {
    block.transactions.forEach(txn => {
        //console.log(db.mempool);
        let index = db.mempool.indexOf(txn);
        //console.log("executing transactions.. index is: ", index);
        if(index > -1) db.mempool.splice(index, 1);
        //txn.execute();
    });
    //console.log("mempool after executing block: ", db.mempool);
}

function broadcastBlock(block) {
    db.peers.forEach(peer => {
        axios.post(`http://localhost:${peer}/block`, { block: block, blockNum: db.justAdded, port: configData.PORT })
        .then(res => console.log(res.data.msg));
    });
}

function startMining() {
    db.mining = true;
    axios.get(`http://localhost:${configData.MINER_PORT}/mine`)
    .then(res => {

    })
    .catch(err => {
        db.mining = false;
    })
}

function stopMining(latestBlock, blockHash) {
    console.log('mining stopped');
    const newBlock = new Block(latestBlock.timestamp, 
    latestBlock.prevHash,
    latestBlock.nonce);
    newBlock.addTransaction(latestBlock.transactions);
    executeBlock(newBlock);
    db.blockchain.addBlock(newBlock, blockHash);
    db.justAdded++;
    setTimeout(() => {
        console.log("executed block: ", latestBlock);
        console.log("block height: ", db.blockchain.blockHeight());
        db.mining = false;
    }, 10);
}

module.exports = { startMining, stopMining, rollback, executeBlock, mine, broadcastBlock };