import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";
import { connect } from "http2";

import { connectDB } from "./lib/db.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use("/api/auth", authRoutes)


console.log(process.env.PORT);

app.listen (PORT, () => {
    console.log("Server is running on HTTP://localhost:" + PORT);
    connectDB()
})

