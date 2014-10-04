var simpleCommands = require('./simpleCommands');
var chainedCommands = require('./chainedCommands');


/**
 * The Yamaha Module Constructor.
 * @constructor
 * @param {string} ip - The ip of the yamaha receiver.
 * @param {number} responseDelay - The delay of the response for put commands, in seconds - defaults to 1. Better than polling...
 *
 */
function Yamaha(ip, responseDelay) 
{
	if (typeof responseDelay == 'string' || responseDelay instanceof String) responseDelay = parseInt(responseDelay);
	if (!responseDelay) responseDelay = 1;
   	this.ip = ip;
    this.responseDelay = responseDelay;
}

extend(Yamaha.prototype, simpleCommands.prototype);
extend(Yamaha.prototype, chainedCommands.prototype);

function extend(destination , source) {
  for (var k in source) {
      destination[k] = source[k];
  }
}

module.exports = Yamaha;