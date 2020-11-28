const { PointLog, User } = require('../models');

/*
    결제/연장/취소 API Method를 수행한 후 그 행위에 대한 포인트를 전달하기 위해,
    공용적으로 포인트 로그를 생성하기 위한 Actions
*/

const sendDepositPoint = (user_id, prev_point, point, text) => {
    // 포인트 증감을 위한 메소드
    try {
        const updateUser = await User.update(
            { point: prev_point + point },
            { where: { user_id, email } }
        ); // 유저 포인트 수정.
        if (!updateUser) { return false; }
        const createPointLog = await PointLog.create({
            use_point: point,
            remain_point: updateUser.dataValues.point,
            point_text: text,
            use_type: false
        }); // 포인트 기록 생성.
        if (!createPointLog) { return false; }
        return true;
    } catch (e) {
        return false;
    }
}

const sendWithdrawPoint = (user_id, prev_point, point, text) => {
    // 포인트 차감을 위한 메소드
    try {
        const updateUser = await User.update(
            { point: prev_point - point },
            { where: { user_id, email } }
        ); // 유저 포인트 수정.
        if (!updateUser) { return false; }
        const createPointLog = await PointLog.create({
            user_id,
            use_point: point,
            remain_point: updateUser.dataValues.point,
            point_text: text,
            use_type: true
        }); // 포인트 기록 생성.
        if (!createPointLog) { return false; }
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    sendDepositPoint,
    sendWithdrawPoint
};