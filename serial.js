var fs = require('fs');

var ref = require('ref');
var ArrayType = require('ref-array');
var StructType = require('ref-struct');
var ioctl = require('ioctl');

var termios2 = StructType({
  c_iflag : ref.types.uint,
  c_oflag : ref.types.uint,
  c_cflag : ref.types.uint,
  c_lflag : ref.types.uint,
  c_line : ref.types.uchar,
  c_cc : ArrayType(ref.types.uchar, 19),
  c_ispeed : ref.types.uint,
  c_ospeed : ref.types.uint
});

var TCGETS2 = 0x802c542a;
var TCSETS2 = 0x402c542b;

var CBAUD = 0x0000100f;
var BOTHER = 0x00001000;

exports.openSerial = function(portDev, speed) {
  var fd = fs.openSync('/dev/ttyUSB0', 'r+');

  var info = new termios2();
  var ret = ioctl(fd, TCGETS2, info.ref());
  if (ret != 0) throw "Failed to get serial port parameters";

  info.c_cflag &= ~CBAUD;
  info.c_cflag |= BOTHER;
  info.c_ispeed = speed;
  info.c_ospeed = speed;

  ret = ioctl(fd, TCSETS2, info.ref());
  if (ret != 0) throw "Failed to set serial port speed";

  return fd;
}

