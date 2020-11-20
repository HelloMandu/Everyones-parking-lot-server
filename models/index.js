// const path = require('path');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
// const config = require(__dirname + '/../config/config copy.json')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Admin = require('./admin')(sequelize, Sequelize); // admin table
db.AppInfo = require('./app_info')(sequelize, Sequelize); // app_info table

db.PhoneVerify = require('./phone_verify')(sequelize, Sequelize); // phone_verify table
db.PersonalPayment = require('./personal_payment')(sequelize, Sequelize); // personal_payment table

db.User = require('./user')(sequelize, Sequelize); // users table
db.Place = require('./place')(sequelize, Sequelize); // places table
db.Comment = require('./comment')(sequelize, Sequelize); // comments table
db.CouponZone = require('./coupon_zone')(sequelize, Sequelize); // coupon_zone table
db.Coupon = require('./coupon')(sequelize, Sequelize); // coupons table
db.Like = require('./like')(sequelize, Sequelize); // likes table
db.Card = require('./card')(sequelize, Sequelize); // cards table
db.PointLog = require('./point_log')(sequelize, Sequelize); // point_logs table
db.Withdraw = require('./withdraw')(sequelize, Sequelize); // withdraws table
db.Review = require('./review')(sequelize, Sequelize); // reviews table
db.RentalOrder = require('./rental_order')(sequelize, Sequelize); // rental_order table
db.ExtensionOrder = require('./extension_order')(sequelize, Sequelize); // extension_order table
db.Event = require('./event')(sequelize, Sequelize); // events table
db.Notice = require('./notice')(sequelize, Sequelize); // notices table
db.Faq = require('./faq')(sequelize, Sequelize); // faqs table
db.Qna = require('./qna')(sequelize, Sequelize); // qnas table
db.Notification = require('./notification')(sequelize, Sequelize); // notifications table
// DB 기본 형성.

/* places TABLE Relation */
db.User.hasMany(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Place = 1 : N

/* rental_order TABLE Relation */
db.User.hasMany(db.RentalOrder, { foreignKey: 'order_user_id', sourceKey: 'user_id' });
db.RentalOrder.belongsTo(db.User, { foreignKey: 'order_user_id', targetKey: 'user_id' });
// OrderUser : RentalOrder = 1 : N
db.User.hasMany(db.RentalOrder, { foreignKey: 'place_user_id', sourceKey: 'user_id' });
db.RentalOrder.belongsTo(db.User, { foreignKey: 'place_user_id', targetKey: 'user_id' });
// PlaceUser : RentalOrder = 1 : N
db.PersonalPayment.hasOne(db.RentalOrder, { foreignKey: 'ppayment_id', sourceKey: 'ppayment_id' });
db.RentalOrder.belongsTo(db.PersonalPayment, { foreignKey: 'ppayment_id', targetKey: 'ppayment_id' });
// PersonalPayment : RentalOrder = 1 : 1
db.Place.hasMany(db.RentalOrder, { foreignKey: 'place_id', sourceKey: 'place_id' });
db.RentalOrder.belongsTo(db.Place, { foreignKey: 'place_id', targetKey: 'place_id' });
// Place : RentalOrder = 1 : N
db.Coupon.hasOne(db.RentalOrder, { foreignKey: 'cp_id', sourceKey: 'cp_id' });
db.RentalOrder.belongsTo(db.Coupon, { foreignKey: 'cp_id', targetKey: 'cp_id' });
// Coupon : RentalOrder = 1 : 1

/* extension_order TABLE Relation */
db.RentalOrder.hasMany(db.ExtensionOrder, { foreignKey: 'rental_id', sourceKey: 'rental_id' });
db.ExtensionOrder.belongsTo(db.RentalOrder, { foreignKey: 'rental_id', targetKey: 'rental_id' });
// RentalOrder : ExtensionOrder = 1 : N
db.PersonalPayment.hasOne(db.ExtensionOrder, { foreignKey: 'ppayment_id', sourceKey: 'ppayment_id' });
db.ExtensionOrder.belongsTo(db.PersonalPayment, { foreignKey: 'ppayment_id', targetKey: 'ppayment_id' });
// PersonalPayment : ExtensionOrder = 1 : 1

/* coupons TABLE Relation */
db.CouponZone.hasMany(db.Coupon, { foreignKey: 'cz_id', sourceKey: 'cz_id' });
db.Coupon.belongsTo(db.CouponZone, { foreignKey: 'cz_id', targetKey: 'cz_id' });
// Coupon : CouponZone = 1 : N
db.User.hasMany(db.Coupon, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Coupon.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : CouponZone = 1 : N

/* likes TABLE Relation */
db.User.hasMany(db.Like, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Like.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Like = 1 : N
db.Place.hasMany(db.Like, { foreignKey: 'place_id', sourceKey: 'place_id' });
db.Like.belongsTo(db.Place, { foreignKey: 'place_id', targetKey: 'place_id' });
// Place : Like = 1 : N
db.Notification.hasMany(db.Like, { foreignKey: 'notification_id', sourceKey: 'notification_id' });
db.Like.belongsTo(db.Notification, { foreignKey: 'notification_id', targetKey: 'notification_id' });
// Notification : Like = 1 : N

/* reviews TABLE Relation */
db.RentalOrder.hasOne(db.Review, { foreignKey: 'rental_id', sourceKey: 'rental_id' });
db.Review.belongsTo(db.RentalOrder, { foreignKey: 'rental_id', targetKey: 'rental_id' });
// RentalOrder : Review = 1 : 1
db.User.hasMany(db.Review, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Review = 1 : N
db.Place.hasMany(db.Review, { foreignKey: 'place_id', sourceKey: 'place_id' });
db.Review.belongsTo(db.Place, { foreignKey: 'place_id', targetKey: 'place_id' });
// Place : Review = 1 : N

/* comments TABLE Relation */
db.Review.hasMany(db.Comment, { foreignKey: 'review_id', sourceKey: 'review_id' });
db.Comment.belongsTo(db.Review, { foreignKey: 'review_id', targetKey: 'review_id' });
// Review : Comment = 1 : N
db.User.hasMany(db.Comment, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Comment.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Comment = 1 : N

/* notifications TABLE Relation */
db.User.hasMany(db.Notification, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Notification = 1 : N

/* qnas TABLE Relation */
db.User.hasMany(db.Qna, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Qna.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Qna = 1 : N

/* cards TABLE Relation */
db.User.hasMany(db.Card, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Card.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Card = 1 : N

/* point_logs TABLE Relation */
db.User.hasMany(db.PointLog, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PointLog.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : PointLog = 1 : N

/* withdraws TABLE Relation */
db.User.hasMany(db.Withdraw, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.Withdraw.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : Withdraw = 1 : N

/* personal_payment TABLE Relation */
db.User.hasMany(db.PersonalPayment, { foreignKey: 'user_id', sourceKey: 'user_id' });
db.PersonalPayment.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });
// User : PersonalPayment = 1 : N
db.Card.hasMany(db.PersonalPayment, { foreignKey: 'card_id', sourceKey: 'card_id' });
db.PersonalPayment.belongsTo(db.Card, { foreignKey: 'card_id', targetKey: 'card_id' });
// Card : PersonalPayment = 1 : N

/*
    IF 1 : 1 관계일 경우
        db.User.hasOne(db.Place, { foreignKey: 'user_id', sourceKey: 'user_id' });
        db.Place.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'user_id' });

    IF N : M 관계일 경우
        db.User.belongsToMany(db.Place, { through: 'UserPlace' });
        db.Place.belongsToMany(db.User, { through: 'UserPlace' });
*/

module.exports = db;
