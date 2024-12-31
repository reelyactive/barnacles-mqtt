/**
 * Copyright reelyActive 2024
 * We believe in an open Internet of Things
 */


const mqtt = require('mqtt');


const DEFAULT_URL = 'mqtt://localhost';
const DEFAULT_CLIENT_OPTIONS = {};
const DEFAULT_TOPIC_PREFIX = 'paretoanywhere';
const DEFAULT_PRINT_ERRORS = false;


/**
 * BarnaclesMqtt Class
 * Distributes raddec, dynamb and spatem events via MQTT.
 */
class BarnaclesMqtt {

  /**
   * BarnaclesMqtt constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.printErrors = options.printErrors || DEFAULT_PRINT_ERRORS;
    this.topicPrefix = ((options.topicPrefix === '') || (options.topicPrefix)) ?
                       options.topicPrefix : DEFAULT_TOPIC_PREFIX;
    this.isClientConnected = false;

    // The (provided) MQTT client has already been instantiated
    if(options.client) {
      this.client = options.client;
    }
    // Create MQTT client using the provided or default options
    else {
      this.client = createMqttClient(self, options.url, options.clientOptions);
    }

  }

  /**
   * Handle an outbound event.
   * @param {String} name The outbound event name.
   * @param {Object} data The outbound event data.
   */
  handleEvent(name, data) {
    let self = this;

    switch(name) {
      case 'raddec':
        return handleRaddec(self, data);
      case 'dynamb':
        return handleDynamb(self, data);
      case 'spatem':
        return handleSpatem(self, data);
    }
  }

}


/**
 * Handle the given raddec by publishing it to MQTT.
 * @param {BarnaclesMqtt} instance The BarnaclesMqtt instance.
 * @param {Object} raddec The raddec data.
 */
function handleRaddec(instance, raddec) {
  let deviceSignature = raddec.transmitterId + '/' + raddec.transmitterIdType;
  let topic = prepareDevicesTopic(instance) + deviceSignature + '/raddec';
  let message = JSON.stringify(raddec);

  instance.client.publish(topic, message);
}


/**
 * Handle the given dynamb by publishing it to MQTT.
 * @param {BarnaclesMqtt} instance The BarnaclesMqtt instance.
 * @param {Object} dynamb The dynamb data.
 */
function handleDynamb(instance, dynamb) {
  let deviceSignature = dynamb.deviceId + '/' + dynamb.deviceIdType;
  let topic = prepareDevicesTopic(instance) + deviceSignature + '/dynamb';
  let message = JSON.stringify(dynamb);

  instance.client.publish(topic, message);
}


/**
 * Handle the given spatem by publishing it to MQTT.
 * @param {BarnaclesMqtt} instance The BarnaclesMqtt instance.
 * @param {Object} spatem The spatem data.
 */
function handleSpatem(instance, spatem) {
  let deviceSignature = spatem.deviceId + '/' + spatem.deviceIdType;
  let topic = prepareDevicesTopic(instance) + deviceSignature + '/spatem';
  let message = JSON.stringify(spatem);

  instance.client.publish(topic, message);
}

/**
 * Prepare the MQTT /devices topic with optional prefix
 * @param {BarnaclesMqtt} instance The BarnaclesMqtt instance.
 */
function prepareDevicesTopic(instance) {
  return (instance.topicPrefix.length === 0) ? 'devices/' :
                                             instance.topicPrefix + '/devices/';
}


/**
 * Create the MQTT client.
 * @param {BarnaclesMqtt} instance The BarnaclesMqtt instance.
 * @param {String} url The MQTT server URL.
 * @param {Object} clientOptions The MQTT client options.
 */
function createMqttClient(instance, url, clientOptions) {
  url = url || DEFAULT_URL;
  clientOptions = clientOptions || DEFAULT_CLIENT_OPTIONS;

  let client = mqtt.connect(url, clientOptions);

  client.on('connect', () => {
    instance.isClientConnected = true;
    console.log('barnacles-mqtt: connected to MQTT server');
  });
  client.on('close', () => {
    if(instance.isClientConnected) {
      instance.isClientConnected = false;
      console.log('barnacles-mqtt: disconnected from MQTT server');
    }
  });
  if(instance.printErrors) {
    client.on('error', (error) => {
      console.log('barnacles-mqtt: MQTT client error');
      console.log(error);
    });
  }

  return client;
}


module.exports = BarnaclesMqtt;