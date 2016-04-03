var messageData;
var buffer;
var data;
var data1;
var data2;
var width;
var height;

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
  bitwise abs operation
  returns value
*/
function abs(value) {
  return (value ^ (value >> 31)) - (value >> 31);
}

/*
  polarize pixel values based on value and threshold
  returns 0 or 0XFF
*/
function polarize(value, threshold) {
  return (value > threshold) ? 0xFF0033 : 0XFF;
}

/*
  create diff image pixel buffer
*/
function createDiffBuffer(messageEvent) {
  var i;
  messageData = messageEvent.data;
  buffer = messageData.buffer;
  data1 = messageData.data1;
  data2 = messageData.data2;
  width = messageData.width;
  height = messageData.height;
  data = new Uint32Array(buffer);
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      i = y * width + x
      average1 = (data1[i*4] + data1[i*4+1] + data1[i*4+2]) / 3;
      average2 = (data2[i*4] + data2[i*4+1] + data2[i*4+2]) / 3;
      delta = polarize(
        abs(average1 - average2), 0x15
      );

      data[i] =
        (255   << 24) |    // alpha
        (delta << 16) |    // blue
        (delta <<  8) |    // green
         delta;           // red
    }
  }

  this.postMessage(buffer);
}

this.addEventListener('message', createDiffBuffer);
