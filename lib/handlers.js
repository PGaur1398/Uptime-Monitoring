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
    var hashPassword =  helpers.hash(password);
    if(hashPassword){
        var userObj = {
            'firstname' : firstname,
            'lastname' : lastname,
            'phone' : phone,
            'password' : hashPassword
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
_data.read('users',phone,function(err,data){
  if(!err){
      delete data.password;
      callback(200,data);
  }
  else{
    callback(404);
  }
})
};
handlers._users.put = function(data,callback){
 var phone = data.queryStringObject.phone;
 var firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0  ? data.payload.firstname.trim() : false; 
 var lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0  ? data.payload.lastname.trim() : false;
 var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0  ? data.payload.password.trim() : false;
 if(firstname || lastname || password)
  {
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
  console.log(firstname,lastname,password);
  callback(400,{'Error' : 'Missing Required Field1'});
}

};
handlers._users.delete = function(data,callback){
  var phone = data.queryStringObject.phone;
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
})
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