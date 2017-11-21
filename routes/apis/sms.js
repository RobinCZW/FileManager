const express = require('express')
const router = express.Router()
const utils = require('./utils')
const wrapper = utils.apiWrapper
const RETCODE = require('./retcode')
const SMS = requirePR('libs/sms')(RETCODE)
// const smsSender = new SMS.SmsSender()

router.use(SMS.SmsMiddleware)
router.use((req, res, next) => {
  req.uparam.user = req.user
  let session = req.session
  req.uparam.session = session
  next()
})

router.all('/verify', wrapper(({code, user, sms}) => {
  return sms.verifyCode(code)
}))

router.all('/trusted', wrapper(({user, sms}) => {
  return sms.trusted()
}))

router.all('/send', wrapper(({phone, user, sms}) => {
  if (!phone) {
    phone = user.get('username')
  }
  return sms.sendCode(phone)
}))

module.exports = router