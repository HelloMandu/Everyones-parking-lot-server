const express = require('express');
const multer = require('multer');
const router = express.Router();

const { Event } = require('../models');

const omissionChecker = require('../lib/omissionChecker');
const foreignKeyChecker = require('../lib/foreignKeyChecker');
const { fileDeleter, filesDeleter } = require('../lib/fileDeleter');
const updateObjectChecker = require('../lib/updateObjectChecker');



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
router.post('/', upload.fields([{ name: 'event_banner_image', maxCount: 1 }, { name: 'event_detail_images' }]), async (req, res, next) => {
    /*
        이벤트 작성 요청 API(POST): /api/event

        event_banner_image: 이벤트 배너 이미지(ImageFile, 필수)
        event_detail_images: 이벤트 상세 이미지([ImageFileList])
        event_title: 이벤트 제목(String, 필수)
        event_body: 이벤트 내용(String)
        warm: 이벤트 경고 텍스트(String)
        start_date: 이벤트 시작 일자(DateString, 필수)
        end_date: 이벤트 종료 일자(DateString, 필수)
    
        * 응답: success / failure
    */
    const { event_title, event_body, warm, start_date, end_date } = req.body;
    const { event_banner_image, event_detail_images } = req.files;
    /* request 데이터 읽어 옴. */
    const eventBannerImage = event_banner_image ? event_banner_image.map(imageObject => imageObject.path)[0] : null;
    const eventDetailImages = event_detail_images ? event_detail_images.map(imageObject => imageObject.path) : null;
    const omissionResult = omissionChecker({ event_banner_image, event_title, start_date, end_date });
    if (!omissionResult.result) {
        // 필수 항목이 누락됨.
        fileDeleter(eventBannerImage);
        filesDeleter(eventDetailImages);
        // 실패이므로 업로드 한 파일 삭제.
        return res.status(202).send({ msg: omissionResult.message });
    }
    try {
        const createEvent = await Event.create({
            event_banner_image: eventBannerImage,
            event_detail_images: eventDetailImages,
            event_title, event_body,
            warm, start_date, end_date
        }); // 이벤트 생성.
        if (!createEvent) {
            fileDeleter(eventBannerImage);
            filesDeleter(eventDetailImages);
            // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: 'failure' });
        }
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 삽입 도중 오류 발생.
        fileDeleter(eventBannerImage);
        filesDeleter(eventDetailImages);
        // 실패이므로 업로드 한 파일 삭제.
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
        이벤트 리스트 요청 API(GET): /api/event

        * 응답: events = [이벤트 Array...]
    */
    try {
        const events = await Event.findAll({
            order: [['createdAt', 'DESC']]
        }); // 이벤트 리스트 조회.
        return res.status(200).send({ msg: 'success', events });
    } catch (e) {
        // DB 조회 도중 오류 발생.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
})
router.get('/:event_id', async (req, res, next) => {
    /*
        이벤트 상세 정보 요청 API(GET): /api/event/:event_id
        { params: evnet_id }: 상세 정보를 가져올 이벤트 id

        * 응답: event = { 이벤트 상세 정보 Object }
    */
    const { event_id } = req.params;
    /* request 데이터 읽어 옴. */
    try {
        const eventID = parseInt(event_id) // int 형 변환
        const event = await Event.findOne({
            where: { event_id: eventID }
        }); // 이벤트 상세 정보 조회.
        if (!event) {
            // 해당 이벤트 id가 DB에 없음.
            return res.status(202).send({ msg: '조회할 수 없는 이벤트입니다.' });
        }

        await event.increment('hit', { by: 1 }); // 이벤트 조회 수 증가.
        return res.status(200).send({ msg: 'success', event });
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
router.put('/:event_id', upload.fields([{ name: 'event_banner_image', maxCount: 1 }, { name: 'event_detail_images' }]), async (req, res, next) => {
    /*
        이벤트 수정 요청 API(PUT): /api/event/:event_id
        { params: event_id }: 수정할 이벤트 id

        event_banner_image: 이벤트 배너 이미지(ImageFile)
        event_detail_images: 이벤트 상세 이미지([ImageFileList])
        event_title: 이벤트 제목(String)
        event_body: 이벤트 내용(String)
        warm: 이벤트 경고 텍스트(String)
        start_date: 이벤트 시작 일자(DateString)
        end_date: 이벤트 종료 일자(DateString)

        * 응답: success / failure
    */
    const { event_id } = req.params;
    const { event_title, event_body, warm, start_date, end_date } = req.body;
    const { event_banner_image, event_detail_images } = req.files;
    /* request 데이터 읽어 옴. */
    const eventBannerImage = event_banner_image ? event_banner_image.map(imageObject => imageObject.path)[0] : null;
    const eventDetailImages = event_detail_images ? event_detail_images.map(imageObject => imageObject.path) : null;
    try {
        const eventID = parseInt(event_id); // int 형 변환
        const existEvent = await Event.findOne({ where: {
            event_id: eventID
        }}); // 수정할 이벤트가 존재하는지 확인.
        if (!existEvent) {
            // 이벤트가 없으면 수정할 수 없음.
            fileDeleter(eventBannerImage);
            filesDeleter(eventDetailImages);
            // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: '조회할 수 없는 이벤트입니다.' });
        } 
        const preValue = existEvent.dataValues;
        // 기존 값으로 업데이트하기 위한 객체.
        const updateEvent = Event.update(updateObjectChecker({
            event_banner_image: eventBannerImage,
            event_detail_images: eventDetailImages,
            event_title, event_body, warm,
            start_date, end_date
        }), {
            where: { event_id: eventID }
        }); // 이벤트 수정.
        if (!updateEvent) {
            fileDeleter(eventBannerImage);
            filesDeleter(eventDetailImages);
            // 실패이므로 업로드 한 파일 삭제.
            return res.status(202).send({ msg: 'failure' });
        }
        if (event_banner_image) fileDeleter(preValue.event_banner_image); // 배너 이미지가 바꼈으면 이전 이미지 삭제.
        if (event_detail_images) filesDeleter(preValue.event_detail_images); // 상세 이미지가 바꼈으면 이전 이미지 삭제.
        return res.status(201).send({ msg: 'success' });
    } catch (e) {
        // DB 수정 도중 오류 발생.
        fileDeleter(eventBannerImage);
        filesDeleter(eventDetailImages);
        // 실패이므로 업로드 한 파일 삭제.
        if (e.table) {
            return res.status(202).send({ msg: foreignKeyChecker(e.table) });
        } else {
            return res.status(202).send({ msg: 'database error', error: e });
        }
    }
});

/* DELETE */
router.delete('/:event_id', async (req, res, next) => {
    /*
        이벤트 삭제 요청 API(DELETE): /api/event/:event_id
        { params: event_id }: 삭제할 이벤트 id

        * 응답: success / failure
    */
    const { event_id } = req.params;
    /* request 데이터 읽어 옴. */
    try {
        const eventID = parseInt(event_id); // int 형 변환
        const existEvent = await Event.findOne({ where: {
            event_id: eventID
        }}); // 삭제할 이벤트가 존재하는지 확인.
        if (!existEvent) {
            // 이벤트가 없으면 삭제할 수 없음.
            return res.status(202).send({ msg: '조회할 수 없는 이벤트입니다.' });
        }
        const deleteEvent = await Event.destroy({
            where: { event_id: eventID }
        }); // 이벤트 삭제.
        if (!deleteEvent) {
            return res.status(202).send({ msg: 'failure' });
        }
        
        const { event_banner_image, event_detail_images } = existEvent.dataValues;
        fileDeleter(event_banner_image); // 배너 이미지 제거
        filesDeleter(event_detail_images); // 상세 이미지 제거
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