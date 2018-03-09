'use strict'
const mongoose = require('mongoose')
// 连接mongodb

var options = {

};

var conn = mongoose.connect('mongodb://@www.xkjtencent.cn:27000/dizhu',{ useMongoClient: true });
/*conn.on('error', function(error) {
 console.log(error);
 });*/

var roomList = new mongoose.Schema({

    name:String,
    createTime:String,
    roomId:String,
    owned:[], // 房间里有多少人
    detail:[]
})

var roomDetail = new mongoose.Schema({

    roomId:String,
    detail:[], // 对局数量
})


/*var subprod = new mongoose.Schema({

 name:String,
 child:Boolean,
 parent:String

 })*/


var roomListModel = conn.model('roomlist',roomList);
var roomDetailModel = conn.model('roomdetail',roomList);

module.exports = {
    roomListModel:roomListModel,
    roomDetailModel:roomDetailModel

};




