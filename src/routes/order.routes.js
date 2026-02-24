const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/order.controller");

router.post("/", OrderController.placeOrder);
router.get("/user/:user_id", OrderController.getUserOrders);
router.get("/:id", OrderController.getOrder);
router.patch("/:id/status", OrderController.updateStatus);
router.patch("/:id/cancel", OrderController.cancelOrder);

module.exports = router;