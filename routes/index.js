const express = require('express');
const router = express.Router();

const user = require('./user');
const mobile = require('./mobile');
const place = require('./place');
const like = require('./like');
const review = require('./review');
const comment = require('./comment');
const coupon = require('./coupon');
const card = require('./card');

router.use('/user', user);
router.use('/mobile', mobile);
router.use('/place', place);
router.use('/like', like);
router.use('/review', review);
router.use('/comment', comment);
router.use('/coupon', coupon);
router.use('/card', card);



const test = require('./test');
router.use('/test', test);

module.exports = router;
