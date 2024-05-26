const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { apiKeyAuth } = require("@vpriem/express-api-key-auth");
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
};

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const localhost = "mongodb://127.0.0.1:27017/test";
const mongoUri = process.env.MONGODB_URI;
const apiKey = process.env.API_KEY;

async function connectDB() {
  try {
    await mongoose.connect(mongoUri || localhost);
    mongoUri
      ? console.log("DB Connected")
      : console.log("DB Localhost Connected");
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
}

const itemSchema = new mongoose.Schema({
  name: String,
  img: [
    {
      sm: String,
      lg: String,
    },
  ],
  desc: String,
  ingredients: [
    {
      name: String,
      img: String,
    },
  ],
  price: Number,
  quantity: Number,
});

const historySchema = new mongoose.Schema({
  date: String,
  items: [],
  totalPrice: Number,
});

// const Item = mongoose.model("Item", itemSchema);
const Transaction = mongoose.model("Transaction", historySchema);

app.use(cors(corsConfig));
app.use(express.json());
app.use(apiKeyAuth([apiKey]));

app.get("/", (req, res) => {
  res.send("hello word");
});

app.get("/transaction", async (req, res) => {
  try {
    const histories = await Transaction.find();
    res.json(histories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/transaction", async (req, res) => {
  const { date, items, totalPrice } = req.body;

  if (
    !date ||
    !Array.isArray(items) ||
    items.length === 0 ||
    typeof totalPrice !== "number"
  ) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const transaction = new Transaction({ date, items, totalPrice });

  try {
    const count = await Transaction.countDocuments();

    if (count >= 15) {
      await Transaction.findOneAndDelete().sort({ date: 1 });
    }

    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});

module.exports = app;
