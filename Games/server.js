const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const players = {};

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9);

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch(data.type) {
            case 'join':
                players[ws.id] = {
                    name: data.name,
                    position: { x: 0, y: 0, z: 5 },
                    rotation: { x: 0, y: 0, z: 0 }
                };
                broadcastToAll({
                    type: 'playerJoined',
                    id: ws.id,
                    name: data.name
                });
                break;
            case 'move':
                if (players[ws.id]) {
                    players[ws.id].position = data.position;
                    players[ws.id].rotation = data.rotation;
                }
                break;
            case 'shoot':
                broadcastToAll({
                    type: 'bullet',
                    position: data.position,
                    velocity: data.velocity
                });
                break;
        }

        broadcastToAll({
            type: 'updatePlayers',
            players: players
        });
    });

    ws.on('close', () => {
        delete players[ws.id];
        broadcastToAll({
            type: 'playerLeft',
            id: ws.id
        });
    });
});

function broadcastToAll(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});