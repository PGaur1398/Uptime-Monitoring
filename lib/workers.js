const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const config = require('./config');

var workers = {};
workers.gatherAllChecks = function(){
    _data.list('checks',function(err,checks){
       if(!err && checks && checks.length > 0){
        checks.forEach(checks => {
            _data.read('checks',checks,function(err,originalCheckData){
                if(!err && originalCheckData){
                    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
                    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;
                    workers.performCheck(originalCheckData);
                } 
                else{
                    console.log('Error reading one of the check data with id : ' + checks);
                }
        });
       });
    }
       else{
           console.log('Error : Could not find any checks to process');
       }
    });
};
workers.performCheck = function(originalCheckData){
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    }

    var outcomeSent = false;
    var parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url,true);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path;
    // Constructing The request
    var requestDetail = {
        'protocol' : originalCheckData.protocol + ':',
        'hostname' : hostname,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000,

    }
    var inputProtocol = originalCheckData.protocol == 'http' ? http  : https;
    var req = inputProtocol.request(requestDetail,function(res){
        checkOutcome.responseCode = res.statusCode;
        if(!outcomeSent){
            workers.performCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
        }
    });
  req.on('error',function(err){
    checkOutcome.error = {
        'error' : true,
        'value' : err,
    };
    if(!outcomeSent){
        // workers.performCheckOutcome(originalCheckData);
            outcomeSent = true;
    }
  });
  req.on('timeout',function(){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {'error' : true, 'value' : 'timeout'};
    if(!outcomeSent){
      // workers.performCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent = true;
    }
  });
  req.end();
};
workers.performCheckOutcome = function(originalCheckData,checkOutcome){
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    var alert = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();
    
    _data.update('checks',newCheckData.id,newCheckData,function(err){
      if(!err){
        if(alert){
          workers.alertUser(newCheckData);
        } else {
          console.log("no alert needed");
        }
      } else {
        console.log("Error trying to save updates to one of the checks");
      }
    });
};
workers.alertUser = function(newCheckData){
    var msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone,msg,function(err){
      if(!err){
        console.log("Success: User was alerted to a status change in their check, via sms: ",msg);
      } else {
        console.log("Error: Could not send sms alert to user who had a state change in their check",err);
      }
    });
  };
workers.loop = function(){
    
    setInterval(function(){
        workers.gatherAllChecks();
    },1000 * 60)
};
workers.init = function(){
  workers.gatherAllChecks();
  workers.loop();
}
module.exports = workers;

