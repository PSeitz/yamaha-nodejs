var assert = require("assert");
var expect = require('chai').expect;
var Yamaha = require("./simpleCommands.js");


describe('Yamaha-API', function() {

	it('should create a yamaha object', function() {
		var yamaha = new Yamaha("192.168.0.25");

	});

	it('16 Inputs', function(done) {
		var yamaha = new Yamaha("192.168.0.25");
		yamaha.getAvailableInputs().done(function(inputs){
			expect(inputs).to.have.length(16);
			done();
		});
	});


	it('should be turned on', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);
		yamaha.powerOn().done(function(inputs){
			yamaha.isOn().done(function(result){
				expect(result).to.be.true;
				done();
			});
			
		});

	});


	it('should switch to the webradio favorites and wait to be ready', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);

		yamaha.selectWebRadioListItem(1).done(function() {
			console.log("Selected Favorites");

			yamaha.whenMenuReady().done(function(){

			});

			yamaha.selectWebRadioListItem(config.selectWebRadioFavoriteChannel).done(function() {});
		});

		yamaha.powerOn().done(function(inputs){
			yamaha.isOn().done(function(result){
				
			});

			expect(result).to.be.true;
				done();
			
		});

	});

});