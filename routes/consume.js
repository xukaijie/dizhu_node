var express = require('express');
var router = express.Router();

var moment = require('moment');

var func = require('../common/func');

var consumeCategoryModel = require('../common/mongodb').consumeCategoryModel;
var consumeListModel = require('../common/mongodb').consumeListModel;

var consumeUserModel = require('../common/mongodb').consumeUserModel;

/* GET category list. */
router.get('/category_list', function(req, res, next) {

    var params = ['userId'];

    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }
    consumeCategoryModel.find({userId:req.query.userId},{_id:0},{},(err,result)=>{
        if (err){
            return re.err("读取数据库错误");
        }else{
            return res.ok(result);
        }
    })

});


router.post('/category_add',function(req, res, next) {


    var params = ['name','userId'];

    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    var id = func.create_id();

    var name = req.body.name;
    var userId = req.body.userId;

    var query = {

        categoryId:id,
        name:name,
        userId:userId
    }

    consumeCategoryModel.update({name:name},query,function(err,result){

        if (err){
            return res.err("操作数据库错误");
        }else{
            return res.ok();
        }
    })


})


router.post('/category_delete',function(req, res, next) {

    var params = ['categoryId','userId'];

    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    consumeCategoryModel.remove({categoryId:req.body.categoryId,userId:req.body.userId},(err)=>{
        if (err){
            return res.err("操作数据库错误");
            return;
        }else{
            return res.ok();
        }
    })


})

router.post('/consume_add',function(req, res, next) {

    var params = ['categoryId','userId','price','addOrCut'];
    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    var consumeId = func.create_id();

    var query = {

        categoryId:req.body.categoryId,
        consumeId:req.body.consumeId,
        userId:req.body.userId,
        price:req.body.price,
        addOrCut:req.body.addOrCut,
        remark:req.body.remark || "",
        createTime:moment().format('YYYY-MM-DD HH:SS'),
        consumeTime:req.body.consumeTime
    }

    consumeListModel.update({},query,function(err,result){

        if (err){
            return res.err("操作数据库错误");
            return;
        }else{
            return res.ok();
        }
    })
})


router.post('/consume_delete',function(req, res, next) {

    var params = ['consumeId','userId'];
    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    consumeListModel.remove({consumeId:req.body.consumeId,userId:req.body.userId},(err)=>{
        if (err){
            return res.err("操作数据库错误");
            return;
        }else{
            return res.ok();
        }
    })
})


/*
*
* “$lt”	小于
 “$lte”	小于等于
 “$gt”	大于
 “$gte”	大于等于
 “$ne”	不等于

 */

router.post('/consume_list',function(req, res, next) {

    var params = ['userId'];
    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    var query = {
        createTime: {
            "$lte": req.body.endTime,
            "$gte": req.body.startTime
        },
        userId:req.body.userId
    }

    consumeListModel.find(query,{_id:0},function(err,result){
        if (err){
            return res.err("操作数据库错误");
        }else{
            return res.ok(result);
        }
    })
})


router.post('/user_register',function(req,res,next){

    var params = ['name','password'];
    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    var userId = func.create_id();

    var query = {

        name:req.body.name,
        password:req.body.password,
        userId:userId
    }

    consumeUserModel.update({name:req.body.name},query,{upsert:true},function(err,result){
        if (err){
            return res.err("操作数据库错误");
        }else{
            return res.ok({userId:userId});
        }
    })
})


router.post('/user_check',function(req,res,next){

    var params = ['name'];
    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    consumeUserModel.findOne({name:req.body.name},function(err,result){
        if (err){
            return res.err("操作数据库错误");
        }else{
            if(result){
                return res.ok({exsit:1})
            }else{
                return res.ok();
            }
        }
    })
})


router.post('/user_login',function(req,res,next){

    var params = ['name','password'];
    var ret = func.get_web_params(req,params);
    if (ret.err){
        res.json(ret);
        return;
    }

    consumeUserModel.findOne({name:req.body.name,password:req.body.password},{_id:0},function(err,result){
        if (err){
            return res.err("操作数据库错误");
        }else{
            if(!result){
                return res.err(-1,"登录失败");
            }else{
                return res.ok({userId:result.userId});
            }
        }
    })
})

module.exports = router;
