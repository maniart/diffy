var times = 0;
var messageData;
var buffer;
var data;
var data1;
var data2;
var width;
var height;

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
  return (value > threshold) ? 0 : 0xFF;
}

this.onmessage = function(event) {
  var i;

  // log event once
  if(times < 1) {
    console.debug('differ: event -', event);
    times++;
  }

  messageData = event.data;
  buffer = messageData.buffer;
  data1 = messageData.data1;
  data2 = messageData.data2;
  width = messageData.width;
  height = messageData.height;
  data = new Uint32Array(buffer);




  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      i = y * width + x

      average1 = (data1[i*4] + data1[i*4+1] + data1[i*4+2]) / 2.5;
      average2 = (data2[i*4] + data2[i*4+1] + data2[i*4+2]) / 2.5;
      delta = polarize(
        abs(average1 - average2), 0x15
      );

      data[i] =
          (255   << 24) |    // alpha
          (delta << 16) |    // blue
          (delta <<  8) |    // green
           delta;           // red
      // if(i == 1000) { window.foo = data[i]; }
    }
  }

  this.postMessage(buffer);

};
