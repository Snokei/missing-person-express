const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = require("./Role");
const User = require("./User");
const Tracking = require("./Tracking");
const MissingPersonModel = require("./missingPerson");
const MissingItemModel = require("./MissingItem");
const Notification = require("./Notification");
const NotificationRecipient = require("./NotificationRecipient");
const VectorStore = require("./VectorStore");

// Initialize models
const MissingPerson = MissingPersonModel(sequelize, DataTypes);
const MissingItem = MissingItemModel(sequelize, DataTypes);

const models = {
  Role,
  User,
  MissingPerson,
  MissingItem,
  Tracking,
  Notification,
  NotificationRecipient,
  VectorStore,
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
