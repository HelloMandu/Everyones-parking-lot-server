const initUser = require('./user/initUser');
const initPlace = require('./place/initPlace');
const initCouponZone = require('./coupon/initCouponZone');
const initNotice = require('./notice/initNotice');
const initFaq = require('./faq/initFaq');


const init = () => {
    initUser.init();
    initPlace.init();
    initCouponZone.init();
    initNotice.init();
    initFaq.init();
}

module.exports = init; 