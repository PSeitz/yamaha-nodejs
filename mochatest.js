var assert = require("assert");
var expect = require('chai').expect;
var Yamaha = require("./yamaha.js");

// Tests For Yamaha RV-775
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

	it('should switch to the webradio favorites using the chained command', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);

		yamaha.switchToFavoriteNumber(1).done(function(result){
			expect(result).to.equal('<YAMAHA_AV rsp="PUT" RC="0"><NET_RADIO><List_Control><Direct_Sel></Direct_Sel></List_Control></NET_RADIO></YAMAHA_AV>');
			done();
		});

	});


	it('should be turned on', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);
		yamaha.powerOn().done(function(on){
			yamaha.isOn().done(function(result){
				expect(result).to.be.true;
				done();
			});
		});
	});

	it('should switch to HDMI2', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);

		yamaha.setMainInputTo("HDMI2").done(function() {
			
			yamaha.getCurrentInput().done(function(result){
				expect(result).to.equal("HDMI2");
				done();

			});
		});

	});

	it('should switch to NET RADIO', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);

		yamaha.setMainInputTo("NET RADIO").done(function() {
			
			yamaha.getCurrentInput().done(function(result){
				expect(result).to.equal("NET RADIO");
				done();

			});
		});

	});

	it('should switch to the webradio favorites and wait to be ready', function(done) {
		var yamaha = new Yamaha("192.168.0.25", 0.5);

		yamaha.whenMenuReady("NET_RADIO").done(function(result){
			yamaha.selectWebRadioListItem(1).done(function(inputs){
				yamaha.whenMenuReady("NET_RADIO").done(function(result){
					expect(result).to.be.true;
					done();
				});
			});

		});

	});

	

	


});