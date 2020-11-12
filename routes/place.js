const express = require('express');
const router = express.Router();

const { Place, Review, Like, Sequelize: { Op } } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const calculateDistance = require('../lib/calculateDistance');
const foreignKeyChecker = require('../lib/foreignKeyChecker');

require('dotenv').config();

/* CREATE */
router.post('/', verifyToken, async (req, res, next) => {
    /*
        주차공간 등록 요청 API(POST): /api/place

        addr: 주차공간 주소(String, 필수)
        addr_detail: 주차공간 상세주소(String)
        addr_extra: 주차공간 여분주소(String)
        post_num: 주차공간 우편번호(String)
        lat: 주차공간의 위도(Float, 필수) => 세로
        lng: 주차공간의 경도(Float, 필수) => 가로
        place_name: 주차공간 이름(String, 필수)
        place_comment: 주차공간 설명(String, 필수)
        place_img: 주차공간 이미지([FileList], 필수)
        place_fee: 주차공간 요금 / 30분 기준(Intager, 필수)
        oper_start_time: 운영 시작 시간(DateTimeString, 필수)
        oper_end_time: 운영 종료 시간(DateTimeString, 필수)

        * 응답: success / failure
    */
    const {
        addr, addr_detail, addr_extra, post_num,
        lat, lng,
        place_name, place_comment, place_img, place_fee,
        oper_start_time, oper_end_time
    } = req.body;
    const omissionResult = omissionChecker({
        addr, lat, lng,
        place_name, place_comment, place_img, place_fee,
        oper_start_time, oper_end_time
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        try {
            const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
            const createPlace = await Place.create({
                user_id,
                addr, addr_detail, addr_extra, post_num,
                lat, lng,
                place_name, place_comment, place_img, place_fee,
                oper_start_time, oper_end_time
            }); // 주차공간 생성.
    
            if (!createPlace) {
                res.send({ msg: 'failure' });
            } else {
                res.send({ msg: 'success' });
            }
        } catch (e) {
            // DB 삽입 도중 오류 발생.
            if (e.table) {
                res.send({ msg: foreignKeyChecker(e.table) });
            } else {
                res.send({ msg: 'database error', error: e });
            }
        }
    }
});

/* READ */
router.get('/', async (req, res, next) => {
    /*
        주차공간 리스트 요청 API(GET): /api/place

        lat: 요청할 주차공간의 기준 위도(Float, 필수) => 세로
        lng: 요청할 주차공간의 기준 경도(Float, 필수) => 가로
        range: 요청할 주차공간의 거리 범위(Float, km 단위, default 값은 1000km)
        min_price: 최소 가격(Intager)
        max_price: 최대 가격(Intager)
        start_date: 입차 시각(DateTimeString)
        end_date: 출차 시각(DateTimeString)
        filter: 필터링 항목([Type Array...])

        * 응답: places = (주차공간 Array)
    */
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

        const RANGE = range ? parseFloat(range) : 1000;

        const places = resultPlaces.filter(place => 
            calculateDistance(parseFloat(lat), parseFloat(lng), place.lat, place.lng) <= RANGE
        ); // 전체 장소 중 range 내의 주차공간을 필터링.
        // 정상적으로 주차공간 응답.
        res.send({ places });
    }
});
router.get('/:place_id', async (req, res, next) => {
    /*
        주차공간 상세 정보 요청 API(GET): /api/place/:place_id

        place_id: 상세 보기할 주차공간 id(필수)

        * 응답: place = (주차공간 Object)
        좋아요 데이터와 리뷰 데이터를 추출해야 함.
    */
    const { place_id } = req.params;
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목인 place_id가 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        const placeID = parseInt(place_id);
        const resultPlace = await Place.findOne({
            where: { place_id: placeID }
        }); // 주차공간을 DB에서 조회
        if (!resultPlace) {
            // 해당 주차공간 id가 DB에 없음.
            res.send({ msg: '조회할 수 없는 주차공간입니다.' });
        } else {
            const reviews = await Review.findAll({
                where: { place_id: placeID }
            }); // 해당 주차공간의 리뷰 가져옴
            const likes = await Like.findAll({
                where: { place_id: placeID }
            }); // 해당 주차공간의 좋아요 수 가져옴
            res.send({
                place: resultPlace,
                reviews, likes: likes.length
            }); // 정상적으로 주차공간 응답.
        }
    }
});
router.get('/like', verifyToken, async (req, res, next) => {
    /*
        즐겨찾는 주차공간 리스트 요청 API(GET): /api/place/like

        { headers }: JWT_TOKEN(유저 로그인 토큰)
        filter: 필터링(현재 정체를 모르겠음.)

        * 응답: places = [주차공간 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const resultLikes = Like.findAll({
        where: { user_id }
    }); // 좋아요 한 리스트 가져옴.
    if (resultLikes.length) {
        // 좋아요를 하나 이상 했으면.
        const wherePlaceId = resultLikes.map(({ place_id }) => ({
            place_id
        })); // 좋아요 한 모든 주차공간 ID를 가져옴.
        const resultPlaces = Place.findAll({
            where: {
                [Op.or]: wherePlaceId
            }
        }); // 그 주차공간 ID를 통해 주차공간 리스트 뽑음.
        res.send({ msg: 'success', places: resultPlaces });
    } else {
        // 좋아요 한 주차공간이 없으면.
        res.send({ msg: 'success', places: [] });
    }
});
router.get('/my', verifyToken, async (req, res, next) => {
    /*
        내 주차공간 리스트 요청 API(GET): /api/place/my

        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: places = [주차공간 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const resultPlaces = Place.findAll({
        where: { user_id }
    }); // user_id에 해당하는 주차공간 리스트를 가져옴.
    res.send({ msg: 'success', places: resultPlaces });
});

/* UPDATE */
router.put('/:place_id', verifyToken, async (req, res, next) => {
    /*
        주차공간 수정 요청 API(PUT): /api/place/:place_id

        { headers }: JWT_TOKEN(유저 로그인 토큰)
        addr: 주차공간 주소(String)
        addr_detail: 주차공간 상세주소(String)
        addr_extra: 주차공간 여분주소(String)
        post_num: 주차공간 우편번호(String)
        lat: 주차공간의 위도(Float) => 세로
        lng: 주차공간의 경도(Float) => 가로
        place_name: 주차공간 이름(String)
        place_comment: 주차공간 설명(String)
        place_img: 주차공간 이미지([FileList])
        place_fee: 주차공간 요금 / 30분 기준(Intager)
        oper_start_time: 운영 시작 시간(DateTimeString)
        oper_end_time: 운영 종료 시간(DateTimeString)

        * 응답: success / failure
    */
    const { place_id } = req.params;
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목인 place_id가 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
        const placeID = parseInt(place_id);
        const existPlace = await Place.findOne({ where: {
            user_id, place_id: placeID
        }});
        if (!existPlace) {
            // 주차공간이 없으면 수정할 수 없음.
            res.send({ msg: '수정할 수 없는 주차공간입니다.' });
        } else {
            try {
                const preValue = existPlace.dataValues;
                const {
                    addr, addr_detail, addr_extra, post_num,
                    lat, lng,
                    place_name, place_comment, place_img, place_fee,
                    oper_start_time, oper_end_time
                } = req.body;
                const updatePlace = Place.update({
                    addr: addr ? addr : preValue.addr,
                    addr_detail: addr_detail ? addr_detail : preValue.addr_detail,
                    addr_extra: addr_extra ? addr_extra : preValue.addr_extra,
                    post_num: post_num ? post_num : preValue.post_num,
                    lat: lat ? lat : preValue.lat,
                    lng: lng ? lng : preValue.lng,
                    place_name: place_name ? place_name : preValue.place_name,
                    place_comment: place_comment ? place_comment : preValue.place_comment,
                    place_img: place_img ? place_img : preValue.place_img,
                    place_fee: place_fee ? place_fee : preValue.place_fee,
                    oper_start_time: oper_start_time ? oper_start_time : preValue.oper_start_time,
                    oper_end_time: oper_end_time ? oper_end_time : preValue.oper_end_time,
                }, {
                    where: { user_id, place_id: placeID }
                }); // 주차공간 수정.
                
                if (!updatePlace) {
                    res.send({ msg: 'failure' });
                } else {
                    res.send({ msg: 'success' });
                }
            } catch (e) {
                // DB 수정 도중 오류 발생.
                if (e.table) {
                    res.send({ msg: foreignKeyChecker(e.table) });
                } else {
                    res.send({ msg: 'database error', error: e });
                }
            }
        }
    }
});

/* DELETE */
router.delete('/:place_id', verifyToken, async (req, res, next) => {
    /*
        주차공간 삭제 요청 API(DELETE): /api/place/:place_id

        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: success / failure
    */
    const { place_id } = req.params;
    const omissionResult = omissionChecker({ place_id });
    if (!omissionResult.result) {
        // 필수 항목인 place_id가 누락됨.
        res.send({ msg: omissionResult.message });
    } else {
        const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
        const placeID = parseInt(place_id);
        const existPlace = await Place.findOne({ where: {
            user_id, place_id: placeID
        }});
        if (!existPlace) {
            // 주차공간이 없으면 삭제할 수 없음.
            res.send({ msg: '이미 삭제된 주차공간입니다.' });
        } else {
            try {
                const destroyPlace = await Place.destroy({
                    where: {
                        user_id,
                        place_id: placeID
                    }
                }); // 주차공간 삭제.
                if (destroyPlace) {
                    // 성공 시 상태 보냄.
                    res.send({ msg: 'success' });
                } else {
                    // 실패
                    res.send({ msg: 'failure' });
                }
            } catch (e) {
                // DB 삭제 도중 오류 발생.
                if (e.table) {
                    res.send({ msg: foreignKeyChecker(e.table) });
                } else {
                    res.send({ msg: 'database error', error: e });
                }
            }
        }
    }
});

module.exports = router;
