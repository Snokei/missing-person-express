const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = require("./Role");
const User = require("./User");
const Tracking = require("./Tracking");
const MissingPersonModel = require("./missingPerson");
const Notification = require("./Notification");
const NotificationRecipient = require("./NotificationRecipient");

// Initialize models
const MissingPerson = MissingPersonModel(sequelize, DataTypes);

const models = {
  Role,
  User,
  MissingPerson,
  Tracking,
  Notification,
  NotificationRecipient,
};

// Run associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};
