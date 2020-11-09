// const path = require('path');
const Sequelize = require('sequelize');


const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
// const config = require(__dirname + '/../config/config copy.json')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Place = require('./place')(sequelize, Sequelize);
// DB 기본 형성.

db.User.hasMany(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Place = 1 : N

/*
    IF 1 : 1 관계일 경우
        db.User.hasOne(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
        db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });

    IF N : M 관계일 경우
        db.User.belongsToMany(db.Place, { through: 'UserPlace' });
        db.Place.belongsToMany(db.User, { through: 'UserPlace' });
*/

module.exports = db;
