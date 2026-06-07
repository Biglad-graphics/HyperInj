import requests
from dotenv import load_dotenv , find_dotenv
load_dotenv(find_dotenv())
import os 

BASE_URL = os.getenv("NODE_BACKEND_URL")  # your backend URL


def fetch_single_strategy(user_id: str, strategy_id: str):
    """Fetch single strategy by userId & strategyId"""
    url = f"{BASE_URL}/api/strategies/user/{user_id}/strategy/{strategy_id}"
    response = requests.get(url)

    if response.status_code != 200:
        return {}

    return response.json()


def get_agent_weight_and_prompt(user_id: str, strategy_id: str, agent_name: str):
    """Return agent votingPower & customPrompt"""
    strategy = fetch_single_strategy(user_id, strategy_id)

    for agent_cfg in strategy.get("agentConfigs", []):
        agent = agent_cfg.get("agentId", {})
        if agent.get("name") == agent_name:
            return {
                "agentName": agent_name,
                "votingPower": agent_cfg.get("votingPower"),
                "customPrompt": agent_cfg.get("customPrompt"),
            }

    return {"error": f"Agent '{agent_name}' not found in strategy {strategy_id}"}


def get_strategy_details(user_id: str, strategy_id: str):
    """Return basic strategy details"""
    s = fetch_single_strategy(user_id, strategy_id)

    return {
        "userId": s.get("userId"),
        "name": s.get("name"),
        "description": s.get("description"),
        "cryptoAsset": s.get("cryptoAsset"),
        "timeframe": s.get("timeframe"),
        "leverage": s.get("leverage"),
        "depositAmount": s.get("depositAmount"),
        "risk": s.get("risk"),
    }


# user_id = "68fdfd9b67be7cf87c41751d"
# strategy_id = "690f48246f18f2d284016cdb"

# agent_names = ["supervisor", "technical", "news_sentiment", "websearch"]

# results = {}

# for name in agent_names:
#     meta = get_agent_weight_and_prompt(user_id, strategy_id, name)

#     if "error" not in meta:
#         results[name] = {
#             "customPrompt": meta.get("customPrompt", "N/A"),
#             "votingPower": meta.get("votingPower", 0)
#         }
#     else:
#         results[name] = {
#             "customPrompt": "N/A",
#             "votingPower": 0
#         }
# print(results)
# print("Agent Results:",get_strategy_details(user_id,strategy_id))
