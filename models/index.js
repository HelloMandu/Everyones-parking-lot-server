// const path = require('path');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
// const config = require(__dirname + '/../config/config copy.json')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Admin = require('./admin')(sequelize, Sequelize);
db.AppInfo = require('./app_info')(sequelize, Sequelize);
db.comment = require('./comment')(sequelize, Sequelize);
db.Coupon_zone = require('./coupon_zone')(sequelize, Sequelize);
db.Coupon = require('./coupon')(sequelize, Sequelize);
db.Event = require('./event')(sequelize, Sequelize);
db.ExtensionOrder = require('./extension_order')(sequelize, Sequelize);
db.Faq = require('./faq')(sequelize, Sequelize);
db.Like = require('./like')(sequelize, Sequelize);
db.Notice = require('./notice')(sequelize, Sequelize);
db.Notification = require('./notification')(sequelize, Sequelize);
db.PersonalPayment = require('./personal_payment')(sequelize, Sequelize);
db.PhoneVerify = require('./phone_verify')(sequelize, Sequelize);
db.Place = require('./place')(sequelize, Sequelize);
db.PointLog = require('./point_log')(sequelize, Sequelize);
db.Qna = require('./qna')(sequelize, Sequelize);
db.RentalOrder = require('./rental_order')(sequelize, Sequelize);
db.Review = require('./review')(sequelize, Sequelize);
db.User = require('./user')(sequelize, Sequelize);
db.Place = require('./place')(sequelize, Sequelize);
// DB 기본 형성.

db.User.hasMany(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Place = 1 : N
db.User.hasMany(db.Like, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Like.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Like = 1 : N
db.Place.hasMany(db.Like, { foreignKey: 'place_id', sourceKey: 'place_id' });
db.Like.belongsTo(db.Place, { foreignKey: 'place_id', targetKey: 'place_id' });
// Place : Like = 1 : N

/*
    IF 1 : 1 관계일 경우
        db.User.hasOne(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
        db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });

    IF N : M 관계일 경우
        db.User.belongsToMany(db.Place, { through: 'UserPlace' });
        db.Place.belongsToMany(db.User, { through: 'UserPlace' });
*/

module.exports = db;
