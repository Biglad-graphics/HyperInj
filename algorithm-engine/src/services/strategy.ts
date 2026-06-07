import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env["API_BASE_URL"];

/**
 * Fetch all strategies (optionally for a specific user)
 */
export async function getStrategies(userId?: string) {
  const url = userId
    ? `${BASE_URL}/api/strategies/user/${userId}`
    : `${BASE_URL}/api/strategies`;
  const res = await axios.get(url);
  return res.data;
}

/**
 * Fetch single strategy by strategyId
 */
export async function getStrategyById(strategyId: string) {
  const res = await axios.get(`${BASE_URL}/api/strategies/strategy/${strategyId}`);
  return res.data;
}
