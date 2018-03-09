var express = require('express');
var router = express.Router();

var moment  = require('moment');

var roomListTable = require('../common/mongodb').roomListModel;

var roomDetailTable = require('../common/mongodb').roomDetailModel;

var func = require('../common/func');

var usersMap = [
    {
        "name" : "末",
        "userId" : "wxb123"
    },
    {
        "name" : "王",
        "userId" : "wdy123"
    },
    {
        "name" : "徐",
        "userId" : "xkj123"
    }
]


router.post('/createRoom', function(req, res, next) {

    console.log('/createRoom')

    var params = ['name'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var body = req.body;

    console.log(body)

    var roomId = func.create_id();

    var query = {

        name:body.name,
        createTime:moment().format('YYYY-MM-DD HH:mm:ss'),
        roomId:roomId,
        owned:usersMap,
        detail:[]
    }

    roomListTable.update({roomId:roomId},query,{upsert:true},(err,result)=> {

        if (err) {
            res.json({err:-1,message:"写入数据库错误"+result});
            return;
        }
        else {


            res.json({err: 0,data:[]})
        }
    });
    return;

});


router.get('/roomList', function(req, res, next) {

    roomListTable.find({},{_id:0,owned:0,detail:0},{sort:{"createTime":-1},limit:10},(err,result)=>{

        if (err) {
            res.json({err:-1,message:"读取数据库错误"+result});
            return;
        }
        else{
            res.json({err: 0,data:result});
        }
    })

    return;

})

router.get('/roomDetail', function(req, res, next) {

    var params = ['roomId'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var roomId = req.query.roomId;

    roomListTable.find({roomId:roomId},{detail:1,_id:0},(err,result)=>{

        if (err) {
            res.json({err:-1,message:"读取数据库错误"+result});
            return;
        }
        else{



            var calc = result[0].detail;

            if (calc.length !== 0) {

                var keys = Object.keys(calc[0]);

                var total = {};

                keys.forEach((k)=>{

                    total[k] = 0;
                })

                for (var i = 0; i < calc.length; i++) {

                        for (var k in calc[i]){

                            total[k]+=calc[i][k];
                        }
                }

                calc.push(total);
            }
            res.json({err: 0,data:calc.reverse()})
        }
    })

    return;

})


router.post('/addOneRound', function(req, res, next) {

    var params = ['roomId','detail'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var roomId = req.body.roomId;

    var detail = req.body.detail;

    roomListTable.update({roomId:roomId},{'$addToSet':{detail:detail}},{upsert:true},function(err,result){
        if (err){
            res.json({err:-1,message:"写入数据库错误"+result});
            return;
        }else{
            res.json({err:0});
            return;
        }

        return;

    })
    return;

});

router.get('/getUserId',function(req, res, next) {


    var params = ['userName'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    for (var i = 0; i < usersMap.length;i++){

        if (usersMap[i].name == req.query.userName){
            res.json({err:0,userId:usersMap[i].userId});
            return;
        }
    }

    res.json({err:-1,message:"未找到相关用户"});
    return;

})

router.get('/userList',function(req, res, next) {


    res.json({err:0,data:usersMap});
    return;

})



module.exports = router;

