const SHA256 = require('crypto-js/sha256');
const axios = require('axios');

const configData = require('./config');
const db = require('./db');
const Block = require('./models/Block');
//const Transaction = require('./models/Transaction');
//const UTXO = require('./models/UTXO');
const TARGET_DIFFICULTY = BigInt('0x00000'+'f'.repeat(59));
const BLOCK_REWARD = 10;

let mining = true;
//let tempBlock = {};
//let tempTransactions = [];
let pause = false;

function mine() {
    if(!mining) return;

    if(db.mempool.length > 3) {
        const latestBlock = new Block();
        // const coinbaseUTXO = new UTXO(PUBLIC_KEY, BLOCK_REWARD);
        // const coinbaseTxn = JSON.stringify(new Transaction([], [coinbaseUTXO]));
        const coinbaseTxn = `miner: ${configData.PORT}`;
        const transactions = db.mempool.slice(0, 3);
        transactions.unshift(coinbaseTxn);

        latestBlock.addTransaction(transactions);
        let blockHash = SHA256(JSON.stringify(latestBlock));

        while(BigInt('0x'+blockHash.toString()) > TARGET_DIFFICULTY) {
            if(mining) {
                latestBlock.nonce++;
                blockHash = SHA256(JSON.stringify(latestBlock));
            } else {
                console.log('after mining stopped!');
                return;
            }
        }
        setTimeout(() => {
            if(!mining) return;
            const tempBlock = JSON.stringify({ latestBlock: latestBlock, blockHash: blockHash.toString() });
            // tempTransactions = transactions;
            console.log(db.peers);
            db.peers.forEach(peer => {
                axios.post(`http://localhost:${peer}/block`, { block: tempBlock, blockNum: db.justAdded, port: configData.PORT })
                .then(res => console.log(res.data.msg));
            });
            
            executeBlock(latestBlock);
            db.blockchain.addBlock(latestBlock, blockHash);
            db.justAdded++;
            //console.log("just added: ", db.justAdded);
            console.log("added block: ", '0x'+blockHash.toString());
            console.log("block nonce: ", latestBlock.nonce);
            console.log("total blocks: ", db.blockchain.blockHeight());
        }, 100);
    }
    setTimeout(() => mine(), 5000);
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
        console.log(db.mempool);
        let index = db.mempool.indexOf(txn);
        //console.log("executing transactions.. index is: ", index);
        if(index > -1) db.mempool.splice(index, 1);
        //txn.execute();
    });
    console.log("mempool after executing block: ", db.mempool);
    setTimeout(() => startMining(), 100);
}

function startMining() {
    mining = true;
    mine();
}

function stopMining() {
    mining = false;
    console.log('mining stopped');
}

module.exports = { startMining, stopMining, rollback, executeBlock };