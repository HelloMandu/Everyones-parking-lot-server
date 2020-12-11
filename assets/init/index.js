const initUser = require('./user/initUser');
const initPlace = require('./place/initPlace');
const initCouponZone = require('./coupon/initCouponZone');


const init = () => {
    initUser.init();
    initPlace.init();
    initCouponZone.init();
}

module.exports = init; 