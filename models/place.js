module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'place',
        {
            place_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
                comment: "주차공간 id"
            },
            addr: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "주차공간 주소"
            },
            addr_detail: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "주차공간 상세주소"
            },
            addr_extra: {
                type: DataTypes.STRING(255),
                comment: "주차공간 여분주소"
            },
            post_num: {
                type: DataTypes.STRING(255),
                comment: "주차공간 우편번호"
            },
            lat: {
                allowNull: false,
                type: DataTypes.GEOMETRY,
                comment: "위도"
            },
            lng: {
                allowNull: false,
                type: DataTypes.GEOMETRY,
                comment: "경도"
            },
            place_name: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "주차공간 이름"
            },
            place_comment: {
                allowNull: false,
                type: DataTypes.STRING(255),
                comment: "주차공간 설명"
            },
            place_img: {
                allowNull: false,
                type: DataTypes.JSON,
                comment: "주차공간 이미지"
            },
            place_type: {
                type: DataTypes.BOOLEAN(4),
                defaultValue: 0,
                comment: "주차공간 타입 0:"
            },
            place_fee: {
                allowNull: false,
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: "주차공간 요금(30분 기준)"
            },
            oper_start_time: {
                allowNull: false,
                type: DataTypes.DATE,
                comment: "운영 시작 시간"
            },
            oper_end_time: {
                allowNull: false,
                type: DataTypes.DATE,
                comment: "운영 종료 시간"
            },
            place_status: {
                type: DataTypes.STRING(255),
            },
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'place',
        },
    );
};
