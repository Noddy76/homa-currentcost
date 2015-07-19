#!/usr/bin/env node

var homa = require('homa');
var devNull = require('dev-null');
var fs = require('fs');
var readline = require('readline');
var xml2js = require('xml2js');

var log = require('./logger.js');
var openSerial = require('./serial.js').openSerial;

var systemId = homa.paramsWithDefaultSystemId("homa-currentcost");
var fd = openSerial("/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0", 9600);

(function connect() {
  homa.logger.stream = devNull();
  homa.logger.on('log', function(msg) {
    log[msg.level](msg.prefix + " - " + msg.message);
  });
  homa.mqttHelper.connect();
})();

homa.mqttHelper.on('connect', function(packet) {
  homa.mqttHelper.publish("/devices/cc-power/controls/power/meta/type", "text", true);
  homa.mqttHelper.publish("/devices/cc-temp/controls/temperature/meta/type", "text", true);

  var processMessage = function(err, result) {
    if (result == null) return;
    if (!err) {
      var ch1 = parseInt(result.msg.ch1[0].watts[0]);
      var tmpr = parseFloat(result.msg.tmpr[0]);
      homa.mqttHelper.publish("/devices/cc-power/controls/power", ch1, true);
      homa.mqttHelper.publish("/devices/cc-temp/controls/temperature", tmpr, true);
    } else {
      log.error("Unable to parse XML!");
    }
  }

  readline.createInterface({
    input: fs.createReadStream(null, {fd: fd})
  }).on("line", function (data) {
    xml2js.parseString(data, processMessage);
  });
});

