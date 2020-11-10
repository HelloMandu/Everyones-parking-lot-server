module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'app_info',
        {
            com_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                comment: "회사 id"
            },
            com_name: {
                type: DataTypes.STRING(45),
                comment: "회사명"
            },
            ceo_name: {
                type: DataTypes.STRING(45),
                comment: "대표자명"
            },
            business_num: {
                type: DataTypes.STRING(45),
                comment: "회사사업자번호"
            },
            cybertrade_num: {
                type: DataTypes.STRING(45),
                comment: "통신판매업 신고번호"
            },
            tel: {
                type: DataTypes.STRING(45),
                comment: "회사전화번호"
            },
            fax: {
                type: DataTypes.STRING(45),
                comment: "팩스"
            },
            tax: {
                type: DataTypes.STRING(45),
                comment: "회사tax번호"
            },
            addr: {
                type: DataTypes.STRING(255),
                comment: "회사주소1"
            },
            addr_detail: {
                type: DataTypes.STRING(255),
                comment: "회사주소2"
            },
            addr_extra: {
                type: DataTypes.STRING(255),
                comment: "회사주소 참고항목"
            },
            post_num: {
                type: DataTypes.STRING(25),
                comment: "회사우편번호"
            },
            info_manager: {
                type: DataTypes.STRING(255),
                comment: "정보관리책임자명"
            },
            info_manager_email: {
                type: DataTypes.STRING(255),
                comment: "정보관리책임자 이메일"
            },
            private_policy: {
                type: DataTypes.TEXT('medium'),
                comment: "개인정보취급방침"
            },
            use_terms: {
                type: DataTypes.TEXT('medium'),
                comment: "이용약관"
            },
            version: {
                type: DataTypes.STRING(45),
                comment: "버전"
            },
            cancel_fee: {
                type: DataTypes.INTEGER,
                defaultValue: 3000,
                comment: "취소 수수료"
            },
            minimum_order: {
                type: DataTypes.INTEGER,
                defaultValue: 100000
            },
            free_cost_order: {
                type: DataTypes.INTEGER,
                defaultValue: 200000
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'app_info',
        },
    );
};
