const configData = require('./config');
const axios = require('axios');

function handshake(peer) {
    const body = JSON.stringify({
        portId: configData.PORT
    });
    // const request = new Request();
    axios.post(`http://localhost:${peer}/handshake`, {portId: configData.PORT})
    .then(res => console.log(res));
}

module.exports = { handshake };