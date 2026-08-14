import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import connectDB from "./config/db.js";
import fileRouter from "./router/file.router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));

app.use("/", fileRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello From Server",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Started on PORT: ${PORT}`);
    });
  })
  .catch((err) => {
   console.log("Error Starting Server"); 
  })