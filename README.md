Yamaha-NodeJs
==================

A node module to control your yamaha receiver

### Install
npm install yamaha-nodejs

## Example
```javascript
    var YamahaAPI = require("Yamaha-Network-API");
    var yamaha = new YamahaAPI("192.168.0.100");
    yamaha.powerOn().done(function(){
		console.log("powerOn");
		yamaha.setMainInputTo("NET RADIO").done( function(){
			console.log("Switched to Net Radio");
			yamaha.selectWebRadioListWithNumber(1).done(function(){
				console.log("Selected Favorites");
				yamaha.selectWebRadioListWithNumber(1).done(function(){});
			});

		});
	});
```
## Methods
```javascript
    var yamaha = new Yamaha("192.168.0.100")
    yamaha.powerOff()
    yamaha.powerOn()
    yamaha.isOn()
    yamaha.isOff()
    
    //Volume
    yamaha.setVolumeTo(-500)
    yamaha.volumeUp(50)
    yamaha.volumeDown(50)
    
    //Switch Input
    yamaha.setMainInputTo("NET RADIO")
    
    //Basic
    yamaha.SendXMLToReceiver()
    
    //Get Info
    yamaha.getBasicInfo().done(function(basicInfo){
		basicInfo.getVolume();
		basicInfo.isMuted();
		basicInfo.isOn();
		basicInfo.isOff();
		basicInfo.getCurrentInput();
		basicInfo.isPartyModeEnabled();
		basicInfo.isPureDirectEnabled();
    })
		
    
    yamaha.getSystemConfig()
    yamaha.getAvailableInputs()
    yamaha.isMenuReady("NET_RADIO")
    
    // The Yamaha reveiver is stateful. Some commands only work work if the receiver is in the right state.
    // E.g. to get web radio channels, the "NET RADIO" input has to be selected.
    
    // Single Commands
    yamaha.getWebRadioChannels()
    yamaha.setWebRadioToChannel()
    
    //Chained Commands, Ensure the receiver is in the right state
    yamaha.selectWebRadioListWithNumber()
    yamaha.switchToFavoriteNumber() 
    
    
```
## Deferreds
All these methods return a promise:
```javascript
    yamaha.isOn().done(function(result){
      console.log("Receiver is:"+result);
    })
```
