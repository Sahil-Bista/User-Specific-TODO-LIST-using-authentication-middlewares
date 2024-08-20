const { type } = require("os");
const { DataTypes } = require("sequelize");

module.exports = (sequelize,DataTypes) =>{
    const todo = sequelize.define("todo",{
        id:{
            type : DataTypes.INTEGER,
            primaryKey : true,
            autoIncrement : true,
            allowNull : false,
            validate : {
                notEmpty : true,
            }
        },
        todo_task:{
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                notEmpty : true,
            }
        },
        user_id: { // Foreign key
            type: DataTypes.INTEGER,
            references: {
                model: 'users', 
                key: 'id' // The key in the referenced model
            },
        }
    });
    return todo;
}