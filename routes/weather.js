const fs = require("fs");
const request = require("request");
const express = require("express");
const con = require("../utils/db.js");
const logger = require("../utils/logger.js");

// 加载配置文件（主要为接口的调用）
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let appkey = config.weather_key;

let router = express.Router();

function getReturnObj() {
  return {success: true, message: "", data: null};
}

/**
 * 根据区的Id返回这个区的id以及name
 * @returns Promise
 */
function getAreaInfoById(areaId){
  return new Promise(function(resolve, reject){
    let sql = "select id, area, area_code from weather_area where id=?";
    con.query(sql, areaId, function(err, data){
      if(err || data[0]){
        reject("sql error");
        return ;
      }
      data = data[0];
      resolve(data);
    });
  });
}

/**
 * 获取市级信息，根据市的id返回信息
 * @returns Promise
 */
function getCityInfoById(cityId){
  return new Promise(function(resolve, reject){
    let sql = "select id, city from weather_city where id=?";
    con.query(sql, cityId, function(err, data){
      if(err || !data[0]){
        reject("sql error");
        return ;
      }
      data = data[0] || {};
      resolve(data);
    });
  });
}

/**
 * 获取省级信息，根据省份的id
 * @returns Promise
 */
function getProvinceInfoById(provinceId){
  return new Promise(function(resolve, reject){
    let sql = "select id, province from weather_province where id=?";
    con.query(sql, provinceId, function(err, data){
      if(err || !data[0]){
        reject("sql error");
        return;
      }
      data = data[0] || {};
      resolve(data);
    });
  });
}

/**
 * 根据区的id获取区的所有信息（区的名称，区所属省市以及所属省id所属市id）
 */
function getPlaceInfoAllByAreaId(areaId){
  return new Promise(function(resolve, reject){
    let sql = "select a.id areaId, a.area area, a.area_code areaCode, c.id cityId, c.city city, p.id provinceId, p.province province from weather_area a, weather_city c, weather_province p WHERE a.id=? AND a.city_id=c.id AND c.province_id=p.id";
    con.query(sql, areaId, function(err, data){
      if(err || !data[0]){
        reject("sql error");
        return;
      } 
      data = data[0] || {};
      resolve(data);
    });
  });
}

/** 
 * 根据市的id返回市的所有信息（市的名称，市所属省以及省的id）
 */
function getPlaceInfoAllByCityId(cityId){
  return new Promise(function(resolve, reject){
    let sql = "select c.id cityId, c.city city, p.id provinceId, p.province province from weather_city c, weather_province p WHERE c.id=? AND c.province_id=p.id";    
    con.query(sql, cityId, function(err, data){
      if(err || !data[0]){
        reject("sql error");
        return;
      } 
      data = data[0] || {};
      resolve(data);
    });
  });
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
        return {id: obj.id, name: obj.province};
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
        return {id: obj.id, name: obj.city};
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
        return {id: obj.id, name: obj.area, code: obj.area_code};
      });
      returnObj.data = data;
    }
    res.send(returnObj);
  });
});

/**
 * 根据id返回name(传入什么id就返回什么，都传入则都返回)
 */
router.get("/getPlaceInfoById", function (req, res) {
  let provinceId = req.query.provinceId,
    cityId = req.query.cityId,
    areaId = req.query.areaId,
    proArr = [],
    returnData = {},
    returnObj = getReturnObj();
  if(!cityId && !provinceId && !areaId){
    res.send(returnObj);
  }
  // 查询省信息（如果有的话）
  if(provinceId){
    proArr.push(getProvinceInfoById(provinceId));
  }
  // 查询市信息（如果有的话）
  if(cityId){
    proArr.push(getCityInfoById(cityId));
  }
  // 查询区信息（如果有的话）
  if(areaId){
    proArr.push(getAreaInfoById(areaId));
  }

  // resolve函数，用来执行promise正常执行的函数（即将结果正常返回到前台）
  let resolve = function(data){
    returnData.province = data[0];
    returnData.city = data[1];
    returnData.area = data[2];
    returnObj.data = returnData;
    res.send(returnObj);
  };
  // 当出现异常（这里一般只有查询数据库异常，所以如果数据异常了的话就提示下信息）
  let reject = function(){
    returnObj.success = false;
    returnObj.message = "数据库查询异常，请稍候重试。如果您一直看到此消息，请联系网站管理员";
  };
  Promise.all(proArr).then(resolve, reject);
});

/**
 * 根据区的id返回区的所有信息（所属市，所属市的id，所属省所属省的id）
 */
router.get("/getPlaceInfoAllByAreaId", function(req, res){
  let id = req.query.areaId,
    returnObj = getReturnObj(),
    p = getPlaceInfoAllByAreaId(id);
  let resolve = function(data){
    returnObj.data = data;
    res.send(returnObj);
  };
  let reject = function(){
    returnObj.success = false;
    returnObj.message = "数据库查询异常，请稍候重试。如果您一直看到此消息，请联系网站管理员";
    res.send(returnObj);
  };
  p.then(resolve, reject);
});

/**
 * 根据市的id返回区的所有信息（所属省所属省的id）
 */
router.get("/getPlaceInfoAllByCityId", function(req, res){
  let id = req.query.cityId,
    returnObj = getReturnObj(),
    p = getPlaceInfoAllByCityId(id);
  let resolve = function(data){
    returnObj.data = data;
    res.send(returnObj);
  };
  let reject = function(){
    returnObj.success = false;
    returnObj.message = "数据库查询异常，请稍候重试。如果您一直看到此消息，请联系网站管理员";
    res.send(returnObj);
  };
  p.then(resolve, reject);
});

// 获取天气信息情况
router.get("/getWeatherInfo", function (req, res) {
  // let obj = {
  //   "success": true,
  //   "message": "",
  //   "data": {
  //     "basic": {
  //           "cid": "CN101070201",
  //           "location": "大连",
  //           "parent_city": "大连",
  //           "admin_area": "辽宁",
  //           "cnty": "中国",
  //           "lat": "38.91458893",
  //           "lon": "121.61862183",
  //           "tz": "+8.0"
  //       },
  //       "update": {
  //           "loc": "2017-11-14 12:46",
  //           "utc": "2017-11-14 04:46"
  //       },
  //       "status": "ok",
  //       "now": {
  //           "cloud": "0",
  //           "cond_code": "100",
  //           "cond_txt": "晴",
  //           "fl": "4",
  //           "hum": "43",
  //           "pcpn": "0.00",
  //           "pres": "1021",
  //           "tmp": "5",
  //           "vis": "10",
  //           "wind_deg": "295",
  //           "wind_dir": "西北风",
  //           "wind_sc": "3-4",
  //           "wind_spd": "10"
  //       },
  //       "daily_forecast": [
  //           {
  //               "cond_code_d": "100",
  //               "cond_code_n": "100",
  //               "cond_txt_d": "晴",
  //               "cond_txt_n": "晴",
  //               "date": "2017-11-14",
  //               "hum": "41",
  //               "mr": "02:03",
  //               "ms": "14:44",
  //               "pcpn": "0.0",
  //               "pop": "0",
  //               "pres": "1023",
  //               "sr": "06:35",
  //               "ss": "16:42",
  //               "tmp_max": "7",
  //               "tmp_min": "1",
  //               "uv_index": "2",
  //               "vis": "20",
  //               "wind_deg": "281",
  //               "wind_dir": "西北风",
  //               "wind_sc": "4-5",
  //               "wind_spd": "31"
  //           },
  //           {
  //               "cond_code_d": "100",
  //               "cond_code_n": "100",
  //               "cond_txt_d": "晴",
  //               "cond_txt_n": "晴",
  //               "date": "2017-11-15",
  //               "hum": "38",
  //               "mr": "03:04",
  //               "ms": "15:15",
  //               "pcpn": "0.0",
  //               "pop": "0",
  //               "pres": "1026",
  //               "sr": "06:36",
  //               "ss": "16:41",
  //               "tmp_max": "6",
  //               "tmp_min": "1",
  //               "uv_index": "2",
  //               "vis": "20",
  //               "wind_deg": "306",
  //               "wind_dir": "西北风",
  //               "wind_sc": "3-4",
  //               "wind_spd": "22"
  //           },
  //           {
  //               "cond_code_d": "101",
  //               "cond_code_n": "104",
  //               "cond_txt_d": "多云",
  //               "cond_txt_n": "阴",
  //               "date": "2017-11-16",
  //               "hum": "58",
  //               "mr": "04:04",
  //               "ms": "15:45",
  //               "pcpn": "4.3",
  //               "pop": "70",
  //               "pres": "1022",
  //               "sr": "06:37",
  //               "ss": "16:41",
  //               "tmp_max": "10",
  //               "tmp_min": "2",
  //               "uv_index": "2",
  //               "vis": "18",
  //               "wind_deg": "176",
  //               "wind_dir": "南风",
  //               "wind_sc": "3-4",
  //               "wind_spd": "18"
  //           }
  //       ],
  //       "lifestyle": [
  //           {
  //               "brf": "较不舒适",
  //               "txt": "白天天气较凉，且风力较强，您会感觉偏冷，不很舒适，请注意添加衣物，以防感冒。",
  //               "type": "comf"
  //           },
  //           {
  //               "brf": "冷",
  //               "txt": "天气冷，建议着棉服、羽绒服、皮夹克加羊毛衫等冬季服装。年老体弱者宜着厚棉衣、冬大衣或厚羽绒服。",
  //               "type": "drsg"
  //           },
  //           {
  //               "brf": "易发",
  //               "txt": "天冷风大，易发生感冒，请注意适当增加衣服，加强自我防护避免感冒。",
  //               "type": "flu"
  //           },
  //           {
  //               "brf": "较不宜",
  //               "txt": "天气较好，但风力很大，推荐您进行室内运动，若在户外运动请注意避风和保暖。",
  //               "type": "sport"
  //           },
  //           {
  //               "brf": "较不宜",
  //               "txt": "天气较好，稍凉加之风大，可能对您的出行产生一定的影响，出游时记得带上防风衣物。",
  //               "type": "trav"
  //           },
  //           {
  //               "brf": "中等",
  //               "txt": "属中等强度紫外线辐射天气，外出时建议涂擦SPF高于15、PA+的防晒护肤品，戴帽子、太阳镜。",
  //               "type": "uv"
  //           },
  //           {
  //               "brf": "较不宜",
  //               "txt": "较不宜洗车，未来一天无雨，风力较大，如果执意擦洗汽车，要做好蒙上污垢的心理准备。",
  //               "type": "cw"
  //           },
  //           {
  //               "brf": "优",
  //               "txt": "气象条件非常有利于空气污染物稀释、扩散和清除，可在室外正常活动。",
  //               "type": "air"
  //           }
  //       ]
  //   }
  // };  
  // res.send(obj);
  let areaId = req.query.areaId,
    cityId = req.query.cityId,
    returnObj = getReturnObj();
  let reject = function(msg){
    returnObj.success = false;
    returnObj.message = msg || "数据库查询异常，也有可能是您选的地名并不存在。请刷新重试。当然如果您持续看到此条消息，请联系网站管理员";
    res.send(returnObj);
  };
  // 获取天气信息
  let getWeather = function(loc){
    let requestUrl = "https://free-api.heweather.com/s6/weather?location=" + loc + "&key=" + appkey,
      returnObj = getReturnObj();
    request(encodeURI(requestUrl), function(err, data){
      if(err){
        reject("提供方接口出错。如果您持续看到此条消息请联系网站管理员~");
        return;
      }
      data = JSON.parse(data.body);
      data = data.HeWeather6[0];
      switch(data.status){
        case "ok": returnObj.data = data;res.send(returnObj);break;
        case "invalid key": reject("非法请求！");break;
        case "unknown location": reject("未知的地址！");break;
        case "no data for this location": reject("暂无数据");break;
        case "no more requests": reject("今日请求次数已达上限...");break;
        case "invalid param": reject("非法参数！");break;
        case "too fast": reject("请求频率过快...");break;
        case "dead": reject("暂无响应");break;
        case "permission denied": reject("暂时无权访问此数据，请联系网站管理员");break;
        default: reject("未知状态码，请刷新重试。如果您持续看到此问题请联系网站管理员");break;
      }
    });
  };
  // 获取地区信息（要查询天气的地区，可能是区也可能是市）
  if(areaId){
    let p = getPlaceInfoAllByAreaId(areaId);
    p.then(function(data){
      getWeather(data.areaCode);
    }, reject);
  } else if(cityId){
    let p = getPlaceInfoAllByCityId(cityId);
    p.then(function(data){
      getWeather(data.city);
    }, reject);
  } else{
    returnObj.success = false;
    returnObj.message = "参数似乎不太正确哦~";
    res.send(returnObj);
  }
});

/**
 * 没有查询到信息就交给下一个中间件（即交给最后的中间件直接返回首页）
 */
router.use("/", function (req, res, next) {
  next();
});

module.exports = router;
