const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

const { User } = require('../../models');

const REDIRECT_VIEW = 'http://localhost:3000/Oauth';

const STATE = 'fa13022c2457797b71b9a284665472ad';

const AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const REDIRECT_URL = 'http://localhost:8080/api/Oauth/kakao/callback';
const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

router.get('/', async (req, res, next) => {
    /*
        카카오 로그인 요청 API(GET): /api/Oauth/kakao
    */
    const AUTH_DATA = querystring.stringify({
        client_id: process.env.KAKAO_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URL,
        state: STATE
    });
    res.redirect(`${AUTH_URL}?${AUTH_DATA}`);
});

router.get('/callback', async (req, res, next) => {
    /*
        카카오 로그인 완료 콜백 요청 API(GET): /api/Oauth/kakao/callback
    */
    const { code, state, error } = req.query;
    
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
                    client_id: process.env.KAKAO_ID,
                    client_secret: process.env.KAKAO_SECRET,
                    redirect_uri: REDIRECT_URL,
                    code
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
            if (!profile_data) {
                const data = querystring.stringify({ msg: 'failure' });
                return res.redirect(`${REDIRECT_VIEW}?${data}`);
            }
            const { id: kakao_id, properties, kakao_account } = profile_data;
            const { email: kakao_email, birthday } = kakao_account;
            const { nickname, profile_image } = properties;
            /* ----- 프로필 API 호출 완료 ----- */

            const existUser = await User.findOne({
                where: { email: kakao_email }
            });
            if (existUser) {
                // 로그인.
                if (existUser.dataValues.register_type !== 'kakao') {
                    // 카카오 로그인 가입자가 아니므로 오류.
                    const data = querystring.stringify({ msg: '해당 소셜 로그인 가입자가 아닙니다.' });
                    return res.redirect(`${REDIRECT_VIEW}?${data}`);
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
                return res.redirect(`${REDIRECT_VIEW}?${data}`);
            } else {
                // 회원가입.
                const hash = await bcrypt.hash(kakao_id.toString(), 12); // 비밀번호 해싱.
                const createUser = await User.create({
                    email: kakao_email, name: nickname,
                    password: hash,
                    phone_number: '00012345678',
                    birth: new Date(0),
                    profile_image,
                    register_type: 'kakao',
                    email_verified_at: new Date()
                });
                if (!createUser) {
                    // 오류
                    const data = querystring.stringify({ msg: 'failure' });
                    return res.redirect(`${REDIRECT_VIEW}?${data}`);
                }
                // 회원가입 성공 및 로그인
                const { user_id, email } = createUser.dataValues;
                const token = jwt.sign(
                    { user_id, email },
                    process.env.JWT_SECRET
                ); // JWT_TOKEN 생성.
                const data = querystring.stringify({
                    msg: 'success',
                    token
                });
                return res.redirect(`${REDIRECT_VIEW}?${data}`);
            }
        } catch (error) {
            // 오류
            console.log(error);
            const data = querystring.stringify({ msg: 'failure' });
            return res.redirect(`${REDIRECT_VIEW}?${data}`);
        }
    }
});


module.exports = router;