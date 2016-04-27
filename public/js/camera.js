'use strict';
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

// we use setTimeout here and not rAf
// because we want the loop to continue
// even when the page it runs on is out of focus.
function loopWithSetTimeOut(callback) {
  window.setTimeout(callback, 1000 / 60);
};

// make a once-logger
var logger = createLogOnce();

// store a ref. just cleanliness and stuff
var createObjectURL = window.URL.createObjectURL;

/*
  Stream object populated by getUserMedia
*/
var localMediaStream = null;

// imageData
var imageData = null;

/*
  last captured imageData
*/
var currentImageData = null;
/*
  previous captured imageData
*/
var previousImageData = null;

/*
  constraints object for getUserMedia
*/
var constraints = {
  audio: false,
  video: {
    width: 130,
    height: 100
  }
};

// video element
var rawVideo = $('#raw-video');

// canvas element
var rawCanvas = $('#raw-canvas');

// canvas context
var ctx = rawCanvas.getContext('2d');

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
  is Worker available?
*/
var isWorkerAvailable = 'Worker' in window;

/*
  Worker
*/
var differ = new Worker('./js/differ.js');

/*
  blend imageData
*/
var blendImageData = blendCtx.getImageData(0, 0, blendWidth, blendHeight);

// ws - read port from # part of url
//var port = +window.location.hash.substr(1) || 8081;



// // assemble the endpoint url
// var url = 'ws://localhost:' + port;
//
// // create a WS connection
// var ws = new WebSocket(url);

/*
  draws stream into a output element (video or canvas)
  returns output
*/
function pipe(input, output) {
  // debugger;
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

var logger2 = createLogOnce();
/*
  compare input and output average values
  returns ?
*/
function compare(input1, input2) {
  var length = input1.length;
  var data1 = input1.data;
  var data2 = input2.data
  var buffer = new ArrayBuffer(data1.length);

  logger2('2');


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
  bitwise Math.round
  returns number
*/
function round(number) {
  return (number + .5) >> 0;
}

/*
  blend two consecutive frames
  returns imageData
*/
function blend(input, output) {
  // debugger;
  var inputCtx = input.getContext('2d');
  var outputCtx = output.getContext('2d');
  var width = input.width;
  var height = input.height;
  currentImageData = inputCtx.getImageData(0, 0, width, height);
  previousImageData = previousImageData || inputCtx.getImageData(0, 0, width, height);
  compare(currentImageData, previousImageData);
}

var logger3 = createLogOnce();
/*
  worker message event callback
  draws pixel buffer to blend canvas
*/
function drawBlendImage(messageEvent) {
  logger3('main thread - ', messageEvent.data);
  blendImageData
    .data
    .set(
      new Uint8ClampedArray(messageEvent.data)
    );

  blendCtx.putImageData(blendImageData, 0, 0);
  previousImageData = currentImageData;
}

// send it up on WS
// function broadcast() {
//   ws.send(blendCanvas.toDataURL('image/jpeg'));
// }

// take a snapshot of canvas, turn it into datUrl
// and send to WS server
// kicks off a loop executing itself *hopfully* 60 fps
// function snapshot() {
// 	if (localMediaStream) {
// 		ctx.drawImage(rawVideo, 0, 0, 260, 100);
// 		currentImageData = rawCanvas.toDataURL('image/jpeg');
//     // logger('currentImageData data is: ', currentImageData);
//     ws.send(currentImageData);
// 	}
//
//   loopWithSetTimeOut(snapshot);
// };

/*
  iteratively calculate and draw
  returns undefined
*/
function loop() {
  pipe(rawVideo, rawCanvas);
  blend(rawCanvas, blendCanvas);
  //broadcast();
  loopWithSetTimeOut(loop);
}

// kickoff
function init() {
  capture()
    .then(function(stream) {

      // populate the localMediaStream in closure
      // so `#snapshot` can use it without passing it in.
      localMediaStream = stream;

      // set the video element source.
      // this needs to happen only once.
      // rawVideo.src = createObjectURL(stream);



      // because why not.
      //eturn stream;
      // logger('----1');
      // order is important
      //differ.addEventListener('message', drawBlendImage);
      [rawCanvas, blendCanvas].forEach(mirror);
      pipe(stream, rawVideo);
      loop();

    })
    .catch(function(err) {
      // omg noes.
      console.error('capture failed: ', err);
    });
}
init();
// ws.onopen = function(event) {
//   // WS connection is open. kick off.
//   console.log('WS connection is open.');
//   init();
// };
//
// ws.onerror = function(err) {
//   // Omg noes.
//   console.error('WS error: ', err);
// };
