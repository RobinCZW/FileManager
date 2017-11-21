// 用于发送短信, 并对每个手机号限制频率

const kvSMS = requirePR('libs/kvdb')('sms')

const topClient = requirePR('libs/top');
const kvLastSend = kvSMS.child('last')
const kvToday = kvSMS.child('today')
const kvCode  = kvSMS.child('code')

const logger    = require('log4js').getLogger('normal')
const config    = requirePR('config/config')
const smsParamsTemplate = config.smsParams;
const phoneRE   = new RegExp(config.phoneRE)
const testPhone = config.testPhone || '13333333333'
var RETCODE;

function getTime() {
  return (new Date()).getTime();
}
function genRandCode() {
  return /(\d{4})\./.exec(('000' + Math.random()*10000 + '.'))[1];
}

class SmsError extends Error {
  constructor (retcode) {
    super(retcode[1])
    this.code = retcode[0]
    this.retcode = retcode
    this.name = 'SmsError'
  }
  toString () {
    return this.message
  }
}

class SmsSender { // session 级别的验证
  constructor (session, opts = {}) {
    // Object.assign(opts, {
    //   limitPerDay: 5,
    //   intervalSec: 60,
    //   expireSec: 900
    // })
    this.limitPerDay = 5
    this.intervalSec = 60
    this.expireSec = 900
    this.debug = config.debug
    this.session = session
    Object.assign(this, opts)
  }
  sendCode (phone) {
    var code = genRandCode()
    logger.info(phone+' '+code)
    this.session.wait = phone
    return kvCode.set(phone, code, 15, true)
      .then(() => this.send(phone, {code: code}))
  }
  verifyCode (code) {
    const phone = this.session.wait
    return kvCode.get(phone)
      .then(c => {
        if (c !== code) {
          throw new SmsError(RETCODE.WrongCode)
        }
        this.session.trusted = {
          phone,
          expire: getTime() + this.expireSec * 1000
        }
      })
  }
  trusted () {
    if (this.session.trusted) {
      if (this.session.trusted.expire <= getTime()) {
        this.session.trusted.phone = null
      }
      return this.session.trusted.phone
    }
    return null
  }
  sendTemplate (phone, templateCode, params = {}) {
    if (!phoneRE.test(phone)) {
      throw new SmsError(RETCODE.WrongPhoneNumber)
    }
    let smsParams = Object.assign({}, smsParamsTemplate)
    smsParams.sms_param = JSON.stringify(params)
    smsParams.sms_template_code = templateCode
    smsParams.rec_num = phone

    return this.execute(smsParams)
  }
  send (phone, params) {
    if (!phoneRE.test(phone)) {
      throw new SmsError(RETCODE.WrongPhoneNumber)
    }
    var todayCount, lastSend;
    var now = getTime();
    var sendMsg = () => kvToday.get(phone, 0)
      .then(v => {
        todayCount = parseInt(v);
        if (todayCount >= this.limitPerDay) {
          throw new SmsError(RETCODE.TryTommorrow);
        }
        return kvLastSend.get(phone, 0);
      })
      .then(v => {
        lastSend = parseInt(v);
        if (now - lastSend < this.intervalSec * 1000) {
          throw new SmsError(RETCODE.TooFast);
        }
        return [todayCount, lastSend];
      })
      .spread((todayCount, lastSend) => {
        let smsParams = {}
        Object.assign(smsParams, smsParamsTemplate)
        Object.assign(smsParams.sms_param, params)
        smsParams.sms_param = JSON.stringify(smsParams.sms_param)
        smsParams.rec_num = phone;

        return kvToday.set(phone, todayCount + 1, 60*24) //一天
          .then(() => kvLastSend.set(phone, now, 10))
          .then(() => this.execute(smsParams))
          .then(() => RETCODE.Success)
      })
    return sendMsg()
  }
  execute (smsParams) {
    if (this.debug || (smsParams.rec_num == testPhone)) { // test phone
      logger.trace('SMSSend:', smsParams)
      return
    }
    return topClient.execute('alibaba.aliqin.fc.sms.num.send', smsParams)
  }
}

function SmsMiddleware (req, res, next) {
  if (!req.session) req.session = {}
  if (!req.session.sms) req.session.sms = {}
  req.uparam.sms = new SmsSender(req.session.sms)
  next()
}

module.exports = retcode => {
  RETCODE = retcode
  return {
    SmsError,
    SmsSender,
    SmsMiddleware
  }
}