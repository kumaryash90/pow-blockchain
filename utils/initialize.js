const axios = require('axios');
const fs = require('fs');
const configData = require('./config');
const db = require('./db');
const { executeBlock } = require('../mine');
const { generateKeys } = require('./generate');

function initialize(peer) {
    if(!fs.existsSync(`./${configData.PORT}/`)) {
        fs.mkdirSync(`./${configData.PORT}/`);
        console.log(`created new directory ./${configData.PORT}/`);
        generateKeys(`./${configData.PORT}/keys.json`);
    } else {
        const keys = JSON.parse(fs.readFileSync(`./${configData.PORT}/keys.json`));
        const blocks = JSON.parse(fs.readFileSync(`./${configData.PORT}/blocks.json`));
        blocks.forEach(blockData => {
            executeBlock(blockData.block);
            db.blockchain.addBlock(blockData.block, blockData.hash);
            db.justAdded++;
        });
    }

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
}

async function sync() {
    const blockHeight = db.blockchain.blockHeight();
    console.log("blockheight: ", blockHeight);
    setTimeout(() => {
        const longestChain = getLongestChain();
    console.log("longest chain: ", longestChain);
    if(blockHeight < longestChain.blockHeight) {
        axios.get(`http://localhost:${longestChain.peer}/sync`)
        .then(res => {
            res.data.blocks.forEach(blockData => {
                executeBlock(blockData.block);
                db.blockchain.addBlock(blockData.block, blockData.hash);
                db.justAdded++;
            });
        });
     }
    }, 2000);
}

function getLongestChain() {
    const peerBlockHeight = db.peers.map(peer => {
        axios.get(`http://localhost:${peer}/blockHeight`)
        .then(res => {
            return { peer: peer, blockheight: res.data.blockHeight}
        });
    });
    
    setTimeout(() => {
            const max = peerBlockHeight.reduce((prev, current) => {
            return current.blockHeight > prev.blockHeight ? current : prev
        }, {});
        return max;
    }, 1000);

}

function writeBlocksToFile() {
    fs.writeFileSync(`./${configData.PORT}/blocks.json`, JSON.stringify(db.blockchain.blocks));
}

module.exports = { initialize, sync, writeBlocksToFile };