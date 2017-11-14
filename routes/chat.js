const fs = require("fs");
const path = require("path");
const request = require("request");
const express = require("express");
const logger = require("../utils/logger.js");

// 加载配置文件（主要为接口的调用）
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let appid = config.chat_appid;
let appkey = config.chat_appkey;

let router = express.Router();

router.get("/", function (req, res) {
  let message = req.query.message,
    returnValue = {},
    _res = res;
  logger.info("请求信息：" + message + "\n");
  returnValue.text = "您似乎什么都没有和我说";
  if (!message) { // 如果请求参数为空则直接返回就好
    _res.send(returnValue);
    return;
  }
  let requestUrl = encodeURI("https://way.jd.com/turing/turing?info=" + message + "&loc=&userid=" + appid + "&appkey=" + appkey);
  request(requestUrl, function (error, response, body) {
    let obj = JSON.parse(body);
    obj.code = parseInt(obj.code);
    switch (obj.code) {
      case 10000:
        returnValue = obj.result;
        break; // 查询成功
      case 10001:
        returnValue.text = "主人把我的配置搞错啦，赶紧联系联系主人吧~";
        break; // 错误的请求appkey
      case 11010:
        returnValue.text = "恩，好像你说的有点深奥，你联系主人他肯定能知道怎么回事~";
        break; // 商家接口调用异常，请稍后再试
      case 11030:
        returnValue.text = "去问主人，我才不理解你说的什么呢";
        break; // 商家接口返回格式有误
      case 10003:
        returnValue.text = "你说的我一点也不懂，要不你问问我的主人吧~";
        break; // 不存在相应的数据信息
      case 10004:
        returnValue.text = "主人把我的配置搞错啦~~~去告诉我的主人我在继续陪你聊天~";
        break; // URL上appkey参数不能为空
      case 10010:
        returnValue.text = "主人是个穷逼，你和主人说下现在的情况";
        break; // 接口需要付费，请充值
      case 10020:
        returnValue.text = "我有点晕，你慢点说，要不你和主人说一下现在的情况";
        break; // 万象系统繁忙，请稍后再试
      case 10030:
        returnValue.text = "你说什么我听不到，你和主人说，他能听到~";
        break; // 调用万象网关失败， 请与万象联系
      case 10040:
        returnValue.text = "我有点累了，明天再约起来好么~";
        break; // 超过每天限量，请明天继续
      case 10050:
        returnValue.text = "嘘！主人不让我和别人说话";
        break; // 用户已被禁用
      case 10060:
        returnValue.text = "嘘！他们不让我和别人说话，别告诉主人";
        break; // 提供方设置调用权限，请联系提供方
      case 10070:
        returnValue.text = "主人不让我和你们说话~";
        break; // 该数据只允许企业用户调用
      case 10090:
        returnValue.text = "你说的太多了我一点都不能理解！！！";
        break; // 文件大小超限，请上传小于1M的文件
      default:
        returnValue.text = "我好像出错了，你还会爱我么QAQ";
        break;
    }
    logger.info("响应信息：" + returnValue.text + "\n");
    obj = {};
    obj.success = true;
    obj.message = "";
    obj.data = returnValue;
    _res.send(obj);
  });
});

router.use("/", function (req, res, next) {
  next();
});

module.exports = router;
