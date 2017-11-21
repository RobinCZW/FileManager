'use strict';
var Promise = require("bluebird");
var ICollege = require('./ICollege');
var logger = require('log4js').getLogger('normal');
var jsdom = Promise.promisifyAll(require('jsdom'));
var request = require('request');
var jquery = require('jquery');
var jarFromJSON = require('tough-cookie').CookieJar.fromJSON;
var isUndefined = require('util').isUndefined;

let jqueryHTML = function (html, selector) {
  let ret = jsdom.envAsync(html)
    .then(jquery);
  if (!isUndefined(selector))
    ret = ret.then($ => $(selector));
  return ret;
};

function getNameFromTopHtml(html) {
  return jqueryHTML(html, '#Label_dlxx')
    .then(span => {
      let name = span.text();
      if (name.length == 0) {
        return '';
      }
      let re = /当前用户：(.*?)\s/;
      return re.exec(name)[1];
    });
}

let dr = Promise.promisifyAll(request.defaults({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
  }
}));

const name = "福州大学";
const id = "fzu";
var fzu = class fzu extends ICollege {
  /**
   * @return {string}
   */
  get Name() { return name; }
  /**
   * @return {string}
   */
  get ID() { return id; }


  login(sid, password, params) {
    logger.info('login', sid, password);

    let cookieJar = request.jar();
    let urlPrefix, searchStr;
    return dr.postAsync({
      url: 'http://59.77.226.32/logincheck.asp',
      followAllRedirects: true,
      jar: cookieJar,
      headers: {
        'Referer': 'http://jwch.fzu.edu.cn/',
        'Origin': 'http://jwch.fzu.edu.cn'
      },
      form: {
        muser: sid,
        passwd: password
      }
    })
      .then(res => {
        if (res.request.uri.href.indexOf('/default.aspx') == -1) {
          throw Error('教务处用户名或密码错误');
        }

        let host = res.request.uri.host;
        urlPrefix = 'http://'+host;
        searchStr = res.request.uri.search;
        let topURL = urlPrefix+'/top.aspx'+searchStr;
        return dr.getAsync({
          url: topURL,
          jar: cookieJar,
          headers: {
            'Referer': res.request.uri.href,
          }
        });
      })
      .then(res => getNameFromTopHtml(res.body))
      .then(name => {
        if (name.length == 0) {
          throw new Error('获取教务处姓名失败');
        }

        return {
          cookies : {
            urlPrefix: urlPrefix,
            searchStr: searchStr,
            cookieJar: cookieJar._jar.toJSON() //damn it...fix
          },
          name: name
        };
        
      });
  }
};
module.exports = new fzu();