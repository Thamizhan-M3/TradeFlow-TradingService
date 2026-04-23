import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    stockId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    executedPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    executedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export const Trade = mongoose.model("Trade", tradeSchema);
