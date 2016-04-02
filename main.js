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
  function(callback){
    window.setTimeout(callback, 1000 / 60);
  };

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
  utility function to log only once
*/
function createLogOnce() {
  var counter = 0;
  return function logOnce() {
    if(counter < 1) {
      console
        .log
        .apply(console, arguments);
      counter ++;
    }
  }
}

/*
  logger instance
*/
var logOnce_1 = createLogOnce();

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
  last captured imageData
*/
var currentImageData;
/*
  previous captured imageData
*/
var previousImageData;

/*
  video element rendering raw camera input
*/
var rawVideo = $('#raw-video');

/*
  canvas element rendering raw camera input
*/
var rawCanvas = $('#raw-canvas');

/*
  canvas element rendering blend image
*/
var blendCanvas = $('#blend-canvas');

/*
  blend canvas 2d context
*/
var blendCtx = blendCanvas.getContext('2d');

/*
  width of blend canvas
*/
var blendWidth = blendCanvas.width;

/*
  height of blend canvas
*/
var blendHeight = blendCanvas.height;

/*
  blend imageData
*/
var blendImageData = blendCtx.getImageData(0, 0, blendWidth, blendHeight);

/*
  is Worker available?
*/
var isWorkerAvailable = 'Worker' in window;

/*
  Worker
*/
var differ = new Worker('differ.js');

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
  draws stream into a output element (video or canvas)
  returns output
*/
function pipe(input, output) {
  /*TODO pipe needs to take in  function. refactor the api */
  if(typeof input === 'string' && typeof output === 'object') {
    // piping blob to video element
    output.src = input;
  } else if(typeof input === 'object' && typeof output === 'object') {
    // piping video to canvas
    output
      .getContext('2d')
      .drawImage(input, 0, 0, output.width, output.height);
  }

  return output;
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
  compare input and output average values
  returns ?
*/
function compare(input1, input2) {
  var length = input1.length;
  var data1 = input1.data;
  var data2 = input2.data
  var buffer = new ArrayBuffer(data1.length);

  differ.postMessage({
    buffer: buffer,
    data1: data1,
    data2: data2,
    width: blendWidth,
    height: blendHeight
  });
}

/*
  blend two consecutive frames
  returns imageData
*/
function blend(input, output) {
  var inputCtx = input.getContext('2d');
  var outputCtx = output.getContext('2d');
  var width = input.width;
  var height = input.height;
  currentImageData = inputCtx.getImageData(0, 0, width, height);
  previousImageData = previousImageData || inputCtx.getImageData(0, 0, width, height);
  compare(currentImageData, previousImageData);
}

/*
  center the canvas
  returns canvas
*/
function center(canvas) {

}

/*
  worker message event callback
  draws pixel buffer to blend canvas
*/
function drawBlendImage(messageEvent) {
  logOnce_1('main thread - ', messageEvent.data);
  blendImageData
    .data
    .set(
      new Uint8ClampedArray(messageEvent.data)
    );
  blendCtx.putImageData(blendImageData, 0, 0);
  previousImageData = currentImageData;
}

/*
  iteratively calculate and draw
  returns undefined
*/
function loop() {
  pipe(rawVideo, rawCanvas);
  blend(rawCanvas, blendCanvas);
  requestAnimFrame(loop);
}

/*
  kickstart the process
*/
capture()
  .then(
    function(input) {
      // order is important
      differ.addEventListener('message', drawBlendImage);
      [rawCanvas, blendCanvas].forEach(mirror);
      pipe(input, rawVideo);
      loop();
    }
  )
  .catch(
    function(error) {
      console.error('Failed to draw camera input to video ', error);
    }
  );
