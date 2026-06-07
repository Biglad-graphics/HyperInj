/**
 * Utility functions for managing user data in localStorage
 */

const USER_STORAGE_KEY = "Cognix_user_data";

export interface UserData {
  userId: string; // MongoDB _id from backend
  uniqueWalletId: string; // Privy wallet ID
  walletAddress: string;
  apiWallet?: {
    address: string;
  };
}

/**
 * Save user data to localStorage
 */
export const saveUserData = (userData: UserData): void => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error("Failed to save user data to localStorage:", error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): UserData | null => {
  try {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get user data from localStorage:", error);
    return null;
  }
};

/**
 * Get only the userId from localStorage
 */
export const getUserId = (): string | null => {
  const userData = getUserData();
  return userData?.userId || null;
};

/**
 * Clear user data from localStorage
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear user data from localStorage:", error);
  }
};

/**
 * Check if user is logged in (has userId in storage)
 */
export const isUserLoggedIn = (): boolean => {
  return getUserId() !== null;
};
