const net = require('net');
const { argv } = require('yargs');
const {PromiseSocket, TimeoutError} = require("promise-socket");

const db = require('./db');
const configData = require('./config');
const tcpReq = require('./tcpReq');
const { HANDSHAKE } = require('./tcpReq');

const host = '127.0.0.1';
const { port, peer } = argv;
configData.PORT = port;

const tcpServer = net.createServer();

tcpServer.on('connection', (socket) => {
    handleRequests(socket);
    socket.on('close', (data) => {
        let index = db.peers.findIndex(s => {
            return s.remoteAddress === socket.remoteAddress && s.remotePort === socket.remotePort;
        });
        if(index !== -1) {
            db.peers.splice(index, 1);
            console.log(`closed: ${socket.remoteAddress}:${socket.remotePort}`);
        }
    })
});

tcpServer.listen(configData.PORT, host, () => {
    console.log("server running on port", configData.PORT);
});

if(peer) {
    const client = net.Socket();
    const promiseSocket = new PromiseSocket(client);
    
    client.connect(peer, host, () => {
        handleRequests(client);    
        console.log("connected to server at: ", peer);
        client.write(JSON.stringify({
            type: tcpReq.HANDSHAKE,
            content: { port: configData.PORT },
        }));
    });
}

async function connectPeers(newPeers) {
    newPeers.forEach(p => {
        const client = net.Socket();
        const promiseSocket = new PromiseSocket(client);
        
        client.connect(p, host, () => {
            handleRequests(client);
            client.write(JSON.stringify({
                type: tcpReq.HANDSHAKE,
                content: { port: configData.PORT },
            }));
            
        });
    });
}

 function handleRequests(socket) {
    socket.on('data', (data) => {
        const req = JSON.parse(data);
        console.log("request received: ", req);
        
        switch(req.type) {
            case tcpReq.HANDSHAKE:
                db.peers.push({
                    peerPort: req.content.port,
                    peerSocket: socket
                });
                //console.log("my updated peers: ", db.peers.map(p => p.peerPort));
                socket.write(JSON.stringify({
                    type: tcpReq.ACK_HANDSHAKE,
                    content: { port: configData.PORT },
                }));
                break;
            case tcpReq.ACK_HANDSHAKE:
                db.peers.push({
                    peerPort: req.content.port,
                    peerSocket: socket
                });
                socket.write(JSON.stringify({
                    type: tcpReq.REQ_PEERS,
                    content: ""
                }));
            case tcpReq.REQ_PEERS:
                socket.write(JSON.stringify({
                    type: tcpReq.RES_PEERS,
                    content: JSON.stringify(db.peers.map(p => p.peerPort))
                }));
                break;
            case tcpReq.RES_PEERS:
                const peers = [...JSON.parse(JSON.parse(data).content)];
                console.log("received peers: ", peers);
                const newPeers = peers.filter(p => {
                    let index = db.peers.findIndex(s => {
                        return s.peerPort === p;
                    });
                    return configData.PORT !== p && index === -1;
                });
                if(newPeers.length > 0) connectPeers(newPeers);
                break;
            default:
                // 
        }
    });

    socket.on('close', (data) => {
        console.log("connection closed");
    });
}