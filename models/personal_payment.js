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
                type: DataTypes.INTEGER,
                comment: "결제 금액"
            },
            pp_receipt_price: {
                type: DataTypes.INTEGER,
                comment: "미수금액"
            },
            pp_settle_case: {
                type: DataTypes.STRING(255),
                comment: "결제 방식"
            },
            pp_bank_num: {
                type: DataTypes.INTEGER,
                comment: "은행 번호"
            },
            pp_bank_name: {
                type: DataTypes.STRING(255),
                comment: "은행 이름"
            },
            pp_bank_account: {
                type: DataTypes.STRING(255),
                comment: "계좌 번호"
            },
            pp_bank_deposit: {
                type: DataTypes.STRING(255),
                comment: "입금자 명"
            },
            pp_receipt_time: {
                type: DataTypes.DATE,
                comment: "결제 시간"
            },
            pp_ip: {
                type: DataTypes.STRING(255),
                comment: "결제 ip"
            },
            pp_cash: {
                type: DataTypes.BOOLEAN(4),
                comment: "현금 영수증 0: 발행안함, 1:소득공제, 2:지출증빙"
            },
            pp_cash_no: {
                type: DataTypes.STRING(255),
                comment: "현금 영수증 번호"
            },
            pp_cash_info: {
                type: DataTypes.TEXT,
                comment: "현금 영수증 정보"
            },
            pp_pg: {
                type: DataTypes.STRING(255),
                comment: "pg사"
            },
            pp_code: {
                type: DataTypes.STRING(255),
                comment: "결제 결과 코드"
            },
            pp_result: {
                type: DataTypes.JSON,
                comment: "결제 결과"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'personal_payment',
        },
    );
};
