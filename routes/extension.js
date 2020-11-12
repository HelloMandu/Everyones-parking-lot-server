// const express = require('express');
// const router = express.Router();

// const { User, RentalOrder, ExtensionOrder } = require('../models');

// const verifyToken = require('./middlewares/verifyToken');
// const omissionChecker = require('../lib/omissionChecker');
// const foreignKeyChecker = require('../lib/foreignKeyChecker');

// require('dotenv').config();

// /*
// - 연장 신청 API(POST): /api/extension
// { headers }: JWT_TOKEN(유저 로그인 토큰)
// rental_id: 대여 주문 번호(Integer, 필수)
// end_time: 연장 종료 시간(DateTImeString, 필수)
// payment_type: 결제 수단(Integer, 필수)
// extension_price: 연장 추가비(Integer, 필수)

// * 응답: success / failure
// */
// router.post('/', verifyToken, async (req, res, next) => {
//     const { user_id } = req.decodeToken;
//     const { rental_id, end_time, payment_type, extension_price } = req.body;
//     try {
//         const existUser = await User.findOne({ where: { user_id } });
//         if (!existUser) {
//             return res.send({ msg: '가입되지 않은 이메일입니다' });
//         }
//         const existRental = await RentalOrder.findOne({ where: { rental_id } });
//         if (!existRental) {
//             return res.send({ msg: '대여정보가 없습니다' });
//         }
//         const createExtensionOrder = await ExtensionOrder.create({
//             rental_id,
//             end_time,
//             payment_type
//         })
//         res.send({ msg: 'success', pointlogs: existPointLog });
//     } catch (e) {
//         if (e.table) {
//             res.send({ msg: foreignKeyChecker(e.table) });
//         } else {
//             res.send({ msg: 'database error', error });
//         }
//     }
// });
