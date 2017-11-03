var domoticzMqtt = require('domoticz-mqtt'),
    P1Reader = require('p1-reader');

var options = {
    mqttHost: '192.168.1.9',
    domoticzIdx: [],
    domoticzEnergyIdx: 169,
    domoticzGasIdx: 170,
    serialPort: '/dev/ttyUSB0',
    serialDebug: false
};

// Create MQTT connection
var domoticzMqttHelper = new domoticzMqtt({ host: options.mqttHost, idx: options.domoticzIdx });

// Action to be done after connection.
domoticzMqttHelper.on('connect', function () {
    var p1Reader = new P1Reader({ serialPort: options.serialPort, debug: options.serialDebug });
    p1Reader.on('reading', function (data) {
        // Update electricity
        var usage1 = data.electricity.received.tariff1.reading;
        var usage2 = data.electricity.received.tariff2.reading;
        var return1 = data.electricity.delivered.tariff1.reading;
        var return2 = data.electricity.delivered.tariff2.reading;
        var cons = Math.round(data.electricity.received.actual.reading * 1000);
        var prod = Math.round(data.electricity.delivered.actual.reading * 1000);
        var energyString = usage1 + ';' + usage2 + ';' + return1 + ';' + return2 + ';' + cons + ';' + prod;
        domoticzMqttHelper.udevice(options.domoticzEnergyIdx, 0, energyString);

        // Update gas
        var gasString = Math.round(data.gas.reading * 1000);
        domoticzMqttHelper.udevice(options.domoticzGasIdx, 0, gasString);

        // Debug
        if (options.serialDebug) {
            console.log('Currently consuming: ' + data.electricity.received.actual.reading + data.electricity.received.actual.unit);
            console.log('Domoticz energy update: ' + energyString);
            console.log('Domoticz gas update: ' + gasString);
        }
    });

    p1Reader.on('error', function (err) {
        console.log('Error while reading: ' + err);
    });
});

domoticzMqttHelper.on('close', function () {
    console.log('connection closed?');
    process.exit();
});
