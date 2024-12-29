const sequelize = require("../libs/dbConexionORM");
const Venta = require("../models/Venta");
const Caja = require("../models/Caja");
const MovimientoCaja = require("../models/MovimientoCaja");
const DenominacionCaja = require("../models/DenominacionCaja");
const DetalleVenta = require("../models/DetalleVenta");
const Inventario = require("../models/Inventario");
const Producto = require("../models/Producto");
const { Cliente, MovimientoInventario, Trabajador } = require("../models");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");

class servicesVenta {
  constructor() {
    this.sesion = {};
  }

  async registrarVentaYActualizar(dataVenta, id_caja, denominaciones) {
    console.log(dataVenta.metodo_pago);
    const transaction = await Venta.sequelize.transaction();

    try {

      if (dataVenta.metodo_pago !== "Contado") {
        dataVenta.total = 0;
        const newVenta = await Venta.create(dataVenta, { transaction });
  
        await transaction.commit();
        return {
          message: "Venta registrada con método de pago no contado.",
          newVenta,
        };
      }

      const newVenta = await Venta.create(dataVenta, { transaction });

      const caja = await Caja.findByPk(id_caja);
      if (!caja) {
        throw new Error(`Caja con ID ${id_caja} no encontrada`);
      }

      const montoVenta = parseFloat(dataVenta.total);
      const nuevoMontoCaja = parseFloat(caja.monto_final) + montoVenta;

      await caja.update({ monto_final: nuevoMontoCaja }, { transaction });

      const nuevoMovimientoCaja = await MovimientoCaja.create(
        {
          id_caja: id_caja,
          tipo_movimiento: "Ingreso",
          motivo: "Venta realizada",
          monto: montoVenta,
          fecha_movimiento: dataVenta.fecha_venta,
          id_trabajador: dataVenta.id_trabajador,
        },
        { transaction }
      );

      for (const denominacion of denominaciones) {
        const {
          tipo_dinero,
          denominacion: valorDenominacion,
          cantidad,
        } = denominacion;

        const denominacionCaja = await DenominacionCaja.findOne({
          where: {
            tipo_dinero: tipo_dinero,
            denominacion: valorDenominacion,
            id_caja: id_caja,
          },
        });

        if (!denominacionCaja) {
          throw new Error(
            `Denominación de tipo ${tipo_dinero} con valor ${valorDenominacion} no encontrada en la caja ${id_caja}`
          );
        }

        await denominacionCaja.update({ cantidad }, { transaction });
      }

      await transaction.commit();
      return {
        message: "Venta registrada y caja actualizada correctamente",
        newVenta,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async procesarVenta(ventaDetalles) {
    const transaction = await sequelize.transaction();
    console.log(ventaDetalles);

    try {
      const productoModificaciones = {};

      for (const detalle of ventaDetalles) {
        const {
          id_producto,
          id_lote,
          cantidad,
          id_venta,
          descripcion,
          cantidad_unidad,
          peso,
        } = detalle;

        await DetalleVenta.create(
          {
            id_producto: id_producto,
            id_venta: id_venta,
            id_lote: id_lote,
            cantidad: cantidad,
            subCantidad: cantidad_unidad,
            peso: peso,
            detalle: descripcion,
            precio_unitario: detalle.precio,
          },
          { transaction }
        );

        const inventario = await Inventario.findOne({
          where: {
            id_producto: id_producto,
            id_lote: id_lote,
          },
        });
        if (!inventario) {
          throw new Error(
            "No se encontró inventario para el producto y lote especificado."
          );
        }

        const nuevaCantidadUnidad =
          inventario.subCantidad - (detalle.cantidad_unidad || 0);
        inventario.subCantidad = nuevaCantidadUnidad;

        const nuevaCantidadInventario = inventario.cantidad - (cantidad || 0);
        if (nuevaCantidadInventario < 0) {
          throw new Error("Cantidad de inventario insuficiente.");
        }
        inventario.cantidad = nuevaCantidadInventario;

        const nuevoPeso = inventario.peso - (detalle.peso || 0);
        inventario.peso = nuevoPeso;
        console.log(nuevaCantidadUnidad);
        console.log(nuevaCantidadInventario);

        await inventario.update(
          {
            cantidad: inventario.cantidad,
            subCantidad: inventario.subCantidad,
            peso: inventario.peso,
          },
          { transaction }
        );

        if (!productoModificaciones[id_producto]) {
          const producto = await Producto.findByPk(id_producto);
          if (!producto) {
            throw new Error("Producto no encontrado.");
          }
          productoModificaciones[id_producto] = {
            producto,
            stock: producto.stock,
            subCantidad: producto.subCantidad,
            peso: producto.peso,
          };
        }

        productoModificaciones[id_producto].stock -= cantidad || 0;
        productoModificaciones[id_producto].subCantidad -= cantidad_unidad || 0;
        productoModificaciones[id_producto].peso -= peso || 0;
      }

      for (const mod of Object.values(productoModificaciones)) {
        if (mod.stock < 0) {
          await transaction.rollback();
          throw new Error("Cantidad de producto insuficiente.");
        }

        await mod.producto.update(
          {
            stock: mod.stock,
            subCantidad: mod.subCantidad,
            peso: mod.peso,
          },
          { transaction }
        );
      }

      const cliente = await Cliente.findByPk(ventaDetalles[0].clienteId);
      if (cliente) {
        const nuevosPuntos = cliente.puntos_fidelidad + 1;
        await cliente.update(
          { puntos_fidelidad: nuevosPuntos },
          { transaction }
        );
      }
      await transaction.commit();

      return {
        message: "Proceso completado sin registrar la venta.",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async procesarInventario(ventaDetalles) {
    const transaction = await sequelize.transaction();

    try {
      const productoModificaciones = {};

      for (const detalle of ventaDetalles) {
        const {
          id_producto,
          id_lote,
          cantidad,
          cantidad_unidad,
          peso,
          id_trabajador,
        } = detalle;

        const inventario = await Inventario.findOne({
          where: {
            id_producto: id_producto,
            id_lote: id_lote,
          },
        });

        if (!inventario) {
          throw new Error(
            "No se encontró inventario para el producto y lote especificado."
          );
        }

        inventario.subCantidad -= cantidad_unidad || 0;
        inventario.cantidad -= cantidad || 0;
        if (inventario.cantidad < 0) {
          throw new Error("Cantidad de inventario insuficiente.");
        }
        inventario.peso -= peso || 0;

        await inventario.update(
          {
            cantidad: inventario.cantidad,
            subCantidad: inventario.subCantidad,
            peso: inventario.peso,
          },
          { transaction }
        );

        if (!productoModificaciones[id_producto]) {
          const producto = await Producto.findByPk(id_producto);
          if (!producto) {
            throw new Error("Producto no encontrado.");
          }
          productoModificaciones[id_producto] = {
            producto,
            stock: producto.stock,
            subCantidad: producto.subCantidad,
            peso: producto.peso,
          };
        }

        productoModificaciones[id_producto].stock -= cantidad || 0;
        productoModificaciones[id_producto].subCantidad -= cantidad_unidad || 0;
        productoModificaciones[id_producto].peso -= peso || 0;

        await MovimientoInventario.create(
          {
            id_producto: id_producto,
            fecha_movimiento: new Date(),
            tipo_movimiento: "Salida sin venta",
            cantidad: cantidad ? parseFloat(cantidad) : null,
            subCantidad: cantidad_unidad ? parseInt(cantidad_unidad) : null,
            peso: peso ? parseFloat(peso) : null,
            id_trabajador: id_trabajador,
            lote: id_lote,
          },
          { transaction }
        );
      }

      for (const mod of Object.values(productoModificaciones)) {
        if (mod.stock < 0) {
          await transaction.rollback();
          throw new Error("Cantidad de producto insuficiente.");
        }

        await mod.producto.update(
          {
            stock: mod.stock,
            subCantidad: mod.subCantidad,
            peso: mod.peso,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        message:
          "Proceso completado sin registrar la venta ni actualizar el cliente.",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async anularVenta(ventaDetalles) {
    console.log(ventaDetalles);

    const transaction = await sequelize.transaction();

    try {
      const productoModificaciones = {};

      for (const detalle of ventaDetalles) {
        const {
          id_producto,
          id_lote,
          cantidad,
          id_detalle,
          cantidad_unidad,
          peso,
        } = detalle;

        try {
          const detalleVenta = await DetalleVenta.findByPk(id_detalle, {
            transaction,
          });
          if (detalleVenta) {
            await detalleVenta.destroy({ transaction });
          } else {
            console.warn(
              `No se encontró el DetalleVenta con el ID ${id_detalle}.`
            );
          }

          const inventario = await Inventario.findOne({
            where: {
              id_producto: id_producto,
              id_lote: id_lote,
            },
            transaction,
          });
          if (inventario) {
            inventario.subCantidad += cantidad_unidad || 0;
            inventario.cantidad += cantidad || 0;
            inventario.peso += peso || 0;

            await inventario.update(
              {
                cantidad: inventario.cantidad,
                subCantidad: inventario.subCantidad,
                peso: inventario.peso,
              },
              { transaction }
            );
          } else {
            console.warn(
              `No se encontró inventario para el producto y lote especificado (ID Producto: ${id_producto}, ID Lote: ${id_lote}).`
            );
          }

          if (!productoModificaciones[id_producto]) {
            const producto = await Producto.findByPk(id_producto, {
              transaction,
            });
            if (producto) {
              productoModificaciones[id_producto] = {
                producto,
                stock: producto.stock,
                subCantidad: producto.subCantidad,
                peso: producto.peso,
              };
            } else {
              console.warn(
                `Producto no encontrado (ID Producto: ${id_producto}).`
              );
            }
          }

          if (productoModificaciones[id_producto]) {
            productoModificaciones[id_producto].stock += cantidad || 0;
            productoModificaciones[id_producto].subCantidad +=
              cantidad_unidad || 0;
            productoModificaciones[id_producto].peso += peso || 0;
          }
        } catch (error) {
          console.error(
            `Error al procesar el detalle con ID ${id_detalle}: ${error.message}`
          );
        }
      }

      for (const mod of Object.values(productoModificaciones)) {
        try {
          await mod.producto.update(
            {
              stock: mod.stock,
              subCantidad: mod.subCantidad,
              peso: mod.peso,
            },
            { transaction }
          );
        } catch (error) {
          console.error(
            `Error al actualizar el producto con ID ${mod.producto.id}: ${error.message}`
          );
        }
      }

      try {
        const cliente = await Cliente.findByPk(ventaDetalles[0].clienteId, {
          transaction,
        });

        if (cliente) {
          const nuevosPuntos = cliente.puntos_fidelidad - 1;
          if (nuevosPuntos >= 0) {
            await cliente.update(
              { puntos_fidelidad: nuevosPuntos },
              { transaction }
            );
          } else {
            console.warn(
              `El cliente (ID Cliente: ${cliente.id}) no puede tener puntos de fidelidad negativos.`
            );
          }
        } else {
          console.warn(
            `No se encontró el cliente con ID ${ventaDetalles[0].clienteId}.`
          );
        }
      } catch (error) {
        console.error(`Error al actualizar el cliente: ${error.message}`);
      }

      await transaction.commit();

      try {
        const venta = await Venta.findByPk(ventaDetalles[0].id_venta);

        if (venta) {
          const caja = await Caja.findByPk(ventaDetalles[0].id_caja);
          if (!caja) {
            throw new Error(`Caja con ID ${id_caja} no encontrada`);
          }
          const montoVenta = parseFloat(venta?.dataValues?.total);
          const nuevoMontoCaja = parseFloat(caja.monto_final) - montoVenta;

          await caja.update({ monto_final: nuevoMontoCaja });

          const nuevoMovimientoCaja = await MovimientoCaja.create({
            id_caja: ventaDetalles[0].id_caja,
            tipo_movimiento: "Salida",
            motivo: "Venta anulada",
            monto: montoVenta,
            fecha_movimiento: ventaDetalles[0].fecha_venta,
            id_trabajador: ventaDetalles[0].id_trabajador,
          });
          await venta.destroy();
        } else {
          console.warn(
            `Venta con ID ${ventaDetalles[0].id_venta} no encontrada.`
          );
        }
      } catch (error) {
        console.error(`Error al eliminar la venta: ${error.message}`);
      }

      return {
        message: "La venta fue anulada exitosamente.",
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`Error general: ${error.message}`);
      throw new Error("Ocurrió un error al anular la venta.");
    }
  }

  // Método GET para obtener todas las ventas
  async getAllVentas() {
    try {
      const ventas = await Venta.findAll();
      return ventas;
    } catch (error) {
      console.error("Error fetching all ventas:", error);
      throw error;
    }
  }

  async getVentasDelDia() {
    try {
      const fechaHoy = DateTime.now().setZone("America/La_Paz").startOf("day");
      const finDia = DateTime.now().setZone("America/La_Paz").endOf("day");

      const ventas = await Venta.findAll({
        where: {
          fecha_venta: {
            [Op.between]: [fechaHoy.toJSDate(), finDia.toJSDate()],
          },
        },
        include: [
          {
            model: Trabajador,
            as: "trabajadorVenta",
            attributes: ["nombre"],
          },
          {
            model: Cliente,
            as: "cliente",
            attributes: ["nombre", "apellido"],
          },
          {
            model: DetalleVenta,
            as: "detallesVenta",
            include: [
              {
                model: Producto,
                as: "producto",
                attributes: ["nombre"],
              },
            ],
          },
        ],
      });

      return ventas;
    } catch (error) {
      console.error("Error fetching ventas:", error);
      throw error;
    }
  }

  // Método POST para crear una nueva venta
  async createVenta(data) {
    try {
      const newVenta = await Venta.create(data);
      return newVenta;
    } catch (error) {
      console.error("Error creating venta:", error);
      throw error;
    }
  }

  // Método PUT para actualizar una venta por id_venta
  async updateVenta(id_venta, data) {
    try {
      const venta = await Venta.findByPk(id_venta);
      if (!venta) {
        throw new Error(`Venta with ID ${id_venta} not found`);
      }
      await venta.update(data);
      return venta;
    } catch (error) {
      console.error("Error updating venta:", error);
      throw error;
    }
  }

  // Método DELETE para eliminar una venta por id_venta
  async deleteVenta(id_venta) {
    try {
      const venta = await Venta.findByPk(id_venta);
      if (!venta) {
        throw new Error(`Venta with ID ${id_venta} not found`);
      }
      await venta.destroy();
      return { message: "Venta deleted successfully" };
    } catch (error) {
      console.error("Error deleting venta:", error);
      throw error;
    }
  }
}

module.exports = servicesVenta;
