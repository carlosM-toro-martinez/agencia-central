const { Model, DataTypes } = require("sequelize");
const sequelize = require("../libs/dbConexionORM");
const Caja = require("./Caja");

class DenominacionCaja extends Model {}

DenominacionCaja.init(
  {
    id_denominacion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_caja: {
      type: DataTypes.INTEGER,
      references: {
        model: Caja,
        key: "id_caja",
      },
    },
    tipo_dinero: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    denominacion: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "DenominacionCaja",
    tableName: "DenominacionCaja",
    timestamps: false,
  }
);

module.exports = DenominacionCaja;
