import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const registerUser = async (
  walletId: string,
  walletAddress: string,
  apiWallet: { address: string; privateKey: string }
) => {
  try {
    const payload = {
      uniqueWalletId: walletId,
      walletAddress: walletAddress,
      apiWallet,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/user/register`,
      payload
    );

    console.log("User registered successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const getUserDetails = async (walletId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/user/${walletId}/walletId`);

    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};
