const EC = require('elliptic').ec;
const fs = require('fs');

function generateKeys(path) {
    const ec = new EC('secp256k1');
    const keys = ec.genKeyPair();
    const PRIVATE_KEY = keys.getPrivate().toString(16);
    const PUBLIC_KEY = keys.getPublic().encode('hex');

    fs.writeFileSync(path, JSON.stringify({
        PRIVATE_KEY,
        PUBLIC_KEY
    }));
}

module.exports = { generateKeys };


