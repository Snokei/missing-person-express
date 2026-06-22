module.exports = (sequelize, DataTypes) => {
  const MissingPerson = sequelize.define(
    "MissingPerson",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      case_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      photo_url: {
        type: DataTypes.TEXT,
      },

      // Person Details
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      last_name: {
        type: DataTypes.STRING,
      },

      gender: {
        type: DataTypes.STRING,
      },

      age: {
        type: DataTypes.INTEGER,
      },

      language_spoken: {
        type: DataTypes.STRING,
      },

      height: {
        type: DataTypes.STRING,
      },

      weight: {
        type: DataTypes.STRING,
      },

      medical_condition: {
        type: DataTypes.TEXT,
      },

      identification_mark: {
        type: DataTypes.TEXT,
      },

      // Reporter Details
      reporter_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      mobile_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      alternative_number: {
        type: DataTypes.STRING,
      },

      relationship: {
        type: DataTypes.STRING,
      },

      address: {
        type: DataTypes.TEXT,
      },

      // Last Seen Details
      last_seen_date: {
        type: DataTypes.DATEONLY,
      },

      last_seen_time: {
        type: DataTypes.TIME,
      },

      last_seen_location: {
        type: DataTypes.STRING,
      },

      circumstances: {
        type: DataTypes.TEXT,
      },

      status: {
        type: DataTypes.STRING,
        defaultValue: "Missing",
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "missing_persons",
      underscored: true,
      timestamps: true,
    },
  );

  MissingPerson.associate = (models) => {
    MissingPerson.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator",
    });
  };

  return MissingPerson;
};
