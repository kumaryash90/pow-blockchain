const axios = require('axios');
const { argv } = require('yargs');
const SHA256 = require('crypto-js/sha256');
//const Transaction = require('../models/Transaction');

const { node, txn } = argv;

//const transaction = JSON.stringify(new Transaction(txn));

// const client = jayson.client.http({
//     port: node
// });

// client.request('createTransaction', [transaction], function(err, res) {
//     if(err) throw err;
//     console.log(res.result);
// });
const hash = SHA256(txn).toString();
axios.post(`http://localhost:${node}/txn`, { txn, hash })
.then(res => console.log(res.data.msg));