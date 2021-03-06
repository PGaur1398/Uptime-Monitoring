var fs = require('fs');
var path = require('path');
//Container for the module to be exported
var helpers = require('./helpers');
var lib =  {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname,'/../.data/');
//write data to a file
lib.create = function(dir,file,data,callback){
  fs.open(lib.baseDir + dir + '/' + file + '.json','wx',function(err,fileDescriptor){
      if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor,stringData,function(err){
        if(!err){
        fs.close(fileDescriptor,function(err){
            if(!err)
            callback(false);
            else
            callback("Error closing new File");
        });
        }
        else
           callback("Error writing new file");

      });
      }
         
      else{
          callback("file may exist already");
      }
  });

}
lib.read = function(dir,file,callback){
    fs.readFile(lib.baseDir + dir + '/' + file + '.json','utf-8',function(err,data){
        if(!err && data)
        {
            callback(false,helpers.parseJsonToObject(data));
        }
     else{
      callback(err,data);
     }
    });
}
lib.update = function(dir,file,data,callback){
    //Open File for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json','r+',function(err,fileDescriptor){
     if(!err && fileDescriptor){
       // Convert data to string
      var stringData = JSON.stringify(data);
      fs.ftruncate(fileDescriptor,function(err){
        if(!err){
            fs.writeFile(fileDescriptor,stringData,function(err){
                if(!err){
                fs.close(fileDescriptor,function(err){
                    if(!err)
                    callback(false);
                    else
                    callback("Error closing new File");
                });
                }
                else
                   callback("Error writing new file");
        
              });
        }
        else{
            callback("Error truncating file");
        }
      });
     }
     else{
         callback("file not exist");
     }
    });
}

lib.delete = function(dir,file,callback){
//Unlinking
fs.unlink(lib.baseDir + dir + '/' + file + '.json',function(err){
    if(!err){
        callback("File deleted");
    }
    else
      callback("Error deleting File");
})
};
//Listing All Items in a directory
lib.list = function(dir,callback){
    fs.readdir(lib.baseDir+dir+'/', function(err,data){
      if(!err && data && data.length > 0){
        var trimmedFileNames = [];
        data.forEach(function(fileName){
          trimmedFileNames.push(fileName.replace('.json',''));
        });
        callback(false,trimmedFileNames);
      } else {
        callback(err,data);
      }
    });
  };
module.exports = lib;
