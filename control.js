var request = require('request');
var deferred = require('deferred');
var parseString = require('xml2js').parseString;

var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>HDMI1</Input_Sel></Input></Main_Zone></YAMAHA_AV>';





function Yamaha(ip) // Constructor
{
    this.ip = ip;
}


Yamaha.prototype.SendXMLToReceiver= function(xml){
	var d = deferred();
	var promise = request.post(
	    {
	    	method: 'POST', 
		    uri: 'http://'+this.ip+'/YamahaRemoteControl/ctrl',
		    body:xml
		},
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            // console.log(body);
	            d.resolve(body);
	        }else{
	        	// console.log(response.statusCode);
	        	if (error) d.reject(error);
	        	else d.reject(response.statusCode);	
	        }
	        if (error){
	        	// console.log(error);
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


// var service = {};

Yamaha.prototype.powerOn = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>On</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};

Yamaha.prototype.powerOff = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>Standby</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
};


Yamaha.prototype.setMainInputTo = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>'+to+'</Input_Sel></Input></Main_Zone></YAMAHA_AV>';
	return this.SendXMLToReceiver(command);
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

// var yamaha = new Yamaha("192.168.0.25");
// yamaha.switchToFavoriteNumber(1);



// service.switchToWebRadioWithName("chill");

// service.getWebRadioChannels().done(function(result){
// 	console.log(result);
// }, function (err) {
//   console.log("err "+err);
// });

// service.setMainInputTo("HDMI1");
// service.setMainInputTo("NET RADIO");

// service.setWebRadioChannelTo("Line_6");

// This is needed, because the yamaha has a stateful api - yeah ...
function delay(delayInS, callAfterDelay){
	return function(){
		setTimeout(function(){
			callAfterDelay();
		}, delayInS*1000);
	};
}