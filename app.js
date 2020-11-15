const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./models').sequelize;
const indexRouter = require('./routes/index');

const app = express();

dotenv.config(); // env 파일에 접근할 수 있게 함.
sequelize.sync(); // Sequelize를 통해 DB 접근.

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev')); // 접속 기록 로그를 찍는 미들웨어 추가.
app.use(express.json()); // req.body에서 json 읽어 옴.
app.use(express.urlencoded({ extended: false })); // req.body 인식.
app.use(cookieParser()); // 쿠키를 파싱.
app.use(express.static(path.join(__dirname, 'public'))); // public 폴더를 접근할 수 있게 함.
app.use(cors()); // CORS 제한을 제거함.

app.use('/api', indexRouter); // api 서버 라우팅.

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app; 
