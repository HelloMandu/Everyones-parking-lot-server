const express = require('express');
const bcrypt = require('bcrypt');

const omissionChecker = require('../lib/omissionChecker');

const { User } = require('../models');

const router = express.Router();
require('dotenv').config();

router.post('/', async (req, res, next) => {
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { phone_number } = req.body;
    const omissionResult = omissionChecker({ phone_number });
    if (!omissionResult.result) {
        res.send({ msg: omissionResult.message });
    }
    /*todo: 인증번호 요청*/
    res.send({ msg: 'success', auth_number: 1234 });
});


module.exports = router;
