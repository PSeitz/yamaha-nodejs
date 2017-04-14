Yamaha-nodejs
==================
[![NPM Downloads](https://img.shields.io/npm/dm/yamaha-nodejs.svg?style=flat)](https://npmjs.org/package/yamaha-nodejs)
[![Dependency Status](https://david-dm.org/PSeitz/yamaha-nodejs.svg?style=flat)](https://david-dm.org/PSeitz/yamaha-nodejs)


A node module to control your yamaha receiver. Tested with RX-V775, should work with all yamaha receivers with a network interface.

### Install
npm install yamaha-nodejs

## Example
```javascript
var YamahaAPI = require("yamaha-nodejs");
var yamaha = new YamahaAPI("192.168.0.100");
yamaha.powerOn().then(function(){
	console.log("powerOn");
	yamaha.setMainInputTo("NET RADIO").then( function(){
		console.log("Switched to Net Radio");
		yamaha.selectWebRadioListItem(1).then(function(){
			console.log("Selected Favorites");
			yamaha.selectWebRadioListItem(1).then(function(){});
		});

	});
});
```
## Prerequisites
* To power on the yamaha, network standby has to be enabled
* The Yamaha reveiver is stateful. Some commands only work work if the receiver is in the right state. E.g. to get web radio channels, the "NET RADIO" input has to be selected.

## Methods
```javascript
var yamaha = new Yamaha("192.168.0.100")
var yamaha = new Yamaha() // Auto-Discovery
yamaha.powerOff(zone)
yamaha.powerOn(zone)
yamaha.isOn(zone)
yamaha.isOff(zone)

//Volume
yamaha.setVolumeTo(-500, zone)
yamaha.volumeUp(50, zone)
yamaha.volumeDown(50, zone)
yamaha.muteOn(zone)
yamaha.muteOff(zone)

//Extended Volume Settings
yamaha.setBassTo(60)          //-60 to 60 (may depend on model)
yamaha.setTrebleTo(60)        //-60 to 60 (may depend on model)
yamaha.setSubwooferTrimTo(60) //-60 to 60 (may depend on model)
yamaha.setDialogLiftTo(5)     //0 to 5 (may depend on model)
yamaha.setDialogLevelTo(3)    //0 to 3 (may depend on model)
yamaha.YPAOVolumeOn()
yamaha.YPAOVolumeOff()
yamaha.extraBassOn()
yamaha.extraBassOff()
yamaha.adaptiveDRCOn()
yamaha.adaptiveDRCOff()

//Playback
yamaha.stop(zone)
yamaha.pause(zone)
yamaha.play(zone)
yamaha.skip(zone)
yamaha.rewind(zone)

//Switch Input
yamaha.setInputTo("USB", 2)
yamaha.setMainInputTo("NET RADIO")

//Party Mode
yamaha.partyModeOn()
yamaha.partyModeOff()
yamaha.partyModeUp()
yamaha.partyModeDown()

//Basic
yamaha.SendXMLToReceiver()

//Get Info
yamaha.getBasicInfo(zone).done(function(basicInfo){
    basicInfo.getVolume();
    basicInfo.isMuted();
    basicInfo.isOn();
    basicInfo.isOff();
    basicInfo.getCurrentInput();
    basicInfo.isPartyModeEnabled();
    basicInfo.isPureDirectEnabled();
    basicInfo.getBass();
    basicInfo.getTreble();
    basicInfo.getSubwooferTrim();
    basicInfo.getDialogueLift();
    basicInfo.getDialogueLevel();
    basicInfo.isYPAOVolumeEnabled();
    basicInfo.isExtraBassEnabled();
    basicInfo.isAdaptiveDRCEnabled();
})

yamaha.isHeadphoneConnected()
yamaha.getSystemConfig()
yamaha.getAvailableInputs()
yamaha.isMenuReady("NET_RADIO")

// FM Tuner
yamaha.getTunerInfo()
yamaha.getTunerPresetList()
yamaha.selectTunerPreset(1)
yamaha.selectTunerFrequency(band, frequency)

//Select Menu Items
yamaha.selectUSBListItem(1)
yamaha.selectWebRadioListItem(1)

// Single Commands, receiver has to be in the right state
yamaha.getWebRadioList()
yamaha.selectWebRadioListItem(1)

// Chained Commands, they ensure the receiver is in the right state
yamaha.switchToFavoriteNumber()

// Zone Commands
yamaha.getAvailableZones()
yamaha.getZoneConfig(zone)

```

#### Zones
The zone parameter is optional, you can pass a number or a string

#### Promises
All these methods return a promise:
```javascript
yamaha.isOn().then(function(result){
	console.log("Receiver is:"+result);
})
```
#### Execute Tests
```javascript
mocha mochatest.js --ip 192.168.0.25
or with autodiscovery
mocha mochatest.js
```

#### Discovery
If the IP is omitted in the constructor, the module will try to discover the yamaha ip via a SSDP call.
Thanks @soef @mwittig
