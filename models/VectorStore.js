/**
 * VectorStore Model
 *
 * Stores embeddings for MissingPerson records in PostgreSQL with pgvector.
 * This enables semantic similarity search across missing person cases.
 *
 * Note: The `embedding` column uses the `vector(768)` type from pgvector.
 * Run the SQL in `src/config/pgvector.sql` to enable the extension.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const VectorStore = sequelize.define(
  "VectorStore",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    missing_person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true, // One vector per missing person
      references: {
        model: "missing_persons",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "The formatted text representation of the missing person record",
    },
    embedding: {
      type: DataTypes.TEXT, // Stored as JSON string since Sequelize doesn't support vector type natively
      allowNull: false,
      comment: "Vector embedding as JSON array string",
    },
  },
  {
    tableName: "vector_store",
    underscored: true,
    timestamps: true,
  }
);

VectorStore.associate = (models) => {
  VectorStore.belongsTo(models.MissingPerson, {
    foreignKey: "missing_person_id",
    as: "missingPerson",
  });
};

module.exports = VectorStore;