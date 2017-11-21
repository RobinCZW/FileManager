// 学校
var models;
module.exports = function(sequelize, DataTypes) {
  var CollegeCommunity = sequelize.define('CollegeCommunity', {});
  var College = sequelize.define('College', {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  }, {
    hooks: {
      /*afterCreate: function (college, opt) {
        return college.getFolders().then((folders) => {
          if (folders.length === 0) {
            return models.Folder.create({
              parentFolder: null,
              name: '',
              CollegeId: college.id
            });
            //.then(college.addFolder);
          }
        });
      }*/
    },
    classMethods: {
      associate: function(db) {
        models = db;
        College.hasMany(models.Course);
        College.hasMany(models.Academy);
        College.hasMany(models.Folder);
        College.belongsToMany(models.Community, { through: CollegeCommunity });
        
        //College.hasMany(models.CommTag);
      }
    }
  });
  return College;
}