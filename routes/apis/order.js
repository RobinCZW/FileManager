'use strict';
var models = requirePR('models');
var DBFS = requirePR('libs/dbfs.js');
var config = requirePR('config/config');

var utils = require('./utils');
var wrapper = utils.apiWrapper;
var express = require('express');
var logger = require('log4js').getLogger('normal');
var router = express.Router();
var kvdb = requirePR('libs/kvdb');

const RETCODE = require('./retcode');
const PostMan = require('./postman')
const pageSize = 10

const Sequelize = require("sequelize")
const path = require('path')
const Alipay = require('alipay-node-sdk')
const aliOpt = config.payment.ali;
const ali = new Alipay({
  appId: aliOpt.appId,
  notifyUrl: aliOpt.notifyUrl,
  rsaPrivate: path.resolve(aliOpt.rsaPrivate),
  rsaPublic: path.resolve(aliOpt.rsaPublic),
  sandbox: aliOpt.sandbox,
  signType: aliOpt.signType
})

function needPostMan (req, res, next) {
  PostMan.get().then(postMan => {
    if (postMan.includes(req.user.id) || req.user.isAdmin) {
      next()
    } else {
      res.ReturnJSON(RETCODE.PermissionDenied)
    }
  })
}

router.all('/notify_ali', (req, res, next) => {
  const response = req.body
  if (ali.signVerify(response)) {
    models.GoodOrder.findOne({where: {
      uuid: response.out_trade_no
    }}).then(order => {
      if (order === null || order.payTime !== null) {
        res.send('success')
        return // 已支付, 忽略
      }
      if (response.app_id !== ali.appId) {
        res.send('success')
        logger.warn('异常:', response)
        return // 异常订单, 忽略
      }
      if (response.trade_status !== 'TRADE_SUCCESS' && response.trade_status !== 'TRADE_FINISHED') {
        res.send('success')
        logger.warn('非成功支付:', response)
        return // 异常订单, 忽略
      }
      return order.pay('ali', response).then(result => {
        if (!result) {
          logger.info(response.out_trade_no, '支付失败')
        }
        res.send('success')
      })
    }).catch(e => {
      logger.error(e, response)
    })
  } else {
    logger.error('sign verify failed', response)
    res.send('sign verify failed')
  }
})

router.use(utils.needUser)
router.all('/list', wrapper(({page = 1}, req) => {
  return models.GoodOrder.findAndCountAll({
    offset: pageSize * (page - 1),
    limit: pageSize,
    where: {
      UserId: req.user.id
    },
    order: [['id', 'DESC']],
    include: [{
      model: models.Good,
      paranoid: false
    }]
  }).then(result => {
    // console.log(result.rows[0].Goods)
    return {
      total: result.count,
      items: result.rows.map(i => {
        let item = i.json()
        item.list = i.Goods.map(j => j.json(true))
        return item
      }),
      pageSize: pageSize
    }
  })
}))

function getDetail (uuid) {
  return models.GoodOrder.findOne({
    where: {
      uuid: uuid
    }
  }).then(order => {
    return order.getGoods()
  }).then(goods => {
    return goods.map(good => ({
      id: good.id,
      title: good.title,
      count: good.OrderDetail.count
    }))
  })
}

router.all('/listAll', needPostMan, wrapper(({page = 1, onlyShipping = false}) => {
  let where = {}
  if (onlyShipping) {
    where = {
      state: 'Shipping'
    }
  }
  return models.GoodOrder.findAndCountAll({
    offset: pageSize * (page - 1),
    limit: pageSize,
    where: where,
    include: [{
      model: models.Good,
      paranoid: false
    }]
  }).then(result => {
    return {
      total: result.count,
      items: result.rows.map(i => {
        let item = i.json()
        item.detail = i.Goods.map(good => {
          return {
            id: good.id,
            title: good.title,
            count: good.OrderDetail.count
          }
        })
        return item
      }),
      pageSize: pageSize
    }
  })
}))

router.all('/getDetail', wrapper(({uuid}, req) => {
  return getDetail(uuid)
}))

router.all('/markSuccess', needPostMan, wrapper(({uuid}) => {
  return models.GoodOrder.findOne({
    where: {
      uuid: uuid
    }
  }).then(order => {
    if (order.state === 'Shipping') {
      return order.shipDone()
    } else {
      throw RETCODE.StateMismatch
    }
  }).then(RETCODE.Success)
}))

router.all('/add', wrapper(({addr, name, phone, list}, req) => {
  if (typeof list === 'string') {
    list = JSON.parse(list)
  }
  return kvdb.config.get('goodClosed', '1')
  .then(val => {
    let closed = val == '1'
    if (closed) {
      throw RETCODE.Closed
    }
  })
  .then(
    () => models.GoodOrder.createByUser(req.user, {
      addr,
      recvName: name,
      phone
    }, list).then(order => {
      return order.json()
    })
  )
}))

router.all('/pay', wrapper(({uuid, type}) => {
  switch (type) {
    case 'alipay':
      return models.GoodOrder.findOne({where: {
        uuid: uuid
      }}).then(order => {
        if (order.payTime !== null) {
          throw RETCODE.OrderPaid
        }
        const payinfo =  ali.pay({
            subject: '期末考啦订单',
            outTradeId: uuid,
            timeout: '30m',
            amount: (order.totalPrice / 100).toFixed(2),
            goodsType: '1'
        })
        return {
          type,
          payinfo
        }
      })
    default:
      throw RETCODE.WrongParam
  }
}))

module.exports = router
