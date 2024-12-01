// routes/reporteRoutes.js
const express = require("express");
const ReporteService = require("../services/servicesReporte");
const route = express.Router();

const reporteService = new ReporteService();

route.get("/almacenes/movimientos/:idInicio/:idFin", async (req, res) => {
  const { idInicio, idFin } = req.params;
  console.log(idInicio, idFin);

  try {
    const movimientos = await reporteService.getLotesConDetalleCompra(
      idInicio,
      idFin
    );
    res.json(movimientos);
  } catch (error) {
    console.error("Error fetching movimientos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

route.get("/almacenes/compras/:proveedorId", async (req, res) => {
  const { proveedorId } = req.params;
  try {
    const compras = await reporteService.getComprasProveedor(proveedorId);
    res.json(compras);
  } catch (error) {
    console.error("Error fetching compras:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

route.get("/caja/:idInicio/:idFin", async (req, res) => {
  const { idInicio, idFin } = req.params;
  try {
    const movimientos = await reporteService.getMovimientosCaja(
      idInicio,
      idFin
    );
    res.json(movimientos);
  } catch (error) {
    console.error("Error fetching movimientos de caja:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

route.get("/ventas/:idInicio/:idFin", async (req, res) => {
  const { idInicio, idFin } = req.params;

  try {
    const ventas = await reporteService.getVentas(idInicio, idFin);
    res.json(ventas);
  } catch (error) {
    console.error("Error fetching ventas:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = route;
