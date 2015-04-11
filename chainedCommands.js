// var simpleCommands = require('./simpleCommands');
var deferred = require('deferred');

function Yamaha() 
{
}

// Navigates and selects the #number of the webradio favorites
Yamaha.prototype.switchToFavoriteNumber = function(favoritelistname, number){
	var self = this;
	var d = deferred();
	self.powerOn().done(function(){
		self.setMainInputTo("NET RADIO").done( function(){
			self.selectWebRadioListItem(1).done(function(){
				self.whenMenuReady("NET_RADIO").done(function(){
					self.selectWebRadioListItem(number).done(d.resolve);
				});
			});
		});
	});
	return d.promise;
};


Yamaha.prototype.switchToWebRadioWithName = function(name){
	var self = this;
	self.setMainInputTo("NET RADIO").done(function(){

		self.getWebRadioList().done(function(result){
			console.log(result);
			parseString(result, function (err, result) {
			    console.dir(result);
			});

		}, function (err) {
		  console.log("err "+err);
		});

	});

};


module.exports = Yamaha;