const express = require('express');
const router = express.Router();

const app_info = require('./app_info');

const user = require('./user');
const Oauth = require('./Oauth');
const mobile = require('./mobile');
const place = require('./place');

const order = require('./order');
const rental = require('./rental');
const extension = require('./extension');

const like = require('./like');
const review = require('./review');
const comment = require('./comment');
const coupon = require('./coupon');
const card = require('./card');
const event = require('./event');
const notice = require('./notice');
const faq = require('./faq');
const qna = require('./qna');
const point = require('./point_log');
const withdraw = require('./withdraw');
const notification = require('./notification');

router.use('/app_info', app_info);

router.use('/user', user);
router.use('/Oauth', Oauth);
router.use('/mobile', mobile);
router.use('/place', place);

router.use('/order', order);
router.use('/rental', rental);
router.use('/extension', extension);

router.use('/like', like);
router.use('/review', review);
router.use('/comment', comment);
router.use('/coupon', coupon);
router.use('/card', card);
router.use('/event', event);
router.use('/notice', notice);
router.use('/faq', faq);
router.use('/qna', qna);
router.use('/point_log', point);
router.use('/withdraw', withdraw);
router.use('/notification', notification);

module.exports = router;
