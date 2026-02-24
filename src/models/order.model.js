const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const OrderModel = {
  // Create a new order with its items (all or nothing transaction)
  create(user_id, total_price, cartItems) {
    const order_id = uuidv4();

    const placeOrder = db.transaction(() => {
      // 1. Create the order
      db.prepare(`
        INSERT INTO orders (id, user_id, total_price, status)
        VALUES (?, ?, ?, 'pending')
      `).run(order_id, user_id, total_price);

      // 2. Save each item
      for (const item of cartItems) {
        db.prepare(`
          INSERT INTO order_items (id, order_id, food_id, quantity, price)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), order_id, item.food_id, item.quantity, item.price);
      }

      // 3. Clear the cart
      db.prepare("DELETE FROM cart WHERE user_id = ?").run(user_id);
    });

    placeOrder();
    return order_id;
  },

  // Find a single order by ID
  findById(id) {
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  },

  // Find a single order by ID and user (for cancellation)
  findByIdAndUser(order_id, user_id) {
    return db
      .prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?")
      .get(order_id, user_id);
  },

  // Get all items inside an order with food details
  getOrderItems(order_id) {
    return db.prepare(`
      SELECT
        order_items.quantity,
        order_items.price,
        foods.name as food_name,
        foods.category,
        (order_items.quantity * order_items.price) as subtotal
      FROM order_items
      JOIN foods ON order_items.food_id = foods.id
      WHERE order_items.order_id = ?
    `).all(order_id);
  },

  // Get all orders for a specific user
  findByUser(user_id) {
    return db
      .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
      .all(user_id);
  },

  // Update order status
  updateStatus(order_id, status) {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?")
      .run(status, order_id);
  },
};

module.exports = OrderModel;