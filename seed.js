import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./models/Product.js";
import products from "../prod.json" with { type: "json" };

dotenv.config();

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connected...");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert new products with pid field
    const productsWithPid = products.map(product => ({
      pid: product.id, // Use the id from prod.json as pid
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      description: product.description,
      rating: product.rating,
      inStock: product.inStock
    }));

    await Product.insertMany(productsWithPid);
    console.log(`Successfully seeded ${productsWithPid.length} products`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error.message);
    process.exit(1);
  }
};

seedProducts();

