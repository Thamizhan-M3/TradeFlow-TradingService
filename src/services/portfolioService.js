import axios from "axios";

const getBaseUrl = () => process.env.PORTFOLIO_SERVICE_URL || "http://localhost:4004/api/portfolio";

export async function getPortfolioHoldings(userId) {
  const response = await axios.get(`${getBaseUrl()}/${userId}/holdings`);
  return response.data;
}

export async function updatePortfolioHolding(userId, stockId, quantity, avgBuyPrice) {
  // We don't have a reliable way to calculate total portfolio value here, so we skip it or pass 0.
  // The backend might recalculate it, or we just rely on holding updates.
  const response = await axios.post(`${getBaseUrl()}/holdings/upsert`, {
    userId,
    stockId,
    quantity,
    avgBuyPrice,
    totalValue: 0 
  });
  return response.data;
}
