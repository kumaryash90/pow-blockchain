const Block = require('./Block');

class Blockchain {
    constructor() {
        this.blocks = [];
    }

    blockHeight() {
        return this.blocks.length;
    }

    addBlock(block, hash) {
        let len = this.blockHeight();
        if(len) {
            block.prevHash = this.blocks[len - 1].hash;
        }
        let newBlock = {
            hash, block
        }
        this.blocks.push(newBlock);
    }
}

module.exports = Blockchain;