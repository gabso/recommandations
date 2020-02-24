const Aerospike = require('aerospike')

const config = {
    hosts: [ { addr:  '0.0.0.0', port: 3000 } ]
   }

const client = Aerospike.client(config)


// Write a record
writeRecord = async function (k, v) {
    let key = new Aerospike.Key('test', 'recs', k)
    return await client.put(key, v)
    }
    // Read a record
    readRecord = async function (k) {
    let key = new Aerospike.Key('test', 'recs', k)
    return await client.get(key)
    }

// Establish connection to the cluster
exports.connect = async function () {
     await client.connect()
}

exports.lazyLoadDB = async function (initData) {

    const initDBKeys= initData.map(element => new Aerospike.Key('test', 'recs', element.id));

    const res =   await client.batchExists(initDBKeys);

  
          
    if (res && res.length > 0 && res.every( el => el.status === 0)){
        return;
    }

    try {
        await client.udfRegister('./resetDb.lua')
          } catch(error){
             console.log('err',error)
     
         }

    var options = {
        ns: 'test',
        set: 'recs',
        bin: 'seen',
        index: 'idx_test_recs_seen',
        datatype: Aerospike.indexDataType.STRING
    } 

    try {
    await client.createIndex(options);
    } catch(error){
        console.log('err',error)

    }

    try {

    let promises =  initData.map(dataElement => writeRecord(dataElement.id,{ 'seen':'false', ...dataElement}));

        await Promise.all(promises);
        // everything succeeded
      } catch (error) {
        // there was an error
      } 
}

resetDBData  = async function() {

    try{
    var scan = client.scan('test', 'recs')

   const res = await scan.background('resetDb', 'resetRecord', [])
   await res.waitUntilDone();
    }
    catch(err){
        console.log('err',err)
    }

    }
      

exports.setRecommandationSeen = async function(rec) {

   await writeRecord(rec.id,{'seen':'true'});
}

exports.getCurrRecommandation = async function () {

    const query =  client.query('test','recs');

    query.where(Aerospike.filter.equal('seen','false'));
    const result = await query.results();

    const curr =  result[0];

    if (curr && curr.bins){
       return curr.bins;
     } else{
        await  resetDBData();
        return await this.getCurrRecommandation(); 
     }
  
}

