import axios from "axios";

const getBaseUrl = () => process.env.USER_SERVICE_URL || "http://localhost:4001/api/users";

export async function getUser(userId) {
  const response = await axios.get(`${getBaseUrl()}/${userId}`);
  return response.data;
}

export async function updateUserBalance(userId, newBalance) {
  const response = await axios.patch(`${getBaseUrl()}/${userId}/wallet`, {
    balance: newBalance
  });
  return response.data;
}
