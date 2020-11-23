module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'extension_order',
        {
            extension_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "연장 주문 번호"
            },
            extension_price: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "결제금액"
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
            extension_start_time: {
                type: DataTypes.DATE,
                comment: "연장 시작 시간"
            },
            extension_end_time: {
                type: DataTypes.DATE,
                comment: "연장 종료 시간"
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
            tableName: 'extension_order',
        },
    );
};
