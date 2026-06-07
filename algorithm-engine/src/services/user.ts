import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env["API_BASE_URL"];

/**
 * Fetch all users
 */
export async function getUsers() {
  const res = await axios.get(`${BASE_URL}/api/v1/user`);
  return res.data;
}