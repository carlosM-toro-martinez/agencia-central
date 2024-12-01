const express = require("express");
const { loginUser } = require("../services/servicesLogin");
const passport = require("passport");

const router = express.Router();

// router.post("/register", async (req, res) => {
//   await registerUser(req, res);
// });

router.post("/login", async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const response = await loginUser(req, res);

    if (response.error) {
      console.log("Error en loginUser:", response.error);
      return res.status(400).json({ error: response.error });
    }
console.log(response);

    console.log("Login exitoso:", response);
    res.json(response);
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ message: "Acceso permitido", user: req.user });
  }
);

module.exports = router;
