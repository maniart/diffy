// canvas
// var canvas1 = $('.input-1');
// var canvas2 = $('.canvas-2');
// var canvas3 = $('.canvas-3');

// ctx
// var ctx1 = canvas1.getContext('2d');
// var ctx2 = canvas2.getContext('2d');
// var ctx3 = canvas3.getContext('2d');

// ws
var ws1 = new WebSocket('ws://localhost:8081');
// var ws2 = new WebSocket('ws://localhost:8082');
// var ws3 = new WebSocket('ws://localhost:8083');



var img1 = new Image();
img1.width = 260;
img1.height = 200;
// var img2 = new Image();
// var img3 = new Image();

document.body.appendChild(img1);

var logger = createLogOnce();

// img1.onload = function() {
//   ctx1.drawImage(this, 0, 0, 260, 200);
// };
// img2.onload = function() {
//   ctx2.drawImage(this, 0, 0, 260, 200);
// };
//
// img3.onload = function() {
//   ctx3.drawImage(this, 0, 0, 260, 200);
// };

ws1.onopen = function(event) {
  console.log('ws1 connected')
  ws1.onmessage = function(message) {
    // logger('---', message)
    img1.src = message.data;
  };
}
//
// ws2.onopen = function(event) {
//   console.log('ws2 connected')
//   ws2.onmessage = function(message) {
//     // logger('---', message)
//     img2.src = message.data;
//   };
// }
//
// ws3.onopen = function(event) {
//   console.log('ws3 connected')
//   ws3.onmessage = function(message) {
//     // logger('---', message)
//     img3.src = message.data;
//   };
// }
