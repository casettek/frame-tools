import express from "express";
import dotenv from "dotenv";
import cors from "cors";

export async function startServer() {
  dotenv.config();

  const app = express();
  app.use("*", cors());

  return app;
}
