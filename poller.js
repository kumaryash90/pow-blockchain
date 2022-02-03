const axios = require('axios');
const db = require('./db');
const { writeBlocksToFile } = require('./initialize');

function pollAndUpdate() {
    // db.peers.forEach((peer, index) => {
    //     axios.get(`http://localhost:${peer}/status`)
    //     .then(res => {
    //         if(!res.data.status) {
    //             db.peers.splice(index, 1);
    //         }
    //     })
    //     .catch(err => {
    //         db.peers.splice(index, 1);
    //     });
    // });

    writeBlocksToFile();
}

module.exports = { pollAndUpdate };