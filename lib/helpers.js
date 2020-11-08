var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var queryString = require('querystring');
var helpers = {};

helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    }
    else{
        return false;
    }
}
helpers.parseJsonToObject = function(str){
  try{
      return JSON.parse(str);
  }
  catch(e){
      return {};
  }
}

helpers.createRandomString = function(l){
  l = typeof(l) == 'number' && l > 0 ? l : false;
  if(l){
     var pos = 'abcdefghijklmnopqrstuvwxyz';
     var str = ""
     for(i = 1;i < l;i++){
         str += pos.charAt(Math.floor(Math.random() * pos.length));
     }
     return str;
  }
  else{
      return false;
  }
 }
//Send an SMS via Twilio

module.exports = helpers;