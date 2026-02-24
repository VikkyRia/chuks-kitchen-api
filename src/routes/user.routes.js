const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");

router.post("/signup", UserController.signup);
router.post("/verify", UserController.verify);
router.get("/:id", UserController.getProfile);

module.exports = router;