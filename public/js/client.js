// canvas
var canvasEl = $('.canvas-output');

// ctx
var ctx = canvasEl.getContext('2d');

// ws
var ws = new WebSocket('ws://localhost:8080');

var img = new Image();

img.onload = function() {
  ctx.drawImage(this, 0, 0, 260, 200);
};

ws.onmessage = function(message) {
  img.src = message.data;
  //console.log('ws ', message.data);
};

// draw
function draw() {

}
