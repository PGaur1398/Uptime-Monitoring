var _data = require('./data');
var helpers = require('./helpers');

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
     callback(403,{'Error' : 'Token is invalid'});
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
    callback(403,{'Error' : 'Token is invalid'});
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

//Ping Handler
handlers.ping = function(data,callback){
  callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};
module.exports = handlers;