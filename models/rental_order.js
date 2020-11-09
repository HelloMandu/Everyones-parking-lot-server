module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'rental_order',
        {
            rental_id: {
                type: DataTypes.STRING(45),
                allowNull: false,
                primaryKey: true,
                comment: "대여 주문 번호"
            },
            order_user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "대여 신청 유저 id"
            },
            place_user_id: {
                type: DataTypes.INTEGER,
                comment: "주차공간 보유 유저 id"
            },
            place_id: {
                type: DataTypes.INTEGER,
                comment: "주차공간 id"
            },
            cp_id: {
                type: DataTypes.STRING(255),
                comment: "쿠폰 id"
            },
            total_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "전체 금액"
            },
            term_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "기간금액"
            },
            deposit: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "보증 금액"
            },
            point_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "포인트 할인금액"
            },
            payment_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "결제금액"
            },
            cancle_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                comment: "취소금액"
            },
            calculated_price: {
                type: DataTypes.DOUBLE,
                defaultValue: 0.00,
                comment: "정산 금액"
            },
            payment_type: {
                type: DataTypes.STRING(255),
                comment: "결제방식"
            },
            order_status: {
                type: DataTypes.STRING(255),
                comment: "입금대기(주문접수): deposit_wait / 주문취소: order_cancel / 배송중: shipping / 배송완료 : place_complete / 정산완료: order_complete"
            },
            trade_no: {
                type: DataTypes.STRING(255),
                comment: "거래번호"
            },
            payment_time: {
                type: DataTypes.Date,
                comment: "결제시간"
            },
            rental_start_time: {
                type: DataTypes.Date,
                comment: "대여 시작 시간"
            },
            rental_end_time: {
                type: DataTypes.Date,
                comment: "대여 종료 시간"
            },
            cancel_time: {
                type: DataTypes.Date,
                comment: "취소시간"
            },
            calculated_time: {
                type: DataTypes.Date,
                comment: "정산시간"
            },
            cancel_reason: {
                type: DataTypes.Date,
                comment: "취소 사유"
            },
            pg: {
                type: DataTypes.Date,
                comment: "PG사"
            },
            pg_result: {
                type: DataTypes.Date,
                comment: "PG 결과"
            },
            deleted: {
                type: DataTypes.Date,
                comment: "0: 정상, 1: 삭제됨"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'rental_order',
        },
    );
};
