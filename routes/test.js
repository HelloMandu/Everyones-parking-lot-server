const express = require('express');
const router = express.Router();


router.post('/', async (req, res, next) => {

    console.log(req.body);
    res.send({
        msg: 'success',
        body: req.body
    });
});

module.exports = router;