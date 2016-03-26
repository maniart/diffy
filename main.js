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
var prevSourceData;

/*
  video element rendering camera input
*/
var videoOutput = document.querySelector('#video-output');

/*
  canvas element rendering camera input
*/
var canvasOutput = document.querySelector('#canvas-output');

/*
  canvas element rendering blend
*/
var canvasBlend = document.querySelector('#canvas-blend');

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

}

/*
  compare input and output average values
  returns ?
*/
function compare(output, input1, input2) {
  var length = input1.length;
  var average1;
  var average2;
  var delta;
  var i = 0;

  while(i < length) {
    average1 = (input1[i*4] + input1[i*4+1] + input1[i*4+2]) / 2.5;
    average2 = (input2[i*4] + input2[i*4+1] + input2[i*4+2]) / 2.5;
    delta = polarize(abs(average1 - average2), 0x15);
    output[i*4] = delta;
    output[i*4+1] = delta;
    output[i*4+2] = delta;
    output[i*4+3] = 0xFF;
    ++i;
  }




}

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
  return (value > threshold) ? 0xFF : 0;
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
  var sourceData = inputCtx.getImageData(0, 0, width, height);
  prevSourceData = prevSourceData || inputCtx.getImageData(0, 0, width, height);
  var blendData = inputCtx.createImageData(width, height);
  compare(blendData.data, sourceData.data, prevSourceData.data);
  outputCtx.putImageData(blendData, 0, 0);
  prevSourceData = sourceData;
}

/*
  center the canvas
  returns canvas
*/
function center(canvas) {

}

/*
  initialize video capture
  returns promise
*/
function initializeVideo() {

}

/*
  iteratively calculate and draw
  returns undefined
*/
function loop() {
  pipe(videoOutput, canvasOutput);
  blend(canvasOutput, canvasBlend);
  requestAnimFrame(loop);
}

/*
  kickstart the process
*/
capture().then(
  function(input) {
    pipe(input, videoOutput);
    loop();
  }
).catch(
  function(error) {
    console.error('Failed to draw camera input to video ', error);
  }
);
