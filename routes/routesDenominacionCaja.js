const express = require("express");
const DenominacionCajaService = require("../services/servicesDenominacionCaja");
const route = express.Router();

const denominacionCajaService = new DenominacionCajaService();

// Ruta GET para obtener todas las denominaciones de caja
route.get("/", async (req, res) => {
  try {
    const denominaciones = await denominacionCajaService.getAllDenominaciones();
    res.json(denominaciones);
  } catch (error) {
    console.error("Error fetching denominaciones:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Ruta GET para obtener una denominación de caja por id_denominacion
route.get("/:id_denominacion", async (req, res) => {
  try {
    const { id_denominacion } = req.params;
    const denominacion = await denominacionCajaService.getDenominacion(
      id_denominacion
    );
    res.json(denominacion);
  } catch (error) {
    console.error("Error fetching denominacion:", error);
    res.status(404).json({ error: error.message });
  }
});

// Ruta POST para crear una nueva denominación de caja
route.post("/", async (req, res) => {
  try {
    const newDenominacion = await denominacionCajaService.createDenominacion(
      req.body
    );
    res.status(201).json(newDenominacion);
  } catch (error) {
    console.error("Error creating denominacion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Ruta PUT para actualizar una denominación de caja por id_denominacion
route.put("/:id_denominacion", async (req, res) => {
  try {
    const { id_denominacion } = req.params;
    const updatedDenominacion =
      await denominacionCajaService.updateDenominacion(
        id_denominacion,
        req.body
      );
    res.json(updatedDenominacion);
  } catch (error) {
    console.error("Error updating denominacion:", error);
    res.status(404).json({ error: error.message });
  }
});

// Ruta DELETE para eliminar una denominación de caja por id_denominacion
route.delete("/:id_denominacion", async (req, res) => {
  try {
    const { id_denominacion } = req.params;
    const message = await denominacionCajaService.deleteDenominacion(
      id_denominacion
    );
    res.json(message);
  } catch (error) {
    console.error("Error deleting denominacion:", error);
    res.status(404).json({ error: error.message });
  }
});

module.exports = route;
