const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            res.status(401).json({ msg: 'please request token' });
        }
        const CLIENT_TOKEN = req.headers.authorization.split('Bearer ')[1];
        const decoded = jwt.verify(CLIENT_TOKEN, process.env.JWT_SECRET);
        if (decoded) {
            const { user_id, email } = decoded;
            if (user_id && email) {
                req.decodeToken = decoded;
                next();
            } else {
                res.status(401).json({ msg: 'unauthorized' });
            }
        } else {
            res.status(401).json({ msg: 'unauthorized' });
        }
    } catch (err) {
        res.status(401).json({ msg: 'token expired', err });
    }
};

module.exports = verifyToken;
