const express = require('express');
const router = express.Router();

const naver = require('./naver');
const kakao = require('./kakao');
const facebook = require('./facebook');

router.use('/naver', naver);
router.use('/kakao', kakao);
router.use('/facebook', facebook);

module.exports = router;