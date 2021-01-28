const express = require('express');
const router = express.Router();

const multer = require('multer');

const { User, Place, Review, Like, Sequelize: { Op }, RentalOrder } = require('../models');

const verifyToken = require('./middlewares/verifyToken');
const omissionChecker = require('../lib/omissionChecker');
const calculateDistance = require('../lib/calculateDistance');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const updateObjectChecker = require('../lib/updateObjectChecker');
const { isValidDataType } = require('../lib/formatChecker');
const { filesDeleter } = require('../lib/fileDeleter');
const timeFormatter = require('../lib/timeFormatter');

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
        place_type: 주차공간 타입(Integer, 필수, 주차공간 타입 = 0: 주차타운, 1: 지하주차장, 2: 지상주차장, 3: 지정주차)
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
        place_type, place_name, place_comment, place_fee,
        oper_start_time, oper_end_time
    } = req.body;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    const place_images = req.files;
    /* request 데이터 읽어 옴. */
    const placeImages = place_images ? place_images.map(imageObject => imageObject.path) : [];
    const omissionResult = omissionChecker({
        addr, addr_detail, lat, lng,
        place_type, place_name, place_comment, place_images, place_fee,
        oper_start_time, oper_end_time
    });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        filesDeleter(placeImages);
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const insertLat = parseFloat(lat); // float 형 변환
        const insertLng = parseFloat(lng); // float 형 변환
        const placeType = parseInt(place_type); // int 형 변환
        const placeFee = parseInt(place_fee); // int 형 변환
        const operStartTime = timeFormatter(new Date(oper_start_time)); // Date 형 변환
        const operEndTime = timeFormatter(new Date(oper_end_time)); // Date 형 변환
        const validDataType = isValidDataType({
            lat: insertLat, lng: insertLng,
            place_fee: placeFee,
            oper_start_time: operStartTime, oper_end_time: operEndTime
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        const diffTime = operEndTime.getTime() - operStartTime.getTime(); // 두 시간의 차이를 구함.
        if (diffTime < 0) {
            // 운영 종료 시간이 운영 시작 시간보다 앞이면 오류.
            return res.status(202).send({ msg: '잘못 설정된 운영 시간입니다.' });
        }

        const createPlace = await Place.create({
            user_id,
            addr, addr_detail, addr_extra, post_num,
            lat: insertLat, lng: insertLng,
            place_type: placeType, place_name, place_comment, place_images: placeImages, place_fee: placeFee,
            oper_start_time: operStartTime, oper_end_time: operEndTime
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

        lat: 요청할 주차공간의 기준 위도(Float, 필수)
        lng: 요청할 주차공간의 기준 경도(Float, 필수)
        range: 요청할 주차공간의 거리 범위(Float, 필수)
        // min_price: 최소 가격(Intager)
        // max_price: 최대 가격(Intager)
        // start_date: 입차 시각(DateTimeString)
        // end_date: 출차 시각(DateTimeString)
        filter: 필터링 항목([Type Array...])

        * 응답: places = [주차공간 Array...]
    */
    const {
        lat, lng,
        // min_price, max_price,
        // start_date, end_date,
        range, filter
    } = req.query;
    /* request 데이터 읽어 옴. */
    const omissionResult = omissionChecker({ lat, lng });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const searchLat = parseFloat(lat); // float 형 변환
        const searchLng = parseFloat(lng); // float 형 변환
        const searchRange = parseFloat(range); // float 형 변환
        const validDataType = isValidDataType({
            range: searchRange, lat: searchLat, lng: searchLng,
        }); // 데이터 형식 검사.
        if (!validDataType.result) {
            // 데이터의 형식이 올바르지 않음.
            return res.status(202).send({ msg: validDataType.message });
        }
        
        const whereArray = []; // 검색 식 배열

        /*
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
        */
        filter && Array.isArray(filter) && whereArray.push({
            [Op.or]: filter.map(f => ({ place_type: parseInt(f) }))
        }); // 타입 필터가 배열로 넘어오면 추가.

        if (!Array.isArray(filter) || filter.length === 0) {
            // 필터링 항목이 없으면 반환 배열 0
            return res.status(200).send({ msg: 'success', places: [] });
        }

        const resultPlaces = await Place.findAll({
            where: { [Op.and]: whereArray }
        }); // 주차공간 리스트 조회.
        const places = resultPlaces.filter(place => 
            calculateDistance(searchLat, searchLng, place.lat, place.lng) <= searchRange
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

router.get('/like', verifyToken, async (req, res, next) => {
    /*
        즐겨찾는 주차공간 리스트 요청 API(GET): /api/place/like
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        filter: 필터링(현재 정체를 모르겠음.)

        * 응답: places = [주차공간 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const resultLikes = await Like.findAll({
            where: { user_id },
            include: [{ model: Place }],
            order: [['createdAt', 'DESC']]
        }); // 좋아요 한 주차공간 리스트 가져옴.
        return res.status(200).send({ msg: 'success', places: resultLikes });
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
    /* request 데이터 읽어 옴. */
    try {
        const now = new Date();
        const places = await Place.findAll({
            where: { user_id },
            order: [['createdAt', 'DESC']],
            include: [{
                model: RentalOrder,
                where: {
                    rental_start_time: {
                        [Op.lte]: now
                    }, // 현재 시간 >= 대여 시작 시간
                    rental_end_time: {
                        [Op.gte]: now
                    } // 현재 시간 <= 대여 종료 시간
                }, // 이 식이 일치하면 현재 대여 중임.
                required: false
            }]
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

router.get('/recently', verifyToken, async (req, res, next) => {
    /*
        최근 이용 주차공간 리스트 요청 API(GET): /api/place/recently
        { headers }: JWT_TOKEN(유저 로그인 토큰)

        * 응답: places = [주차공간 Array...]
    */
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    try {
        const places = await RentalOrder.findAll({
            where: { user_id },
            order: [['createdAt', 'DESC']],
            attributes: ['rental_id'],
            include: [{ model: Place }]
        }); // user_id에 해당하는 최근 이용 주차공간 리스트를 가져옴.
        return res.status(200).send({ msg: 'success', places });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        console.log(e);
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
    /* request 데이터 읽어 옴. */
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
            where: { place_id: placeID },
            include: [{ model: User }]
        }); // 해당 주차공간의 리뷰 가져옴.
        const likes = await Like.findAll({
            where: { place_id: placeID },
            order: [['createdAt', 'DESC']]
        }); // 해당 주차공간의 좋아요 수 가져옴.

        await place.increment('hit'); // 주차공간 조회 수 증가
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


/* UPDATE */
router.put('/:place_id', verifyToken, upload.array('place_images'), async (req, res, next) => {
    /*
        주차공간 수정 요청 API(PUT): /api/place/:place_id
        { headers }: JWT_TOKEN(유저 로그인 토큰)
        { params: place_id } 수정할 주차공간 id

        addr: 주차공간 주소(String)
        addr_detail: 주차공간 상세주소(String)
        addr_extra: 주차공간 여분주소(String)
        post_num: 주차공간 우편번호(String)
        lat: 주차공간의 위도(Float)
        lng: 주차공간의 경도(Float)
        place_type: 주차공간 타입(String, 주차공간 타입 = 0: 주차타운, 1: 지하주차장, 2: 지상주차장, 3: 지정주차)
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
        place_type, place_name, place_comment, place_fee,
        oper_start_time, oper_end_time
    } = req.body;
    const place_images = req.files;
    const { user_id } = req.decodeToken; // JWT_TOKEN에서 추출한 값 가져옴
    /* request 데이터 읽어 옴. */
    const placeImages = place_images ? place_images.map(imageObject => imageObject.path) : null;
    try {
        const placeID = parseInt(place_id); // int 형 변환
        const updateLat = parseFloat(lat); // float 형 변환
        const updateLng = parseFloat(lng); // float 형 변환
        const placeType = parseInt(place_type); // int 형 변환
        const placeFee = parseInt(place_fee); // int 형 변환
        const operStartTime = timeFormatter(new Date(oper_start_time)); // Date 형 변환
        const operEndTime = timeFormatter(new Date(oper_end_time)); // Date 형 변환

        const existPlace = await Place.findOne({
            where: { user_id, place_id: placeID }
        }); // 수정할 주차공간이 존재하는지 조회.
        if (!existPlace) {
            // 주차공간이 없으면 수정할 수 없음.
            filesDeleter(placeImages);
            return res.status(202).send({ msg: '조회할 수 없는 주차공간입니다.' });
        }

        if (!isNaN(operStartTime) && !isNaN(operEndTime)) {
            // 운영 시간을 설정했을 때,
            const diffTime = operEndTime.getTime() - operStartTime.getTime(); // 두 시간의 차이를 구함.
            if (diffTime < 0) {
                // 운영 종료 시간이 운영 시작 시간보다 앞이면 오류.
                return res.status(202).send({ msg: '잘못 설정된 운영 시간입니다.' });
            }   
        }
        
        const updatePlace = await Place.update(updateObjectChecker({
            addr, addr_detail, addr_extra, post_num,
            lat: updateLat, lng: updateLng,
            place_type: placeType, place_name, place_comment, place_images: placeImages, place_fee: placeFee,
            oper_start_time: operStartTime, oper_end_time: operEndTime,
        }), {
            where: { user_id, place_id: placeID }
        }); // 주차공간 수정.
        if (!updatePlace) {
            filesDeleter(placeImages);
            return res.status(202).send({ msg: 'failure' });
        }
        const { place_images: prev_place_images } = existPlace.dataValues;
        filesDeleter(prev_place_images); // 주차 공간 이미지 제거
        await existPlace.reload();
        return res.status(201).send({ msg: 'success', place: existPlace });
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
    /* request 데이터 읽어 옴. */
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
        filesDeleter(existPlace.dataValues.place_images);
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
