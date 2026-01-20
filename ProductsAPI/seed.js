import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

const products = [
  {
    name: "Wireless Headphones",
    category: "Electronics",
    price: 79.99,
    image: "https://i.pinimg.com/1200x/12/d0/0a/12d00ae02a5a9c76c9138986307ab979.jpg",
    description: "Premium wireless headphones with noise cancellation and 30-hour battery life.",
    rating: 4.5,
    inStock: true
  },
  {
    name: "Smart Watch",
    category: "Electronics",
    price: 249.99,
    image: "https://i.pinimg.com/1200x/e0/52/b1/e052b1a1b6466a160665491062fe49a4.jpg",
    description: "Feature-packed smartwatch with health tracking, GPS, and water resistance.",
    rating: 4.7,
    inStock: true
  },
  {
    name: "Running Shoes",
    category: "Fashion",
    price: 129.99,
    image: "https://i.pinimg.com/474x/31/6a/1e/316a1e742c36af403a3b59c78e9a4a13.jpg",
    description: "Comfortable running shoes with excellent cushioning and breathable mesh.",
    rating: 4.6,
    inStock: true
  },
  {
    name: "Leather Jacket",
    category: "Fashion",
    price: 199.99,
    image: "https://i.pinimg.com/1200x/86/ac/ed/86acedaa6764cdebf4c5a64b0f7081b1.jpg",
    description: "Classic leather jacket with modern design and premium quality materials.",
    rating: 4.4,
    inStock: true
  },
  {
    name: "Laptop Stand",
    category: "Electronics",
    price: 39.99,
    image: "https://i.pinimg.com/474x/1c/f6/d9/1cf6d9e892a3c88b913b0df17392bb39.jpg",
    description: "Ergonomic aluminum laptop stand with adjustable height and ventilation.",
    rating: 4.3,
    inStock: true
  },
  {
    name: "Denim Jeans",
    category: "Fashion",
    price: 69.99,
    image: "https://i.pinimg.com/1200x/b0/c1/d3/b0c1d3c718bf35cef901583d349bbf00.jpg",
    description: "Classic fit denim jeans with stretch comfort and durable construction.",
    rating: 4.5,
    inStock: true
  },
  {
    name: "Coffee Maker",
    category: "Home",
    price: 89.99,
    image: "https://i.pinimg.com/474x/8b/30/b7/8b30b74cfcb23ce52ea8893d88fa95ee.jpg",
    description: "Programmable coffee maker with thermal carafe and auto-shutoff feature.",
    rating: 4.6,
    inStock: true
  },
  {
    name: "Throw Pillows Set",
    category: "Home",
    price: 34.99,
    image: "https://i.pinimg.com/474x/69/ce/d4/69ced41e63fabcb6a1317ad20ba93d19.jpg",
    description: "Set of 4 decorative throw pillows with premium fabric and modern patterns.",
    rating: 4.2,
    inStock: true
  },
  {
    name: "Yoga Mat",
    category: "Sports",
    price: 29.99,
    image: "https://i.pinimg.com/1200x/f5/a8/0d/f5a80d22367d20ff6a89f70a09904203.jpg",
    description: "Non-slip yoga mat with carrying strap and moisture-resistant surface.",
    rating: 4.4,
    inStock: true
  },
  {
    name: "Dumbbell Set",
    category: "Sports",
    price: 149.99,
    image: "https://i.pinimg.com/474x/ca/3e/92/ca3e9223a83c8557322e0bc5066b4f47.jpg",
    description: "Adjustable dumbbell set with weight range from 5-50lbs per dumbbell.",
    rating: 4.7,
    inStock: true
  },
  {
    name: "Backpack",
    category: "Fashion",
    price: 59.99,
    image: "https://i.pinimg.com/474x/1e/ce/ff/1eceff8d98eb80e71da7c468e5a45b8d.jpg",
    description: "Durable backpack with multiple compartments and laptop sleeve.",
    rating: 4.5,
    inStock: true
  },
  {
    name: "Wireless Mouse",
    category: "Electronics",
    price: 24.99,
    image: "https://i.pinimg.com/1200x/f5/bb/c4/f5bbc42e21f8e62aaa47c92e5391ecb0.jpg",
    description: "Ergonomic wireless mouse with precision tracking and long battery life.",
    rating: 4.3,
    inStock: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/M1cart");
    console.log("Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert new products
    await Product.insertMany(products);
    console.log("Seed data inserted successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();