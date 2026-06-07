import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const getAllIndicators = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/indicators`);

    return response.data;
  } catch (error) {
    console.error("Error fetching all indicators:", error);
    throw error;
  }
};
