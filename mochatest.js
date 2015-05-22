var assert = require("assert");
var expect = require('chai').expect;
var Yamaha = require("./yamaha.js");

var yamaha_ip= process.argv[4] || "192.168.0.25";

// Tests For Yamaha RV-775
describe('Yamaha-API', function() {
	this.timeout(5000);

	it('should create a yamaha object', function() {
		var yamaha = new Yamaha(yamaha_ip);
	});


	it('should be turned on', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);
		yamaha.powerOn().done(function(on){
			yamaha.isOn().done(function(result){
				expect(result).to.be.true;
				done();
			});
		});
	});


	it('should return 16 Inputs', function(done) {
		var yamaha = new Yamaha(yamaha_ip);
		yamaha.getAvailableInputs().done(function(inputs){
			expect(inputs).to.have.length(16);
			done();
		});
	});

	it('should set volume to -600', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);
		yamaha.setVolume(-600).done(function(on){
			yamaha.getVolume().done(function(volume){
				expect(volume).to.equal(-600);
				done();
			});
		});
	});

	it('should increase volume by 100', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);
		yamaha.volumeUp(100).done(function(on){
			yamaha.getVolume().done(function(volume){
				expect(volume).to.equal(-500);
				done();
			});
		});
	});


	// it('should switch to the webradio favorites using the chained command', function(done) {
	// 	var yamaha = new Yamaha(yamaha_ip, 0.5);

	// 	yamaha.switchToFavoriteNumber(1).done(function(result){
	// 		yamaha.getCurrentInput().done(function(result){
	// 			expect(result).to.equal("NET RADIO");
	// 			done();
	// 		});
	// 	});

	// });


	it('should switch to HDMI2', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);
		yamaha.setMainInputTo("HDMI2").done(function() {
			yamaha.getCurrentInput().done(function(result){
				expect(result).to.equal("HDMI2");
				done();
			});
		});

	});

	it('should switch to NET RADIO', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);
		yamaha.setMainInputTo("NET RADIO").done(function() {
			yamaha.getCurrentInput().done(function(result){
				expect(result).to.equal("NET RADIO");
				done();
			});
		});

	});

	it('should switch to the webradio favorites and wait to be ready', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);

		yamaha.whenMenuReady("NET_RADIO").done(function(result){
			yamaha.selectWebRadioListItem(1).done(function(inputs){
				yamaha.whenMenuReady("NET_RADIO").done(function(result){
					expect(result).to.be.true;
					done();
				});
			});

		});

	});

	it('should be turned off', function(done) {
		var yamaha = new Yamaha(yamaha_ip, 0.5);
		yamaha.powerOff().done(function(on){
			yamaha.isOn().done(function(result){
				expect(result).to.be.false;
				done();
			});
		});
	});


	// it('should list the webradio favorites list info', function(done) {
	// 	var yamaha = new Yamaha(yamaha_ip, 0.5);

	// 	yamaha.whenMenuReady("NET_RADIO").done(function(result){
	// 		yamaha.selectWebRadioListItem(1).done(function(inputs){
	// 			yamaha.whenMenuReady("NET_RADIO").done(function(result){
	// 				expect(result).to.be.true;
	// 				done();
	// 			});
	// 		});

	// 	});

	// });

	

	


});