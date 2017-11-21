const uuid = require('uuid')
function nowTime () {
  return (new Date()).getTime()
}
module.exports = function(sequelize, DataTypes) {
  var models
  var OrderDetail = sequelize.define('OrderDetail', {
    count: DataTypes.INTEGER
  })
  var GoodOrder = sequelize.define('GoodOrder', {
    uuid: DataTypes.STRING, //UUID
    addr: DataTypes.STRING,
    recvName: DataTypes.STRING,
    phone: DataTypes.STRING,
    totalPrice: DataTypes.INTEGER, // 单位: 分
    state: DataTypes.ENUM('Paying', 'Shipping', 'Success', 'Closed'),
    createTime: DataTypes.BIGINT,
    payTime: DataTypes.BIGINT,
    successTime: DataTypes.BIGINT,
    paytype: DataTypes.ENUM('alipay'),
    payResult: DataTypes.TEXT
  }, {
    classMethods: {
      associate (m) {
        // Good.belongsTo(models.College);
        // GoodOrder.hasMany(models.Good);
        models = m
        GoodOrder.belongsToMany(models.Good, {
          through: {
            model: OrderDetail
          }
        })
        GoodOrder.belongsTo(models.User)
      },
      createByUser (user, def, list) {
        // TODO: 事物rollback
        return GoodOrder.create(def)
        .then(order => {
          let sets = []
          sets.push(order.setUser(user))
          order.state = 'Paying'
          order.createTime = nowTime()
          order.uuid = uuid.v4()
          let goodMap = new Map()
          for (let [goodId, count] of list) {
            goodMap.set(goodId, count)
            sets.push(order.addGood(goodId, { count: count }))
          }
          return models.Good.findAll({
            where: {
              id: list.map(i => i[0])
            },
            attributes: ['id', 'price']
          }).then(goods => {
            let totalPrice =  goods.reduce((prev, good) => {
              return prev + good.price * goodMap.get(good.id)
            }, 0)
            order.totalPrice = totalPrice
            return Promise.all(sets).then(() => order.save())
          })
        })
      }
    },
    instanceMethods: {
      json () {
        let ret = {
          uuid: this.uuid,
          addr: this.addr,
          name: this.recvName,
          phone: this.phone,
          state: this.state,
          createTime: this.createTime,
          payTime: this.payTime,
          successTime: this.successTime,
          totalPrice: this.totalPrice,
        }
        if (this.User) {
          ret.user = this.User.json()
        }
        return ret
      },
      pay (paytype, payResult) {
        if (this.get('state') !== 'Paying') {
          return Promise.resolve(false)
        }
        this.set('state', 'Shipping')
        this.set('payTime', nowTime())
        this.set('paytype', paytype)
        this.set('payResult', JSON.stringify(payResult))
        return this.save()
      },
      shipDone () {
        if (this.get('state') !== 'Shipping') {
          return Promise.resolve(false)
        }
        this.set('state', 'Success')
        this.set('successTime', nowTime())
        return this.save()
      }
    }
  });
  return GoodOrder
}
