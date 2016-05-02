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
  debug image container
*/
var container = $('#container');

/*
  toggle raw and blend video
*/
var toggleBtn = $('#toggle');

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
  main drawing stage
*/
var drawCanvas = $('#draw-canvas');

/*
  main drawing context
*/
var drawCtx = drawCanvas.getContext('2d');

/*
  width of grid canvas
*/
var drawWidth = drawCanvas.width;

/*
  height of grid canvas
*/
var drawHeight = drawCanvas.height;

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
  uniform width of all "control" videso (raw, blend, etc.) - small canvases for debugging mostly.
*/
var _width = blendWidth;
var _height = blendHeight;

/*
  width to height ratio of all canvases
*/
var ratio = blendWidth / blendHeight;

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
  Save a reference to Math.PI
*/
var PI = Math.PI;

/*
  grid image resolution values
*/
var GRID_RESOLUTION_X = 80;
var GRID_RESOLUTION_Y = 80;

/*
  grid cell resolution
*/
var CELL_WIDTH = gridWidth / GRID_RESOLUTION_X;
var CELL_HEIGHT = gridHeight / GRID_RESOLUTION_Y;


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
    sensitivity: .5,
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
function matrix() {
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

  return matrix;
}

/*
  draw a matrix as a pixelated image
*/
function drawPixels(matrix) {
  matrix.forEach(function(row, rowIdx) {
    row.forEach(function(column, colIdx) {
      gridCtx.beginPath();
      gridCtx.fillStyle = 'rgb(' + column + ',' + column + ',' + column + ')';
      gridCtx.fillRect(rowIdx * CELL_WIDTH, colIdx * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      gridCtx.closePath();
    });
  });
}

/*
  draw a matrix as hit points
*/
function drawGrid(matrix) {
  // var color;
  matrix.forEach(function(row, rowIdx) {
    row.forEach(function(column, colIdx) {
      // color = column < 200 ? 0 : 255;
      gridCtx.beginPath();
      gridCtx.fillStyle = 'rgb(' + column + ',' + column + ',' + column + ')';
      // gridCtx.fillRect(rowIdx * CELL_WIDTH, colIdx * CELL_HEIGHT, 2, 2);
      gridCtx.arc(rowIdx * CELL_WIDTH, colIdx * CELL_HEIGHT, 1, 0, 2 * PI, false);
      gridCtx.fill();
      //gridCtx.lineWidth = 1;
      //gridCtx.strokeStyle = 'rgb(' + column + ',' + column + ',' + column + ')';
      //gridCtx.stroke();
      gridCtx.closePath();
    });
  });
}

function getRandomColor() {
  var colors = [
    '#00ffff',
    '#ff00ff',
    '#000000',
    '#ffff00'
  ];
  return colors[ Math.floor ( Math.random() * (colors.length ))];
}
var count = 0;
/*
  main draw function
*/
function draw(matrix, count) {
  var color;
  count += 1;

  var pos1 = {};
  var pos2 = {};
  var sin;
  var cos;

  matrix.forEach(function(row, rowIdx) {
    row.forEach(function(column, colIdx) {
      pos1.x = rowIdx * CELL_WIDTH;
      pos1.y = colIdx * CELL_HEIGHT;

      pos2.x = drawWidth - pos1.x;
      pos2.y = pos1.y;

      drawCtx.beginPath();
      drawCtx.lineCap= 'round';

      sin = Math.sin(new Date().getMilliseconds());
      cos = Math.cos(new Date().getMilliseconds());

      // color = column === 255 ?'#ffffff' : ['rgb(', Math.abs(cos * 255).toFixed(0), ',', Math.abs(sin * 255).toFixed(0), ',', colIdx, ')'].join('');

      color = column === 255 ? '#000000' : getRandomColor();



      drawCtx.strokeStyle = color;
      drawCtx.lineWidth = 1;

      drawCtx.moveTo(pos1.x , pos1.y);
      drawCtx.lineTo( (pos1.x + 15) + (sin * 40), (pos1.y + 15) + (cos * 40));

      drawCtx.moveTo(pos2.x , pos2.y);
      drawCtx.lineTo( (pos2.x + 15) + (sin * 40), (pos2.y + 15) + (cos * 40));

      drawCtx.stroke();


      drawCtx.closePath();
    });
  });
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

  draw(matrix(), new Date().getMilliseconds()); // pixijs draw
  // drawPixels(
  //   matrix(150)
  // );

  // drawGrid(matrix());

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
      toggleBtn.addEventListener('click', toggle);
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
