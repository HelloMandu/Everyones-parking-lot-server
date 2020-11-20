const express = require('express');
const router = express.Router();

const user = require('./user');
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

router.use('/user', user);
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



const test = require('./test');
router.use('/test', test);

module.exports = router;
