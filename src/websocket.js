const ws = require('ws');
const auth = require('./services/auth');

function websocketServer(expressServer)
{
    const websocketServer = new ws.Server({
        noServer: true,
        path: "/session",
    });

    expressServer.on("upgrade", (request, socket, head) => {
        console.log(socket);
        websocketServer.handleUpgrade(request, socket, head, (websocket) => {
            if(auth.websocketAuthCheck(request, websocket, head))
            {
                websocketServer.emit("connection", websocket, request);
            }
        });
    });

    websocketServer.on(
        "connection",
        function connection(websocketConnection, connectionRequest) {
            console.log(JSON.stringify(connectionRequest.headers));
            console.log("Websocket connected");
            websocketConnection.on("message", (message) => {
                console.log(message.toString());
            });
        }
    );

    return websocketServer;
};

module.exports = {
    websocketServer
};