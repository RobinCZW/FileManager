module.exports = function(sequelize, DataTypes) {
  var Good = sequelize.define('Good', {
    title: DataTypes.STRING,
    price: DataTypes.INTEGER,
    image: DataTypes.STRING
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        //Good.belongsTo(models.College);
        //Good.hasMany(models.Folder);
      }
    },
    instanceMethods: {
      json (withCount = false) {
        let ret = {
          id: this.get('id'),
          title: this.get('title'),
          price: this.get('price'),
          image: this.get('image'),
        }
        if (withCount) {
          ret.count = this.OrderDetail.count
        }
        return ret
      }
    }
  });
  return Good;
}
