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
    }
    counter ++;
  }
}

/*
  logger instances
*/
var logOnce_1 = createLogOnce();
var logOnce_2 = createLogOnce();
var logOnce_3 = createLogOnce();

/*
  constraints object for getUserMedia
*/
var constraints = {
  audio: false,
  video: {
    width: 260,
    height: 200
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
  canvas containing the grid
*/
var gridCanvas = $('#grid-canvas');

/*
  grid canvas context
*/
var gridCtx = gridCanvas.getContext('2d');

/*
  width of grid canvas
*/
var gridWidth = gridCanvas.width;

/*
  height of grid canvas
*/
var gridHeight = gridCanvas.height;

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
  grid image resolution values
*/
var GRID_RESOLUTION_X = 40;
var GRID_RESOLUTION_Y = 40;

/*
  grid cell resolution
*/
var CELL_WIDTH = gridWidth / GRID_RESOLUTION_X;
var CELL_HEIGHT = gridHeight / GRID_RESOLUTION_Y;

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
  create a matrix
*/
function matrix(threshold) {
  var matrix = [];
  var i;
  var j;
  var posX;
  var posY;
  var k = 0;
  var cellWidth = blendWidth / GRID_RESOLUTION_X;
  var cellHeight = blendHeight / GRID_RESOLUTION_Y
  var cellImageData;
  var cellImageDataLength;
  var cellPixelCount;
  var average = 0;

  for(i = 0; i < blendWidth; i += cellWidth) {
    var row = [];
    for(j = 0; j < blendHeight; j += cellHeight) {
      cellImageData = blendCtx.getImageData(i, j, cellWidth, cellHeight).data;
      // logOnce_2('- ', cellImageData.length);
      /*TODO refactor with bitshifting */
      cellImageDataLength = cellImageData.length;
      cellPixelCount = cellImageDataLength / 4;
      while(k < cellPixelCount) {
        average += (cellImageData[k * 4] + cellImageData[k * 4 + 1] + cellImageData[k * 4 + 2]) / 3;
        ++k;
      }
      average = round(average / cellPixelCount);
      // gridCtx.beginPath();
      // gridCtx.rect(i, j, cellWidth * 4, cellHeight * 4);
      //gridCtx.arc(i, j, cellWidth/3, 0, 2 * Math.PI, false);
      /* push the value in the row */
      row.push(average  );
      average = 0;
      k = 0;
    }
    matrix.push(row); // store the row in matrix
  }
  // logOnce_2(average);
  return matrix;
}

/*
  scale a matrix
*/
function scale(matrix, scale) {

}

/*
  draw a matrix
*/
function draw(matrix) {
  matrix.forEach(function(row, rowIdx) {
    row.forEach(function(column, colIdx) {
      gridCtx.beginPath();
      // console.log(column);
      gridCtx.fillStyle = 'rgb(' + column + ',' + column + ',' + column + ')';
      gridCtx.fillRect(rowIdx * CELL_WIDTH, colIdx * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      console.log(rowIdx * CELL_WIDTH);
      // gridCtx.fillRect(rowIdx * GRID_RESOLUTION_X, colIdx * GRID_RESOLUTION_Y, 3, 3);
      //gridCtx.arc(rowIdx, colIdx, cellWidth/3, 0, 2 * Math.PI, false);
      gridCtx.closePath();
    });
  })
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
  draw(
    matrix(GRID_RESOLUTION_X, GRID_RESOLUTION_Y, 50)
  );

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
