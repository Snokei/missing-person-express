const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tracking = sequelize.define(
  "Tracking",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },

    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },

    tracked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tracking",
    timestamps: true,
    underscored: true,
  },
);

Tracking.associate = (models) => {
  Tracking.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
};

module.exports = Tracking;
