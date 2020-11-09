const express = require('express');

const signin = require('./signin');
const signup = require('./signup');

const router = express.Router();

router.use('/signin', signin);
router.use('/signup', signup);

module.exports = router;
