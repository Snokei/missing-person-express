module.exports = (sequelize, DataTypes) => {
  const MissingItem = sequelize.define(
    "MissingItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      case_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "missing_persons",
          key: "id",
        },
      },

      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      reporter_first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      reporter_last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      gov_card_type: {
        type: DataTypes.ENUM("aadhaar", "pan", "voter"),
        allowNull: true,
      },

      gov_card: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      item_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },

      estimated_value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      lost_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      lost_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },

      lost_location: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      landmark: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("MISSING", "FOUND", "CLOSED"),
        defaultValue: "MISSING",
      },

      attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },

      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },

      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "missing_items",
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  MissingItem.associate = (models) => {
    MissingItem.belongsTo(models.MissingPerson, {
      foreignKey: "case_id",
      as: "case",
    });

    MissingItem.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "reportedBy",
    });

    MissingItem.belongsTo(models.User, {
      foreignKey: "updated_by",
      as: "updatedBy",
    });
  };

  return MissingItem;
};