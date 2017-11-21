'use strict';

const config = requirePR('config/config')
const models = requirePR('models')
const kvdb = requirePR('libs/kvdb')
const express = require('express')
const router = express.Router()
const UPLOAD_FOLDER = 'uploadprint'
const uploadStorage = requirePR('libs/uploadStorage')(UPLOAD_FOLDER)
const upload = require('multer')({storage: uploadStorage.storage})
const RETCODE = require('./retcode')
const logger = require('log4js').getLogger('normal')
const utils = require('./utils')
const path = require('path')
const SMS = requirePR('libs/sms')(RETCODE)
const wrapper = utils.apiWrapper
const pageSize = 30

function checkPassword (req, res, next) {
  if (req.uparam.token !== config.uploadPrintPassword) {
    res.ReturnJSON(RETCODE.WrongPassword)
  } else {
    next()
  }
}

router.all('/download/:id', checkPassword, (req, res) => {
  const id = req.params.id
  models.UploadPrintOrder.findById(id)
    .then(order => {
      if (order) {
        res.download(order.filepath, order.filename)
      } else {
        res.end('订单未找到')
      }
    }).catch(e => {
      res.end('下载发生错误, 请重试')
    })
})

router.all('/list', checkPassword, wrapper(({page = 1}) => {
  return models.UploadPrintOrder.findAndCountAll({
    offset: pageSize * (page - 1),
    limit: pageSize,
    order: [['id', 'DESC']]
  }).then(result => {
    return {
      total: result.count,
      items: result.rows.map(item => ({
        comment: item.comment,
        id: item.id,
        filename: item.filename,
        addr: item.addr,
        createdAt: item.createdAt,
        arrived: item.arrived,
        phone: item.phone
      })),
      pageSize: pageSize
    }
  })
}))

router.all('/setArrived', checkPassword, SMS.SmsMiddleware, wrapper(({token, id, arrived, sms}) => {
  return models.UploadPrintOrder.findById(id)
  .then(order => {
    if (order && arrived && !order.arrived) {
      order.arrived = true
      return order.save()
    } else {
      throw RETCODE.WrongParam
    }
  })
  .then(order => {
    // 发送短信通知
    sms.sendTemplate(order.phone, 'SMS_70390352')
    return order
  })
}))

router.all('/submit', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.ReturnJSON(RETCODE.WrongParam)
    return
  }
  var list = ['addr', 'phone'];
  var d = req.body
  var obj = {}
  for (let item of list) {
    if (typeof d[item] !== "string" || d[item].length == 0) {
      res.ReturnJSON(RETCODE.WrongParam)
      return
    }
    obj[item] = d[item]
  }
  obj.comment = d.comment || ''
  obj.filepath = uploadStorage.path + req.file.filename
  obj.filename = req.file.originalname
  models.UploadPrintOrder.create(obj)
    .then(() => {
      res.ReturnJSON(RETCODE.Success);
    })
    .catch((e) => {
      logger.error(e)
      res.ReturnJSON(RETCODE.Unknown);
    });
});

module.exports = router
