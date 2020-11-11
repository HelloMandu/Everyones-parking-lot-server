const express = require('express');
const router = express.Router();

const user = require('./user');
const mobile = require('./mobile');
const place = require('./place');
const review = require('./review');

router.use('/user', user);
router.use('/mobile', mobile);
router.use('/place', place);
router.use('/review', review);

module.exports = router;
