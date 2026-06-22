// src/models/Role.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
    underscored: true,
  },
);

Role.associate = (models) => {
  Role.hasMany(models.User, {
    foreignKey: "role_id",
    as: "users",
  });
};

module.exports = Role;
