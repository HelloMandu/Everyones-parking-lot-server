module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'notice',
        {
            notice_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "공지사항 id"
            },
            notice_title: {
                type: DataTypes.STRING(255),
                comment: "공지사항 제목"
            },
            notice_body: {
                type: DataTypes.TEXT('long'),
                comment: "공지사항 내용"
            },
            notice_img: {
                type: DataTypes.JSON,
                comment: "공지사항 첨부 이미지"
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'notice',
        },
    );
};
