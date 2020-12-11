const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

const { User } = require('../../models');

const STATE = 'e0a76592f35858fc61b749f568242287';

const AUTH_URL = 'https://nid.naver.com/oauth2.0/authorize';
const TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

const REDIRECT_URL = process.env.REDIRECT_BASE + '/naver/callback';

router.get('/', async (req, res, next) => {
    /*
        네이버 로그인 요청 API(GET): /api/Oauth/naver
    */
    
    const AUTH_DATA = querystring.stringify({
        client_id: process.env.NAVER_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URL,
        state: STATE
    });
    res.redirect(`${AUTH_URL}?${AUTH_DATA}`);
});

router.get('/callback', async (req, res, next) => {
    /*
        네이버 로그인 완료 콜백 요청 API(GET): /api/Oauth/naver/callback
    */

    const { code, state, error, error_description } = req.query;
    if (error) {
        // API 요청 실패 시
    }
    if (code) {
        // API 요청 성공 시
        try {
            /* ----- 접근 토큰 발급 ----- */
            const token_res = await axios.get(TOKEN_URL, {
                params: {
                    grant_type: 'authorization_code',
                    client_id: process.env.NAVER_ID,
                    client_secret: process.env.NAVER_SECRET,
                    code, STATE
                }
            });
            const { data: token_data } = token_res;
            /* ----- 접근 토큰 발급 완료 ----- */

            /* ----- 프로필 API 호출 ----- */
            const profile_res = await axios.post(PROFILE_URL, null, {
                headers: {
                    'Authorization': `Bearer ${token_data.access_token}`
                }  
            });
            const { data: profile_data } = profile_res;
            if (profile_data.message !== 'success') {
                const data = querystring.stringify({ msg: 'failure' });
                return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
            }
            const {
                id: naver_id,
                profile_image,
                email: naver_email,
                name: naver_name,
                birthday,
            } = profile_data.response;
            /* ----- 프로필 API 호출 완료 ----- */

            const existUser = await User.findOne({
                where: { email: naver_email }
            }); // 가입한 이메일이 있는지 확인.
            if (existUser) {
                // 로그인.
                if (existUser.dataValues.register_type !== 'naver') {
                    // 네이버 로그인 가입자가 아니므로 오류.
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
                const hash = await bcrypt.hash(naver_id, 12); // 비밀번호 해싱.
                const createUser = await User.create({
                    email: naver_email, name: naver_name,
                    password: hash,
                    phone_number: '00012345678',
                    birth: new Date(0),
                    profile_image,
                    register_type: 'naver',
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
            // 오류
            const data = querystring.stringify({
                msg: 'failure',
                error: JSON.stringify(e)
            });
            return res.redirect(`${process.env.REDIRECT_VIEW}?${data}`);
        }
    }
});

module.exports = router;