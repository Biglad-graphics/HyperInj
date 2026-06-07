users = [
    {
        "id": "1",
        "name": "Alice Johnson",
        "age": 32,
        "crypto_preference": ["Bitcoin", "Ethereum"],
        "risk_appetite": "High",
        "portfolio_value_usd": 150000,
        "crypto_portfolio": {
            "BTC": {"amount": 2.5, "avg_buy_price": 45000},
            "ETH": {"amount": 15.0, "avg_buy_price": 3000},
            "USDT": {"amount": 30000, "avg_buy_price": 1}
        },
        "country": "UK",
        "trading_experience": "Intermediate",
        "max_trade_size_percentage": 10,
        "daily_trade_limit": 5
    },
    {
        "id": "3",
        "name": "Bob Smith",
        "age": 45,
        "crypto_preference": ["Bitcoin", "Ethereum", "Cardano"],
        "risk_appetite": "Medium",
        "portfolio_value_usd": 200000,
        "crypto_portfolio": {
            "BTC": {"amount": 4.0, "avg_buy_price": 42000},
            "ETH": {"amount": 20.0, "avg_buy_price": 2800},
            "ADA": {"amount": 10000, "avg_buy_price": 1.2},
            "USDT": {"amount": 50000, "avg_buy_price": 1}
        },
        "country": "UK",
        "trading_experience": "Beginner",
        "max_trade_size_percentage": 5,
        "daily_trade_limit": 3
    },
    {
        "id": "2",
        "name": "Charlie Brown",
        "age": 28,
        "crypto_preference": ["Bitcoin", "Ethereum", "Solana"],
        "risk_appetite": "Low",
        "portfolio_value_usd": 80000,
        "crypto_portfolio": {
            "BTC": {"amount": 1.0, "avg_buy_price": 40000},
            "ETH": {"amount": 5.0, "avg_buy_price": 2500},
            "SOL": {"amount": 100, "avg_buy_price": 150},
            "USDT": {"amount": 20000, "avg_buy_price": 1}
        },
        "country": "UK",
        "trading_experience": "Advanced",
        "max_trade_size_percentage": 15,
        "daily_trade_limit": 10
    }
]


def get_users():
    return users


def get_user(user_id: int):
    user = next((user for user in users if user["id"] == user_id), None)
    if user:
        return user
    return {"error": "User not found"}