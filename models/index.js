const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = require("./Role");
const User = require("./User");
const MissingPersonModel = require("./missingPerson");

// Initialize models
const MissingPerson = MissingPersonModel(sequelize, DataTypes);

const models = {
  Role,
  User,
  MissingPerson,
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
