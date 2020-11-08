const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const omissionChecker = require('../lib/omissionChecker');

const { User } = require('../models');

router.post('/signup', async function (req, res, next) {
    /*
        회원가입 요청.
        path: /api/auth/signup.  
    */
    if (req.body !== {}) {
        const { email, name, birth, phone_number, password } = req.body;
        const omissionResult = omissionChecker({
            email, name, birth, phone_number, password
        }); // 데이터가 올바르게 모두 넘어왔는지 검사.
        if (omissionResult.result) {
            /*
                모든 데이터가 정상적으로 넘어왔으면 회원가입 절차 실행.
            */
            const findData = await User.findOne({ where: { email } });
            // 이미 가입된 이메일이 있는지 찾음.
            if (!findData) {
                // 일치하는 이메일이 없다 => 가입 가능한 계정.
                const hash = await bcrypt.hash(password, 12);
                const createData = await User.create({
                    email, name, password: hash, phone_number,
                    birth: new Date(birth),
                });
                if (createData) {
                    // 가입 성공이라는 메세지 보냄.
                    res.send({ msg: 'success' });
                }
            } else {
                // 일치하는 이메일이 있다 => 이미 가입된 계정.
                res.send({ msg: '이미 가입한 이메일입니다.' });
            }
        } else {
            // 데이터가 부족할 때.
            res.send({ msg: omissionResult.message });
        }
    } else {
        // 데이터를 보내지 않았을 때.
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    }
});

module.exports = router;