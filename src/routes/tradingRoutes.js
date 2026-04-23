import express from "express";
import { Order } from "../models/Order.js";
import { Trade } from "../models/Trade.js";
import { buyStock, sellStock } from "../controllers/tradeController.js";

export const tradingRouter = express.Router();

tradingRouter.post("/buy", buyStock);
tradingRouter.post("/sell", sellStock);

tradingRouter.post("/orders", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create order", error: error.message });
  }
});

tradingRouter.get("/orders", async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch orders", error: error.message });
  }
});

tradingRouter.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch order", error: error.message });
  }
});

tradingRouter.post("/orders/:id/execute", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = "COMPLETED";
    await order.save();

    const trade = await Trade.create({
      orderId: order.id,
      executedPrice: req.body.executedPrice || order.price,
      quantity: order.quantity
    });

    return res.json({ order, trade });
  } catch (error) {
    return res.status(500).json({ message: "Unable to execute order", error: error.message });
  }
});

tradingRouter.get("/executions", async (_req, res) => {
  try {
    const trades = await Trade.find().sort({ executedAt: -1 });
    return res.json(trades);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch trades", error: error.message });
  }
});
