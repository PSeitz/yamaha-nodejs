var Yamaha = require("./yahama.js");
var yamaha = new Yamaha("192.168.0.25");

yamaha.isOn().done(function(result){
	console.log(result);
});
