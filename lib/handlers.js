var _data = require('./data');
var helpers = require('./helpers');
const maxChecks = 5;
// Define all the handlers
var handlers = {};
//Users
handlers.users = function(data,callback){
    var allMethods = ['post','get','put','delete'];
    if(allMethods.indexOf(data.method) > -1)
       handlers._users[data.method](data,callback);
    else
       callback(405);
};
//Container for user sub-method
handlers._users = {};
handlers._users.post = function(data,callback){
//checking all required fields are field out
var firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0  ? data.payload.firstname.trim() : false; 
var lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0  ? data.payload.lastname.trim() : false;
var phone = typeof(data.payload.phone) == 'string' ? data.payload.phone.trim() : false;
var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0  ? data.payload.password.trim() : false;
if(firstname && lastname && phone && password){
//Make Sure that user doesn't exist
_data.read('users',phone,function(err,data){
  if(err){
    //Hash the password
    var hashedPassword =  helpers.hash(password);
    if(hashedPassword){
        var userObj = {
            'firstname' : firstname,
            'lastname' : lastname,
            'phone' : phone,
            'password' : hashedPassword
        }; 
    

    // Storing the user data
    _data.create('users',phone,userObj,function(err){
        if(!err)
         callback(200);
         else{
             callback(400,{'Error' : 'A user with that phone number already exists'});
         }
    });
}
else
   callback(500,{'Error' : "Couldn't hash the password"});
  }
  else{
      callback(405,{"Error" : 'A user with that phone number already exist'})
  }
});
}else
  callback(400,{"Error" : "Missing Required Field"});
};
handlers._users.get = function(data,callback){
var phone = data.queryStringObject.phone;
//Get the token from the header
var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

handlers._tokens.verifyTokens(token,phone,function(tokenIsValid){
   if(tokenIsValid){
    _data.read('users',phone,function(err,data){
      if(!err){
          delete data.password;
          callback(200,data);
      }
      else{
        callback(404);
      }
    });
   }
   else{
     callback(403,{'Error' : 'Session invalid'});
   }
});

};
handlers._users.put = function(data,callback){
 var phone = data.queryStringObject.phone;
 var firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0  ? data.payload.firstname.trim() : false; 
 var lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0  ? data.payload.lastname.trim() : false;
 var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0  ? data.payload.password.trim() : false;
 if(firstname || lastname || password)
  {
    //Get the token from the header
var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
handlers._tokens.verifyTokens(token,phone,function(tokenIsValid){
  if(tokenIsValid){
    _data.read('users',phone,function(err,userData){
      if(!err && userData){
        if(firstname){
          userData.firstname = firstname;
        }
        if(lastname){
          userData.lastname = lastname;
        }
        if(password){
          userData.password = helpers.hash(password);
        }
        //Store the new Updates
       _data.update('users',phone,userData,function(err){
         if(!err){
          callback(200);
         }
         else{
           callback(500,{'Error' : "Can't be Updated"});
         }
       });
      }
      else{
        callback(400,{'Error' : 'Missing Required Field2'});
      }
    });
  }
  else{
    callback(403,{'Error' : 'Session Expired'});
  }
});

  }
else{
  console.log(firstname,lastname,password);
  callback(400,{'Error' : 'Missing Required Field1'});
}

};
handlers._users.delete = function(data,callback){
  var phone = data.queryStringObject.phone;
  //Get the token from the header
var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
handlers._tokens.verifyTokens(token,phone,function(tokenIsValid){
   if(tokenIsValid){
    _data.read('users',phone,function(err,data){
      if(!err){
         _data.delete('users',phone,function(err){
           if(!err){
             callback(200);
           }
           else{
             callback(500,{'Error' : 'Data cannot be deleted'});
           }
         })
      }
      else{
        callback(404);
      }
    });
   }
   else{
    callback(403,{'Error' : 'Token is invalid'});
   }
  });
};
//TOKENS
handlers.tokens = function(data,callback){
  var allMethods = ['post','get','put','delete'];
  if(allMethods.indexOf(data.method) > -1)
     handlers._tokens[data.method](data,callback);
  else
     callback(405);
};
handlers._tokens = {};
handlers._tokens.post = function(data,callback){
  var phone = typeof(data.payload.phone) == 'string' ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0  ? data.payload.password.trim() : false;
  if(phone && password){
   //Lookup the user that matches the phone number
   _data.read('users',phone,function(err,userData){
     if(!err && userData){
       var hashedPassword = helpers.hash(password);
         if(hashedPassword == userData.password){
         var tokenId = helpers.createRandomString(20);
         var expires = Date.now() + 1000 * 60 * 60;
         var tokenObject = {
           'phone' : phone,
           'id' : tokenId,
           'expires' : expires
         }
         _data.create('tokens',tokenId,tokenObject,function(err){
           if(!err){
             callback(200,tokenObject);
           }
           else{
              callback(500,{'Error' : "Couldn't create the new token"});
           }
         });
         }
         else{
           callback(400,{"Error" : "Password didn't match the specified field"});
         }
     }
     else{
        callback(400,{'Error' : "Couldn't find the Specified Field"});
     }
   });
  }
  else{
    callback(404,{'Error' : 'Missing Required Field(s)'});
  }
};
handlers._tokens.get = function(data,callback){
  var id = data.queryStringObject.id;
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
        callback(200,tokenData);
    }
    else{
      callback(404);
    }
  })
};
handlers._tokens.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 19 ? data.payload.id : false;
  var extend = typeof(data.payload.extend) == 'boolean' ?  data.payload.extend : false;
  if(id && extend){
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
       if(tokenData.expires > Date.now()){
        //Set the expiration
        tokenData.expires = Date.now() + 1000 * 60 * 60;
        _data.update('tokens',id,tokenData,function(err){
         if(!err)
           callback(200);
           else
             callback(500,{'Error': "Couldn't update Expiry time"});
        });
       }
       else{
         callback(400,{'Error' : "Token already expired"});
       }
      }
      else{
        callback(400,{'Error' : "Specified token doesn't exist"});
      }
    });
  }
  else{
     callback(400,{'Error' : 'Missing require field(s) or field(s) are invalid'});
  }
};
handlers._tokens.delete = function(data,callback){
  var id = data.queryStringObject.id;
  _data.read('users',id,function(err,tokendata){
    if(!err){
       _data.delete('users',id,function(err){
         if(!err){
           callback(200);
         }
         else{
           callback(500,{'Error' : 'Data cannot be deleted'});
         }
       })
    }
    else{
      callback(404);
    }
  });
};
//Verify if given token id is Valid or not
handlers._tokens.verifyTokens = function(id,phone,callback){
  _data.read('tokens',id,function(err,tokenData){
   if(!err && tokenData)
      {
        if(tokenData.phone == phone && tokenData.expires > Date.now())
         callback(true);
         else
           callback(false);
      }
   else
     callback(false);
  });
};
//Checks Handler
handlers.checks = function(data,callback){
  var allMethods = ['post','get','put','delete'];
  if(allMethods.indexOf(data.method) > -1)
     handlers._checks[data.method](data,callback);
  else
     callback(405);
};
// CHECK
handlers._checks = {};
//checks post
handlers._checks.post = function(data,callback){
  // Validate inputs
  var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  if(protocol && url && method && successCodes && timeoutSeconds){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Lookup the user phone by reading the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users',userPhone,function(err,userData){
          if(!err && userData){
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify that user has less than the number of max-checks per user
            if(userChecks.length < maxChecks){
              // Create random id for check
              var checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              var checkObject = {
                'id' : checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method' : method,
                'successCodes' : successCodes,
                'timeoutSeconds' : timeoutSeconds
              };

              // Save the object
              _data.create('checks',checkId,checkObject,function(err){
                if(!err){
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users',userPhone,userData,function(err){
                    if(!err){
                      // Return the data about the new check
                      callback(200,checkObject);
                    } else {
                      callback(500,{'Error' : 'Could not update the user with the new check.'});
                    }
                  });
                } else {
                  callback(500,{'Error' : 'Could not create the new check'});
                }
              });



            } else {
              callback(400,{'Error' : 'The user already has the maximum number of checks ('+maxChecks+').'})
            }


          } else {
            callback(403);
          }
        });


      } else {
        callback(403);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
  }
};

//Checks get
handlers._checks.get = function(data,callback){
  var id = data.queryStringObject.id;
// Lookup the checks
   _data.read('checks',id,function(err,checkData){
     if(!err && checkData){
      //Get the token from the header
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      handlers._tokens.verifyTokens(token,checkData.userPhone,function(tokenIsValid){
        if(tokenIsValid){
         callback(200,checkData);
        }
        else{
          callback(403);
        }
     });
     }
     else
       callback(404);
   });
  };
  //Checks put
  handlers._checks.put = function(data,callback){
    //Check fo the required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 19 ? data.payload.id : false;
    //Check for the optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if(id){
        if(protocol || url || method || successCodes || timeoutSeconds){
           _data.read('checks',id,function(err,checkData){
          if(!err && checkData){
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verifyTokens(token,checkData.userPhone,function(tokenIsValid){
        if(tokenIsValid){
          if(protocol)
           checkData.protocol = protocol;
          if(url)
           checkData.url = url;
          if(method)
           checkData.method = method;
          if(successCodes)
           checkData.successCodes = successCodes;
           if(timeoutSeconds)
           checkData.timeoutSeconds = timeoutSeconds;
         _data.update('checks',id,checkData,function(err){
           if(!err)
             callback(200);
           else
             callback(500,{'Error' : 'Could not Update the check'});
         });
        }
        else{
          callback(403,{'Error' : 'Session Expired'});
        }
     });
          }
           });
        }
        else{
          callback(400,{'Error' : 'Missing Fields to Update'});
        }
    }
    else{
       callback(400,{'Error' : 'Missing require field(s) or field(s) are invalid'});
    }
  };
//Checks Delete
handlers._checks.delete = function(data,callback){
  var id = data.queryStringObject.id;
  _data.read('checks',id,function(err,checkData){
    if(!err && checkData){
      //Get the token from the header
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verifyTokens(token,phone,function(tokenIsValid){
    if(tokenIsValid){
      _data.delete('checks',id,function(err){
        if(!err){
          _data.read('users',checkData.userPhone,function(err,userData){
            if(!err && userPhone){
              var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
              var checkPos = userChecks.indexOf(id);
              if(checkPos > -1){
                userChecks.splice(checkPos,1);
                _data.update('users',checkData.userPhone,userData,function(err){
                 if(!err)
                   callback(200);
                  else
                    callback(500,{'Error' : 'Could not update the user'});
                });
              }
              else
                callback(500,'Could not find the check on the specified User');
            }
            else{
              callback(404);
            }
          });
        }
        else{
          callback(500,{'Error' : 'Could not delete the Specified user'});
        }
      })
   }
   else{
    callback(403,{'Error' : 'Session Expired'});
   }
  });
    }
    else{
      callback(400,{'Error' : 'Specified Id do not exist'});
    }
  });
};
//Ping Handler
handlers.ping = function(data,callback){
  callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};
module.exports = handlers;