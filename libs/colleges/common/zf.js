// 正方教务管理系统
'use strict';
var Promise = require("bluebird");
var ICollege = require('../ICollege');
var logger = require('log4js').getLogger('normal');
var jsdom = Promise.promisifyAll(require('jsdom'));
var request = require('request');
var jquery = require('jquery');
var jarFromJSON = require('tough-cookie').CookieJar.fromJSON;
var isUndefined = require('util').isUndefined;
var iconv = require('iconv-lite');

let jqueryHTML = function (html, selector) {
  let ret = jsdom.envAsync(html)
    .then(jquery);
  if (!isUndefined(selector))
    ret = ret.then($ => $(selector));
  return ret;
};

function toBase64(str) {
  return new Buffer(str, 'binary').toString("base64");
}

let dr = Promise.promisifyAll(request.defaults({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
  },
  // proxy:'http://127.0.0.1:8888'
}));

module.exports = class zf extends ICollege {
  constructor(id,name,url, sessionCookie) {
    super();
    this.url = url;
    this.id = id;
    this.name = name;
    this.sessionCookie = sessionCookie;
  }
  get Name() {
    return this.name;
  }
  get ID() {
    return this.id;
  }
  login(sid, password, params) {
    logger.info('zf login', sid, password, params)
    if (isUndefined(params)) params = {};

    let sessionId;
    let baseUrl = sid => {
      if (this.sessionCookie) {
        return this.url;
      } else {
        return this.url + `(${sessionId})/`;
      }
    };
    let cookieJar = request.jar();

    let viewState = ''
    if (!isUndefined(params.sessionId)) {
      if (this.sessionCookie) {
        try {
          let json = JSON.parse(params.sessionId);
          sessionId = json;
          cookieJar._jar = jarFromJSON(json);
        } catch (e) {
          logger.error(e);
          throw new Error("Session格式有误");
        }
      } else {
        if (!/^\w+$/.test(params.sessionId)) {
          throw new Error("Session格式有误");
        }
        sessionId = params.sessionId;
      }
      if (isUndefined(params.code) || params.code.length == 0) {
        throw new Error("请填写验证码");
      }
      if (!isUndefined(params.viewState)) {
        viewState = params.viewState
      } else {
        logger.warn('zf login no viewState')
      }
    }

    if (isUndefined(params.sessionId)) {
      return dr.getAsync({
        url: this.url,
        followAllRedirects: true,
        jar: cookieJar
      })
        .then(res => {
          let re = /\/\((\w+)\)\//;
          logger.info(res.request.uri.href);
          if (this.sessionCookie) {
            sessionId = JSON.stringify(cookieJar._jar.toJSON());
          } else {
            sessionId = re.exec(res.request.uri.href)[1];
          }
          let vsRE = /name="__VIEWSTATE" value="(.*?)"/
          viewState = vsRE.exec(res.body)[1];

          return dr.getAsync({
            jar: cookieJar,
            url: baseUrl() + 'CheckCode.aspx',
            encoding: null
          })
        })
        .then(res => {
          return {
            needMore: true,
            prompt: {
              code: {
                desc: '验证码',
                type: 'image',
                data: res.body.toString('base64')
              }
            },
            sendback: {
              sessionId: sessionId,
              viewState: viewState
            }
          };
        });
    } else {
      return dr.postAsync({
        jar: cookieJar,
        url: baseUrl() + 'default2.aspx',
        encoding: null,
        followAllRedirects: true,
        headers: {
          'Referer': baseUrl() + 'default2.aspx'
        },
        form: {
          //              
          '__VIEWSTATE': viewState, // 'dDwyODE2NTM0OTg7Oz4Xj4H4EpBntPTKX7HbaJ3mKxXHaA==',
          'txtUserName': sid,
          'TextBox2': password,
          'txtSecretCode': params.code,
          'RadioButtonList1': 'sb',
          'Button1': '',
          'lbLanguage': '',
          'hidPdrs': '',
          'hidsc': ''
        }
      })
        .then(res => {
          let re = /<span id="xhxm">(.*?)同学<\/span>/;
          let reCapWrong = /alert\('验证码不正确.*?'\);/;
          let body = iconv.decode(res.body, 'GBK');
          if (re.test(body)) {
            let name = re.exec(body)[1];
            return {
              cookies: {
                sessionId: sessionId
              },
              name: name
            }
          } else if (reCapWrong.test(body)) {
            throw new ICollege.WrongCaptcha("验证码错误");
          } else {
            throw new Error("帐号密码错误或其他错误");
          }
        });
    }
  }
};