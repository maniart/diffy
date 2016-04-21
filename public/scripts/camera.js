// requires _ lodash
// requires utils.js
'use strict'

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

function dropSpaces(str) {
  return str.split(' ').join('');
};

var socket = io();

socket.on('frame', function(e) {
  // console.log('frame ', e);
});

var Camera = {

  getInfo: function() {
    return this.info;
  },

  setEl: function(el) {
    this._el = el;
    return this;
  },

  getEl: function() {
    return this._el;
  },

  broadcast: function(stream) {
    // console.log('emitting ', stream);
    socket.emit('stream', stream);
    var self = this;
    requestAnimFrame(function() {
      self.broadcast(stream);
    });
    return stream;
  },

  createEl: function() {
    var temp = document.createElement('div');
    temp.innerHTML = _.template(this.template)(this.data);;
    return this
      .setEl(temp.firstChild)
      .getEl();
  },

  attachEl: function(containerSelector) {
    $(containerSelector).appendChild(this.createEl());
    return this;
  },

  attachStream: function(stream) {
    console.log('STREAM RAW = ', stream);
    console.log(window.URL.createObjectURL(stream));
    var blob = window.URL.createObjectURL(stream);
    var video = this.getVideoEl();
    video.src = blob;
    this.drawToCanvas();
    return this;
  },

  capture: function() {
    return navigator.mediaDevices.getUserMedia(this.data.constraints)
      .then(function(stream) {
        // console.log('stream is here');
        return stream;
      })
      .catch(function(error) {
        console.error(error.name + ' : ' + error.message);
      });
  },

  drawToCanvas: function() {
    // console.log('111');
    var self = this;
    var video = this.getVideoEl();
    var ctx = this.getCanvasEl().getContext('2d');
    ctx.drawImage(video, 0, 0, 260, 200);
    socket.emit('stream', ctx.getImageData(0, 0, 260, 200));

    requestAnimFrame(function() {
      self.drawToCanvas(video);
    });
    //return this;
  },

  getVideoEl: function() {
    return this.getEl().querySelector('.video');
  },

  getCanvasEl: function() {
    return this.getEl().querySelector('.canvas');
  },

  template: [
    '<div class="camera" id="<%= label %>">',
    '<div class="select">',
    '<label class="hidden" for="source">',
    'Source:',
    '</label>',
    '<select id="source">',
    '<%= label %>',
    '<% _.forEach(list, function(device) { %>',
    '<option><%= device %></option>',
    '<% }); %>',
    '</select>',
    '</div>',
    '<video width="<%= constraints.video.width %>" height="<%= constraints.video.height %>" class="video" autoplay>',
    '</video>',
    '<canvas width="260" height="200" class="canvas" id="<%= label %>-canvas">',
    '</canvas>'
  ].join(''),

  init: function(data) {
    var self = this;
    this.data = {
      label: data.label,
      deviceId: data.deviceId,
      list: data.list,
      constraints: constraints
    };
    this.container = data.container;
    this
      .attachEl(this.container)
      .getEl()
      .querySelector('#source')
      .addEventListener('change', function(e) {
        console.debug('change', e);
      });

    this.capture()
    .then(function(stream) {
      self.attachStream(stream);

    })
    .catch(function(error) {
      console.error('Failed to broadcast: ', error);
    });
    return this;
  }
};

var cameras = [];

function createCameras() {
  navigator.mediaDevices.enumerateDevices()
  .then(function(deviceInfos) {

    _.forEach(
      _.filter(deviceInfos, {kind: 'videoinput'}),
      function(deviceInfo, deviceIndex, deviceInfos) {
        var list = _.map(deviceInfos,
          function(deviceInfo) {
            return 'label' in deviceInfo ? dropSpaces(deviceInfo.label) : 'Camera ' + (deviceIndex + 1);
          }
        );
        cameras.push(Object.create(Camera).init({
          label: dropSpaces(deviceInfo.label),
          deviceId: deviceInfo.deviceId,
          container: '#container',
          list: list
          })
        );
      }
    );

  })
  .catch(function(error) {
    console.error('Failed to create cameras: ',  error);
  });
}


createCameras();
