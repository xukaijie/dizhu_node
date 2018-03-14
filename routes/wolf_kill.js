var express = require('express');
var router = express.Router();

var moment  = require('moment');

var https = require('https');
var qs = require('querystring');

var wolfListTable = require('../common/mongodb').wolfListModel;
var userListTable = require('../common/mongodb').userListModel;

var adminListTable = require('../common/mongodb').adminListModel;

var func = require('../common/func');

var env = require('../common/config')


var appId = env.appId;

var appSecret = env.appSecret;


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

            if (result.length === 0){

                res.json({err:0,data:[]});
                return;
            }

            var founderArray = result.map((r)=>{

                return r.founder;
            })

            userListTable.find({openId:{$in:founderArray}},{_id:0},(err,result2)=>{

                if (err){
                    res.json({err:-1,messgae:"读取用户表出错"});
                    return;
                }else{

                    for (var k = 0;k<result.length;k++){

                        for (var j = 0;j<result2.length;j++){

                            if (result2[j].openId === result[k].founder){
                                result[k].founder = result2[j].nickName;
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

    var _enter = {openId:openId,remark:req.body.remark || ""};

    wolfListTable.findOne({wolfId:wolfId},{limit:1,enterList:1},function(err,result){

        if (err){
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }else{


            if (!result){

                res.json({err:-1,message:"读取数据库错误"});
                return;
            }
            /*if (result.length === 0){

                res.json({err:-1,message:"读取数据库错误"});
                return;
            };*/

            var alOpenIds = [];

            alOpenIds = result.enterList.map((e)=>{

                return e.openId;
            })


            if (alOpenIds.indexOf(openId) !== -1){

                res.json({err:-1,message:"您已经报名"});
                return;
            }

            var currentCount = result.enterList.length;
            var limit = result.limit;

            if (currentCount == limit){

                res.json({err:-1,message:"报名人数已达上线"});
                return;
            }

            wolfListTable.update({wolfId:wolfId},{'$addToSet':{enterList:_enter}},function(err,result){
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

            console.log(result);

            if (!result){
                res.json({err:-1,message:"读取数据库错误"});
                return;
            }

            var list = result.enterList;

            var openList = list.map((l)=>{

                return l.openId;
            })

            userListTable.find({openId:{$in:openList}},{_id:0},{lean:true},(err,result2)=>{

                if (err){
                    res.json({err:-1,messgae:"读取用户表出错"});
                    return;
                }else{

                   for (var i = 0 ;i < result2.length;i++){

                       result2[i].remark = "123";
                       for (var k = 0;k<list.length;k++){

                           if (list[k].openId === result2[i].openId)
                               result2[i].remark = list[k].remark;
                       }
                   }
                    res.json({err:0,data:{enterList:result2}});

                    return;
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



router.get('/getAuthList',function(req, res, next) {


    adminListTable.find({},{_id:0},{lean:true},(err,result)=>{

        if (err){
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }else{

            var ad = [];
            var superAd = [];

            for (var i = 0;i < result.length;i++){

                if (result[i].isSuperAdmin !== true){

                    ad.push(result[i].openId);
                }else{

                    superAd.push(result[i].openId);
                }
            }

            userListTable.find({},{_id:0},{lean:true},(err,result2)=>{

                if (err){

                    res.json({err:-1,message:"操作数据库错误"});
                    return;
                }else {


                    var res_ret = [];

                    for (var i = 0; i < result2.length; i++) {


                        if (superAd.indexOf(result2[i].openId) === -1){

                            res_ret.push(result2[i]);
                        }
                    }


                    for (var i = 0; i < res_ret.length; i++) {

                        /*判断是不是管理员*/
                        if (ad.indexOf(res_ret[i].openId) !== -1) {
                            res_ret[i].isAdmin = true;
                        } else {
                            res_ret[i].isAdmin = false;
                        }

                    }


                    res.json({err: 0, data: res_ret});

                    return;
                }


            })

            return;
        }

    })
})


router.post('/setAuthList',function(req, res, next) {

    var params = ['openId',"value"];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    var query = {

        openId:req.body.openId,
        isSuperAdmin:false
    }

    /*增加为管理员*/
    if (req.body.value){

        adminListTable.update({openId:req.body.openId},query,{upsert:false},(err,result)=>{
            if (err){

                res.json({err:-1,message:"操作数据库错误"});
            }else {

                if (result.nModified === 0){

                    res.json({err:-1,message:"写入失败"});
                    return;
                }

                res.json({err: 0});
                return;
            }
        })
    }else{

        adminListTable.remove({openId:req.body.openId},(err)=>{
            if (err){

                res.json({err:-1,message:"操作数据库错误"});
            }else {
                res.json({err: 0});
                return;
            }
        })

        return;
    }

})

// 获取管理员列表

router.get('/adminList',function(req, res, next) {


    adminListTable.find({},{_id:0},(err,result)=>{

        if (err){
            res.json({err:-1,message:"读取数据库错误"});
            return;
        }else{

            res.json({err:0,data:result})

            return;
        }

    })
})


// 获取管理员列表

router.post('/deleteWolf',function(req, res, next) {



    var params = ['wolfId'];

    var ret = func.get_web_params(req,params);

    if (ret.err){
        res.json(ret);
        return;
    }

    wolfListTable.remove({wolfId:req.body.wolfId},(err)=>{

        if (err){
            res.json({err:-1,message:"操作数据库错误"});
            return;
        }else{

            res.json({err:0})

            return;
        }

    })
})



module.exports = router;

