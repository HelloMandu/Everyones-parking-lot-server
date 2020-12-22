const express = require('express');
const router = express.Router();

const { PhoneVerify } = require('../models');

const DECIMAL = 10; // 10진수
const AUTH_NUMBER_LENGTH = 6; // 인중번호 길이

const omissionChecker = require('../lib/omissionChecker');
const { isCellPhoneForm } = require('../lib/formatChecker');

const createAuthNumber = NUMBER_LENTH => [...new Array(NUMBER_LENTH).keys()].map(() => Math.floor(Math.random() * DECIMAL)).join('');

const { config, Group } = require('solapi');

config.init({
    apiKey: process.env.SOLAPI_KEY,
    apiSecret: process.env.SOLAPI_SECRET,
});
async function send(message, agent = {}) {
    await Group.sendSimpleMessage(message, agent);
}



router.post('/auth', async (req, res, next) => {
    /*
        휴대폰 인증 번호 요청 API(POST): /api/mobile/auth

        phone_number: 유저 휴대폰 번호(String, 필수)

        * 응답: success / failure
    */
    const { phone_number } = req.body;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ phone_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const auth_number = createAuthNumber(AUTH_NUMBER_LENGTH); // 인증 번호 생성.
        const existPhoneVerify = await PhoneVerify.findOne({
            where: { phone_number }
        }); // 같은 휴대폰 번호로 인증한 내역이 있는지 확인.

        /* todo: 인증번호 요청 */
        let statePhoneVerify = null;
        if (existPhoneVerify) {
            // 같은 휴대폰 번호로 인증한 내역이 있음. => 인증번호 재전송.
            statePhoneVerify = await PhoneVerify.update(
                { auth_number },
                { where: { phone_number } },
            ); // 휴대폰 인증 번호 수정.
        } else {
            // 최초 인증.
            statePhoneVerify = await PhoneVerify.create(
                { phone_number, auth_number }
            ); // 휴대폰 인증 번호 생성.
        }
        send({
            type: 'SMS', // 발송할 메시지 타입 (SMS, LMS, MMS, ATA, CTA)
            text: `[인증번호] Space Station: 인증번호는 ${auth_number}입니다. 3분 후에 만료됩니다.`,
            to: phone_number,
            from: process.env.SOLAPI_SENDER,
        });
        // 인증 번호 전송.

        if (!statePhoneVerify) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
    } catch (e) {
        console.log(e);
        // DB 생성 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.post('/confirm', async (req, res, next) => {
    /*
        휴대폰 인증 번호 확인 API(POST): /api/mobile/confirm

        phone_number: 유저 휴대폰 번호(String, 필수)
        auth_number: 전달 받은 인증 번호(String, 필수)

        * 응답: success / failure
    */
    const { phone_number, auth_number } = req.body;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ phone_number, auth_number });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    if (!isCellPhoneForm(phone_number)) {
        return res.status(202).send({ msg: '휴대폰 번호 형식에 맞지 않습니다.' });
    }
    try {
        const existPhoneVerify = await PhoneVerify.findOne({
            where: { phone_number }
        }); // 같은 휴대폰 번호로 인증한 내역이 있는지 확인.
        if (!existPhoneVerify) {
            // 휴대폰 인증 번호를 발급 받지 않고 인증할 수 없음.
            return res.status(202).send({ msg: '휴대폰 인증 번호를 발급 받지 않았습니다.' });
        }
        const authConfirm = auth_number === existPhoneVerify.dataValues.auth_number;
        if (!authConfirm) {
            return res.status(202).send({ msg: '인증 번호가 일치하지 않습니다.' });
        }

        const deletePhoneVerify = await PhoneVerify.destroy({
            where: { phone_number, auth_number }
        }); // 인증 완료 후 기록 삭제.
        if (!deletePhoneVerify) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
    } catch (e) {
        // DB 삭제 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
