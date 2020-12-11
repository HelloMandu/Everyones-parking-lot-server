const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { User } = require('../../models');

const REDIRECT_URL = process.env.REDIRECT_BASE + '/facebook/callback';

router.get('/', async (req, res, next) => {
    /*
        페이스북 로그인 요청 API(GET): /api/Oauth/facebook
    */
    res.render('facebook', { appId: process.env.FACEBOOK_ID, redirectUrl: REDIRECT_URL });
});

router.get('/callback', async (req, res, next) => {
    /*
        페이스북 로그인 완료 콜백 요청 API(GET): /api/Oauth/facebook/callback
    */
    const { id: facebook_id, email: facebook_email, name: facebook_name, birthday, error } = req.query;
    if (error) {
        // API 요청 실패 시
        const data = querystring.stringify({ msg: 'failure' });
        return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
    }
    else {
        // API 요청 성공 시
        try {
            const existUser = await User.findOne({
                where: { email: facebook_email }
            }); // 가입한 이메일이 있는지 확인.
            if (existUser) {
                // 로그인.
                if (existUser.dataValues.register_type !== 'facebook') {
                    // 페이스북 로그인 가입자가 아니므로 오류.
                    const data = querystring.stringify({ msg: '해당 소셜 로그인 가입자가 아닙니다.' });
                    return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
                }
                const { user_id, email } = existUser.dataValues;
                const token = jwt.sign(
                    { user_id, email },
                    process.env.JWT_SECRET
                ); // JWT_TOKEN 생성.
                const data = querystring.stringify({
                    msg: 'success',
                    token
                });
                return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
            } else {
                // 회원가입.
                const hash = await bcrypt.hash(facebook_id, 12); // 비밀번호 해싱.
                const createUser = await User.create({
                    email: facebook_email, name: facebook_name,
                    password: hash,
                    phone_number: '00012345678',
                    birth: birthday !== 'undefined' ? new Date(birthday) : new Date(0),
                    register_type: 'facebook',
                    email_verified_at: new Date()
                });
                if (!createUser) {
                    // 오류
                    const data = querystring.stringify({ msg: 'failure' });
                    return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
                }
                // 회원가입 성공 및 로그인.
                const { user_id, email } = createUser.dataValues;
                const token = jwt.sign(
                    { user_id, email },
                    process.env.JWT_SECRET
                ); // JWT_TOKEN 생성.
                const data = querystring.stringify({
                    msg: 'success',
                    token
                });
                return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
            }
        } catch (e) {
            const data = querystring.stringify({
                msg: 'failure',
                error: JSON.stringify(e)
            });
            return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
        }
    }
});

module.exports = router;