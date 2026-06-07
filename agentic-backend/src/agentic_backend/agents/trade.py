from ..models.state_models import SupervisorState, TradeExecution, TradeType
from ..agents.base import build_agent_state
from ..mcp.clients import init_clients
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from ..users.users import get_agent_weight_and_prompt , get_strategy_details
from langchain.chat_models import init_chat_model
from ..api.users import get_user
import json

llm = init_chat_model("openai:gpt-4o")


async def trade_agent_node(state: SupervisorState) -> SupervisorState:
    """Run the trade agent with the current task and update state."""

    
    user_id = state.user_detail              # from state
    strategy_id = state.thread_id            # from state
    agent_name = "executor"                   # or "technical" if finance = technical
    # ✅ fetch strategy details
    strategy = get_strategy_details(user_id, strategy_id)
    agent_meta = get_agent_weight_and_prompt(user_id, strategy_id, agent_name)

    if "error" in agent_meta:
        agent_meta={}

    user_prompt = agent_meta.get("customPrompt") or ""
    sysprompt_trade_agent = f"""
<system_prompt>
  <role>
    You are an advanced crypto trading AI assistant. Be serious, logical, and precise.
    Your goal is to help the user execute trades safely on Hyperliquid using proper market analysis.
  </role>
  <principle>Focus on the user’s current intent else Default flow is to analyse and then only place trade if risk to reward is good .</principle>
  <user_request>{user_prompt}</user_request>
    <strategy_details>
    <asset>{strategy.get("cryptoAsset")}</asset>
    <timeframe>{strategy.get("timeframe")}</timeframe>
    <risk>{strategy.get("risk")}</risk>
  </strategy_details>
  <purpose>
    Analyze market data, confirm trade setups using pivot points and current price, 
    and execute BUY or SELL orders only when the risk/reward ratio is favorable.
    In case user specificaly ask then place trade 
  </purpose>

  <available_tools>
    1. analyze_market(coin: str, interval: str = "1h") ->
       Fetches live price and pivot points for the given coin.
       Calculates potential stop-loss (SL) and take-profit (TP) levels for buy and sell.
      

    2. place_trade(coin: str, size: str, side: str, sl: float, tp: float, privateKey: str = DEFAULT_PRIVATE_KEY) ->
       Places a buy or sell order on Hyperliquid with specified SL and TP.

  </available_tools>

  <trading_logic>
    - Step 1: Use analyze_market() to get current price, support/resistance levels, and suggested SL/TP.
    - Step 2: Evaluate risk/reward:
        * For BUY: TP should be sufficiently above price compared to risk (price-SL).
        * For SELL: TP should be sufficiently below price compared to risk (SL-price).
        
        
    - Step 3: Only call place_trade() with coin, size, side, sl, tp if analysis confirms a favorable trade or user specificaly mention to take .
  </trading_logic>

  <risk_management>
    - Prioritize user intend . If nothing mention then see risk to reward good or not 
    - Respect user’s risk profile: 
        * High Risk: Can accept larger positions
        * Medium Risk: Moderate positions (Make it as default if user do not mention)
        * Low Risk: Conservative trades
  </risk_management>

  <validation_rules>
    - Coin symbol must be valid (e.g., BTC, ETH, SOL, ADA, XRP, DOGE, USDT, USDC, BNB, XLM).
    - Trade size must be positive.
    - Side must be "buy" or "sell".
  </validation_rules>

  <execution_process>
    1. DBased on context data decide if should take buy or sell trade 
    7. Analyze market using analyze_market().
    2. Confirm SL/TP and risk/reward are favorable.do not take decimal part . 
    3. Execute trade using place_trade() with sl and tp parameters.
    4. Report trade confirmation including SL, TP, current price, and reasoning.
    5. If declining trade, clearly explain reason.
  </execution_process>

  <communication_guidelines>
    - Explain reasoning concisely.
    - Include market prices and pivot points in analysis.
    - Clearly report risk/reward ratio.
    - If trade is skipped, state the exact reason.
    - Avoid speculation; only act based on analysis and constraints.
  </communication_guidelines>
  
  <context>
    Current Task: {state.current_task}
    Context Data: {json.dumps(state.context, indent=2, default=str)}
  </context>
<private_key>{user_id}</private_key>
<note> use private_key when you place trade</note>
</system_prompt>
"""

    
    tools = await init_clients()
    trade_tools = tools["trade_tools"]

    trade_agent = create_react_agent(
        llm.bind_tools(trade_tools, parallel_tool_calls=False),
        tools=trade_tools,
        prompt=sysprompt_trade_agent,
        name="trade_agent",
    )

    if not state.current_task:
        return state  # no task assigned, nothing to do

    # Run the trade agent on the supervisor's current task
    input_msg = {"messages": [{"role": "user", "content": state.current_task}]}
    print("Trade Agent Task:", state.current_task)

    result = await trade_agent.ainvoke(input=input_msg)

    # Convert the messages from the agent into AgentState
    agent_state = build_agent_state(result["messages"], agent_name="trade_agent")

    # Add agent state to SupervisorState
    state.agent_states.append(agent_state)

    # Update context for downstream use
    agent_count = sum(1 for s in state.agent_states if s.agent_name == "trade_agent")
    state.context[f"trade_agent_step{agent_count}"] = agent_state.agent_output

    # Extract and track trade executions from agent responses
    # Parse tool calls to identify executed trades
    for tool_call in agent_state.tool_call_response_pair:
        tool_name = tool_call.get("tool_name", "")
        args = tool_call.get("arguments", {})
        response = tool_call.get("response", "")

        if tool_name in ("buy_crypto", "sell_crypto"):
            try:
                # Parse response if it's a JSON string
                if isinstance(response, str):
                    response_data = json.loads(response) if response.startswith("{") else {"status": response}
                else:
                    response_data = response

                if response_data.get("status") == "success":
                    trade_type = TradeType.BUY if tool_name == "buy_crypto" else TradeType.SELL
                    trade_exec = TradeExecution(
                        trade_id=response_data.get("trade_id"),
                        symbol=args.get("symbol"),
                        trade_type=trade_type,
                        quantity=args.get("quantity", 0),
                        status="executed",
                        reason=state.current_task,
                        execution_price=response_data.get("execution_price"),
                        total_value=response_data.get("total_value")
                    )
                    state.trade_executions.append(trade_exec)
            except Exception as e:
                print(f"Error parsing trade execution: {e}")

    # Clear current_task (supervisor will decide next)
    state.current_task = None

    return state
