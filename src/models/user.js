const { validate } = require("uuid")

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user",{
        id:{
            type : DataTypes.INTEGER,
            primaryKey : true,
            autoIncrement : true,
            allowNull : false,
            validate : {
                notEmpty : true,
            }
        },
        username:{
            type : DataTypes.STRING,
            unique : true,
            allowNull : false,
        },
        user_password : {
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                notEmpty : true,
            }
        }
    });
    return User;
}