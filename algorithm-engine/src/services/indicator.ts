import { getUsers } from "./user";
import { getStrategies } from "./strategy";

/**
 * Fetch all users and their strategies that include a given indicatorId
 */
export async function getUsersAndStrategiesByIndicator(indicatorId: string) {
  const users = await getUsers();
  const result: {
    userId: string;
    walletAddress: string;
    strategies: any[];
  }[] = [];

  const usersList = users?.data;

  // Sequentially or concurrently depending on your load tolerance
  await Promise.all(
    usersList.map(async (user: any) => {
      try {
        const strategies = await getStrategies(user._id);
        const matchedStrategies = strategies.filter((s: any) =>
          s.indicators?.includes(indicatorId)
        );

        if (matchedStrategies.length > 0) {
          result.push({
            userId: user._id,
            walletAddress: user.walletAddress,
            strategies: matchedStrategies,
          });
        }
      } catch (err) {
        console.error(`Error fetching strategies for user ${user._id}:`);
      }
    })
  );

  return result;
}