const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const {
  VALID_NOTIFICATION_TYPES,
  VALID_NOTIFICATION_PRIORITIES,
} = require("../utils/notificationConstants");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [VALID_NOTIFICATION_TYPES],
      },
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NORMAL",
      validate: {
        isIn: [VALID_NOTIFICATION_PRIORITIES],
      },
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  }
);

Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });

  Notification.hasMany(models.NotificationRecipient, {
    foreignKey: "notification_id",
    as: "recipients",
  });
};

module.exports = Notification;