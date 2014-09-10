var simpleCommands = require('./simpleCommands');

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