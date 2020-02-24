const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { log, ExpressAPILogMiddleware } = require('@rama41222/node-logger');
const api = require('./aeroSpikeApi')
const kafkaProducer = require('./kafka.producer');
const mockRecsGenerator = require('./mockRecsGenerator');

const recs = mockRecsGenerator.generateMockData();


const config = {
    name: 'sample-express-app',
    port: 5000,
    host: '0.0.0.0',
};

// Establish connection to the cluster
api.connect()

const app = express();
const logger = log({ console: true, file: false, label: config.name });

app.use(bodyParser.json());
app.use(cors());
app.use(ExpressAPILogMiddleware(logger, { request: true }));

app.get('/getCurrRecommandation', async (req, res) => { 

    try{

    await api.lazyLoadDB(recs);

    const curr = await api.getCurrRecommandation();

    res.status(200).send(JSON.stringify(curr ? curr : {}));

    if (curr) {
    await api.setRecommandationSeen(curr);
    }

} catch(error){
    res.status(400).send(error);
}
 

});

app.post('/produceUserDecision', function(req, res) { 
    const userId = req.body.userId,
        productId = req.body.productId,
        userDecision = req.body.userDecision;

        kafkaProducer.SendPayload({userId, productId, userDecision},(error,data) =>{

            if (error) {
                res.status(400).send(error);
            } else{
                res.status(200).send(data);
            }
        });

}); 

app.listen(config.port, config.host, (e)=> {
    if(e) {
        throw new Error('Internal Server Error');
    }
    logger.info(`${config.name} runninge on ${config.host}:${config.port}`);
});