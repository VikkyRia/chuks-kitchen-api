const FoodModel = require("../models/food.model");

const FoodController = {
  // GET /api/foods
  getAllFoods(req, res) {
    const { category } = req.query;

    const foods = category
      ? FoodModel.findByCategory(category)
      : FoodModel.findAll();

    res.json({
      success: true,
      count: foods.length,
      foods,
    });
  },

  // GET /api/foods/:id
  getFoodById(req, res) {
    const food = FoodModel.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.json({ success: true, food });
  },

  // POST /api/foods
  createFood(req, res) {
    const { name, description, price, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    if (FoodModel.findByName(name)) {
      return res.status(409).json({
        success: false,
        message: "A food item with this name already exists",
      });
    }

    const id = FoodModel.create({ name, description, price, category });

    res.status(201).json({
      success: true,
      message: "Food item added successfully!",
      food: { id, name, description, price, category },
    });
  },

  // PATCH /api/foods/:id
  updateFood(req, res) {
    const food = FoodModel.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const { price } = req.body;

    if (price && (isNaN(price) || price <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    const updated = FoodModel.update(req.params.id, req.body);

    res.json({
      success: true,
      message: "Food item updated successfully!",
      food: updated,
    });
  },

  // DELETE /api/foods/:id
  deleteFood(req, res) {
    const food = FoodModel.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    FoodModel.delete(req.params.id);

    res.json({
      success: true,
      message: "Food item deleted successfully!",
    });
  },
};

module.exports = FoodController;