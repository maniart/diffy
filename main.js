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
  debug images container
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
  PIXI renderer
*/
var renderer;

/*
  PIXI stage
*/
var stage;

/*
  PIXI background video
*/
var video;

/*
  PIXI mask shapes
*/
var shapes;

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
  Save a reference to Math static props
*/
var PI = Math.PI;
var cos = Math.cos;
var sin = Math.sin;

/*
  grid image resolution values
*/
var GRID_RESOLUTION_X = 200;
var GRID_RESOLUTION_Y = 200;

/*
  Stage size
*/
var STAGE_WIDTH = 1900;
var STAGE_HEIGHT = 1000;

/*
  Scale factor
*/
var scaleX = STAGE_WIDTH / GRID_RESOLUTION_X;
var scaleY = STAGE_HEIGHT / GRID_RESOLUTION_Y;

/*
  incrementing counters used for animation.
*/
var counter1 = 0;
var counter2 = 0;

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
  initialize pixi stage
*/
function initPixi() {
  renderer = PIXI.autoDetectRenderer(1900, 1000, { antialias: true });
  document.body.appendChild(renderer.view);

  // create the root of the scene graph
  stage = new PIXI.Container();
  // stage.interactive = true;
  video = document.createElement('video');
  video.preload = 'auto';
  video.loop = true;  // enable looping
  video.src = './assets/tehran-nyc.mp4';

  // create a video texture from a path
  var texture = PIXI.Texture.fromVideo(video);

  // create a new Sprite using the video texture (yes it's that easy)
  var videoSprite = new PIXI.Sprite(texture);

  videoSprite.width = renderer.width;
  videoSprite.height = renderer.height;

  videoSprite.anchor.x = 0.5;
  videoSprite.anchor.y = 0.5;

  videoSprite.position.x = renderer.width / 2;
  videoSprite.position.y = renderer.height / 2;

  stage.addChild(videoSprite);

  shapes = new PIXI.Graphics();
  shapes.lineStyle(8, 0xffd900, 1);

  stage.addChild(shapes);
  shapes.position.x = 0;
  shapes.position.y = 0;

  stage.mask = shapes;
}

function drawShapes(graphicsObj, posX, posY, scale) {
  var a = 10 * scale;
  var b = a * 2;
  graphicsObj.moveTo(posX, posY);
  // shapes.moveTo(posX * cos(counter1), posY * sin(counter1));
  // shapes.drawCircle(rowIdx * scaleX, colIdx * scaleY, 10); // drawCircle(x, y, radius)
  graphicsObj.lineTo(posX - a , posY);
  graphicsObj.lineTo(posX - b , posY  - a);
  graphicsObj.lineTo(posX + a, posY - a);
  graphicsObj.lineTo(posX + b, posY);

  shapes.lineTo(posX, posY);
}

/*
  draw pixiJS masking image
*/
function draw(matrix) {
  counter1 += 0.01;
  // counter2 += 0.05;

  // position
  var posX;
  var posY;

  shapes.clear();
  // shapes.beginFill(0x8bc5ff, 0.4);
  shapes.lineStyle(1, 0xffffff, 1);

  matrix.forEach(function(row, rowIdx) {
    row.forEach(function(column, colIdx) {
      posX = rowIdx * scaleX;
      posY = colIdx * scaleY;
      // if value is 0 (black)
      // meaning that a movement has been detected at this coords.
      if(column === 0) {

        drawShapes(shapes, posX, posY, Math.floor(Math.random() * 2));
        // shapes.moveTo(posX + 1, posY);
        //
        // shapes.lineTo(posX - 5, posY);
        // shapes.lineTo(posX, posY  - 5);
        // shapes.lineTo(posX + 5, posY);
        // shapes.lineTo(posX, posY);

        // shapes.lineTo(posX - 15, posY  + 5);
        // shapes.lineTo(posX - 15, posY  + 15);
        // shapes.lineTo(posX - 100 * Math.cos(counter), posY +  100 * Math.sin(counter));
        // thing.moveTo(-120 + Math.sin(count) * 20, -100 + Math.cos(count)* 20);
      }

    });
  });

  renderer.render(stage);
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
  draw(matrix());
  requestAnimFrame(loop);
}

/*
  kickstart the process
*/
capture()
  .then(
    function(input) {
      // order is important
      initPixi();
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
