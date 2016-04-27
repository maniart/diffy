'use strict';

var messageData;
var buffer;
var data;
var data1;
var data2;
var width;
var height;
var sensitivity;
console.log('ssss')
// port should be variable. passable configurable etc if we need three servers
var port = 8081;
// assemble the endpoint url
var url = 'ws://localhost:' + port;

// create a WS connection
var ws = new WebSocket(url);
ws.binaryType = 'arraybuffer';


/*
  utility function to log only once
*/
function createLogOnce() {
  var counter = 0;
  return function logOnce() {
    if(counter < 1) {
      console
        .log
        .apply(console, arguments);
    }
    counter ++;
  }
}

var logger = createLogOnce();


/*
  bitwise abs operation
  returns value
*/
function abs(value) {
  return (value ^ (value >> 31)) - (value >> 31);
}

/*
  polarize pixel values based on value and threshold
  returns 0 or 0XFF
*/
function polarize(value, threshold) {
  return (value > threshold) ? 0xFF0033 : 0XFF;
}

/*
  create diff image pixel buffer
*/
function createDiffBuffer(messageEvent) {
  var i, average1, average2, delta;

  messageData = messageEvent.data;
  buffer = messageData.buffer;
  data1 = messageData.data1;
  data2 = messageData.data2;
  width = messageData.width;
  height = messageData.height;
  sensitivity = messageData.sensitivity;
  data = new Uint32Array(buffer);
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      i = y * width + x
      average1 = ((data1[i*4] + data1[i*4+1] + data1[i*4+2]) / 3) / sensitivity;
      average2 = ((data2[i*4] + data2[i*4+1] + data2[i*4+2]) / 3) / sensitivity;
      delta = polarize(
        abs(average1 - average2), 0x15
      );

      data[i] =
        (255   << 24) |    // alpha
        (delta << 16) |    // blue
        (delta <<  8) |    // green
         delta;           // red
    }
  }
  logger('differ - posting: ', buffer, ' bytelength is', buffer.byteLength);

  ws.send(buffer);
  this.postMessage(buffer);
}

ws.addEventListener('open', function() {
  this.addEventListener('message', createDiffBuffer);
}.bind(this));
