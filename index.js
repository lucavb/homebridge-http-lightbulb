var Service;
var Characteristic;
var HomebridgeAPI;
var request = require('request');
var rgbConversion = require("./rgbConversion");


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
    this.ledsStatus = {
        "on" : true,
        "values" : rgbConversion.rgbToHsl(255, 255, 255)
    };
    


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
                that.ledsStatus.on = true;
            } else {
                that.service.getCharacteristic(Characteristic.On)
                .setValue(false);
                that.ledsStatus.on = false;
            }
        } else {
            // bad
        }
    });

    if(config.rgbGetUrl) {
        this.rgbGetUrl = config.rgbGetUrl;
        this.rgbSetUrl = config.rgbSetUrl;
        this.service.getCharacteristic(Characteristic.Hue)
            .on('get', this.getHue.bind(this));
        this.service.getCharacteristic(Characteristic.Hue)
            .on('set', this.setHue.bind(this));

        this.service.getCharacteristic(Characteristic.Saturation)
            .on('get', this.getSat.bind(this));
        this.service.getCharacteristic(Characteristic.Saturation)
            .on('set', this.setSat.bind(this));

        this.service.getCharacteristic(Characteristic.Brightness)
            .on('get', this.getBright.bind(this));
        this.service.getCharacteristic(Characteristic.Brightness)
            .on('set', this.setBright.bind(this));

        request(this.rgbGetUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var arr = body.split(",");
                var hsl = rgbConversion.rgbToHsl(arr[0], arr[1], arr[2]);
                that.ledsStatus.values = hsl;
                that.service.getCharacteristic(Characteristic.Hue).setValue(hsl[0]);
                that.service.getCharacteristic(Characteristic.Saturation).setValue(hsl[1]);
                that.service.getCharacteristic(Characteristic.Brightness).setValue(hsl[2]);
            } else {
                // bad
            }
        });
    }
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



HTTPLightbulb.prototype.getHue = function(callback) {
    callback(null, this.ledsStatus.values[0]);
};

HTTPLightbulb.prototype.setHue = function(level, callback) {
    this.ledsStatus.values[0] = level;
    if (this.ledsStatus.on) {
        var rgb = rgbConversion.hslToRgb(this.ledsStatus.values[0], this.ledsStatus.values[1], this.ledsStatus.values[2]);
        console.log("writing " + rgb);
        request( { url : this.rgbSetUrl, headers : { "Authorization" : this.auth }, qs : rgb }, function (error, response, body) {
            console.log("habe antwort erhalten");
            if (!error && response.statusCode == 200) {
                //
            } else {
                //callback(new Error('Could not reach remote or wrong response code'));
            }
            callback();
        });
    }
};






HTTPLightbulb.prototype.getSat = function(callback) {
    callback(null, this.ledsStatus.values[1]);
};

HTTPLightbulb.prototype.setSat = function(level, callback) {
    this.ledsStatus.values[1] = level;
    if (this.ledsStatus.on) {
        var rgb = rgbConversion.hslToRgb(this.ledsStatus.values[0], this.ledsStatus.values[1], this.ledsStatus.values[2]);
        request( { url : this.rgbSetUrl, headers : { "Authorization" : this.auth }, qs : rgb }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //callback();
            } else {
                //callback(new Error('Could not reach remote or wrong response code'));
            }
            callback();
        });
    }
};




HTTPLightbulb.prototype.getBright = function(callback) {
    callback(null, this.ledsStatus.values[2]);
};

HTTPLightbulb.prototype.setBright = function(level, callback) {
    this.ledsStatus.values[2] = level;
    if (this.ledsStatus.on) {
        var rgb = rgbConversion.hslToRgb(this.ledsStatus.values[0], this.ledsStatus.values[1], this.ledsStatus.values[2]);
        request( { url : this.rgbSetUrl, headers : { "Authorization" : this.auth }, qs : rgb }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //callback();
            } else {
                //callback(new Error('Could not reach remote or wrong response code'));
            }
            callback();
        });
    }
};






HTTPLightbulb.prototype.getServices = function() {
    return [this.informationService, this.service];
};
