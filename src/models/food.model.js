const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const FoodModel = {
  // Get all available food items
  findAll() {
    return db.prepare("SELECT * FROM foods WHERE is_available = 1").all();
  },

  // Get food items by category
  findByCategory(category) {
    return db
      .prepare("SELECT * FROM foods WHERE is_available = 1 AND category = ?")
      .all(category);
  },

  // Find a single food item by ID
  findById(id) {
    return db.prepare("SELECT * FROM foods WHERE id = ?").get(id);
  },

  // Find food by name (to check duplicates)
  findByName(name) {
    return db.prepare("SELECT * FROM foods WHERE name = ?").get(name);
  },

  // Admin adds a new food item
  create({ name, description, price, category }) {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO foods (id, name, description, price, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description || null, price, category);

    return id;
  },

  // Admin updates a food item
  update(id, { name, description, price, category, is_available }) {
    const food = this.findById(id);

    const updatedName = name ?? food.name;
    const updatedDescription = description ?? food.description;
    const updatedPrice = price ?? food.price;
    const updatedCategory = category ?? food.category;
    const updatedAvailability = is_available ?? food.is_available;

    db.prepare(`
      UPDATE foods
      SET name = ?, description = ?, price = ?, category = ?, is_available = ?
      WHERE id = ?
    `).run(
      updatedName,
      updatedDescription,
      updatedPrice,
      updatedCategory,
      updatedAvailability,
      id
    );

    return this.findById(id);
  },

  // Admin deletes a food item
  delete(id) {
    db.prepare("DELETE FROM foods WHERE id = ?").run(id);
  },
};

module.exports = FoodModel;