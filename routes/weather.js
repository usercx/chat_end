const fs = require("fs");
const request = require("request");
const express = require("express");
const con = require("../utils/db.js");
const logger = require("../utils/logger.js");

// 加载配置文件（主要为接口的调用）
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let appkey = config.weather_key1;

let router = express.Router();

// 获取所有城市列表
router.get("/getCityList", function (req, res) {
    
});

// 获取天气信息情况
router.get("/getWeatherInfo", function(req, res){

});

router.use("/", function(req, res, next){
    next();
});

module.exports = router;
