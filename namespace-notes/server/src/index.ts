// server/node/src/index.ts
import fs from "fs";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import documentRoutes from "./routes/documentRoutes";
import contextRoutes from "./routes/contextRoutes";
var memwatch = require("@airbnb/node-memwatch");

// Define the path for the uploads directory
const uploadsDir = path.join(__dirname, "..", "uploads");

if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode");
  console.log = function () {};
} else if (process.env.NODE_ENV === "profile") {
  memwatch.on("stats", function (stats: any) {
    console.log(stats);
  });
}

// Create the 'uploads' directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/documents", documentRoutes);
app.use("/api/context", contextRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
