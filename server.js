var http = require('http');
var express = require('express');
var ws = require('ws');
var url = require('url');

var app = express();
var server = http.createServer();
var WebSocketServer = ws.Server;
var webSocketServer = new WebSocketServer({ server: server });

app.use(express.static(__dirname + '/public'));
server.on('request', app);
server.listen(8080, function() {
  console.log('________ server listening on 8080');
});

webSocketServer.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  console.log('new client');
  ws.on('message', function incoming(message) {
    console.log('received: %s');
    webSocketServer.clients.forEach(function(client) {
      client.send(message);
    });
  });


});
