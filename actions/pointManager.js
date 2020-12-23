const { PointLog, User } = require('../models');

/*
    결제/연장/취소 API Method를 수행한 후 그 행위에 대한 포인트를 전달하기 위해,
    공용적으로 포인트 로그를 생성하기 위한 Actions
*/

const sendDepositPoint = async (user_id, point, text) => {
    // 포인트 증감을 위한 메소드
    try {
        const existUser = await User.findOne(
            { where: { user_id } }
        ); // 유저 포인트 수정.
        if (!existUser) { return false; }
        await existUser.increment('point', { by: point });
        await existUser.reload();
        const createPointLog = await PointLog.create({
            user_id,
            use_point: point,
            remain_point: existUser.dataValues.point,
            point_text: text,
            use_type: false
        }); // 포인트 기록 생성.
        if (!createPointLog) { return false; }
        return true;
    } catch (e) {
        return false;
    }
}

const sendWithdrawPoint = async (user_id, point, text) => {
    // 포인트 차감을 위한 메소드
    try {
        const existUser = await User.findOne(
            { where: { user_id } }
        ); // 유저 포인트 수정.
        if (!existUser) { return false; }
        await existUser.decrement('point', { by: point });
        await existUser.reload();
        const createPointLog = await PointLog.create({
            user_id,
            use_point: point,
            remain_point: existUser.dataValues.point,
            point_text: text,
            use_type: true
        }); // 포인트 기록 생성.
        if (!createPointLog) { return false; }
        return createPointLog;
    } catch (e) {
        return false;
    }
}

module.exports = {
    sendDepositPoint,
    sendWithdrawPoint
};