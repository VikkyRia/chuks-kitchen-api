const CartModel = require("../models/cart.model");
const UserModel = require("../models/user.model");
const FoodModel = require("../models/food.model");

const CartController = {
  // POST /api/cart
  addToCart(req, res) {
    const { user_id, food_id, quantity } = req.body;

    if (!user_id || !food_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and food_id are required",
      });
    }

    // Check user exists and is verified
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
        message: "Please verify your account before adding items to cart",
      });
    }

    // Check food exists and is available
    const food = FoodModel.findById(food_id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    if (food.is_available === 0) {
      return res.status(400).json({
        success: false,
        message: "Sorry, this food item is currently unavailable",
      });
    }

    // If item already in cart, increase quantity
    const existingItem = CartModel.findExistingItem(user_id, food_id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + (quantity || 1);
      CartModel.updateQuantity(existingItem.id, newQuantity);

      return res.json({
        success: true,
        message: "Cart updated — quantity increased",
        cart_item: { ...existingItem, quantity: newQuantity },
      });
    }

    // Add new item to cart
    const id = CartModel.addItem(user_id, food_id, quantity || 1);

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully!",
      cart_item: {
        id,
        user_id,
        food_id,
        food_name: food.name,
        price: food.price,
        quantity: quantity || 1,
      },
    });
  },

  // GET /api/cart/:user_id
  getCart(req, res) {
    const user = UserModel.findById(req.params.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartItems = CartModel.findByUser(req.params.user_id);
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const unavailableItems = cartItems.filter(
      (item) => item.is_available === 0
    );

    res.json({
      success: true,
      count: cartItems.length,
      cart: cartItems,
      total_price: total,
      warning:
        unavailableItems.length > 0
          ? `${unavailableItems.length} item(s) in your cart are now unavailable`
          : null,
    });
  },

  // DELETE /api/cart/:user_id/item/:cart_item_id
  removeItem(req, res) {
    const { user_id, cart_item_id } = req.params;
    const cartItem = CartModel.findCartItem(cart_item_id, user_id);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    CartModel.removeItem(cart_item_id);

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  },

  // DELETE /api/cart/:user_id/clear
  clearCart(req, res) {
    const user = UserModel.findById(req.params.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    CartModel.clearCart(req.params.user_id);

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  },
};

module.exports = CartController;