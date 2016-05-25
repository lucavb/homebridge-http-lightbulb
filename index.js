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
    this.auth = "Basic " + new Buffer(config.username + ":" + config.password).toString("base64");
    


    // info service
    this.informationService = new Service.AccessoryInformation();
        
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, config.manufacturer || "Light")
        .setCharacteristic(Characteristic.Model, config.model || "Bulb")
        .setCharacteristic(Characteristic.SerialNumber, config.serial || "8F2A8GGG8FA86");




    this.service = new Service.Lightbulb(this.name);

    this.service.getCharacteristic(Characteristic.On)
        .on('get', this.getState.bind(this));
    this.service.getCharacteristic(Characteristic.On)
        .on('set', this.setState.bind(this));

    var that = this;
    request(this.statusUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (body == 1) {
                that.service.getCharacteristic(Characteristic.On).setValue(true);
            } else {
                that.service.getCharacteristic(Characteristic.On)
                .setValue(false);
            }
        } else {
            // bad
        }
    });
}

HTTPLightbulb.prototype.setState = function(status, callback) {
    var urlToUse;
    if (status) {
        urlToUse = this.onUrl;
    } else {
        urlToUse = this.offUrl;
    }
    request(
        {
            url : urlToUse,
            headers : {
                "Authorization" : this.auth
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback();
            } else {
                //callback(new Error('Could not reach remote or wrong response code'));
            }
        }
    );
};

HTTPLightbulb.prototype.getState = function(callback) {
    request(this.statusUrl, function (error, response, body) {
        if (body == 1) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    });
};

HTTPLightbulb.prototype.getServices = function() {
    return [this.informationService, this.service];
};
