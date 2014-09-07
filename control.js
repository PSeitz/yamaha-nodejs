var request = require('request');
var deferred = require('deferred');
var parseString = require('xml2js').parseString;


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
	if (typeof responseDelay == 'string' || responseDelay instanceof String) responseDelay = parseInt(responseDelay);
	if (!responseDelay) responseDelay = 1;
   	this.ip = ip;
    this.responseDelay = responseDelay;
}


Yamaha.prototype.powerOn = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>On</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

Yamaha.prototype.powerOff = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>Standby</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};


Yamaha.prototype.setVolumeTo = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Volume><Lvl><Val>'+to+'</Val><Exp>1</Exp><Unit>dB</Unit></Lvl></Volume></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

Yamaha.prototype.volumeUp = function(by){
	return this.adjustVolumeBy(by);
};

Yamaha.prototype.volumeDown= function(by){
	return this.adjustVolumeBy(-by);
};

Yamaha.prototype.setMainInputTo = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>'+to+'</Input_Sel></Input></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

// Navigates and selects the #number of the webradio favorites
Yamaha.prototype.switchToFavoriteNumber = function(number){
	var self = this;
	self.powerOn().done(delay(2,function(){

		console.log("powerOn");
		self.setMainInputTo("NET RADIO").done(delay(2, function(){
			console.log("NET RADIO");
			self.selectWebRadioListWithNumber(1).done(delay(2, function(){
				console.log("Selected Favorites");
				self.selectWebRadioListWithNumber(number).done(function(){
					console.log("Callback Hell accomplished");
				});
			}));

		}));
	}));
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
			enrichBasicInfo(info);
			promise.resolve(info);
		});
	});

};


Yamaha.prototype.getSystemConfig = function(){
	var command = '<YAMAHA_AV cmd="GET"><System><Config>GetParam</Config></System></YAMAHA_AV>';
	return getPromiseWithSuccessCallback(this.SendXMLToReceiver(command), function(xmlresult, promise){
		parseString(xmlresult, function (err, info) {
			promise.resolve(info);
		});
	});
};

function enrichBasicInfo(basicInfo){

	basicInfo.getVolume = function(){
		return parseInt(basicInfo.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Volume[0].Lvl[0].Val[0]);
	};

	basicInfo.isMuted = function(){
		return basicInfo.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Volume[0].Mute[0] !== "Off";
	};

	basicInfo.isOn = function(){
		return basicInfo.YAMAHA_AV.Main_Zone[0].Basic_Status[0].Power_Control[0].Power[0] === "On";
	};

	basicInfo.isOff = function(){
		return !basicInfo.isOn();
	};

}

Yamaha.prototype.isOn = function(){
	return getPromiseWithSuccessCallback(this.getBasicInfo(), function(result, promise){
		promise.resolve(result.isOn());
	});
};

Yamaha.prototype.isOff = function(){
	return getPromiseWithSuccessCallback(this.getBasicInfo(), function(result, promise){
		promise.resolve(result.isOff());
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




Yamaha.prototype.adjustVolumeBy = function(by){
	if (typeof by == 'string' || by instanceof String) by = parseInt(by);
	var self = this;
	var d = deferred();
	self.getBasicInfo().done(function(basicInfo){
		self.setVolumeTo(basicInfo.getVolume()+by).done(d.resolve);
	});
	return d.promise;
};

// <YAMAHA_AV cmd="PUT"><NET_RADIO><List_Control><Cursor>Return</Cursor></List_Control></NET_RADIO></YAMAHA_AV>

// <YAMAHA_AV cmd="GET"><NET_RADIO><List_Info>GetParam</List_Info></NET_RADIO></YAMAHA_AV>

Yamaha.prototype.selectWebRadioListWithNumber = function(number){
	var command = '<YAMAHA_AV cmd="PUT"><NET_RADIO><List_Control><Direct_Sel>Line_'+number+'</Direct_Sel></List_Control></NET_RADIO></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};


Yamaha.prototype.setWebRadioToChannel = function(channel){
	return this.selectWebRadioListWithNumber(channel);
};

Yamaha.prototype.getWebRadioChannels = function(){
	var command = '<YAMAHA_AV cmd="GET"><NET_RADIO><List_Info>GetParam</List_Info></NET_RADIO></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

Yamaha.prototype.switchToWebRadioWithName = function(name){
	var self = this;
	self.setMainInputTo("NET RADIO").done(function(){

		self.getWebRadioChannels().done(function(result){
			console.log(result);
			parseString(result, function (err, result) {
			    console.dir(result);
			});

		}, function (err) {
		  console.log("err "+err);
		});

	});

};

// var yamaha = new Yamaha("192.168.0.25");
// yamaha.getAvailableInputs();
// yamaha.volumeUp("35");
// yamaha.switchToFavoriteNumber(1);

// This is needed, because the yamaha has a stateful api - yeah ...
function delay(delayInS, callAfterDelay){
	return function(){
		setTimeout(function(){
			callAfterDelay();
		}, delayInS*1000);
	};
}


module.exports = Yamaha;