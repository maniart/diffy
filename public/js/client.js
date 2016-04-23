// canvas
var canvas1 = $('.canvas-1');
var canvas2 = $('.canvas-2');
var canvas3 = $('.canvas-3');

// ctx
var ctx1 = canvas1.getContext('2d');
var ctx2 = canvas2.getContext('2d');
var ctx3 = canvas3.getContext('2d');

// ws
var ws = new WebSocket('ws://localhost:8080');

var img1 = new Image();
var img2 = new Image();
var img3 = new Image();


img1.onload = function() {
  ctx1.drawImage(this, 0, 0, 260, 200);
};
img2.onload = function() {
  ctx2.drawImage(this, 0, 0, 260, 200);
};

img3.onload = function() {
  ctx3.drawImage(this, 0, 0, 260, 200);
};

ws.onmessage = function(message) {
  img1.src = message.data
  img2.src = message.data
  img3.src = message.data
  //console.log('ws ', message.data);
};

// draw
function draw() {

}
