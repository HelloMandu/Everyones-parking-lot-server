module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'event',
        {
            event_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: "이벤트 id"
            },
            event_banner_image: {
                type: DataTypes.JSON,
                comment: "이미지 배너 이미지"
            },
            event_detail_images: {
                type: DataTypes.JSON,
                comment: "이벤트 상세 이미지"
            },
            event_title: {
                type: DataTypes.TEXT('medium'),
                comment: "이벤트 제목"
            },
            event_body: {
                type: DataTypes.TEXT('medium'),
                comment: "이벤트 내용"
            },
            warn: {
                type: DataTypes.TEXT('medium'),
                comment: "이벤트 경고 텍스트"
            },
            hit: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "조회 수"
            },
            start_date: {
                type: DataTypes.DATE,
                comment: "이벤트 시작 일자"
            },
            end_date: {
                type: DataTypes.DATE,
                comment: "이벤트 종료 일자"
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    );
};
