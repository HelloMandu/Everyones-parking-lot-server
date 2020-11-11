const express = require('express');
const router = express.Router();

const { Place, Sequelize: { Op } } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const calculateDistance = require('../lib/calculateDistance');

require('dotenv').config();

/* CREATE */
router.post('/', async (req, res, next) => {
    /*

    */
});

/* READ */
router.get('/', async (req, res, next) => {
    /*
        주차공간 리스트 요청 API(GET): /api/place

        lat: 요청할 주차공간의 기준 위도(Float, 필수) => 세로
        lng: 요청할 주차공간의 기준 경도(Float, 필수) => 가로
        range: 요청할 주차공간의 거리 범위(Float, km 단위, default 값은 10km)
        min_price: 최소 가격(Intager)
        max_price: 최대 가격(Intager)
        start_date: 입차 시각(DateTimeString)
        end_date: 출차 시각(DateTimeString)
        filter: 필터링 항목([Type Array...])

        * 응답: places = (주차공간 Array)
    */
    if (req.query === {}) {
        // 정상적으로 데이터가 넘어오지 않음.
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    } else {
        const { lat, lng } = req.query;
        const omissionResult = omissionChecker({ lat, lng });
        if (!omissionResult.result) {
            // 필수 항목인 위도와 경도가 누락됨.
            res.send({ msg: omissionResult.message });
        } else {
            const {
                range, min_price, max_price,
                start_date, end_date, filter
            } = req.query;

            const whereArray = [];

            const minPrice = parseInt(min_price);
            const maxPrice = parseInt(max_price);

            !isNaN(minPrice) && whereArray.push({
                place_fee: { [Op.gte]: minPrice }
            }); // 최소 가격 필터링 있으면 추가
            !isNaN(maxPrice) && whereArray.push({
                place_fee: { [Op.lte]: maxPrice }
            }); // 최대 가격 필터링 있으면 추가
            start_date && whereArray.push({
                oper_start_time: { [Op.gte]: start_date }
            }); // 입차 예정 시각 필터링 있으면 추가
            end_date && whereArray.push({
                oper_end_time: { [Op.lte]: end_date }
            }); // 출차 예정 시각 필터링 있으면 추가
            filter && Array.isArray(filter) && whereArray.push({
                [Op.or]: filter.map(f => ({ place_type: f }))
            }); // 타입 필터가 배열로 넘어오면 추가.

            const resultPlaces = await Place.findAll({
                where: { [Op.and]: whereArray }
            }); // 주차공간 리스트를 DB에서 조회.

            const places = resultPlaces.filter(place => 
                calculateDistance(parseFloat(lat), parseFloat(lng), place.lat, place.lng) <= parseFloat(range)
            ); // 전체 장소 중 range 내의 주차공간을 필터링.
            // 정상적으로 주차공간 응답.
            res.send({ places });
        }
    }
});
router.get('/:place_id', async (req, res, next) => {
    /*
        주차공간 리스트 요청 API(GET): /api/place/:place_id

        place_id: 상세 보기할 주차공간 id(필수)

        * 응답: place = (주차공간 Object)
        좋아요 데이터와 리뷰 데이터를 추출해야 함.
    */
   
    if (req.params === {}) {
        // 정상적으로 데이터가 넘어오지 않음.
        res.send({ msg: '정상적으로 데이터를 전송하지 않음.' });
    } else {
        const { place_id } = req.params;
        const omissionResult = omissionChecker({ place_id });
        if (!omissionResult.result) {
            // 필수 항목인 place_id가 누락됨.
            res.send({ msg: omissionResult.message });
        } else {
            const resultPlace = await Place.findOne({
                where: { place_id: parseInt(place_id) }
            }); // 주차공간을 DB에서 조회
            if (!resultPlace) {
                // 해당 주차공간 id가 DB에 없음.
                res.send({ msg: '조회할 수 없는 주차공간입니다. '});
            } else {
                // 정상적으로 주차공간 응답.
                res.send({ place: resultPlace });
                // *** 좋아요 정보, 리뷰 리스트 추가. ***
            }
        }
    }
});
router.get('/like', verifyToken, async (req, res, next) => {

});

/* UPATE */
router.put('/', async (req, res, next) => {

});

/* DELETE */
router.delete('/', async (req, res, next) => {

});

module.exports = router;
