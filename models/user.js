module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user', {
        user_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        email: {
            type: DataTypes.STRING(255),
            unique: true,
            allowNull: false
        },
        email_verified_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        phone_number: {
            type: DataTypes.STRING(12),
            allowNull: false
        },
        birth: {
            type: DataTypes.DATE,
            allowNull: false
        },
        car_location: {
            type: DataTypes.STRING(20),
        },
        car_num: {
            type: DataTypes.STRING(20),
        },
        car_img: {
            type: DataTypes.JSON,
        },
        profile_img: {
            type: DataTypes.JSON,
        },
        agree_mail: {
            type: DataTypes.BOOLEAN(4)
        },
        agree_sms: {
            type: DataTypes.BOOLEAN(4)
        },
        point: {
            type: DataTypes.INTEGER.UNSIGNED
        },
        level: {
            type: DataTypes.INTEGER
        },
        register_type: {
            type: DataTypes.STRING(150)
        },
        native_token: {
            type: DataTypes.STRING(255)
        }
    }, {
        timestamps: true,
        underscored: true,
        tableName: 'user'
    })
}