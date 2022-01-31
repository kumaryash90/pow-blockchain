# Week-2 Project - POW Blockchain
#### (ChainShot Bootcamp, Jan 2022)

Tried building a p2p network of miners, with simple consensus rules.
Need to add a few more features, and clean up the code a bit.

### What does it do:
- every node is connected to every other node, and all of them are miner nodes
- upon joining the network, the node performs handshake with a seed node and gets a list of peers
- transactions are sent manually, through the script ```transactions.js``` (right now the transactions are just strings)
- the nodes then propogate these transactions among their peers
- nodes start mining when mempool size > 3
- upon successfully mining a block, a node sends across its mined block to other nodes, who then stop mining right away (because assuming that all nodes are honest, and the blocks they send are correct too)
- the nodes then execute transactions (removing those from mempool) and add the block to their respective chains

(Still working on a few more functions to make it more complete and functional)


### How to run it:
#### Miners
to run miners, open new terminal window for each miner, and run the command:
```
node index.js --port=3456
```
the port could be anything.

to add subsequent miners, add a peer option too:
```
node index.js --port=3500 --peer=3456
```

#### Sending transactions
run the script ```transactions.js```:
```cd scripts
node transactions.js --node=3456 --txn='a transaction, which is basically just a string'
```
