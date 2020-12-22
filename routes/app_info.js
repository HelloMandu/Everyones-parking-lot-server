const express = require('express');
const router = express.Router();

const { AppInfo } = require('../models');

/* READ */
router.get('/', async (req, res, next) => {
    /*
        앱 정보 요청 API(GET): /api/app_info)

        * 응답: info = { 앱 정보 Object }
    */
    try {
        const info = await AppInfo.findOne({
            where: { com_id: 1 }
        }); // 앱 정보 조회.
        if (!info) {
            return res.status(202).send({ msg: '애플리케이션 정보가 없습니다.' });
        }
        return res.status(200).send({ msg: 'success', info });
    } catch (e) {
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
