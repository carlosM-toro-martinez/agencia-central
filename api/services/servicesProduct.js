const Producto = require("../models/Producto");
const Inventario = require("../models/Inventario");
const Lote = require("../models/Lote");
const MovimientoInventarioService = require("./servicesMovimientoInventario");
const InventarioService = require("./servicesInventario");
const sequelize = require("../libs/dbConexionORM");

const movimientoInventarioService = new MovimientoInventarioService();
const inventarioService = new InventarioService();

class servicesProducto {
  constructor() {
    this.sesion = {};
  }

  async getAllProducts() {
    try {
      const products = await Producto.findAll();
      return products;
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const product = await Producto.findByPk(id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      return product;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      throw error;
    }
  }

  async createProduct(data) {
    try {
      const newProduct = await Producto.create(data);
      return newProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateOneProduct(id, data) {
    try {
      const product = await Producto.findByPk(id);
      if (!product) {
        throw new Error(`producto with ID ${id} not found`);
      }
      await product.update(data);
      return product;
    } catch (error) {
      console.error("Error updating producto:", error);
      throw error;
    }
  }

  async updateProduct(id, data) {
    const transaction = await sequelize.transaction();
    console.log(data);
    console.log(id);

    try {
      const product = await Producto.findByPk(id, { transaction });
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      const stockChange =
        data.tipo_movimiento === "compra" ? data.cantidad : -data.cantidad;
      const pesoChange =
        data.tipo_movimiento === "compra"
          ? parseFloat(data.peso)
          : -parseFloat(data.peso);
      const subCantidadChange =
        data.tipo_movimiento === "compra"
          ? parseInt(data?.subCantidad)
          : -parseInt(data?.subCantidad);
      const currentPeso = product.peso !== null ? parseFloat(product.peso) : 0;
      const currentSubCantidad =
        product.subCantidad !== null ? parseInt(product.subCantidad) : 0;
      await product.update(
        {
          stock: product.stock + stockChange,
          peso: parseFloat((currentPeso + pesoChange).toFixed(2)),

          subCantidad: parseFloat(
            (currentSubCantidad + subCantidadChange).toFixed(2)
          ),
        },
        { transaction }
      );

      // Crear registro en MovimientoInventario
      await movimientoInventarioService.createMovimientoInventario(
        {
          id_producto: id,
          cantidad: data.cantidad,
          tipo_movimiento: data.tipo_movimiento,
          fecha_movimiento: new Date(),
          id_trabajador: data.id_trabajador,
        },
        transaction
      );

      // Crear registro en Inventario
      await inventarioService.createInventario(
        {
          id_producto: id,
          id_lote: data.id_lote,
          cantidad: data.cantidad,
          subCantidad: data?.subCantidad,
          peso: parseFloat(data.peso).toFixed(2),
          fecha_actualizacion: new Date(),
          id_trabajador: data.id_trabajador,
        },
        transaction
      );

      await transaction.commit();

      return product;
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating product:", error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const product = await Producto.findByPk(id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      await product.destroy();
      return { message: "Product deleted successfully" };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  async getInventariosByProductId(id) {
    try {
      const product = await Producto.findByPk(id, {
        include: [
          {
            model: Inventario,
            as: "inventarios",
            include: [
              {
                model: Lote,
                as: "lote",
                attributes: ["fecha_caducidad", "fecha_ingreso", "numero_lote"],
              },
            ],
          },
        ],
      });

      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      const inventarios = product.inventarios.map((inventario) => ({
        id: inventario.id,
        cantidad: inventario.cantidad,
        subCantidad: inventario.subCantidad,
        peso: inventario.peso,
        fecha_caducidad: inventario.lote
          ? inventario.lote.fecha_caducidad
          : null,
        fecha_ingreso: inventario.lote ? inventario.lote.fecha_ingreso : null,
        numero_lote: inventario.lote ? inventario.lote.numero_lote : null,
      }));

      return {
        producto: product.nombre,
        inventarios,
      };
    } catch (error) {
      console.error("Error fetching inventories by product ID:", error);
      throw error;
    }
  }
}

module.exports = servicesProducto;
