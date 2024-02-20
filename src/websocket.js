const ws = require('ws');
const url = require('url');
const auth = require('./services/auth');
const session = require('./services/session');

let websocketMap = new Map();

function heartbeat() {
    this.isAlive = true;
}

function removeWebsocket(ws)
{
    const sessionID = ws.sessionID
    let websockets = websocketMap.get(sessionID)
    if(websockets != null)
    {
        const index = websockets.indexOf(ws);
        websockets.splice(index, 1);
        if(websockets.length == 0) websocketMap.delete(sessionID)
    }
}

function websocketServer(expressServer)
{
    const websocketServer = new ws.Server({
        noServer: true,
        path: "/session",
    });

    const interval = setInterval(function() {
        websocketServer.clients.forEach(function(ws) {
            if (ws.isAlive === false){
                ws.terminate();
                removeWebsocket(ws);
                return;
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    expressServer.on("upgrade", (request, socket, head) => {
        const sessionID = url.parse(request.url, true).query.sessionID;
        websocketServer.handleUpgrade(request, socket, head, (websocket) => {
            if(auth.websocketAuthCheck(request, websocket, head))
            {
                websocket.sessionID = sessionID
                websocketServer.emit("connection", websocket, request);
            }
        });
    });

    websocketServer.on(
        "connection",
        function connection(ws, connectionRequest) {
            console.log("Websocket connected");
            heartbeat(ws)
            let websockets = websocketMap.get(ws.sessionID)
            if(websockets == null)
            {
                websockets = []
                websocketMap.set(ws.sessionID, websockets)
            }
            websockets.push(ws)
            ws.on("message", (message)=>{
                let request = JSON.parse(message.toString())
                session.handleOperation(ws, request)
                .then((res)=>{
                    ws.send(JSON.stringify(res))
                    if(res.result == 200)
                    {
                        websocketServer.clients.forEach(function(client) {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(request);
                            }
                        });
                    }
                })
                .catch(e=>{
                    console.log(e)
                    ws.send(500)
                })
            });
            ws.on("close", (code, reason)=>{
                removeWebsocket(ws)
                clearInterval(interval);
            });
            ws.on('pong', heartbeat);
        }
    );

    return websocketServer;
};

module.exports = {
    websocketServer
};