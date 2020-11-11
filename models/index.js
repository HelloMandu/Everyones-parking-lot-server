// const path = require('path');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env];
const config = require(__dirname + '/../config/config copy.json')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Admin = require('./admin')(sequelize, Sequelize);
db.AppInfo = require('./app_info')(sequelize, Sequelize);
db.Comment = require('./comment')(sequelize, Sequelize);
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

db.User.hasMany(db.RentalOrder, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.RentalOrder.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : RentalOrder = 1 : N
db.Place.hasMany(db.RentalOrder, { foreignKey: 'place_id', sourceKey: 'place_id' });
db.RentalOrder.belongsTo(db.Place, { foreignKey: 'place_id', targetKey: 'place_id' });
// Place : RentalOrder = 1 : N
db.Coupon.hasOne(db.RentalOrder, { foreignKey: 'cp_id', sourceKey: 'cp_id' });
db.RentalOrder.belongsTo(db.Coupon, { foreignKey: 'cp_id', targetKey: 'cp_id' });
// Coupon : RentalOrder = 1 : 1

db.RentalOrder.hasMany(db.ExtensionOrder, { foreignKey: 'rental_id', sourceKey: 'rental_id' });
db.ExtensionOrder.belongsTo(db.RentalOrder, { foreignKey: 'rental_id', targetKey: 'rental_id' });
// RentalOrder : ExtensionOrder = 1 : N

db.RentalOrder.hasMany(db.Review, { foreignKey: 'rental_id', sourceKey: 'rental_id' });
db.Review.belongsTo(db.RentalOrder, { foreignKey: 'rental_id', targetKey: 'rental_id' });
// RentalOrder : Review = 1 : N
db.User.hasMany(db.Review, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Review = 1 : N

db.Review.hasMany(db.Comment, { foreignKey: 'review_id', sourceKey: 'review_id' });
db.Comment.belongsTo(db.Review, { foreignKey: 'review_id', targetKey: 'review_id' });
// Review : Comment = 1 : N
db.User.hasMany(db.Comment, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Comment.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Comment = 1 : N

db.User.hasMany(db.Notification, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Notification = 1 : N

db.User.hasMany(db.Qna, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Qna.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Qna = 1 : N

db.User.hasMany(db.PointLog, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PointLog.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : PointLog = 1 : N
db.RentalOrder.hasMany(db.PointLog, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PointLog.belongsTo(db.RentalOrder, { foreignKey: 'user_id', targetKey: 'user_id' });
// RentalOrder : PointLog = 1 : N
db.ExtensionOrder.hasMany(db.PointLog, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PointLog.belongsTo(db.ExtensionOrder, { foreignKey: 'user_id', targetKey: 'user_id' });
// ExtensionOrder : PointLog = 1 : N

db.User.hasMany(db.PersonalPayment, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PersonalPayment.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : PersonalPayment = 1 : N
db.User.hasMany(db.PersonalPayment, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PersonalPayment.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : PersonalPayment = 1 : N
db.RentalOrder.hasMany(db.PersonalPayment, { foreignKey: 'rental_id', sourceKey: 'rental_id' });
db.PersonalPayment.belongsTo(db.RentalOrder, { foreignKey: 'rental_id', targetKey: 'rental_id' });
// RentalOrder : PersonalPayment = 1 : N
db.ExtensionOrder.hasMany(db.PersonalPayment, { foreignKey: 'extension_id', sourceKey: 'extension_id' });
db.PersonalPayment.belongsTo(db.ExtensionOrder, { foreignKey: 'extension_id', targetKey: 'extension_id' });
// ExtensionOrder : PersonalPayment = 1 : N

/*
    IF 1 : 1 관계일 경우
        db.User.hasOne(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
        db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });

    IF N : M 관계일 경우
        db.User.belongsToMany(db.Place, { through: 'UserPlace' });
        db.Place.belongsToMany(db.User, { through: 'UserPlace' });
*/

module.exports = db;
