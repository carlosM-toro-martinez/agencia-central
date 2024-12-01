const Lote = require("../models/Lote");
const Producto = require("../models/Producto");
const MetodoVenta = require("../models/MetodoVenta");

class servicesLote {
  constructor() {
    this.sesion = {};
  }

  // Método GET para obtener todos los lotes

  async getAllLotes() {
    try {
      const lotes = await Lote.findAll({
        include: [
          {
            model: Producto,
            as: "producto",
            attributes: [
              "nombre",
              "codigo_barra",
              "precio",
              "stock",
              "peso",
              "subCantidad",
            ],
            include: {
              model: MetodoVenta,
              as: "metodosVenta",
              attributes: [
                "id_metodo_venta",
                "descripcion",
                "cantidad_por_metodo",
                "precio",
              ],
            },
          },
        ],
      });
      return lotes;
    } catch (error) {
      console.error("Error fetching all lotes:", error);
      throw error;
    }
  }

  // Método GET para obtener un lote por id_lote
  async getLote(id_lote) {
    try {
      const lote = await Lote.findByPk(id_lote);
      if (!lote) {
        throw new Error(`Lote with ID ${id_lote} not found`);
      }
      return lote;
    } catch (error) {
      console.error("Error fetching lote:", error);
      throw error;
    }
  }

  // Método POST para crear un nuevo lote
  async createLote(data) {
    try {
      const newLote = await Lote.create(data);
      return newLote;
    } catch (error) {
      console.error("Error creating lote:", error);
      throw error;
    }
  }

  // Método PUT para actualizar un lote por id_lote
  async updateLote(id_lote, data) {
    try {
      const lote = await Lote.findByPk(id_lote);
      if (!lote) {
        throw new Error(`Lote with ID ${id_lote} not found`);
      }
      await lote.update(data);
      return lote;
    } catch (error) {
      console.error("Error updating lote:", error);
      throw error;
    }
  }

  // Método DELETE para eliminar un lote por id_lote
  async deleteLote(id_lote) {
    try {
      const lote = await Lote.findByPk(id_lote);
      if (!lote) {
        throw new Error(`Lote with ID ${id_lote} not found`);
      }
      await lote.destroy();
      return { message: "Lote deleted successfully" };
    } catch (error) {
      console.error("Error deleting lote:", error);
      throw error;
    }
  }
}

module.exports = servicesLote;
