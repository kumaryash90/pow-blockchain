const Blockchain = require('./models/Blockchain');

const db = {
    blockchain: new Blockchain(),
    peers: [],
    mempool: [],
    receivedTxns: [],
    receivedBlocks: [],
    justAdded: -1
}

module.exports = db;