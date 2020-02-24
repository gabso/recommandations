const dummyjson = require('dummy-json');



exports.generateMockData = () => {

    const myPartials = {
        user: '{\
          "id": {{@index}},\
          "productName": "{{company}}",\
          "price": "{{int 1 1000}}"\
        }'
      };
       
      const template = '[\
            {{#repeat 10}}\
              {{> user}}\
            {{/repeat}}\
          ]\
          ';
       
          const recommandations = dummyjson.parse(template, {partials: myPartials});
    
      return JSON.parse(recommandations);
    
}

