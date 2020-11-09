const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            res.status(401).json({ error: 'please request token' });
        }
        const CLIENT_TOKEN = req.headers.authorization.split('Bearer ')[1];
        const decoded = jwt.verify(CLIENT_TOKEN, process.env.SECRET_KEY);
        if (decoded) {
            next();
        } else {
            res.status(401).json({ error: 'unauthorized' });
        }
    } catch (err) {
        res.status(401).json({ error: 'token expired' });
    }
};

module.exports = verifyToken;
