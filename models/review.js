// 上传文件的审核
module.exports = function(sequelize, DataTypes) {
  var Review = sequelize.define('Review', {
    type: DataTypes.STRING,
    state: DataTypes.ENUM('Pending', 'Resolve', 'Reject'),
    objId: DataTypes.INTEGER,
    reason: DataTypes.STRING, // 拒绝原因等
    extra: DataTypes.STRING // 来自举报时, 附加的信息
  }, {
    classMethods: {
      associate: function (models) {
        Review.belongsTo(models.User, {as: 'fromUser'});
      },
      //Project.findAll({ offset: 5, limit: 5, order: [] })
      list: function (offset, limit) {
        return Review.findAll({
          offset: offset,
          limit: limit,
          order: 'id'
        })
      }
    }
  });
  return Review;
};
