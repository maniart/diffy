'use strict';

/*
  shim requestAnimationFrame api
  source: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
*/
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
  shim getUserMedia with a Promise api
  source: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*/
function getUserMedia(constraints, successCallback, errorCallback) {

  // First get a hold of getUserMedia, if present
  var getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia);

  // Some browsers just don't implement it - return a rejected promise with an error
  // to keep a consistent interface
  if(!getUserMedia) {
    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
  }

  // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
  return new Promise(function(successCallback, errorCallback) {
    getUserMedia.call(navigator, constraints, successCallback, errorCallback);
  });

}

// Older browsers might not implement mediaDevices at all, so we set an empty object first
if(navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if(navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = getUserMedia;
}


/*
  constraints object for getUserMedia
*/
var constraints = {
  audio: false,
  video: {
    width: 1280,
    height: 720
  }
};

/*
  latest captured image data
*/
var lastImageData;

/*
  video element rendering camera input
*/
var cameraOutput = document.querySelector('#camera-output');

/*
  capture from camera
  returns objectUrl
 */
function capture() {
  return navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      return window.URL.createObjectURL(stream);
    })
    .catch(function(error) {
      console.error(error.name + ' : ' + error.message);
    });
}

/*
  draws stream into a video element
  returns undefined
*/
function drawToVideo(stream) {
  cameraOutput.src = stream;
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
  return (value ^ (value >> 31)) - (value >> 31);
}

/*
  adjust contrast based on value and threshold
  returns 0 or 0XFF
*/
function contrast(value, threshold) {
  return (value > threshold) ? 0xFF : 0;
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
function drawToCanvas(canvas, resolutionX, resolutionY) {

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
  return capture()
    .then(drawToVideo)
    .catch(function(error) {
      console.error('Failed to draw camera input to video ', error);
    });
}
