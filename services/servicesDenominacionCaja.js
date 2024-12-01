const DenominacionCaja = require("../models/DenominacionCaja");

class servicesDenominacionCaja {
  constructor() {
    this.sesion = {};
  }

  // Método GET para obtener todas las denominaciones de caja
  async getAllDenominaciones() {
    try {
      const denominaciones = await DenominacionCaja.findAll();
      return denominaciones;
    } catch (error) {
      console.error("Error fetching all denominaciones:", error);
      throw error;
    }
  }

  // Método GET para obtener una denominación de caja por id_denominacion
  async getDenominacion(id_denominacion) {
    try {
      const denominacion = await DenominacionCaja.findByPk(id_denominacion);
      if (!denominacion) {
        throw new Error(`Denominacion with ID ${id_denominacion} not found`);
      }
      return denominacion;
    } catch (error) {
      console.error("Error fetching denominacion:", error);
      throw error;
    }
  }

  // Método POST para crear una nueva denominación de caja
  async createDenominacion(data) {
    try {
      const newDenominacion = await DenominacionCaja.create(data);
      return newDenominacion;
    } catch (error) {
      console.error("Error creating denominacion:", error);
      throw error;
    }
  }

  // Método PUT para actualizar una denominación de caja por id_denominacion
  async updateDenominacion(id_denominacion, data) {
    try {
      const denominacion = await DenominacionCaja.findByPk(id_denominacion);
      if (!denominacion) {
        throw new Error(`Denominacion with ID ${id_denominacion} not found`);
      }
      await denominacion.update(data);
      return denominacion;
    } catch (error) {
      console.error("Error updating denominacion:", error);
      throw error;
    }
  }

  // Método DELETE para eliminar una denominación de caja por id_denominacion
  async deleteDenominacion(id_denominacion) {
    try {
      const denominacion = await DenominacionCaja.findByPk(id_denominacion);
      if (!denominacion) {
        throw new Error(`Denominacion with ID ${id_denominacion} not found`);
      }
      await denominacion.destroy();
      return { message: "Denominacion deleted successfully" };
    } catch (error) {
      console.error("Error deleting denominacion:", error);
      throw error;
    }
  }
}

module.exports = servicesDenominacionCaja;
