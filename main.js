'use strict';

window.requestAnimFrame = (function(){
  return
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
})();

/*
  latest captured image data
*/
var lastImageData;
/*
  capture from camera
  returns stream object url
 */
function capture() {

}

/*
  hirozintally mirror canvas
  returns canvas
*/
function mirror(canvas) {

}

/*
  bitwise abs operation
  returns value
*/
function abs(value) {

}

/*
  adjust contrast based on value and threshold
  returns 0 or 0XFF
*/
function contrast(value, threshold) {

}

/*
  blend two consecutive frames
  returns imageData
*/
function blend(canvas, width, height) {

}

/*
  draw the motion image to canvas
  returns canvas
*/
function draw(canvas, resolutionX, resolutionY) {

}

/*
  center the canvas
  returns canvas
*/
function center(canvas) {

}

/*
  iteratively calculate and draw
  returns undefined
*/
function loop() {

}

/*
  kickstart the process
  returns undefined
*/
function initialize() {

}
