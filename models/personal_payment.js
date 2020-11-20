module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'personal_payment',
        {
            ppayment_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                comment: "결제 정보 id"
            },
            method: {
                type: DataTypes.STRING(15),
                comment: "pay, cancel"
            },
            trade_no: {
                type: DataTypes.STRING(255),
                comment: "거래번호"
            },
            payment_price: {
                type: DataTypes.INTEGER,
                comment: "결제 금액"
            },
            receipt_price: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: "미수금액"
            },
            payment_type: {
                type: DataTypes.STRING(255),
                comment: "결제 방식"
            },
            bank_name: {
                type: DataTypes.STRING(255),
                comment: "은행 이름"
            },
            bank_account: {
                type: DataTypes.STRING(255),
                comment: "계좌 번호"
            },
            bank_deposit: {
                type: DataTypes.STRING(255),
                comment: "입금자 명"
            },
            payment_time: {
                type: DataTypes.DATE,
                comment: "결제 시간"
            },
            ppayment_ip: {
                type: DataTypes.STRING(255),
                comment: "결제 ip"
            },
            ppayment_cash: {
                type: DataTypes.BOOLEAN(4),
                comment: "현금 영수증 0: 발행안함, 1:소득공제, 2:지출증빙"
            },
            ppayment_cash_no: {
                type: DataTypes.STRING(255),
                comment: "현금 영수증 번호"
            },
            ppayment_cash_info: {
                type: DataTypes.TEXT,
                comment: "현금 영수증 정보"
            },
            ppayment_pg: {
                type: DataTypes.STRING(255),
                comment: "PG사"
            },
            ppayment_code: {
                type: DataTypes.STRING(255),
                comment: "결제 결과 코드"
            },
            ppayment_result: {
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
