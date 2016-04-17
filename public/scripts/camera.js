// requires _ lodash
// requires utils.js
'use strict'

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
  template: [
    '<div class="camera" id="<%= this.label %>">',
    '<div class="select">',
    '<label for="source">',
    'Source:',
    '</label>',
    '<select id="source">',
    '</select>',
    '<video class="video" autoplay>',
    '</video>'
  ].join(''),
  init: function(data) {
    this.data = {
      label: data.label,
      deviceId: data.deviceId
    };
    this.container = data.container;
    this.attachEl(this.container);
    return this;
  }
};

var cameras = {};

function createCameras() {
  navigator.mediaDevices.enumerateDevices()
  .then(function(deviceInfos) {
    deviceInfos.forEach(function(deviceInfo) {
      var _label = dropSpaces(deviceInfo.label);
      if(deviceInfo.kind === 'videoinput') {
        cameras[_label] = Object.create(Camera)
          .init({
            label: _label,
            deviceId: deviceInfo.deviceId,
            container: '#container'
          });
      }
    });
  })
  .catch(function(error) {
    console.error('Failed to create cameras: ',  error);
  });
}

createCameras();
