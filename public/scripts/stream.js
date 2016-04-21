'use strict';
var socket = io();

function $(selector) {
  return document.querySelector(selector);
}

/*
  socket connection
*/
var socket = io();

/*
  debug image container
*/
var container = $('#container');

/*
  toggle raw and blend video
*/
var toggleBtn = $('#toggle');

/*
  canvas element rendering raw camera input
*/
var rawCanvas = $('#raw-canvas');

/*
  kahn tekst
*/
var rawCanvasCtx = rawCanvas.getContext('2d');

/*
  toggle the raw videos. callback for `toggleBtn` click
*/
function toggle(event) {
  event.preventDefault
  if(container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    toggleBtn.textContent = '-';
  } else {
    container.classList.add('hidden');
    toggleBtn.textContent = '+';
  }

}

/*
  hirozintally mirror canvas
  returns canvas
*/
function mirror(canvas) {
  var ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  return canvas;
}

/*
  center the canvas
  returns canvas
*/
function center(canvas) {

}
socket.on('frame', function(data) {
  var imageData = rawCanvasCtx.createImageData(260, 200);
  imageData.data.set(new Uint8ClampedArray(data));
  rawCanvasCtx.putImageData(imageData, 0, 0);
});

/*
  bitwise Math.round
  returns number
*/
function round(number) {
  return (number + .5) >> 0;
}

/*
  iteratively calculate and draw
  returns undefined
*/
// function loop() {
//
//   requestAnimFrame(loop);
// }

toggleBtn.addEventListener('click', toggle);
