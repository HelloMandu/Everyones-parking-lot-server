const express = require('express');

const router = express.Router();

const user = require('./user');
const mobile = require('./mobile');

router.use('/user', user);
router.use('/mobile', mobile);

module.exports = router;
