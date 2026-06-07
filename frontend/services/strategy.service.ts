import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const createStrategy = async (userId: string, strategyData: any) => {
  try {
    console.log("Creating strategy with data:", strategyData);
    console.log("For user ID:", userId);
    const payload = {
      userId: userId,
      ...strategyData,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/strategies`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error creating strategy:", error);
    throw error;
  }
};

export const updateStrategy = async (
  userId: string,
  strategyId: string,
  strategyData: any
) => {
  try {
    const payload = {
      userId,
      name: strategyData.name,
      description: strategyData.description,
      risk: strategyData.risk,
      agents: strategyData.agents, // [Array of objects with agentId: string, votingPower: 0.1, customPrompt: string, code: string]
    };

    const response = await axios.put(
      `${API_BASE_URL}/api/strategies/strategy/${strategyId}`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error updating strategy:", error);
    throw error;
  }
};

export const deleteStrategy = async (strategyId: string) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/strategies/strategy/${strategyId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting strategy:", error);
    throw error;
  }
};

export const getStrategyDetails = async (strategyId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/strategies/strategy/${strategyId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error getting strategy details:", error);
    throw error;
  }
};

export const getUserStrategies = async (userId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/strategies/user/${userId}`
    );

    console.log("Strategies: ", response.data);

    return response.data;
  } catch (error) {
    console.error("Error getting user strategies:", error);
    throw error;
  }
};

export const getUsersStrategy = async (userId: string, strategyId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/strategies/user/${userId}/strategy/${strategyId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error getting user's strategy:", error);
    throw error;
  }
};
