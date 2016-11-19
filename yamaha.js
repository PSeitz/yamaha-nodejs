var simpleCommands = require('./simpleCommands');
var chainedCommands = require('./chainedCommands');


/**
 * The Yamaha Module Constructor.
 * @constructor
 * @param {string} ip - The ip of the yamaha receiver.
 * @param {number} responseDelay - The delay of the response for put commands, in seconds - defaults to 1. Better than polling...
 *
 */
function Yamaha(ip, responseDelay, requestTimeout)
{
    if (typeof responseDelay == 'string' || responseDelay instanceof String) responseDelay = parseInt(responseDelay);
    if (!responseDelay) responseDelay = 1;
    this.ip = ip;
    this.responseDelay = responseDelay;
    this.pollingDelay = 500; // used for menu ready check, webradio e.g.
    this.requestTimeout = requestTimeout;
}


extend(Yamaha.prototype, simpleCommands.prototype);
extend(Yamaha.prototype, chainedCommands.prototype);


var reYamahaManufacturer = /<manufacturer>.*yamaha.*<\/manufacturer>/i;
var reFriendlyName = /<friendlyName>([^<]*)<\/friendlyName>/;

Yamaha.prototype.discover = function (callback, timeout) {
    var request = require('request');
    var ssdp = require("peer-ssdp");
    var peer = ssdp.createPeer();
    var timer = setTimeout(closePeer, timeout || 5000);
    
    function closePeer(ip, info) {
        timer = null;
        if (peer) peer.close();
        peer = null;
        callback(ip, info);
    }
    
    peer.on("ready", function () {
        peer.search({ ST: 'urn:schemas-upnp-org:device:MediaRenderer:1' });
    }).on("found", function (headers, address) {
        if (headers.LOCATION) {
            request(headers.LOCATION, function (error, response, body) {
                if (!error && response.statusCode == 200 && reYamahaManufacturer.test(body)) {
                    var info = reFriendlyName.exec(body);
                    if (timer) {
                        clearTimeout(timer);
                        closePeer(address.address, info && info.length >= 2 ? info[1] : '');
                    }
                }
            });
        }
    }).start();
};

Yamaha.prototype.waitForNotify = function (ip, callback) {
    var ssdp = require("peer-ssdp");
    var peer = ssdp.createPeer();
    peer.on("ready", function () {
    }).on("notify", function (headers, address) {
        if (address.adress === ip) {
            callback(true);
            peer.close();
        }
    }).start();
    return peer;
};


function extend(destination , source) {
  for (var k in source) {
      destination[k] = source[k];
  }
}

module.exports = Yamaha;