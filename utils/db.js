const Blockchain = require('./models/Blockchain');

const db = {
    blockchain: new Blockchain(),
    peers: [],
    mempool: [],
    receivedTxns: [],
    receivedBlocks: [],
    justAdded: -1,
    mining: false,
    addMinedBlock: true
}

module.exports = db;