var express = require('express');
var app = express();

app.use(express.static('public'));
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + 'static/index.html');
});

function relay(blob) {
  toBuffer(blob, function(err, buffer) {
    if(err) throw err;


  });
}

io.on('connection', function (socket) {
  console.log('camera connected');
  socket.on('stream', function (buffer) {
    // console.log('stream ', data);
    // console.log(buffer);
    io.sockets.emit('frame', buffer);
    // relay(blob);
  });


});
