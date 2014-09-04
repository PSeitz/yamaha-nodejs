var request = require('request');
var deferred = require('deferred');
var parseString = require('xml2js').parseString;

var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>HDMI1</Input_Sel></Input></Main_Zone></YAMAHA_AV>';


function SendXMLToReceiver(xml){
	var d = deferred();
	var promise = request.post(
	    {method: 'POST', 
		    uri: 'http://192.168.0.25/YamahaRemoteControl/ctrl',
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

}


var service = {};

service.powerOn = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>On</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return SendXMLToReceiver(command);
};

service.powerOff = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Power_Control><Power>Standby</Power></Power_Control></Main_Zone></YAMAHA_AV>';
	return SendXMLToReceiver(command);
};


service.setMainInputTo = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>'+to+'</Input_Sel></Input></Main_Zone></YAMAHA_AV>';
	return SendXMLToReceiver(command);
};


// <YAMAHA_AV cmd="PUT"><NET_RADIO><List_Control><Cursor>Return</Cursor></List_Control></NET_RADIO></YAMAHA_AV>

// <YAMAHA_AV cmd="GET"><NET_RADIO><List_Info>GetParam</List_Info></NET_RADIO></YAMAHA_AV>

service.selectWebRadioListWithNumber = function(number){
	var command = '<YAMAHA_AV cmd="PUT"><NET_RADIO><List_Control><Direct_Sel>Line_'+number+'</Direct_Sel></List_Control></NET_RADIO></YAMAHA_AV>';
	return SendXMLToReceiver(command);
};


service.setWebRadioToChannel = function(channel){
	return service.selectWebRadioListWithNumber(channel);
};

service.getWebRadioChannels = function(){
	var command = '<YAMAHA_AV cmd="GET"><NET_RADIO><List_Info>GetParam</List_Info></NET_RADIO></YAMAHA_AV>';
	return SendXMLToReceiver(command);
};


service.switchToWebRadioWithName = function(name){

	service.setMainInputTo("NET RADIO").done(function(){

		service.getWebRadioChannels().done(function(result){
			console.log(result);
			parseString(result, function (err, result) {
			    console.dir(result);
			});

		}, function (err) {
		  console.log("err "+err);
		});

	});

	// var command = '<YAMAHA_AV cmd=\"PUT\"><NET_RADIO><List_Control><Direct_Sel>'+to+'</Direct_Sel></List_Control></NET_RADIO></YAMAHA_AV>';
	// return SendXMLToReceiver(command);
};



service.switchToFavoriteNumber = function(number){

	service.powerOn().done(delay(2,function(){

		console.log("powerOn");
		service.setMainInputTo("NET RADIO").done(delay(2, function(){
			console.log("NET RADIO");
			service.selectWebRadioListWithNumber(1).done(delay(2, function(){
				console.log("Selected Favorites");
				service.selectWebRadioListWithNumber(number).done(function(){
					console.log("Callback Hell accomplished");
				});
			}));

		}));
	}));

	


};

service.switchToFavoriteNumber(1);



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