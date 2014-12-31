#!/usr/bin/env node
var homa = require('homa');
var serialport = require("serialport");
var xml2js = require('xml2js');

var SerialPort = serialport.SerialPort;

var serialDevice = "/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0";
var systemId = homa.paramsWithDefaultSystemId("homa-currentcost");

(function connect() {
  homa.mqttHelper.connect();
})();

homa.mqttHelper.on('connect', function(packet) {
  homa.mqttHelper.publish("/devices/cc-power/controls/power/meta/type", "text", true);
  homa.mqttHelper.publish("/devices/cc-temp/controls/temperature/meta/type", "text", true);
  var serialPort = new SerialPort(serialDevice, {
    baudrate : 9600,
    parser : serialport.parsers.readline("\n")
  });
  serialPort.on("open", function () {
    console.log('open');
    var parser = new xml2js.Parser();

    var previousTmpr = NaN;
    var previousCh1 = NaN;

    serialPort.on('data', function(data) {
      parser.parseString(data, function(err, result) {
        if (!err) {
          var ch1 = parseInt(result.msg.ch1[0].watts[0]);
          var tmpr = parseFloat(result.msg.tmpr[0]);
          if (previousCh1 != ch1) {
            homa.mqttHelper.publish("/devices/cc-power/controls/power", ch1, true);
            previousCh1 = ch1;
          }
          if (previousTmpr != tmpr) {
            homa.mqttHelper.publish("/devices/cc-temp/controls/temperature", tmpr, true);
            previousTmpr = tmpr;
          }
        } else {
          console.log("Unable to parse XML!");
        }
      });
    });
  });
});

homa.mqttHelper.on('message', function(packet) {
  homa.settings.insert(packet.topic, packet.payload);

  if (!homa.settings.isLocked() && homa.settings.isBootstrapCompleted()) {
    homa.settings.lock();
  }
});

