var request = require('request');
var Promise = require("bluebird");
var logger = require('log4js').getLogger('normal');
var crypto = require('crypto');
request = Promise.promisifyAll(request)

function str_repeat(str, num){ 
  return new Array(num + 1).join(str); 
}
function dword(d) {
  let o = ''
  o += String.fromCharCode(d % 256)
  d >>= 8
  o += String.fromCharCode(d % 256)
  d >>= 8
  o += String.fromCharCode(d % 256)
  d >>= 8
  o += String.fromCharCode(d % 256)
  o = o.split('').reverse().join('')
  return o
}
function hex(s) {
  let o = ''
  for (let i=0; i<s.length; i++) {
    o += s.charCodeAt(i).toString(16) + ' '
  }
  return o
}
function encrypt (data, key) {
  const cipher =  crypto.createCipheriv('aes256', key, key.substr(0, 16))
  cipher.setAutoPadding(true)
  return cipher.update(data, 'utf8', 'base64') + cipher.final('base64')
}

module.exports = ({appKey, appSecret}) => {
  return function umengLogin (user) {
    var json = {
      user_info: {
        name: user.get('nickname'),
        icon_url: 'http://finalexam.cn/' + user.get('avatar'),
        gender: user.get('gender') === '男' ? 1 : 0
      },
      source_uid: String.valueOf()(user.get('id')),
      source: 'self_account'
    }
    json = JSON.stringify(json)

    // let buf = new Buffer(json)
    // let lenbuf = new Buffer(dword(buf.length))
    // let padding = new Buffer(str_repeat(' ', 16 - (buf.length + 4) % 16))
    // json = Buffer.concat([lenbuf, buf, padding], lenbuf.length + buf.length + padding.length)
    json = new Buffer(json)
    // console.log(json, json.length)
    
    var encrypted_data = encrypt(json, appSecret)

    return request.postAsync({
      // proxy: 'http://127.0.0.1:8888',
      // strictSSL: false,
      // url: `https://rest.wsq.umeng.com/0/get_access_token?ak=${appKey}`,
      url: `https://api.wsq.umeng.com/v2/user/login?ak=${appKey}`,
      form: {
        encrypted_data
      }
    })
      .then(r => r.body)
      .then(JSON.parse)
  }
}
