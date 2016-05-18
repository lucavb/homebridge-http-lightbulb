var Service;
var Characteristic;
var HomebridgeAPI;
var request = require('request');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;

    // console.log(Service.ContactSensor);
    homebridge.registerAccessory("homebridge-http-lightbulb", "http-lightbulb", HTTPLightbulb);
};

function HTTPLightbulb(log, config) {
    this.log = log;
    this.name = config.name;
    this.onUrl = config.onUrl;
    this.offUrl = config.offUrl;
    this.statusUrl = config.statusUrl;




    // info service
    this.informationService = new Service.AccessoryInformation();
        
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, config.manufacturer || "Light")
        .setCharacteristic(Characteristic.Model, config.model || "Bulb")
        .setCharacteristic(Characteristic.SerialNumber, config.serial || "8F1A8DD8FA86");




    this.service = new Service.Lightbulb(this.name);

    this.service.getCharacteristic(Characteristic.On)
        .on('get', this.getState.bind(this));

    var that = this;
    request(this.statusUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            that.service.getCharacteristic(Characteristic.On)
                .setValue(body);
        } else {
            // bad
        }
    });
}

HTTPLightbulb.prototype.setState = function(status, callback) {
    var url;
    if (status) {
        url = this.onUrl;
    } else {
        url = this.offUrl;
    }
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback();
        } else {
            callback(new Error('Could not reach remote or wrong response code'));
        }
    });
    callback();
};

HTTPLightbulb.prototype.getState = function(callback) {
    request(this.statusUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            callback(new Error('Could not reach remote or wrong response code'));
        }
    });
};

HTTPLightbulb.prototype.getServices = function() {
  return [this.informationService, this.service];
};