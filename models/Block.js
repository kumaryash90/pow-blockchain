class Block {
    constructor(timestamp, transactions, prevHash, nonce) {
        this.timestamp = timestamp || Date.now();
        this.transactions = [];
        this.prevHash = prevHash || null;
        this.nonce = nonce || 0;
    }
    addTransaction(transactions) {
        this.transactions = [...transactions];
    }
}

module.exports = Block;