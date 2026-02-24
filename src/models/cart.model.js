const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const CartModel = {
  // Check if a food item is already in the user's cart
  findExistingItem(user_id, food_id) {
    return db
      .prepare("SELECT * FROM cart WHERE user_id = ? AND food_id = ?")
      .get(user_id, food_id);
  },

  // Get all cart items with food details for a user
  findByUser(user_id) {
    return db.prepare(`
      SELECT
        cart.id as cart_item_id,
        cart.quantity,
        foods.id as food_id,
        foods.name as food_name,
        foods.price,
        foods.is_available,
        foods.category,
        (cart.quantity * foods.price) as subtotal
      FROM cart
      JOIN foods ON cart.food_id = foods.id
      WHERE cart.user_id = ?
    `).all(user_id);
  },

  // Add a new item to the cart
  addItem(user_id, food_id, quantity) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO cart (id, user_id, food_id, quantity)
      VALUES (?, ?, ?, ?)
    `).run(id, user_id, food_id, quantity);
    return id;
  },

  // Increase quantity if item already exists in cart
  updateQuantity(cart_item_id, quantity) {
    db.prepare("UPDATE cart SET quantity = ? WHERE id = ?")
      .run(quantity, cart_item_id);
  },

  // Remove a single item from the cart
  removeItem(cart_item_id) {
    db.prepare("DELETE FROM cart WHERE id = ?").run(cart_item_id);
  },

  // Find a specific cart item by ID and user
  findCartItem(cart_item_id, user_id) {
    return db
      .prepare("SELECT * FROM cart WHERE id = ? AND user_id = ?")
      .get(cart_item_id, user_id);
  },

  // Clear all items in a user's cart
  clearCart(user_id) {
    db.prepare("DELETE FROM cart WHERE user_id = ?").run(user_id);
  },
};

module.exports = CartModel;