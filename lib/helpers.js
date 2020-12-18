var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');
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
helpers.sendTwilioSms = function(phone,msg,callback){
    // Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(phone && msg){
  
      // Configure the request payload
      var payload = {
        'From' : config.twilio.fromPhone,
        'To' : '+1'+phone,
        'Body' : msg
      };
      var stringPayload = querystring.stringify(payload);
  
  
      // Configure the request details
      var requestDetails = {
        'protocol' : 'https:',
        'hostname' : 'api.twilio.com',
        'method' : 'POST',
        'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
        'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
        'headers' : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringPayload)
        }
      };
  
      // Instantiate the request object
      var req = https.request(requestDetails,function(res){
          // Grab the status of the sent request
          var status =  res.statusCode;
          // Callback successfully if the request went through
          if(status == 200 || status == 201){
            callback(false);
          } else {
            callback('Status code returned was '+status);
          }
      });
  
      // Bind to the error event so it doesn't get thrown
      req.on('error',function(e){
        callback(e);
      });
  
      // Add the payload
      req.write(stringPayload);
  
      // End the request
      req.end();
  
    } else {
      callback('Given parameters were missing or invalid');
    }
  };
module.exports = helpers;