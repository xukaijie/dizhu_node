var express = require('express');
var router = express.Router();

var moment  = require('moment');

var https = require('https');
var qs = require('querystring');

var wolfListTable = require('../common/mongodb').wolfListModel;
var userListTable = require('../common/mongodb').userListModel;

var func = require('../common/func');


var appId = 'wx3b80b184bb167e6e';

var appSecret = 'cff2ab052d0b3396b57d6cdd88eaccc5';


function getWolfList(page,callback){

    var pageSize = 5;

    var skip = pageSize* (parseInt(page)-1);

    wolfListTable.find({},{_id:0},{sort:{"createTime":-1},limit:pageSize,skip:skip},(err,result)=>{
        callback(err,result)
    })
};

router.get('/getWolfList', function(req, res, next) {

    var params = ['page'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var page = req.query.page;

    getWolfList(page,(err,result)=>{

        if (err) {
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }
        else {

            var founderArray = result.map((r)=>{

                return r.founder;
            })

            userListTable.find({openId:{$in:founderArray}},{_id:0},(err,result2)=>{

                if (err){
                    res.json({err:-1,messgae:"读取用户表出错"});
                    return;
                }else{

                    console.log(result);
                    console.log(result2);
                    for (var k = 0;k<result.length;k++){

                        for (var j = 0;j<result2.length;j++){

                            console.log(result2[j].openId,result[k].founder)
                            if (result2[j].openId === result[k].founder){
                                console.log(result2[j].nickName);

                                result[k].founder = result2[j].nickName;
                                console.log(result[k]);
                            }
                        }

                    };

                    res.json({err:0,data:result})
                }
            })

        }

    })

})

// 创建一个活动
router.post('/createWolf', function(req, res, next) {

    var params = ['activeTime','limit','founder','location'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var body = req.body;

    var wolfId = func.create_id();

    var query = {
        createTime:moment().format('YYYY-MM-DD HH:mm:ss'),
        activeTime:body.activeTime,
        wolfId:wolfId,
        limit:body.limit,
        founder:body.founder,
        location:body.location,
        remark:body.remark || "",
        enterList:[],
        newRole:body.newRole || ""
    }

    wolfListTable.update({wolfId:wolfId},query,{upsert:true},(err,result)=> {

        if (err) {
            console.log(result);
            res.json({err:-1,message:"写入数据库错误"});
            return;
        }
        else {

            res.json({err: 0,data:[]})
        }
    });
    return;

});


router.post('/sigIn', function(req, res, next) {

    var params = ['openId','wolfId'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var wolfId = req.body.wolfId;
    var openId = req.body.openId;

    wolfListTable.findOne({wolfId:wolfId},{limit:1,enterList:1},function(err,result){

        if (err){
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }else{

            var currentCount = result.enterList.length;
            var limit = result.limit;

            if (currentCount == limit){

                res.json({err:-1,message:"报名人数已达上线"});
                return;
            }

            wolfListTable.update({wolfId:wolfId},{'$addToSet':{enterList:openId}},function(err,result){
                if (err){
                    res.json({err:-1,message:"写入数据库错误"});
                    return;
                }else{
                    res.json({err:0});
                    return;
                }

                return;

            })

            return;
        }

    })



})

// 目前只返回报名的人数
router.get('/wolfDetail',function(req, res, next) {

    var params = ['wolfId'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var wolfId = req.query.wolfId;

    wolfListTable.findOne({wolfId:wolfId},{enterList:1,_id:0},(err,result)=>{

        if (err){
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }else{

            var list = result.enterList;

            userListTable.find({openId:{$in:list}},{_id:0},(err,result)=>{

                if (err){
                    res.json({err:-1,messgae:"读取用户表出错"});
                    return;
                }else{
                    res.json({err:0,data:{enterList:result}})
                }
            })

            return;
        }

    })
})


function createGetHttpRequest(options,callback){

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (ret) {
            callback(0,ret);
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
        callback(-1)
    });

    req.end();

}

router.post('/openId',function(req, res, next) {


    var params = ['code','nickName','header'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var code = req.body.code;
    var header = req.body.header;
    var nickName = req.body.nickName;

    var get_data = {
        appid: appId,
        secret: appSecret,
        js_code: code,
        grant_type: 'authorization_code'

    };

    var content = qs.stringify(get_data);

    var options = {
        hostname: 'api.weixin.qq.com',
        path: '/sns/jscode2session?'+content,
        method: 'GET',
    };


    createGetHttpRequest(options,(ret,se)=>{
        if (ret){
            res.json({err:-1,message:"读取微信数据错误 "});
            return;
        }

        var session_key = JSON.parse(se).session_key;
        var openId = JSON.parse(se).openid;

         var query = {

             openId:openId,
             header:header,
             nickName:nickName

         }

        userListTable.update({openId:openId},query,{upsert:true},(err,result)=> {

            if (err) {
                res.json({err:-1,message:"写入数据库错误"});
                return;
            }
            else {
                res.json({err: 0,data:openId});
                return;
            }
        });
    })


})



// 目前只返回报名的人数
router.get('userInfo',function(req, res, next) {

    var params = ['openId'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var openId = req.query.openId;

    wolfListTable.findOne({openId:openId},{_id:0},(err,result)=>{

        if (err){
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }else{

            res.json({err:0,data:result})

            return;
        }

    })
})

module.exports = router;

