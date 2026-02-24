const express = require("express");
const router = express.Router();
const FoodController = require("../controllers/food.controller");

router.get("/", FoodController.getAllFoods);
router.get("/:id", FoodController.getFoodById);
router.post("/", FoodController.createFood);
router.patch("/:id", FoodController.updateFood);
router.delete("/:id", FoodController.deleteFood);

module.exports = router;