module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'rental_order',
        {
            rental_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "대여 주문 번호"
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
                type: DataTypes.DOUBLE.UNSIGNED,
                defaultValue: 0.00,
                comment: "정산 금액"
            },
            payment_type: {
                type: DataTypes.INTEGER,
                comment: "결제 수단"
            },
            rental_start_time: {
                type: DataTypes.DATE,
                comment: "대여 시작 시간"
            },
            rental_end_time: {
                type: DataTypes.DATE,
                comment: "대여 종료 시간"
            },
            cancel_reason: {
                type: DataTypes.STRING(255),
                comment: "취소 사유"
            },
            cancel_time: {
                type: DataTypes.DATE,
                comment: "취소시간"
            },
            calculated_time: {
                type: DataTypes.DATE,
                comment: "정산시간"
            },
            deleted: {
                type: DataTypes.BOOLEAN,
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
