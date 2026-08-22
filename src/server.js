import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/db.js";
import fileRouter from "./router/file.router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));

app.use("/api/v1", fileRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hello From Server",
    status_code: 200,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "The /health route is working correctly. The server is up and responding normally.",
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    status_code: 200,
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