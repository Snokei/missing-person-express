const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NotificationRecipient = sequelize.define(
  "NotificationRecipient",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    notification_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "notifications",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notification_recipients",
    timestamps: true,
    underscored: true,
    paranoid: false, // We handle soft-delete manually via deleted_at
  }
);

NotificationRecipient.associate = (models) => {
  NotificationRecipient.belongsTo(models.Notification, {
    foreignKey: "notification_id",
    as: "notification",
  });

  NotificationRecipient.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
};

module.exports = NotificationRecipient;