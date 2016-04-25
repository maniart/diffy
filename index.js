var http = require('http');
var express = require('express');
var url = require('url');
var utils = require('./utils');

var app = express();
var server = http.createServer();

var logger = utils.createLogOnce();

app.use(express.static(__dirname + '/public'));
server.on('request', app);
server.listen(8080, function() {
  console.log('index listening on 8080');
});
