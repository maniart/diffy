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

var ws = new WebSocket('ws://localhost:8080');

ws.onmessage = function(message) {
  console.log('ws ', message.data);
};

// kickoff
function init() {
  capture()
    .then(function(stream) {
      videoEl.src = stream;
    });
}

init();
