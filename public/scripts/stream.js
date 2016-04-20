'use strict';
var socket = io();
socket.on('frame', function(e) {
  console.log(e);
});

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
function loop() {

  requestAnimFrame(loop);
}

toggleBtn.addEventListener('click', toggle);
