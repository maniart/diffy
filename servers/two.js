var http = require('http');
var ws = require('ws');
var url = require('url');
var utils = require('../utils');

var server = http.createServer();
var WebSocketServer = ws.Server;
var webSocketServer = new WebSocketServer({ server: server });

var logger = utils.createLogOnce();

server.listen(8082, function() {
  console.log('server 2 listening on 8082');
});

webSocketServer.on('connection', function connection(ws) {
  console.log('server 2: new client');
  ws.on('message', function incoming(message) {
    webSocketServer.clients.forEach(function(client) {
      if(client.readyState === client.OPEN) {
        client.send(message);
      } else {
        console.error('client 2 is not ready');
      }

    });
  });

});
