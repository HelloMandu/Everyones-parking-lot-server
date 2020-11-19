const express = require('express');
const moment = require('moment');
const router = express.Router();


router.post('/', async (req, res, next) => {
    console.log(moment());
    console.log(new Date(moment()));
    console.log(new Date('ㄴㄴㄴ').toString());
    if (!isNaN(new Date('ㄴㄴㄴ'))) {
        console.log('왜 들어옴')
    }
    res.send({
        msg: 'success',
        body: new Date('ㄴㄴㄴ')
    });
});

module.exports = router;