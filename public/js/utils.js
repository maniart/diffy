'use strict';

/*
  shim requestAnimationFrame api
  source: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
*/
 var requestAnimFrame =
  window.requestAnimationFrame       ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame    ||
  window.oRequestAnimationFrame      ||
  window.msRequestAnimationFrame     ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };

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
  Utility for getting dom references
  return DOM Object
*/
function $(selector) {
  return document.querySelector(selector);
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
