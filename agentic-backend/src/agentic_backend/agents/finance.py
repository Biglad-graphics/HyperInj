from ..models.state_models import SupervisorState
from ..agents.base import build_agent_state
# from ..tools.tool_wrappers import invoke_agent
from ..mcp.clients import init_clients

from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from ..users.users import get_agent_weight_and_prompt , get_strategy_details
import json
import os
from langchain.chat_models import init_chat_model

llm=init_chat_model("openai:gpt-4o")

# Load available indicators from JSON
def load_available_indicators():
    """Load list of available indicators from indicators_full.json"""
    try:
        json_path = os.path.join(os.path.dirname(__file__), "..", "mcp", "servers", "indicators_full.json")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return sorted(list(data.keys()))
    except Exception as e:
        print(f"Warning: Could not load indicators: {e}")
        return []

AVAILABLE_INDICATORS = load_available_indicators()

async def financial_agent_node(state: SupervisorState) -> SupervisorState:
    """Run the financial agent with the current task and update state."""
    user_id = state.user_detail              # from state
    strategy_id = state.thread_id            # from state
    agent_name = "technical"                 # or "technical" if finance = technical
    # ✅ fetch strategy details
    strategy = get_strategy_details(user_id, strategy_id)
    agent_meta = get_agent_weight_and_prompt(user_id, strategy_id, agent_name)

    if "error" in agent_meta:
        agent_meta={}

    prompt = agent_meta.get("customPrompt") or ""     
    
        # Format available indicators for display
    indicators_list = ", ".join(AVAILABLE_INDICATORS[:30])  # Show first 30 for brevity
    indicators_note = f"Plus {len(AVAILABLE_INDICATORS) - 30} more..." if len(AVAILABLE_INDICATORS) > 30 else ""


    sysprompt_finance_agent = f"""
<system_prompt>
  <role>
    You are an advanced AI financial analyst specializing in cryptocurrency markets.
    Your purpose is to objectively analyze financial data and report your findings
    to a human supervisor. You must NOT issue warnings, raise cautions, or execute trades.
  </role>

  <mission>
    Analyze the given market context using minimal, high-value tool calls.
    Based on your analysis, clearly state whether a trade can be taken or not.
  </mission>

  <tools>
    1. get_indicator(endpoint, symbol, interval, results)
       - Function: Retrieves technical indicators (momentum, trend, volume, volatility, etc.).
       - Output: Indicator values, interpretation, and inference over past candles.
       - Available indicators: ({len(AVAILABLE_INDICATORS)} total)
         {indicators_list}
       - Note: {indicators_note}
  </tools>
  <user_request>{prompt}</user_request>
    <strategy_details>
    <asset>{strategy.get("cryptoAsset")}</asset>
    <timeframe>{strategy.get("timeframe")}</timeframe>
    <risk>{strategy.get("risk")}</risk>
  </strategy_details>
  <rules>
    - Use at most 1–2 tools per analysis.
    - Avoid redundant calls; check if data already exists in context.
    - Each tool call consumes API credits — optimize for insight, not volume.
    - Focus on tools that yield the highest signal-to-noise ratio.
  </rules>

  <analysis_protocol>
    1. Read the query and current context carefully.
    2. Determine if sufficient data already exists.
    3. If not, call up to 2 tools to gather essential data.
    4. Interpret the results numerically and logically.
    5. Conclude with one of:
       - "YES — trade can be taken"
       - "NO — trade should not be taken"
       - "INSUFFICIENT DATA — unable to determine"
  </analysis_protocol>

  <reporting_guidelines>
    - Be concise, factual, and neutral in tone.
    - Provide specific numeric evidence (price, RSI, MACD, volume, etc.).
    - Explain in 2–4 short bullet points why the data supports or rejects a trade.
    - Do NOT include emotional, cautionary, or speculative language.
    - Do NOT recommend execution actions.
  </reporting_guidelines>

  <response_format note = "reply in plane format">
    <analysis_result>
      <conclusion>YES / NO / INSUFFICIENT DATA</conclusion>
      <summary>Short numeric summary (price, indicators, timeframe)</summary>
      <rationale>
        - Bullet 1 (indicator + interpretation)
        - Bullet 2 (confirmation or divergence)
        - Bullet 3 (optional supporting factor)
      </rationale>
      <supervisor_summary>
        One-line concise summary for supervisor review.
      </supervisor_summary>
    </analysis_result>
  </response_format>

  <reminder>
    - Only analyze and report; never warn or act.
    - Limit to 1–2 essential tool calls.
    - Always output a numeric, evidence-backed conclusion.
  </reminder>
</system_prompt>
"""
    tools = await init_clients()
    finance_tools=  tools["financial_tools"]
    finance_agent = create_react_agent(
        llm.bind_tools(finance_tools ,parallel_tool_calls=False),
        tools=finance_tools,
        prompt=sysprompt_finance_agent,
        name="finance_agent",
    )
    if not state.current_task:
        return state  # no task assigned, nothing to do

    # Run the financial agent on the supervisor's current task
    # Ensure your agent is the ReAct agent you created earlier
    input = {"messages": [{"role": "user", "content": state.current_task}]}
    print("this is context ",state.context)
    result = await finance_agent.ainvoke(input=input)
    
    # Convert the messages from the agent into AgentState
    agent_state = build_agent_state(result["messages"], agent_name="finance_agent")

    # Include agent name
    # agent_state.agent_name = "FinanceAgent"

    # Add agent state to SupervisorState (flat array in sequential order)
    state.agent_states.append(agent_state)

    # Update context for downstream use
    agent_count = sum(1 for s in state.agent_states if s.agent_name == "finance_agent")
    state.context[f"finance_agent_step{agent_count}"] = agent_state.agent_output

    # Clear current_task (supervisor will decide next)
    state.current_task = None

    return state


# state = SupervisorState(user_query="check is BTC-USD is bullish or berrish and find its support and ressistance")
# state.current_task = "check is BTC-USD is bullish or berrish and find its support and ressistance"

# # Run financial agent node
# updated_state = financial_agent_node(state)

# # Show result
# print(updated_state.dump_json(indent=2))