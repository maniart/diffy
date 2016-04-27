
var http = require('http');
var ws = require('ws');
var url = require('url');
var utils = require('../utils');

var server = http.createServer();
var WebSocketServer = ws.Server;
var webSocketServer = new WebSocketServer({ server: server });

var logger = utils.createLogOnce();

server.listen(8081, function() {
  console.log('server 1 listening on 8081');
});

webSocketServer.on('connection', function connection(ws) {
  console.log('server 1: new client');
  ws.on('message', function incoming(message) {
    logger('-- message received', message);
    // webSocketServer.clients.forEach(function(client) {
    //   if(client.readyState === client.OPEN) {
    //     client.send(message);
    //   } else {
    //     console.error('client 1 is not ready');
    //   }
    //
    // });
  });

});
