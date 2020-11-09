const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const omissionChecker = require('../../lib/omissionChecker');

const { User } = require('../../models');

/*
    로그인 요청.(POST)
    path: /api/user/signin
*/
router.post('', async function (req, res, next) {
    if (req.body === {}) {
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
    const { email, password } = req.body;
    const omissionResult = omissionChecker({ email, password });
    if (!omissionResult.result) {
        res.send({ msg: omissionResult.message });
    }
    const exUser = await User.findOne({ where: { email } });
    if (!exUser) {
        res.send({ msg: '가입되지 않은 이메일입니다.' });
    }
    const result = await bcrypt.compare(password, exUser.password);
    if (!result) {
        res.send({ msg: '비밀번호가 일치하지 않습니다.' });
    }
    const token = jwt.sign(
        {
            email: email,
            password: password,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30m',
        },
    );
    res.send({  msg: '로그인 성공!', token: token });
});

module.exports = router;
