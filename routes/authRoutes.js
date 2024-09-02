const express = require("express");
const {
  login,
  register,
  getUserDetails,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/:id", getUserDetails);

module.exports = router;
