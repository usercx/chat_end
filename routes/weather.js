const fs = require("fs");
const request = require("request");
const express = require("express");
const con = require("../utils/db.js");
const logger = require("../utils/logger.js");

// 加载配置文件（主要为接口的调用）
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let appkey = config.weather_key1;

let router = express.Router();

function getReturnObj() {
  return {
    success: true,
    message: "",
    data: null
  };
}

/**
 * 返回中国所有省级城市的列表
 * @requestParams null
 */
router.get("/getProvinceList", function (req, res) {
  let sql = "select * from weather_province";
  let returnObj = getReturnObj();
  con.query(sql, function (err, data) {
    if (err) {
      returnObj.success = false;
      returnObj.message = "数据库查询异常，请稍候重试。如果您一直看到此消息，请联系网站管理员";
    } else {
      data = data.map(function (obj) {
        return { id: obj.id, name: obj.province };
      });
      returnObj.data = data;
    }
    res.send(returnObj);
  });
});

/**
 * 根据省份的id去查询所有属于该省的市级城市
 * @requestParams provinceId  所查询省份该省的id
 */
router.get("/getCityList", function (req, res) {
  let provinceId = req.query.provinceId,
    returnObj = getReturnObj(),
    sql = "select id, city from weather_city where province_id=?";
  con.query(sql, provinceId, function (err, data) {
    if (err) {
      returnObj.success = false;
      returnObj.message = "数据库查询异常，请稍候重试。如果您一直看到此消息，请联系网站管理员";
    } else {
      data = data.map(function (obj) {
        return { id: obj.id, name: obj.city };
      });
      returnObj.data = data;
    }
    res.send(returnObj);
  });
});

/**
 * @requestParams cityId  所查询城市的id，存在weather_area表中
 */
router.get("/getAreaList", function (req, res) {
  let cityId = req.query.cityId,
    returnObj = getReturnObj(),
    sql = "select id, area, area_code from weather_area where city_id=?";
  con.query(sql, cityId, function (err, data) {
    if (err) {
      returnObj.success = false;
      returnObj.message = "数据库查询异常，请稍候重试。如果您一直看到此消息，请联系网站管理员";
    } else {
      data = data.map(function (obj) {
        return { id: obj.id, name: obj.area, code: obj.area_code };
      });
      returnObj.data = data;
    }
    res.send(returnObj);
  });
});



// 获取天气信息情况
router.get("/getWeatherInfo", function (req, res) {

});

router.use("/", function (req, res, next) {
  next();
});

module.exports = router;
