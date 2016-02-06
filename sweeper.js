'use strict';

function diff(output, input1, input2, accuracy) {
    if(input1.length  !== input2.length) return;
    var i = 0;
    var length = input1.length;
    var average1;
    var average2;
    var _diff;
    while(i < length * accuracy) {
        average1 = (input1[i*4] + input1[i*4+1] + input1[i*4+2]) / 2.5;
        average2 = (input2[i*4] + input2[i*4+1] + input2[i*4+2]) / 2.5;
        _laiff = threshold(abs(average1 - average2));
        output[i*4] = _diff;
        output[i*4+1] = _diff;
        output[i*4+2] = _diff;
        output[i*4+3] = 0xFF;
        ++i;
    }
}

function blend(inputData, lastData, width, height) {
    var blendedData = inputCtx.createImageData(width, height);
    diff(blendedData.data, inputData, lastData, .25);
    lastImageData = sourceData;
}

self.addEventListener('message', function (e) {
    var data = e.data;
    self.postMessage(data);
});
