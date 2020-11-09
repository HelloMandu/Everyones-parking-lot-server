module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'personal_payment',
        {
            pp_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                comment: "결제 정보 id"
            },
            user_id: {
                type: DataTypes.INTEGER,
                comment: "결제 유저 id"
            },
            rental_id: {
                type: DataTypes.STRING(45),
                comment: "결제 대여 주문 번호"
            },
            extension_id: {
                type: DataTypes.STRING(45),
                comment: "결제 연장 주문 번호"
            },
            pp_method: {
                type: DataTypes.STRING(255),
                comment: "pay, cancel"
            },
            pp_trade_no: {
                type: DataTypes.STRING(255),
                comment: "거래번호"
            },
            pp_price: {
                type: DataTypes.DATE,
                allowNull: false,
                comment: "생년월일"
            },
            pp_receipt_price: {
                type: DataTypes.STRING(20),
                comment: "차량 등록 지역"
            },
            pp_settle_case: {
                type: DataTypes.STRING(20),
                allowNull: false,
                comment: "차량 등록 번호"
            },
            pp_bank_num: {
                type: DataTypes.JSON,
                allowNull: false,
                comment: "차량 이미지"
            },
            pp_bank_name: {
                type: DataTypes.JSON,
                comment: "프로필 이미지"
            },
            pp_bank_account: {
                type: DataTypes.BOOLEAN(4),
                comment: "0: 거부, 1: 동의"
            },
            pp_bank_deposit: {
                type: DataTypes.BOOLEAN(4),
                comment: "0: 거부, 1: 동의"
            },
            pp_receipt_time: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "포인트"
            },
            pp_cash: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                comment: "10: 관리자, 1: 유저"
            },
            pp_cash_no: {
                type: DataTypes.STRING(150),
            },
            pp_cash_info: {
                type: DataTypes.STRING(255),
            },
            pp_pg: {
                type: DataTypes.STRING(255),
            },
            pp_code: {
                type: DataTypes.STRING(255),
            },
            pp_result: {
                type: DataTypes.STRING(255),
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'personal_payment',
        },
    );
};
