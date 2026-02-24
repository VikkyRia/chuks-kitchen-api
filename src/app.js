const express = require("express");
const migrate = require("./db/migrate");
const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Run migrations — creates tables if they don't exist
migrate();

// Routes
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/foods", require("./routes/food.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Chuks Kitchen API",
    status: "Server is running",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Chuks Kitchen API running on http://localhost:${PORT}`);
});