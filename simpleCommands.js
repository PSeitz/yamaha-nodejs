var request = require('request');
var deferred = require('deferred');
var parseString = require('xml2js').parseString;


//<YAMAHA_AV cmd="GET"><USB><List_Info>GetParam</List_Info></USB></YAMAHA_AV>
//<YAMAHA_AV cmd="GET"><USB><Play_Info>GetParam</Play_Info></USB></YAMAHA_AV>

// The Module Constructor, needs the ip as parameter : e.g. new Yamaha("192.168.0.15")

/**
 * The Yamaha Module Constructor.
 * @constructor
 * @param {string} ip - The ip of the yamaha receiver.
 * @param {number} responseDelay - The delay of the response for put commands, in seconds - defaults to 1. Better than polling...
 *
 */
function Yamaha(ip, responseDelay) 
{
	// if (typeof responseDelay == 'string' || responseDelay instanceof String) responseDelay = parseInt(responseDelay);
	// if (!responseDelay) responseDelay = 1;
 //   	this.ip = ip;
 //    this.responseDelay = responseDelay;
}

Yamaha.prototype.powerOn = function(to){

	var self = this;

	return getPromiseWithSuccessCallback(self.isOn(), function(isOn, promise){

		if (isOn) {
			promise.resolve(true);
			return;
		}

		var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>On</Power></Power_Control></Main_Zone></YAMAHA_AV>';
		return self.SendXMLToReceiver(command).done(function(xmlresult){

			//TODO : CHECK return value
			// parseString(xmlresult, function (err, info) {
			// 	enrichBasicStatus(info);
			// 	promise.resolve(info);
			// });

			promise.resolve(true);
		});
	});

};

Yamaha.prototype.powerOff = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>Standby</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};


Yamaha.prototype.setVolumeTo = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Volume><Lvl><Val>'+to+'</Val><Exp>1</Exp><Unit>dB</Unit></Lvl></Volume></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};
Yamaha.prototype.setVolume = Yamaha.prototype.setVolumeTo;

Yamaha.prototype.volumeUp = function(by){
	return this.adjustVolumeBy(by);
};

Yamaha.prototype.volumeDown= function(by){
	return this.adjustVolumeBy(-by);
};

Yamaha.prototype.adjustVolumeBy = function(by){
	if (typeof by == 'string' || by instanceof String) by = parseInt(by);
	var self = this;
	var d = deferred();
	self.getBasicInfo().done(function(basicInfo){
		self.setVolumeTo(basicInfo.getVolume()+by).done(d.resolve);
	});
	return d.promise;
};

Yamaha.prototype.setMainInputTo = function(to){
	return this.setInputTo("Main_Zone", to);
};

Yamaha.prototype.setInputTo = function(zone, to){
	var command = '<YAMAHA_AV cmd="PUT"><'+zone+'><Input><Input_Sel>'+to+'</Input_Sel></Input></'+zone+'></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

Yamaha.prototype.SendXMLToReceiver= function(xml){
	var self = this;
	var d = deferred();
	var promise = request.post(
	    {
	    	method: 'POST', 
		    uri: 'http://'+this.ip+'/YamahaRemoteControl/ctrl',
		    body:xml
		},
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	        	isPutCommand = xml.indexOf("cmd=\"PUT\"">=0);
	        	if (isPutCommand) {
	        		setTimeout(function(){
	        			d.resolve(body);
	        		}, self.responseDelay*1000);
	        	}else{
	        		d.resolve(body);
	        	}
	            
	        }else{
	        	if (error) d.reject(error);
	        	else d.reject(response.statusCode);	
	        }
	        if (error){
	        	console.log(error);
	        	d.reject(error);	
	        }
	    }
	);

	return d.promise;

};

Yamaha.prototype.getColor = function()
{
    return "The receiver is blue";
};

Yamaha.prototype.getBasicInfo = function(){

	var command = '<YAMAHA_AV cmd="GET"><Main_Zone><Basic_Status>GetParam</Basic_Status></Main_Zone></YAMAHA_AV>';
	return getPromiseWithSuccessCallback(this.SendXMLToReceiver(command), function(xmlresult, promise){
		parseString(xmlresult, function (err, info) {
			enrichBasicStatus(info);
			promise.resolve(info);
		});
	});

};

function enrichBasicStatus(basicStatus){

	basicStatus.getVolume = function(){
		return parseInt(basicStatus.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Volume[0].Lvl[0].Val[0]);
	};

	basicStatus.isMuted = function(){
		return basicStatus.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Volume[0].Mute[0] !== "Off";
	};

	basicStatus.isOn = function(){
		return basicStatus.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Power_Control[0].Power[0] === "On";
	};

	basicStatus.isOff = function(){
		return !basicStatus.isOn();
	};

	basicStatus.getCurrentInput = function(){
		return basicStatus.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Input[0].Input_Sel[0];
	};

	basicStatus.isPartyModeEnabled = function(){
		return basicStatus.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Party_Info[0] === "On";
	};

	basicStatus.isPureDirectEnabled = function(){
		return basicStatus.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Sound_Video[0].Pure_Direct[0].Mode[0] === "On";
	};
}


// Add direct functions for basic info
function addBasicInfoWrapper(basicInfo){
	Yamaha.prototype[basicInfo] = function(){
		return getPromiseWithSuccessCallback(this.getBasicInfo(), function(result, promise){
			promise.resolve(result[basicInfo]());
		});
	};
}
//TODO: no list, take properties of basicStatus object
var basicInfos = ["getVolume", "isMuted", "isOn", "isOff", "getCurrentInput","isPartyModeEnabled", "isPureDirectEnabled"];
for (var i = 0; i < basicInfos.length; i++) {
	var basicInfo = basicInfos[i];
	addBasicInfoWrapper(basicInfo);
}

Yamaha.prototype.getSystemConfig = function(){
	var command = '<YAMAHA_AV cmd="GET"><System><Config>GetParam</Config></System></YAMAHA_AV>';
	return getPromiseWithSuccessCallback(this.SendXMLToReceiver(command), function(xmlresult, promise){
		parseString(xmlresult, function (err, info) {
			promise.resolve(info);
		});
	});
};


function getPromiseWithSuccessCallback(origPromise, sucess){
	var d = deferred();
	origPromise.done(function(result){
		sucess(result, d);
	}, d.reject);

	return d.promise;
}

Yamaha.prototype.getAvailableInputs = function(){
	return getPromiseWithSuccessCallback(this.getSystemConfig(), function(info, d){
		var inputs = [];
		var inputsXML = info.YAMAHA_AV.System[0].Config[0].Name[0].Input[0];
		for (var prop in inputsXML) {
			inputs.push(inputsXML[prop][0]);
		}
		d.resolve(inputs);
	});
};

Yamaha.prototype.selectListItem = function(listname, number){
	var command = '<YAMAHA_AV cmd="PUT"><'+listname+'><List_Control><Direct_Sel>Line_'+number+'</Direct_Sel></List_Control></'+listname+'></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

Yamaha.prototype.getList = function(name){
	var command = '<YAMAHA_AV cmd="GET"><'+name+'><List_Info>GetParam</List_Info></'+name+'></YAMAHA_AV>';
	return getPromiseWithSuccessCallback(this.SendXMLToReceiver(command), function(xmlresult, promise){
		parseString(xmlresult, function (err, info) {
			enrichListInfo(info, name);
			promise.resolve(info);
		});
	});
};

function enrichListInfo(listInfo, listname){

	listInfo.hasSelectableItems = function(){
		return listInfo.YAMAHA_AV[listname][0].List_Info[0].Current_List[0].Line_1[0].Attribute[0] !== "Unselectable";
	};

	listInfo.isReady = function(){

		return !listInfo.isBusy() && listInfo.hasSelectableItems();
	};

	listInfo.isBusy = function(){
		return listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Status[0] === "Busy";
	};

	listInfo.getMenuLayer = function(){
		return listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Layer[0];
	};

	listInfo.getMenuName = function(){
		return listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Name[0];
	};

	listInfo.getList = function(){
		var list = listInfo.YAMAHA_AV[listname][0].List_Info[0].Menu_Name[0];
		console.log(list);
		// for (var i = 0; i < list.length; i++) {
		// 	list[i]
		// };
	};


}


Yamaha.prototype.isMenuReady = function(name){
	var self = this;
	return getPromiseWithSuccessCallback(self.getList(name), function(result, promise){
		promise.resolve(result.isReady());
	});
};

Yamaha.prototype.whenMenuReady = function(name){
	var self = this;
	return self.when("isMenuReady",name, true);
};

Yamaha.prototype.when = function(YamahaCall, parameter, expectedReturnValue){
	var self = this;

	var d = deferred();
	var tries = 0;
	var interval = setInterval(function(){
		console.log("Checking");
		self[YamahaCall](parameter).done(function(result){
			if (result == expectedReturnValue){
				clearInterval(interval);
				d.resolve(true);
			}
			tries++;
			if (tries > 40) d.reject("Timeout");
		});

	}, 500);

	return d.promise;
};

Yamaha.prototype.selectUSBListItem = function(number){
	return this.selectListItem("USB", number);
};

Yamaha.prototype.selectWebRadioListItem = function(number){
	return this.selectListItem("NET_RADIO", number);
};

//TODO: More XML CONVERT
Yamaha.prototype.getWebRadioList = function(){
	return this.getList("NET_RADIO");
};
Yamaha.prototype.getUSBList = function(){
	return this.getList("USB");
};


module.exports = Yamaha;