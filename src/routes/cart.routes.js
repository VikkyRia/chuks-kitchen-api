const express = require("express");
const router = express.Router();
const CartController = require("../controllers/cart.controller");

router.post("/", CartController.addToCart);
router.get("/:user_id", CartController.getCart);
router.delete("/:user_id/item/:cart_item_id", CartController.removeItem);
router.delete("/:user_id/clear", CartController.clearCart);

module.exports = router;