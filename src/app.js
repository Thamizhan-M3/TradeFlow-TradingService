import cors from "cors";
import express from "express";
import { tradingRouter } from "./routes/tradingRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ service: "tradeflow-trading-service", status: "ok" });
  });

  app.use("/api/trades", tradingRouter);

  return app;
}
