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
  TODO: refactor
*/
var blendWidth = canvasBlend.width;
var blendHeight = canvasBlend.height;


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
function compare(input1, input2) {
  // debugger;
  var length = input1.length;
  var data1 = input1.data;
  var data2 = input2.data;
  var average1;
  var average2;
  var delta;
  var imageData = canvasBlend
    .getContext('2d')
    .getImageData(0, 0, blendWidth, blendWidth);
  //var i = 0;

  var buf = new ArrayBuffer(data1.length);
  var buf8 = new Uint8ClampedArray(buf);
  var data = new Uint32Array(buf);

  var i;
  for (var y = 0; y < blendHeight; ++y) {
    for (var x = 0; x < blendWidth; ++x) {
      i = y * blendWidth + x;
      average1 = (data1[i*4] + data1[i*4+1] + data1[i*4+2]) / 2.5;
      average2 = (data2[i*4] + data2[i*4+1] + data2[i*4+2]) / 2.5;
      delta = polarize(abs(average1 - average2), 0x15);
      //var value = x * y & 0xff;

      data[i] =
          (255   << 24) |    // alpha
          (delta << 16) |    // blue
          (delta <<  8) |    // green
           delta;           // red
    }
  }

  imageData.data.set(buf8);
  return imageData;

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
  var blendData = compare(sourceData, prevSourceData);
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
