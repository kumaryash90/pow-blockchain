# Week-2 Project - POW Blockchain
#### (ChainShot Bootcamp, Jan 2022)

Tried building a p2p network of miners, with simple consensus rules.
Need to add a few more features, and clean up the code a bit.


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
each miner will send handshake requests to existing miners upon joining, and update its peer-list

#### Sending transactions
run the script ```transactions.js```:
```cd scripts
node transactions.js --node=3456 --txn='a transaction, which is basically just a string'
```
upon receiving more than three transactions its mempool, a miner will start mining a block.

#### Assumptions etc.
- every miner is honest, thus no malicious blocks/transactions
- all transactions are just strings sent to the nodes
