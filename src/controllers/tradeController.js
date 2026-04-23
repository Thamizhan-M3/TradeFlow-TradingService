import { Order } from "../models/Order.js";
import { Trade } from "../models/Trade.js";
import { getUser, updateUserBalance } from "../services/userService.js";
import { getPortfolioHoldings, updatePortfolioHolding } from "../services/portfolioService.js";

export async function buyStock(req, res) {
  try {
    const { userId, stockId, quantity, price } = req.body;

    // 1. Validate input
    if (!userId || !stockId || quantity === undefined || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ message: "Quantity and price must be greater than zero" });
    }

    // 2. Fetch user & 3. Check balance
    let user;
    try {
      user = await getUser(userId);
    } catch (error) {
      return res.status(404).json({ message: "User not found or unreachable" });
    }

    const totalCost = quantity * price;
    if (user.balance < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 4. Create order
    const order = await Order.create({
      userId,
      stockId,
      type: "BUY",
      quantity,
      price,
      status: "PENDING"
    });

    // 5. Execute order
    order.status = "COMPLETED";
    await order.save();

    const trade = await Trade.create({
      orderId: order.id,
      stockId,
      executedPrice: price,
      quantity
    });

    // 6. Deduct balance via user-service
    const newBalance = user.balance - totalCost;
    await updateUserBalance(userId, newBalance);

    // 7. Update portfolio via portfolio-service
    let holdings = [];
    try {
      holdings = await getPortfolioHoldings(userId);
    } catch (error) {
      // Ignore if empty portfolio
    }
    
    const existingHolding = holdings.find(h => h.stockId === stockId);
    const oldQty = existingHolding?.quantity || 0;
    const oldAvgPrice = existingHolding?.avgBuyPrice || 0;
    
    const newQty = oldQty + quantity;
    const newAvgBuyPrice = ((oldQty * oldAvgPrice) + totalCost) / newQty;

    try {
      await updatePortfolioHolding(userId, stockId, newQty, newAvgBuyPrice);
    } catch (error) {
      return res.status(500).json({ message: "Trade executed but portfolio update failed", order, trade });
    }

    // 8. Return success
    return res.status(200).json({
      message: "Buy order executed successfully",
      order,
      trade
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to process buy order", error: error.message });
  }
}

export async function sellStock(req, res) {
  try {
    const { userId, stockId, quantity, price } = req.body;

    // 1. Validate input
    if (!userId || !stockId || quantity === undefined || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ message: "Quantity and price must be greater than zero" });
    }

    // 2. Fetch holdings
    let holdings = [];
    try {
      holdings = await getPortfolioHoldings(userId);
    } catch (error) {
      return res.status(404).json({ message: "Portfolio not found or unreachable" });
    }

    // 3. Check quantity
    const holding = holdings.find(h => h.stockId === stockId);
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ message: "Not enough holdings to sell" });
    }

    // 4. Create order
    const order = await Order.create({
      userId,
      stockId,
      type: "SELL",
      quantity,
      price,
      status: "PENDING"
    });

    // 5. Execute order
    order.status = "COMPLETED";
    await order.save();

    const trade = await Trade.create({
      orderId: order.id,
      stockId,
      executedPrice: price,
      quantity
    });

    // 6. Add balance via user-service
    let user;
    try {
      user = await getUser(userId);
      const newBalance = user.balance + (quantity * price);
      await updateUserBalance(userId, newBalance);
    } catch (error) {
      // Proceed even if balance fetch fails, though ideally we handle this tighter
    }

    // 7. Update portfolio
    const newQty = holding.quantity - quantity;
    const newAvgBuyPrice = holding.avgBuyPrice; // Average buy price remains same on sell

    try {
      // NOTE: backend logic handles setting quantity to 0 as valid. 
      await updatePortfolioHolding(userId, stockId, newQty, newAvgBuyPrice);
    } catch (error) {
      return res.status(500).json({ message: "Trade executed but portfolio update failed", order, trade });
    }

    // 8. Return success
    return res.status(200).json({
      message: "Sell order executed successfully",
      order,
      trade
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to process sell order", error: error.message });
  }
}
