// services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  Administrador,
  Trabajador,
  Rol,
  Permiso,
  RolPermiso,
} = require("../models");

const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
const saltRounds = 10;

const generateToken = (user, tipo) => {
  const payload = {
    id: user.id_trabajador || user.id_administrador,
    tipo,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
};

const loginUser = async (req, res) => {
  const { username, password, tipo } = req.body;

  try {
    let user;

    if (tipo === "trabajador") {
      user = await Trabajador.findOne({
        where: { username },
        include: [
          {
            model: Rol,
            as: "rol",
            include: [
              {
                model: Permiso,
                as: "permisos",
                through: {
                  attributes: [],
                },
              },
            ],
          },
        ],
      });
    } else if (tipo === "administrador") {
      user = await Administrador.findOne({ where: { username } });
    } else {
      return { error: "Tipo inválido" };
    }

    if (!user) {
      return { error: "Usuario no encontrado" };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { error: "Contraseña incorrecta" };
    }

    const token = generateToken(user, tipo);

    return {
      token,
      user,
    };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  loginUser,
};
