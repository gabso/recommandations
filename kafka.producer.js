var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.KafkaClient({
        kafkaHost: '0.0.0.0:29092'
    }),
    producer = new Producer(client);


let producerReady = false;

producer.on('ready', function () {

    producerReady = true;

});

producer.on('error', function (err) {
    console.log('error', err);
})


exports.SendPayload = (payload, callback) => {

    if (producerReady) {

        KeyedMessage = kafka.KeyedMessage;

        const km = Object.keys(payload).map((p => new KeyedMessage(p, payload[p])));
        payloads = [{
            topic: 'recommandations',
            messages: km,
            partition: 0
        }];

        producer.send(payloads,callback);
    } else {
        console.error("sorry, Producer is not ready yet, failed to produce message to Kafka.");
    }

};