var Promise = require("bluebird");
var xml2js = Promise.promisifyAll(require("xml2js"));

var request = Promise.promisify(require("request"));
Promise.promisifyAll(request);

//<YAMAHA_AV cmd="GET"><USB><List_Info>GetParam</List_Info></USB></YAMAHA_AV>
//<YAMAHA_AV cmd="GET"><USB><Play_Info>GetParam</Play_Info></USB></YAMAHA_AV>

function Yamaha() {}

Yamaha.prototype.SendXMLToReceiver = function(xml) {
    var self = this;
    return this.getOrDiscoverIP().then(ip => {
        var isPutCommand = xml.indexOf("cmd=\"PUT\"" >= 0);
        var delay = isPutCommand ? this.responseDelay * 1000 : 0;
        var req = {
            method: 'POST',
            uri: 'http://' + ip + '/YamahaRemoteControl/ctrl',
            body: xml
        };
        if (this.requestTimeout) req.timeout = this.requestTimeout;

        var prom = request.postAsync(req).delay(delay).then(response => response.body)
        if (self.catchRequestErrors === true) prom.catch(console.log.bind(console));

        return prom

    })

};

var reYamahaManufacturer = /<manufacturer>.*yamaha.*<\/manufacturer>/i;
Yamaha.prototype.discover = function(timeout) {
    return new Promise(function(resolve, reject) {
        var ssdp = require("peer-ssdp");
        var peer = ssdp.createPeer();
        var timer = setTimeout(notFound, timeout || 5000);

        function notFound() {
            if (peer) peer.close();
            reject(new Error('Yamaha Receiver not found'))
        }

        peer.on("ready", function() {
            peer.search({
                ST: 'urn:schemas-upnp-org:device:MediaRenderer:1'
            });
        }).on("found", function(headers, address) {
            if (headers.LOCATION) {
                request(headers.LOCATION, function(error, response, body) {
                    if (!error && response.statusCode == 200 && reYamahaManufacturer.test(body)) {
                        clearTimeout(timer);
                        peer.close()
                        resolve(address.address)
                    }
                });
            }
        }).start();
    })

};

function getZone(zone) {
    if (!zone) return "Main_Zone";

    // replace numbers with zones, eg type "2" and it will change to Zone 2
    if (zone.length == 1) {
        zone = zone.replace("/^1", "Main_Zone");
        zone = zone.replace("/^2", "Zone_2");
        zone = zone.replace("/^3", "Zone_3");
        zone = zone.replace("/^4", "Zone_4");
    }

    switch (zone) {
        case 1:
            zone = "Main_Zone";
            break;
        case 2: case 3: case 4:
            zone = "Zone_" + zone;
    }
    return zone;
}

Yamaha.prototype.muteOn = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Volume><Mute>On</Mute></Volume></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.muteOff = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Volume><Mute>Off</Mute></Volume></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.stop = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Play_Control><Playback>Stop</Playback></Play_Control></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.pause = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Play_Control><Playback>Pause</Playback></Play_Control></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.play = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Play_Control><Playback>Play</Playback></Play_Control></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.skip = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Play_Control><Playback>Skip Fwd</Playback></Play_Control></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.rewind = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Play_Control><Playback>Skip Rev</Playback></Play_Control></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.powerOn = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Power_Control><Power>On</Power></Power_Control></' + getZone(zone) + '></YAMAHA_AV>'
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.powerOff = function(zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Power_Control><Power>Standby</Power></Power_Control></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setVolumeTo = function(to, zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Volume><Lvl><Val>' + to + '</Val><Exp>1</Exp><Unit>dB</Unit></Lvl></Volume></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};
Yamaha.prototype.setVolume = Yamaha.prototype.setVolumeTo;

Yamaha.prototype.volumeUp = function(by, zone) {
    return this.adjustVolumeBy(by, zone);
};

Yamaha.prototype.volumeDown = function(by, zone) {
    return this.adjustVolumeBy(-by, zone);
};

Yamaha.prototype.adjustVolumeBy = function(by, zone) {
    if (typeof by == 'string' || by instanceof String) by = parseInt(by);
    var self = this;
    return self.getBasicInfo(zone).then(function(basicInfo) {
        return self.setVolumeTo(basicInfo.getVolume() + by, zone);
    });
};

Yamaha.prototype.partyModeOn = function() {
    var command = '<YAMAHA_AV cmd="PUT"><System><Party_Mode><Mode>On</Mode></Party_Mode></System></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.partyModeOff = function() {
    var command = '<YAMAHA_AV cmd="PUT"><System><Party_Mode><Mode>Off</Mode></Party_Mode></System></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.partyModeUp = function() {
    // Increments all zones up equally
    var command = '<YAMAHA_AV cmd="PUT"><System><Party_Mode><Volume><Lvl>Up</Lvl></Volume><</Party_Mode></System></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.partyModeDown = function() {
    // Increments all zones down equally
    var command = '<YAMAHA_AV cmd="PUT"><System><Party_Mode><Volume><Lvl>Down</Lvl></Volume><</Party_Mode></System></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setMainInputTo = function(to) {
    return this.setInputTo(to, "Main_Zone");
};

Yamaha.prototype.setInputTo = function(to, zone) {
    var command = '<YAMAHA_AV cmd="PUT"><' + getZone(zone) + '><Input><Input_Sel>' + to + '</Input_Sel></Input></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


Yamaha.prototype.sendRcCode = function(code) { // 7C80 = Power on/off
    if (typeof code == 'number') {
        code = code.toString(16);
    }
    //DSZ-Z7: <System><Remote_Signal><Receive><Code>***</Code></Receive></Remote_Signal></System>
    //RX-Vx7x: <System><Misc><Remote_Signal><Receive><Code>***</Code></Receive></Remote_Signal></Misc></System>
    //var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Remote_Control><RC_Code>' + code + '</RC_Code></Remote_Control></Main_Zone></YAMAHA_AV>';
    //var command = '<YAMAHA_AV cmd="PUT"><System><Misc><Remote_Signal><Receive><Code>' + code + '</Code></Receive></Remote_Signal></Misc></System></YAMAHA_AV>';
    //var command = '<YAMAHA_AV cmd="PUT"><System><Remote_Signal><Receive><Code>' + code + '</Code></Receive></Remote_Signal></System></YAMAHA_AV>';

    var command = '<YAMAHA_AV cmd="PUT"><System><Remote_Control><RC_Code>' + code + '</RC_Code></Remote_Control></System></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setPureDirect = function(on) {
    return this.sendPutCommand('<Sound_Video><Pure_Direct><Mode>' + (on ? 'On' : 'Off') + '</Mode></Pure_Direct></Sound_Video>');
};
Yamaha.prototype.setHDMIOutput = function(hdmi_num, on) {
    return this.sendPutCommand('<Sound_Video><HDMI><Output><OUT_' + hdmi_num + '>' + (on ? 'On' : 'Off') + '</OUT_' + hdmi_num + '></Output></HDMI></Sound_Video>', 'System');
};

Yamaha.prototype.sleep = function(val, zone) {
    if (val < 30) val = 'Off';
    else if (val < 60) val = '30 min';
    else if (val < 90) val = '60 min';
    else if (val < 120) val = '90 min';
    else val = '120 min';
    return this.sendPutCommand('<Power_Control><Sleep>' + val + '</Sleep></Power_Control>', zone);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


Yamaha.prototype.setBassTo = function(to) {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Tone><Bass><Val>' + to + '</Val><Exp>1</Exp><Unit>dB</Unit></Bass></Tone></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setTrebleTo = function(to) {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Tone><Treble><Val>' + to + '</Val><Exp>1</Exp><Unit>dB</Unit></Treble></Tone></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setSubwooferTrimTo = function(to) {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Volume><Subwoofer_Trim><Val>' + to + '</Val><Exp>1</Exp><Unit>dB</Unit></Subwoofer_Trim></Volume></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setDialogLiftTo = function(to) {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Dialogue_Adjust><Dialogue_Lift>' + to + '</Dialogue_Lift></Dialogue_Adjust></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.setDialogLevelTo = function(to) {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Dialogue_Adjust><Dialogue_Lvl>' + to + '</Dialogue_Lvl></Dialogue_Adjust></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.YPAOVolumeOn = function() {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><YPAO_Volume>Auto</YPAO_Volume></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.YPAOVolumeOff = function() {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><YPAO_Volume>Off</YPAO_Volume></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.extraBassOn = function() {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Extra_Bass>Auto</Extra_Bass></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.extraBassOff = function() {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Extra_Bass>Off</Extra_Bass></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.adaptiveDRCOn = function() {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Adaptive_DRC>Auto</Adaptive_DRC></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.adaptiveDRCOff = function() {
    var zone = getZone(); //only available in Main Zone
    var command = '<YAMAHA_AV cmd="PUT"><' + zone + '><Sound_Video><Adaptive_DRC>Off</Adaptive_DRC></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};


Yamaha.prototype.getOrDiscoverIP = function() {
    if (this.ip) return Promise.resolve(this.ip)
    if (!this.discoverPromise) {
        this.discoverPromise = this.discover().tap(function(ip) {
            this.ip = ip
        })
    }
    return this.discoverPromise
}

Yamaha.prototype.sendPutCommand = function(command, zone) {
    zone = getZone(zone);
    command = '<YAMAHA_AV cmd="PUT"><' + zone + '>' + command + '</' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.getColor = function() {
    return "The receiver is blue";
};

Yamaha.prototype.isHeadphoneConnected = function() {
    //checks if a Headphone is connected, returns "Connected" or "Not Connected"
    //is not available via getBasicInfo, that's why an additional request is needed
    //only available in Zone 1, this setting is readonly

    var zone = getZone(1);
    var command = '<YAMAHA_AV cmd="GET"><' + zone + '><Sound_Video><Headphone>GetParam</Headphone></Sound_Video></' + zone + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync).then(function(info) {
        try {
            return info.YAMAHA_AV[zone][0].Sound_Video[0].Headphone[0];
        } catch (e) {
            return "Not Available"; //if the Receiver has no Headphone Connector
        }
    });
}

Yamaha.prototype.getBasicInfo = function(zone) {

    var command = '<YAMAHA_AV cmd="GET"><' + getZone(zone) + '><Basic_Status>GetParam</Basic_Status></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync).then(function(info) {
        return enrichBasicStatus(info, zone);
    });

};

function enrichBasicStatus(basicStatus, zone) {
    zone = getZone(zone);

    basicStatus.getVolume = function() {
        return parseInt(basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Volume[0].Lvl[0].Val[0]);
    };

    basicStatus.isMuted = function() {
        return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Volume[0].Mute[0] !== "Off";
    };

    basicStatus.isOn = function() {
        return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Power_Control[0].Power[0] === "On";
    };

    basicStatus.isOff = function() {
        return !basicStatus.isOn();
    };

    basicStatus.getCurrentInput = function() {
        return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Input[0].Input_Sel[0];
    };

    basicStatus.isPartyModeEnabled = function() {
        return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Party_Info[0] === "On";
    };

    //the following properties are only available in Main Zone
    basicStatus.isPureDirectEnabled = function() {
        try {
            return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Pure_Direct[0].Mode[0] === "On";
        } catch (e) {
            return 'Not Available';
        }
    };

    basicStatus.getBass = function() {
        try {
            return parseInt(basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Tone[0].Bass[0].Val[0]);
        } catch (e) {
            return 0;
        }
    };

    basicStatus.getTreble = function() {
        try {
            return parseInt(basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Tone[0].Treble[0].Val[0]);
        } catch (e) {
            return 0;
        }
    };

    basicStatus.getSubwooferTrim = function() {
        try {
            return parseInt(basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Volume[0].Subwoofer_Trim[0].Val[0]);
        } catch (e) {
            return 0;
        }
    };

    basicStatus.getDialogueLift = function() {
        try {
            return parseInt(basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Dialogue_Adjust[0].Dialogue_Lift[0]);
        } catch (e) {
            return 0;
        }
    };

    basicStatus.getDialogueLevel = function() {
        try {
            return parseInt(basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Dialogue_Adjust[0].Dialogue_Lvl[0]);
        } catch (e) {
            return 0;
        }
    };

    basicStatus.isYPAOVolumeEnabled = function() {
        //values 'Off' or 'Auto'
        try {
            return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].YPAO_Volume[0] !== 'Off';
        } catch (e) {
            return false;
        }
    };

    basicStatus.isExtraBassEnabled = function() {
        //values 'Off' or 'Auto'
        try {
            return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Extra_Bass[0] !== 'Off';
        } catch (e) {
            return false;
        }
    };

    basicStatus.isAdaptiveDRCEnabled = function() {
        //values 'Off' or 'Auto'
        try {
            return basicStatus.YAMAHA_AV[zone][0].Basic_Status[0].Sound_Video[0].Adaptive_DRC[0] !== 'Off';
        } catch (e) {
            return false;
        }
    };
    return basicStatus;
}


// Add direct functions for basic info
function addBasicInfoWrapper(basicInfo) {
    Yamaha.prototype[basicInfo] = function(zone) {
        return this.getBasicInfo(zone).then(function(result) {
            return result[basicInfo]();
        });
    };
}
//TODO: no list, take properties of basicStatus object
var basicInfos = ["getVolume", "isMuted", "isOn", "isOff", "getCurrentInput", "isPartyModeEnabled", "isPureDirectEnabled", "getBass", "getTreble", "getSubwooferTrim", "getDialogueLift", "getDialogueLevel", "isYPAOVolumeEnabled", "isExtraBassEnabled", "isAdaptiveDRCEnabled"];
for (var i = 0; i < basicInfos.length; i++) {
    var basicInfo = basicInfos[i];
    addBasicInfoWrapper(basicInfo);
}

Yamaha.prototype.getSystemConfig = function() {
    var command = '<YAMAHA_AV cmd="GET"><System><Config>GetParam</Config></System></YAMAHA_AV>';
    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync);
};

Yamaha.prototype.getZoneConfig = function(zone) {
    var command = '<YAMAHA_AV cmd="GET"><' + getZone(zone) + '><Config>GetParam</Config></' + getZone(zone) + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync);
};

Yamaha.prototype.getAvailableZones = function() {
    return this.getSystemConfig().then(function(info) {
        var zones = [];
        var zonesXML = info.YAMAHA_AV.System[0].Config[0].Feature_Existence[0];
        for (var prop in zonesXML) {
            // Only return zones that the receiver supports
            if (prop.includes('one') && zonesXML[prop].includes('1')) {
                zones.push(prop);
            }
        }
        return zones;
    });
};

Yamaha.prototype.getAvailableInputs = function() {
    return this.getSystemConfig().then(function(info) {
        var inputs = [];
        var inputsXML = info.YAMAHA_AV.System[0].Config[0].Name[0].Input[0];
        for (var prop in inputsXML) {
            inputs.push(inputsXML[prop][0]);
        }
        return inputs;
    });
};

Yamaha.prototype.selectListItem = function(listname, number) {
    var command = '<YAMAHA_AV cmd="PUT"><' + listname + '><List_Control><Direct_Sel>Line_' + number + '</Direct_Sel></List_Control></' + listname + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.getList = function(name) {
    var command = '<YAMAHA_AV cmd="GET"><' + name + '><List_Info>GetParam</List_Info></' + name + '></YAMAHA_AV>';
    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync).then(function(info) {
        enrichListInfo(info, name);
        return info;
    });
};

function enrichListInfo(listInfo, listname) {

    listInfo.hasSelectableItems = function() {
        return listInfo.YAMAHA_AV[listname][0].List_Info[0].Current_List[0].Line_1[0].Attribute[0] !== "Unselectable";
    };

    listInfo.isReady = function() {

        return !listInfo.isBusy() && listInfo.hasSelectableItems();
    };

    listInfo.isBusy = function() {
        return listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Status[0] === "Busy";
    };

    listInfo.getMenuLayer = function() {
        return listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Layer[0];
    };

    listInfo.getMenuName = function() {
        return listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Name[0];
    };

}


Yamaha.prototype.isMenuReady = function(name) {
    var self = this;
    return self.getList(name).then(function(result) {
        return result.isReady();
    });
};

Yamaha.prototype.whenMenuReady = function(name) {
    var self = this;
    return self.when("isMenuReady", name, true);
};

Yamaha.prototype.when = function(YamahaCall, parameter, expectedReturnValue, tries) {
    var self = this;
    tries = tries || 0;
    return this[YamahaCall](parameter).then(function(result) {
        console.log('Polling...');
        if (result == expectedReturnValue) {
            return true;
        } else if (tries > 40) {
            return Promise.reject("Timeout");
        } else {
            return Promise.delay(self.pollingDelay).then(function() {
                return self.when(YamahaCall, parameter, expectedReturnValue, tries + 1);
            });
        }
    });
};

Yamaha.prototype.selectUSBListItem = function(number) {
    return this.selectListItem("USB", number);
};

Yamaha.prototype.selectWebRadioListItem = function(number) {
    return this.selectListItem("NET_RADIO", number);
};

Yamaha.prototype.selectTunerPreset = function(number) {
    var command = '<YAMAHA_AV cmd="PUT"><Tuner><Play_Control><Preset><Preset_Sel>' + number + '</Preset_Sel></Preset></Play_Control></Tuner></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

Yamaha.prototype.getTunerPresetList = function() {
    var command = '<YAMAHA_AV cmd="GET"><Tuner><Play_Control><Preset><Data>GetParam</Data></Preset></Play_Control></Tuner></YAMAHA_AV>';

    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync).then(function(info) {
        var presets = {};
        for (var presetNum in info.YAMAHA_AV.Tuner[0].Play_Control[0].Preset[0].Data[0]) {
            var preset = info.YAMAHA_AV.Tuner[0].Play_Control[0].Preset[0].Data[0][presetNum][0];
            if (preset.Status[0] === 'Exist') {
                var number = presetNum.substring(7);
                var band = preset.Band[0];
                if (band == 'AM') {
                    var freq = preset.Freq[0].AM[0].Val[0] / Math.pow(10, preset.Freq[0].AM[0].Exp[0]);
                } else {
                    var freq = preset.Freq[0].FM[0].Val[0] / Math.pow(10, preset.Freq[0].FM[0].Exp[0]);
                }
                presets[number] = {
                    "preset": number,
                    "band": band,
                    "value": freq
                }
            }
        }
        return (presets);
    });
};

Yamaha.prototype.getTunerInfo = function() {
    var command = '<YAMAHA_AV cmd="GET"><Tuner><Play_Info>GetParam</Play_Info></Tuner></YAMAHA_AV>';

    return this.SendXMLToReceiver(command).then(xml2js.parseStringAsync).then(function(info) {
        var presets = info.YAMAHA_AV.Tuner[0];
        return (presets);
    });
};

Yamaha.prototype.selectTunerFrequency = function(band, frequency) {
    var unit = band == "FM" ? "MHz" : "KHz",
        exp = band == "FM" ? 2 : 0,
        command = '<YAMAHA_AV cmd="PUT"><Tuner><Play_Control><Tuning><Band>' + band + '</Band><Freq><' + band + '><Val>' + frequency + '</Val><Exp>' + exp + '</Exp><Unit>' + unit + '</Unit></' + band + '></Freq></Tuning></Play_Control></Tuner></YAMAHA_AV>';
    return this.SendXMLToReceiver(command);
};

//TODO: More XML CONVERT
Yamaha.prototype.getWebRadioList = function() {
    return this.getList("NET_RADIO");
};
Yamaha.prototype.getUSBList = function() {
    return this.getList("USB");
};


module.exports = Yamaha;
