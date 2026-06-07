EXAMPLE_STRATEGY_CODE1 = '''import backtrader as bt
import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta

# === User Parameters ===
X_days = 365       # past X days
Y_interval = '1d'  # interval: '1d', '1h', '1wk', etc.

end_date = datetime.today()
start_date = end_date - timedelta(days=X_days)

start_str = start_date.strftime("%Y-%m-%d")
end_str = end_date.strftime("%Y-%m-%d")

print(f"Fetching ETH-USD data from {start_str} to {end_str} with interval '{Y_interval}'")

# Fetch data
df = yf.download('ETH-USD', start=start_str, end=end_str, interval=Y_interval)
df.columns = ["Open", "High", "Low", "Close", "Volume"]
df.index.name = 'Date'

# === Prepare Backtrader Data Feed ===
data = bt.feeds.PandasData(dataname=df)

# === EMA Crossover Strategy ===
class EMACrossStrategy(bt.Strategy):
    params = (("ema_fast", 9), ("ema_slow", 15))

    def __init__(self):
        self.ema_fast = bt.indicators.EMA(self.data.close, period=self.p.ema_fast)
        self.ema_slow = bt.indicators.EMA(self.data.close, period=self.p.ema_slow)
        self.trade_log = []
        self.entry_price = None
        self.entry_date = None
        self.entry_size = None

    def next(self):
        # Buy signal: fast EMA crosses above slow EMA
        if not self.position and self.ema_fast[0] > self.ema_slow[0] and self.ema_fast[-1] <= self.ema_slow[-1]:
            self.buy()
        # Sell signal: fast EMA crosses below slow EMA
        elif self.position and self.ema_fast[0] < self.ema_slow[0] and self.ema_fast[-1] >= self.ema_slow[-1]:
            self.sell()

    def notify_order(self, order):
        """Capture entry information when buy order is completed"""
        if order.status in [order.Completed]:
            if order.isbuy():
                self.entry_date = self.data.datetime.date(0)
                self.entry_price = order.executed.price
                self.entry_size = order.executed.size
            elif order.issell():
                exit_date = self.data.datetime.date(0)
                exit_price = order.executed.price
                exit_size = order.executed.size
                
                gross_pnl = (exit_price - self.entry_price) * self.entry_size
                total_commission = order.executed.comm + (self.entry_price * self.entry_size * 0.001)
                net_pnl = gross_pnl - total_commission
                
                duration = (exit_date - self.entry_date).days
                
                self.trade_log.append({
                    "Entry Date": self.entry_date.strftime("%Y-%m-%d"),
                    "Exit Date": exit_date.strftime("%Y-%m-%d"),
                    "Entry Price": round(self.entry_price, 4),
                    "Exit Price": round(exit_price, 4),
                    "Size": round(self.entry_size, 6),
                    "PnL": round(gross_pnl, 2),
                    "PnL (Net)": round(net_pnl, 2),
                    "Commission": round(total_commission, 2),
                    "Duration (Days)": duration,
                    "Direction": "Long"
                })
                
                self.entry_price = None
                self.entry_date = None
                self.entry_size = None

# === Cerebro Setup ===
cerebro = bt.Cerebro()
cerebro.addstrategy(EMACrossStrategy)
cerebro.adddata(data)
cerebro.broker.setcash(10000)
cerebro.broker.setcommission(commission=0.001)

cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
cerebro.addanalyzer(bt.analyzers.Returns, _name="returns")
cerebro.addanalyzer(bt.analyzers.SQN, _name="sqn")

class AvgHoldPeriod(bt.Analyzer):
    def start(self):
        self.total_days = 0
        self.trades_count = 0

    def notify_trade(self, trade):
        if trade.isclosed:
            duration = (bt.num2date(trade.dtclose) - bt.num2date(trade.dtopen)).days
            self.total_days += duration
            self.trades_count += 1

    def get_analysis(self):
        return {"avg_hold_days": self.total_days / self.trades_count if self.trades_count > 0 else 0}

cerebro.addanalyzer(AvgHoldPeriod, _name="avg_hold")

print("[*] Running backtest...")
initial_value = cerebro.broker.getvalue()
print(f"Starting Portfolio Value: ${initial_value:,.2f}")

results = cerebro.run()
strat = results[0]

final_value = cerebro.broker.getvalue()
sharpe = strat.analyzers.sharpe.get_analysis()
trade_analysis = strat.analyzers.trades.get_analysis()
drawdown = strat.analyzers.drawdown.get_analysis()
returns_analysis = strat.analyzers.returns.get_analysis()
sqn = strat.analyzers.sqn.get_analysis()
avg_hold = strat.analyzers.avg_hold.get_analysis()

print(f"Final Portfolio Value: ${final_value:,.2f}")

report = {
    "summary": {
        "initial_value": initial_value,
        "final_value": final_value,
        "total_return_pct": round(((final_value - initial_value) / initial_value * 100), 2),
        "sharpe_ratio": sharpe.get("sharperatio", None),
        "max_drawdown": drawdown.max.drawdown,
        "cumulative_returns": returns_analysis.get("rnorm", None),
        "total_trades": trade_analysis.total.total if "total" in trade_analysis else 0,
        "winning_trades": trade_analysis.won.total if "won" in trade_analysis else 0,
        "losing_trades": trade_analysis.lost.total if "lost" in trade_analysis else 0,
        "sqn": sqn.sqn if hasattr(sqn, 'sqn') else None,
        "avg_holding_days": avg_hold.get("avg_hold_days", 0)
    },
    "trades": strat.trade_log
}

print("__JSON_REPORT_START__")
print(json.dumps(report, indent=4))
print("__JSON_REPORT_END__")
'''

EXAMPLE_STRATEGY_CODE2 = '''import backtrader as bt
import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta

X_days = 365
Y_interval = '1d'

end_date = datetime.today()
start_date = end_date - timedelta(days=X_days)

start_str = start_date.strftime("%Y-%m-%d")
end_str = end_date.strftime("%Y-%m-%d")

print(f"Fetching ETH-USD data from {start_str} to {end_str} with interval '{Y_interval}'")

df = yf.download('ETH-USD', start=start_str, end=end_str, interval=Y_interval)
df.columns = ["Open", "High", "Low", "Close", "Volume"]
df.index.name = 'Date'

data = bt.feeds.PandasData(dataname=df)

class RSIStrategy(bt.Strategy):
    params = (("rsi_period", 14), ("rsi_overbought", 70), ("rsi_oversold", 30))

    def __init__(self):
        self.rsi = bt.indicators.RSI_SMA(self.data.close, period=self.p.rsi_period)
        self.trade_log = []

    def log_trade(self, trade):
        if trade.isclosed:
            entry_date = bt.num2date(trade.dtopen).strftime("%Y-%m-%d")
            exit_date = bt.num2date(trade.dtclose).strftime("%Y-%m-%d")
            entry_price = round(trade.price, 4)
            exit_price = round(trade.price + trade.pnlcomm / trade.size, 4) if trade.size != 0 else round(trade.price, 4)
            self.trade_log.append({
                "Entry Date": entry_date,
                "Exit Date": exit_date,
                "Entry Price": entry_price,
                "Exit Price": exit_price,
                "Size": trade.size,
                "PnL": round(trade.pnl, 2),
                "PnL (Net)": round(trade.pnlcomm, 2),
                "Commission": round(trade.commission, 2),
                "Duration (Days)": (bt.num2date(trade.dtclose) - bt.num2date(trade.dtopen)).days,
                "Direction": "Long" if trade.size > 0 else "Short"
            })

    def next(self):
        if not self.position and self.rsi < self.p.rsi_oversold:
            self.buy()
        elif self.position and self.rsi > self.p.rsi_overbought:
            self.sell()

    def notify_trade(self, trade):
        if trade.isclosed:
            self.log_trade(trade)

cerebro = bt.Cerebro()
cerebro.addstrategy(RSIStrategy)
cerebro.adddata(data)
cerebro.broker.setcash(10000)
cerebro.broker.setcommission(commission=0.001)

cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
cerebro.addanalyzer(bt.analyzers.Returns, _name="returns")
cerebro.addanalyzer(bt.analyzers.SQN, _name="sqn")

class AvgHoldPeriod(bt.Analyzer):
    def start(self):
        self.total_days = 0
        self.trades_count = 0

    def notify_trade(self, trade):
        if trade.isclosed:
            duration = (bt.num2date(trade.dtclose) - bt.num2date(trade.dtopen)).days
            self.total_days += duration
            self.trades_count += 1

    def get_analysis(self):
        return {"avg_hold_days": self.total_days / self.trades_count if self.trades_count > 0 else 0}

cerebro.addanalyzer(AvgHoldPeriod, _name="avg_hold")

results = cerebro.run()
strat = results[0]

final_value = cerebro.broker.getvalue()
sharpe = strat.analyzers.sharpe.get_analysis()
trade_analysis = strat.analyzers.trades.get_analysis()
drawdown = strat.analyzers.drawdown.get_analysis()
returns_analysis = strat.analyzers.returns.get_analysis()
sqn = strat.analyzers.sqn.get_analysis()
avg_hold = strat.analyzers.avg_hold.get_analysis()

initial_value = cerebro.broker.getvalue() - (final_value - initial_value) if 'initial_value' not in locals() else initial_value
report = {
    "summary": {
        "initial_value": initial_value,
        "final_value": final_value,
        "total_return_pct": round(((final_value - initial_value) / initial_value * 100), 2),
        "sharpe_ratio": sharpe.get("sharperatio", None),
        "max_drawdown": drawdown.max.drawdown,
        "cumulative_returns": returns_analysis.get("rnorm", None),
        "total_trades": trade_analysis.total.total if "total" in trade_analysis else 0,
        "winning_trades": trade_analysis.won.total if "won" in trade_analysis else 0,
        "losing_trades": trade_analysis.lost.total if "lost" in trade_analysis else 0,
        "sqn": sqn.sqn,
        "avg_holding_days": avg_hold.get("avg_hold_days", 0)
    },
    "trades": strat.trade_log
}

print("__JSON_REPORT_START__")
print(json.dumps(report, indent=4))
print("__JSON_REPORT_END__")
'''


