module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'admin',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            is_super: {
                type: DataTypes.BOOLEAN(1),
                defaultValue: '0',
                allowNull: false,
            },
            remember_token: {
                type: DataTypes.STRING(100),
            },
            auth_token: {
                type: DataTypes.STRING(255),
            },
            auth_token_created_at: {
                type: DataTypes.DATE,
            },
    
        },
        {
            timestamps: true,
            underscored: true,
            tableName: 'admin',
        },
    );
};
