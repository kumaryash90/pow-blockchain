const axios = require('axios');
const http = require('http');
const { argv } = require('yargs');
const SHA256 = require('crypto-js/sha256');

//const Transaction = require('../models/Transaction');

const { node } = argv;

//const transaction = JSON.stringify(new Transaction(txn));

// const client = jayson.client.http({
//     port: node
// });

// client.request('createTransaction', [transaction], function(err, res) {
//     if(err) throw err;
//     console.log(res.result);
// });
let count = 0;
let nodeList = [node];
axios.get(`http://localhost:${node}/peers`)
            .then(res => {
                nodeList.push(...res.data.peers);
                console.log("received nodes: ", nodeList);
            });

setInterval(() => {
    const txn = "transaction" + count++;
    const hash = SHA256(txn).toString();
    const index = Math.floor(nodeList.length * Math.random());
    const selectedNode = nodeList[index];
    axios.post(`http://localhost:${selectedNode}/txn`, 
        { txn, hash }, 
        { 
            timeout: 10000,
            httpAgent: new http.Agent({ keepAlive: true })
        }
    )
    .then(res => console.log(res.data.msg))
    .catch(err => console.log(`some error with ${selectedNode}`));

}, 5000);