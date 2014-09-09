Yamaha-Network-API
==================

A node module to control your yamaha receiver


## Methods
    var yamaha = new Yamaha("192.168.0.100")
    yamaha.powerOff()
    yamaha.setVolumeTo()
    yamaha.volumeUp()
    yamaha.volumeDown()
    yamaha.setMainInputTo()
    yamaha.switchToFavoriteNumber()
    yamaha.SendXMLToReceiver()
    yamaha.getBasicInfo()
    yamaha.getSystemConfig()
    yamaha.isOn()
    yamaha.isOff()
    yamaha.getAvailableInputs()
    yamaha.adjustVolumeBy()
    yamaha.selectWebRadioListWithNumber()
    yamaha.setWebRadioToChannel()
    yamaha.getWebRadioChannels()
    yamaha.switchToWebRadioWithName()

## Deferreds
All these methods return a promise:

    yamaha.isOn().done(function(result){
      console.log("Receiver is:"+result);
    })
