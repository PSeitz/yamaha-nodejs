var request = require('request');

var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>HDMI1</Input_Sel></Input></Main_Zone></YAMAHA_AV>';


function SendXMLToReceiver(xml){

	request.post(
    {method: 'POST', 
    uri: 'http://192.168.0.25/YamahaRemoteControl/ctrl',
    body:xml},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
        if (error) console.log(error);
    }
);


}


var service = {};

service.setMainInputTo = function(to){
	var command = '<YAMAHA_AV cmd="PUT"><Main_Zone><Input><Input_Sel>'+to+'</Input_Sel></Input></Main_Zone></YAMAHA_AV>';
	SendXMLToReceiver(command);
};


// <YAMAHA_AV cmd="PUT"><NET_RADIO><List_Control><Cursor>Return</Cursor></List_Control></NET_RADIO></YAMAHA_AV>

// <YAMAHA_AV cmd="GET"><NET_RADIO><List_Info>GetParam</List_Info></NET_RADIO></YAMAHA_AV>


service.setWebRadioChannelTo = function(to){
	var command = '<YAMAHA_AV cmd=\"PUT\"><NET_RADIO><List_Control><Direct_Sel>'+to+'</Direct_Sel></List_Control></NET_RADIO></YAMAHA_AV>';
	SendXMLToReceiver(command);
};

service.setMainInputTo("HDMI1");
// service.setMainInputTo("NET RADIO");


// service.setWebRadioChannelTo("Line_6");
