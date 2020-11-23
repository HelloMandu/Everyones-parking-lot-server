module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'notice',
        {
            notice_id: {
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
                comment: "공지사항 id"
            },
            notice_title: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "공지사항 제목"
            },
            notice_body: {
                type: DataTypes.TEXT('long'),
                comment: "공지사항 내용"
            },
            notice_images: {
                type: DataTypes.JSON,
                comment: "공지사항 첨부 이미지"
            },
            hit: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "조회 수"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
