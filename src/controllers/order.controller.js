const OrderModel = require("../models/order.model");
const UserModel = require("../models/user.model");
const CartModel = require("../models/cart.model");
const FoodModel = require("../models/food.model");

const validStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
];

const OrderController = {
  // POST /api/orders
  placeOrder(req, res) {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const user = UserModel.findById(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.is_verified === 0) {
      return res.status(403).json({
        success: false,
        message: "Please verify your account before placing an order",
      });
    }

    // Get cart items
    const cartItems = CartModel.findByUser(user_id);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Add items before placing an order",
      });
    }

    // Check for unavailable items
    const unavailableItems = cartItems.filter(
      (item) => item.is_available === 0
    );

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items in your cart are no longer available. Please remove them first.",
        unavailable_items: unavailableItems.map((item) => ({
          food_id: item.food_id,
          food_name: item.food_name,
        })),
      });
    }

    // Calculate total
    const total_price = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const order_id = OrderModel.create(user_id, total_price, cartItems);

    res.status(201).json({
      success: true,
      message: "Order placed successfully! 🎉",
      order: {
        id: order_id,
        user_id,
        total_price,
        status: "pending",
        items: cartItems.map((item) => ({
          food_name: item.food_name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
      },
    });
  },

  // GET /api/orders/:id
  getOrder(req, res) {
    const order = OrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderItems = OrderModel.getOrderItems(req.params.id);

    res.json({
      success: true,
      order: { ...order, items: orderItems },
    });
  },

  // GET /api/orders/user/:user_id
  getUserOrders(req, res) {
    const user = UserModel.findById(req.params.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = OrderModel.findByUser(req.params.user_id);

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  },

  // PATCH /api/orders/:id/status
  updateStatus(req, res) {
    const { status } = req.body;

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = OrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot update an order that is already ${order.status}`,
      });
    }

    OrderModel.updateStatus(req.params.id, status);

    res.json({
      success: true,
      message: `Order status updated to: ${status}`,
      order_id: req.params.id,
      new_status: status,
    });
  },

  // PATCH /api/orders/:id/cancel
  cancelOrder(req, res) {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const order = OrderModel.findByIdAndUser(req.params.id, user_id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or does not belong to this user",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `You can only cancel a pending order. This order is: ${order.status}`,
      });
    }

    OrderModel.updateStatus(req.params.id, "cancelled");

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order_id: req.params.id,
    });
  },
};

module.exports = OrderController;