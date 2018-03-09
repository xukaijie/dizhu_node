
var UUID = require('uuid');


var func = {}

func.get_web_params = function(req,keys){

    var para = {...req.query,...req.body}

    var para_keys = Object.keys(para)

    for (var i = 0;i<keys.length;i++){

        if (para_keys.contains(keys[i]))
         continue
        else
         return {err:-1,message:'param '+keys[i] +' is miss'}
    }

    return {err:0,data:para}


}


func.op_db_error = function(err){

    return {code:err,message:"operate db error"}
}



func.create_id = function(){

    return UUID.v1();

}

func.create_sms_code = function(){

    var num="";
    for(var i=0;i<4;i++){
        num+=Math.floor(Math.random()*10)
    }

    return num
}

module.exports = func;