var fs = require('fs');
var path = require('path');
//Container for the module to be exported
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
        fs.close(fileDescriptor,stringData,function(err){
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
      callback(err,data);
    });
}
lib.update = function(dir,file,data,callback){
    //Open File for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json','r+',function(err,fileDescriptor){
     if(!err && fileDescriptor){
       // Convert data to string
      var stringData = JSON.stringify(data);
      fs.truncate(fileDescriptor,function(err){
        if(!err){
            fs.writeFile(fileDescriptor,stringData,function(err){
                if(!err){
                fs.close(fileDescriptor,stringData,function(err){
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
modules.export = lib;