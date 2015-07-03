
var aConfigAnalyser = {
  "fr": {
      'stopwords': "_french_",
      "name"   : "light_french"
  },
  "de": {
      'stopwords': "_german_",
      "name"   : "minimal_german"
  },
  "en": {
      'stopwords': "_english_",
      "name"   : "minimal_english"
  },
  "it": {
      'stopwords': "_italian_",
      "name"   : "light_italian"
  },
};
var countryCode = "en";
//***** Learning page
EasySearch.createSearchIndex("somethingCollection-dev", {//name into ES
  'collection': Ingredients, // instanceof Meteor.Collection
  'field': ['name'], // array of fields to be searchable
  'limit': 5,
  'use' : 'elastic-search',
  'props': { 'iKnowYou':[], 'searchObject':{_id:''} },
  'transformResults':function(something){
      return something;
  },
  'type': 'my_mapping',
  'sort': function() { return {"_score":-1}; },
  'mapping': {
      'my_mapping': {//type define before
          // '_all': {
          //   'index_analyzer': 'default_analyzer',
          //   'search_analyzer': 'language_analyzer'
          // },
          'properties': {
              'name': {
                  'type': 'multi_field',//date float integer multi_field string
                  'fields': {
                    'default': {//using in the field array defined before
                      'type': 'string',
                      'index': 'analyzed',
                      'analyzer': 'default_analyzer',
                      'store': 'yes'
                    }
                  }
            }
          }
      }
  },
  'settings': {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      'analysis': {
          'analyzer': {
              'default_analyzer': {
                  'tokenizer': 'standard', // (letter // keyword // standard )
                  'filter': ['uppercase', 'edge_ngram']
              },
              'language_analyzer': {
                'type': 'custom',
                'tokenizer': 'my_ngram_tokenizer',
                'filter': ['asciifolding', 'stop_filter', 'stem_filter'], 
                'char_filter': ['html_strip']
              },
          },
          "tokenizer": {
                        "my_ngram_tokenizer": {
                            "type": "nGram",
                            "min_gram": "2",
                            "max_gram": "9",
                            "token_chars": [ "letter", "digit" ]
                        }
          },
          'filter': {
              'stop_filter': {
                'type': 'stop',
                'stopwords': [aConfigAnalyser[countryCode].stopwords]
              },
              'stem_filter': {
                'type': 'stemmer',
                'name': aConfigAnalyser[countryCode].name
              },
              'edge_ngram': {
                'type': 'edgeNGram',
                'side': 'front',
                'min_gram': '3',
                'max_gram': '10',
                "token_chars": [ "letter", "digit" ]
              }
              
          }
      }
  },
  ///*
  'query': function(nope, opts) {
    var searchObject = this.props.searchObject;
    var ids = [searchObject._id];  

    var nameRange         = 1;
    var cosineRange         = 1;
    
    if(this.props.ranges !== undefined){
      nameRange         = 1000 * parseFloat(this.props.ranges.name);
      cosineRange       = 1000 * parseFloat(this.props.ranges.cosine);
    }    

    var iKnowYouId = [];  
     
    var query = {
                  filtered: {
                            query: {
                                    bool:{ should: [] }
                            },                  
                            filter: {bool : {
                                    must_not: [{ terms : {_id : ids} }]
                                  }
                            }
                  }
              };
    
    this.props.searchObject.script_fields = {};
    var should = [];
    
    //##### FUNCTIONS ######   
    if(cosineRange !== 0 ){
      //nameSomething
      var nameSomething = construct_cosine("nameSomething", searchObject["nameSomething"], cosineRange);
      if(_.isEmpty(nameSomething) !== true){
        should.push(nameSomething.query);
        this.props.searchObject.script_fields = _.extend(this.props.searchObject.script_fields, nameSomething.script_fields);
      }
    }    

    //##### NAME ######
    if(nameRange !== 0){
      searchObject.name = searchObject.name + " ";
      var stopWords = [" DE ", " LA "];
      for (var i = stopWords.length - 1; i >= 0; i--) {
        searchObject.name = searchObject.name.replaceAll(stopWords[i], " ");
      };
      should.push({ "match" : {"name.default" : { "boost" : nameRange, "query" : searchObject.name} } });
    }
    
    query.filtered.query.bool.should = should;

    return query;
  },
  'body': function(bodyObj, opts) {  
    bodyObj.script_fields = this.props.searchObject.script_fields;
    return bodyObj;
  }
});

//see:
//https://github.com/imotov/elasticsearch-native-script-example/blob/master/src/main/java/org/elasticsearch/examples/nativescript/script/CosineSimilarityScoreScript.java
function construct_cosine(name , dataCosine, rangeCosine){
  var query;
  var terms = [];
  var weights = [];
  var queryString = "";
  var othersDescriptors = [];
  var script_fields = {};
  var cosineString = String(name) + "String";//plane plane plane bike bike roller
  if(dataCosine === undefined){
    return {};
  }
  
  if(dataCosine !== undefined && _.isEmpty(dataCosine) === false){
    for (var i = dataCosine.length - 1; i >= 0; i--) {
      var currentDesc = dataCosine[i].descr.toLowerCase().replaceAll("-","");
      script_fields[""+currentDesc+"-tf"] = {"script": "_index['"+cosineString+"']['"+currentDesc+"'].tf()"};
      
      terms.push(currentDesc);
      weights.push(dataCosine[i].weight + 0.000000000001);
      queryString = queryString + " " + currentDesc;
    };
  }

  //add the others cosine
  for (var i = distinctEntries.length - 1; i >= 0; i--) {
    var currentDesc = distinctEntries[i].toLowerCase().replaceAll("-","");
    var index = _.indexOf(terms, currentDesc);

    if(index !== -1){
      //weights[index] = Math.max(weights[index], 0.000000000001);
    }else{
      script_fields[""+currentDesc+"-tf"] = {"script": "_index['"+cosineString+"']['"+currentDesc+"'].tf()"};
      terms.push(currentDesc);
      weights.push(0.000000000001);
    }
  };

  query = {
            "function_score": {
               "query": {
                  "bool": {
                     "must": [
                        {
                           "match": {}
                        }
                     ]
                  }
               },
               "functions": [
                  {
                     "script_score": {
                        "params": {
                           "field": cosineString,
                           "terms": terms,//['plane', 'bike', 'roller']
                           "weights": weights//[3.000000000001, 2.000000000001, 1.000000000001]
                        },
                        "script": "cosine_sim_script_score",
                        "lang": "native"
                     }
                  }
               ],
               "boost_mode": "replace"
            }
         }; 
  query.function_score.query.bool.must[0].match[cosineString] = {
                                 "query": queryString,//plane plane plane bike bike roller
                                 "operator": "and",
                                 "boost": rangeCosine//1 or 1000 etc.
                              };

  return {query:query,script_fields:script_fields};
  
}