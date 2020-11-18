const express = require('express');
const router = express.Router();

const multer = require('multer');

const { Place, Review, Like, Sequelize: { Op } } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const calculateDistance = require('../lib/calculateDistance');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { filesDeleter } = require('../lib/fileDeleter');



/* multer storage */
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, new Date().valueOf() + file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
    },
});
const upload = multer({ storage: storage });



/* CREATE */
router.post('/', verifyToken, upload.array('place_images'), async (req, res, next) => {
    /*
        주차공간 등록 요청 API(POST): /api/place
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        addr: 주차공간 주소(String, 필수)
        addr_detail: 주차공간 상세주소(String)
        addr_extra: 주차공간 여분주소(String)
        post_num: 주차공간 우편번호(String)
        lat: 주차공간의 위도(Float, 필수) => 세로
        lng: 주차공간의 경도(Float, 필수) => 가로
        place_name: 주차공간 이름(String, 필수)
        place_comment: 주차공간 설명(String, 필수)
        place_images: 주차공간 이미지([ImageFileList], 필수)
        place_fee: 주차공간 요금 / 30분 기준(Intager, 필수)
        oper_start_time: 운영 시작 시간(DateTimeString, 필수)
        oper_end_time: 운영 종료 시간(DateTimeString, 필수)

        * 응답: success / failure
    */
    const {
        addr, addr_detail, addr_extra, post_num,
        lat, lng,
        place_name, place_comment, place_fee,
        oper_start_time, oper_end_time
    } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const { place_images } = req.files;
    const placeImages = place_images ? place_images.map(imageObject => imageObject.path) : [];
    const omissionResult = omissionChecker({
        addr, lat, lng,
        place_name, place_comment, place_images, place_fee,
        oper_start_time, oper_end_time
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        filesDeleter(placeImages);
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const updateLat = parseFloat(lat); // float 형 변환
        const updateLng = parseFloat(lng); // float 형 변환

        const createPlace = await Place.create({
            user_id,
            addr, addr_detail, addr_extra, post_num,
            lat: updateLat, lng: updateLng,
            place_name, place_comment, place_images, place_fee,
            oper_start_time, oper_end_time
        }); // 주차공간 생성.
        if (!createPlace) {
            filesDeleter(placeImages);
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        filesDeleter(placeImages);
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
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

        * 응답: places = [주차공간 Array...]
    */
    const { lat, lng } = req.query;
    const omissionResult = omissionChecker({ lat, lng });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    const {
        range, min_price, max_price,
        start_date, end_date, filter
    } = req.query;

    try {
        const whereArray = [];
        const minPrice = parseInt(min_price); // int 형 변환
        const maxPrice = parseInt(max_price); // int 형 변환
        !isNaN(minPrice) && whereArray.push({
            place_fee: { [Op.gte]: minPrice }
        }); // 최소 가격 필터링 있으면 추가.
        !isNaN(maxPrice) && whereArray.push({
            place_fee: { [Op.lte]: maxPrice }
        }); // 최대 가격 필터링 있으면 추가.
        start_date && whereArray.push({
            oper_start_time: { [Op.gte]: start_date }
        }); // 입차 예정 시각 필터링 있으면 추가.
        end_date && whereArray.push({
            oper_end_time: { [Op.lte]: end_date }
        }); // 출차 예정 시각 필터링 있으면 추가.
        filter && Array.isArray(filter) && whereArray.push({
            [Op.or]: filter.map(f => ({ place_type: f }))
        }); // 타입 필터가 배열로 넘어오면 추가.

        const resultPlaces = await Place.findAll({
            where: { [Op.and]: whereArray }
        }); // 주차공간 리스트 조회.
        const RANGE = range ? parseFloat(range) : 1000;
        const places = resultPlaces.filter(place => 
            calculateDistance(parseFloat(lat), parseFloat(lng), place.lat, place.lng) <= RANGE
        ); // 전체 장소 중 range 내의 주차공간을 필터링.
        return res.status(200).send({ msg: 'success', places });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.get('/:place_id', async (req, res, next) => {
    /*
        주차공간 상세 정보 요청 API(GET): /api/place/:place_id
        { params: place_id }: 상세 보기할 주차공간 id
        
        * 응답:
            place = { 주차공간 상세 정보 Object }
            reviews = [주차공간의 리뷰 Array...]
		    likes = 주차공간 좋아요 수
    */
    const { place_id } = req.params;
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const place = await Place.findOne({
            where: { place_id: placeID }
        }); // 주차공간 조회.
        if (!place) {
            // 주차공간이 없으면 상세 조회할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const reviews = await Review.findAll({
            where: { place_id: placeID }
        }); // 해당 주차공간의 리뷰 가져옴.
        const likes = await Like.findAll({
            where: { place_id: placeID }
        }); // 해당 주차공간의 좋아요 수 가져옴.

        const UpdatePlaceHit = await Place.update({
            hit: place.dataValues.hit + 1
        }, {
            where: { place_id: placeID }
        }); // 주차공간 조회 수 증가.

        return res.status(200).send({ msg: 'success', place, reviews, likes: likes.length });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
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
    try {
        const resultLikes = Like.findAll({
            where: { user_id }
        }); // 좋아요 한 리스트 가져옴.
        if (resultLikes.length) {
            // 좋아요를 하나 이상 했으면.
            const wherePlaceId = resultLikes.map(({ place_id }) => ({
                place_id
            })); // 좋아요 한 모든 주차공간 ID를 가져옴.
            const places = Place.findAll({
                where: { [Op.or]: wherePlaceId }
            }); // 그 주차공간 ID를 통해 주차공간 리스트 가져옴.
            return res.status(200).send({ msg: 'success', places });
        } else {
            // 좋아요 한 주차공간이 없으면.
            return res.status(200).send({ msg: 'success', places: [] });
        }
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

router.get('/my', verifyToken, async (req, res, next) => {
    /*
        내 주차공간 리스트 요청 API(GET): /api/place/my
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: places = [주차공간 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const places = Place.findAll({
            where: { user_id }
        }); // user_id에 해당하는 주차공간 리스트를 가져옴.
        return res.status(200).send({ msg: 'success', places });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* UPDATE */
router.put('/:place_id', verifyToken, upload.array('place_images'), async (req, res, next) => {
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
        place_images: 주차공간 이미지([ImageFileList])
        place_fee: 주차공간 요금 / 30분 기준(Intager)
        oper_start_time: 운영 시작 시간(DateTimeString)
        oper_end_time: 운영 종료 시간(DateTimeString)

        * 응답: success / failure
    */
    const { place_id } = req.params;
    const {
        addr, addr_detail, addr_extra, post_num,
        lat, lng,
        place_name, place_comment, place_fee,
        oper_start_time, oper_end_time
    } = req.body;
    const { place_images } = req.files;
    const placeImages = place_images ? place_images.map(imageObject => imageObject.path) : [];
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const existPlace = await Place.findOne({
            where: { user_id, place_id: placeID }
        }); // 수정할 주차공간이 존재하는지 조회.
        if (!existPlace) {
            // 주차공간이 없으면 수정할 수 없음.
            filesDeleter(placeImages);
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const preValue = existPlace.dataValues;
        // 기존 값으로 업데이트하기 위한 객체.
        const updateLat = parseFloat(lat); // float 형 변환
        const updateLng = parseFloat(lng); // float 형 변환
        const updatePlace = Place.update({
            addr: addr ? addr : preValue.addr,
            addr_detail: addr_detail ? addr_detail : preValue.addr_detail,
            addr_extra: addr_extra ? addr_extra : preValue.addr_extra,
            post_num: post_num ? post_num : preValue.post_num,
            lat: lat ? updateLat : preValue.lat,
            lng: lng ? updateLng : preValue.lng,
            place_name: place_name ? place_name : preValue.place_name,
            place_comment: place_comment ? place_comment : preValue.place_comment,
            place_images: place_images ? place_images : preValue.place_images,
            place_fee: place_fee ? place_fee : preValue.place_fee,
            oper_start_time: oper_start_time ? oper_start_time : preValue.oper_start_time,
            oper_end_time: oper_end_time ? oper_end_time : preValue.oper_end_time,
        }, {
            where: { user_id, place_id: placeID }
        }); // 주차공간 수정.
        if (!updatePlace) {
            filesDeleter(placeImages);
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        filesDeleter(placeImages);
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});



/* DELETE */
router.delete('/:place_id', verifyToken, async (req, res, next) => {
    /*
        주차공간 삭제 요청 API(DELETE): /api/place/:place_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: place_id }: 삭제할 주차공간 id

        * 응답: success / failure
    */
    const { place_id } = req.params;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const existPlace = await Place.findOne({
            where: { user_id, place_id: placeID }
        }); // 삭제할 주차공간이 존재하는지 확인.
        if (!existPlace) {
            // 주차공간이 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }
        const deletePlace = await Place.destroy({
            where: { user_id, place_id: placeID }
        }); // 주차공간 삭제.
        if (!deletePlace) {
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(200).send({ msg: 'success' });
    } catch (e) {
        // DB 삭제 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

module.exports = router;
