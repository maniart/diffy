'use strict';
/*
  capture from camera
  returns objectUrl
 */
function capture() {
  return navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      return stream;
    })
    .catch(function(error) {
      console.error(error.name + ' : ' + error.message);
    });
}

function loop(callback) {
  window.setTimeout(callback, 1000 / 60);
};

var logger = createLogOnce();

// store a ref
var createObjectURL = window.URL.createObjectURL;

/*
  Stream object populated by getUserMedia
*/
var localMediaStream = null;

// imageData
var imageData = null;

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

// video element
var videoEl = $('.video-input');

// canvas element
var canvasEl = $('.canvas-input');

// canvas context
var ctx = canvasEl.getContext('2d');

// ws
var port = +window.location.hash.substr(1) || 8081;
var url = 'ws://localhost:' + port;
var ws = new WebSocket(url);
console.log('streaming to port: ', port);

function snapshot() {
	if (localMediaStream) {
		ctx.drawImage(videoEl, 0, 0, 260, 200);

		imageData = canvasEl.toDataURL('image/jpeg');
    logger(imageData);
    ws.send(imageData);
		// socket.emit("image", imageData);
	}

  loop(snapshot);
};

// ws.onmessage = function(message) {
//   console.log('ws ', message.data);
// };

// kickoff
function init() {
  capture()
    .then(function(stream) {
      localMediaStream = stream;
      videoEl.src = createObjectURL(stream);
      snapshot();

      return stream;
    })
    .catch(function(err) {
      console.error('capture failed: ', err);
    });
}

ws.onopen = function(event) {
  console.log(event);
  init();
};

ws.onerror = function(err) {
  console.error(err);
};
