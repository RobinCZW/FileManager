module.exports = function(sequelize, DataTypes) {
  var Course = sequelize.define('Course', {
    name: DataTypes.STRING,
    idDelete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    classMethods: {
      associate: function(models) {
        //Course.belongsTo(models.College);
        //Course.hasMany(models.Folder);
      }
    },
    // indexes: [{
    //   unique: true,
    //   get fields(){
    //     console.trace('get field');
    //     return ['name', 'CollegeId', 'teacher'];
    //   }
    // }]
  });
  return Course;
}