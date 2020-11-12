const express = require('express');

const { AppInfo } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try{
        const appInfo = await AppInfo.findOne({ where: { id: 1 } });
        if (!appInfo) {
            res.status(401).send({ msg: '애플리케이션 정보가 없습니다.' });
        }
        res.send(appInfo);
    } catch(e){
        if (e.table) {
            res.status(500).send({ msg: foreignKeyChecker(e.table) });
        } else {
            res.status(500).send({ msg: 'database error', error });
        }
    }

});

module.exports = router;
