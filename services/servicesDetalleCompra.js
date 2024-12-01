const DetalleCompra = require("../models/DetalleCompra");
const Lote = require("../models/Lote");
const Producto = require("../models/Producto");
const Proveedor = require("../models/Proveedor");

class servicesDetalleCompra {
  constructor() {
    this.sesion = {};
  }

  // Método GET para obtener todos los detalles de compra
  async getAllDetallesCompra() {
    try {
      const detallesCompra = await DetalleCompra.findAll();
      return detallesCompra;
    } catch (error) {
      console.error("Error fetching all detalles de compra:", error);
      throw error;
    }
  }

  async getDetallesCompraByLote(numeroLote) {
    try {
      const detallesCompra = await Lote.findAll({
        where: { numero_lote: numeroLote },
        include: [
          {
            model: Producto,
            as: "producto",
            attributes: ["nombre", "id_producto"],
          },
          {
            model: DetalleCompra,
            as: "detalleCompra",
            include: [
              {
                model: Proveedor,
                as: "proveedor",
                attributes: ["nombre", "id_proveedor"],
              },
            ],
            attributes: ["precio_unitario"],
          },
        ],
        attributes: [
          "id_lote",
          "numero_lote",
          "fecha_caducidad",
          "cantidad",
          "peso",
          "subCantidad",
        ],
      });

      return detallesCompra;
    } catch (error) {
      console.error("Error fetching detalles de compra by lote:", error);
      throw error;
    }
  }

  async getDetalleCompra(id_detalle) {
    try {
      const detalleCompra = await DetalleCompra.findByPk(id_detalle);
      if (!detalleCompra) {
        throw new Error(`DetalleCompra with ID ${id_detalle} not found`);
      }
      return detalleCompra;
    } catch (error) {
      console.error("Error fetching detalle de compra:", error);
      throw error;
    }
  }

  async createDetalleCompra(data) {
    try {
      if (!data.id_producto) {
        throw new Error(
          "El campo 'id_producto' es obligatorio y debe ser un número válido."
        );
      }
      const newDetalleCompra = await DetalleCompra.create(data);
      return newDetalleCompra;
    } catch (error) {
      console.error("Error creating detalle de compra:", error);
      throw error;
    }
  }

  async updateDetalleCompra(id_detalle, data) {
    try {
      const detalleCompra = await DetalleCompra.findByPk(id_detalle);
      if (!detalleCompra) {
        throw new Error(`DetalleCompra with ID ${id_detalle} not found`);
      }
      await detalleCompra.update(data);
      return detalleCompra;
    } catch (error) {
      console.error("Error updating detalle de compra:", error);
      throw error;
    }
  }

  async deleteDetalleCompra(id_detalle) {
    try {
      const detalleCompra = await DetalleCompra.findByPk(id_detalle);
      if (!detalleCompra) {
        throw new Error(`DetalleCompra with ID ${id_detalle} not found`);
      }
      await detalleCompra.destroy();
      return { message: "DetalleCompra deleted successfully" };
    } catch (error) {
      console.error("Error deleting detalle de compra:", error);
      throw error;
    }
  }
}

module.exports = servicesDetalleCompra;
