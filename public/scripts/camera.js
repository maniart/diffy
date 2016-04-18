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

var Camera = {
  getInfo: function() {
    return this.info;
  },
  getElement: function() {
    var temp = document.createElement('div');
    temp.innerHTML = _.template(this.template)(this.data);
    return temp.firstChild;
  },
  attachEl: function(containerSelector) {
    $(containerSelector).appendChild(this.getElement());
    return this;
  },
  attachStream: function(stream) {
    this.getVideoEl().srcObject = stream;
    return this;
  },
  getVideoEl: function() {
    return this.getElement().querySelector('.video');
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
    '</video>'
  ].join(''),
  init: function(data) {
    this.data = {
      label: data.label,
      deviceId: data.deviceId,
      list: data.list,
      constraints: constraints
    };
    this.container = data.container;
    this.attachEl(this.container);
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
