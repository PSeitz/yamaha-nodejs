var Yamaha = require("./yamaha.js");
var yamaha = new Yamaha();

yamaha.isOn().done(function(result){
    console.log(result);
});


// yamaha.discover().then(function(result){
// 	console.log(result);
// });
