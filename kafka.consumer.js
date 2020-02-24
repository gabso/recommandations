var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = new kafka.KafkaClient({kafkaHost: 'localhost:29092'}),
    consumer = new Consumer(
        client,
        [
            { topic: 'recommandations' }
        ]
    );

    consumer.on('message', function (message) {
        console.log(message);
    });