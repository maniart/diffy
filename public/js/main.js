'use strict';

var ws = new WebSocket('ws://localhost:8081');
ws.binaryType = 'arraybuffer';

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

var blendCanvas = $('#blend-canvas');
var blendCtx = blendCanvas.getContext('2d');
var blendWidth = blendCanvas.width;
var blendHeight = blendCanvas.height;
var blendImageData = blendCtx.getImageData(0, 0, blendWidth, blendHeight);

var toggleBtn = $('#toggle')



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

  debug image container
*/
var container = $('#container');

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
  is Worker available?
*/
var isWorkerAvailable = 'Worker' in window;

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
  // drawPixels(
  //   matrix(150)
  // );

  drawGrid(matrix());

  requestAnimFrame(loop);
}


function init() {
  console.log('init')
  loop();
  toggleBtn.addEventListener('click', toggle);
  ws.addEventListener('message', function(ev) {
    blendImageData.data = ev.data;
  });
}

ws.addEventListener('open', init);
