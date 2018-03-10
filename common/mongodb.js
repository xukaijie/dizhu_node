'use strict'
const mongoose = require('mongoose')
// 连接mongodb

var options = {

};

var conn = mongoose.connect('mongodb://@www.xkjtencent.cn:27000/dizhu',{ useMongoClient: true });


var roomList = new mongoose.Schema({

    name:String,
    createTime:String,
    roomId:String,
    owned:[], // 房间里有多少人
    detail:[]
})

/*狼人杀活动列表*/
var wolfList = new mongoose.Schema({

    activeTime:String, // 活动时间
    createTime:String, // 创建时间,
    wolfId:String, // 活动id,
    limit:Number, // 活动人数上线
    enterList:[], // 已经报名的人数
    founder:String, //创始人 存名字和userId
    location:String, // 地点
    remark:String,
    newRole:String // 新增角色
})


var userList = new mongoose.Schema({

    openId:String, // 微信的openid

    nickName:String, // 昵称

    header:String, // 头像

})

/*var subprod = new mongoose.Schema({

 name:String,
 child:Boolean,
 parent:String

 })*/


var roomListModel = conn.model('roomlist',roomList);

var wolfListModel = conn.model('wolflist',wolfList);

var userListModel = conn.model('userlist',userList);
module.exports = {
    roomListModel:roomListModel,
    wolfListModel:wolfListModel,
    userListModel:userListModel

};




