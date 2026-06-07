import json
from ..models.state_models import SupervisorState
from ..models.state_models import *
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from ..users.users import get_agent_weight_and_prompt , get_strategy_details
from langchain.chat_models import init_chat_model
llm=init_chat_model("openai:gpt-4o")
from ..agents.finance import load_available_indicators
AVAILABLE_INDICATOR= load_available_indicators()
def supervisor_node(state: SupervisorState) -> SupervisorState:
    """Supervisor decides the next agent + task based on state so far."""

    step = len(state.decisions) + 1
    user_id = state.user_detail  # coming from state
    user_id = state.user_detail
    strategy_id = state.thread_id
    agent_names = ["supervisor", "technical", "news_sentiment", "websearch"]

    supervisor_prompt = "N/A"  # default
    agent_voting_power = {}    # for all
    # ✅ fetch strategy details
    strategy = get_strategy_details(user_id, strategy_id)
    for name in agent_names:
        meta = get_agent_weight_and_prompt(user_id, strategy_id, name)
        
        # store supervisor custom prompt separately
        if name == "supervisor":
            supervisor_prompt = meta.get("customPrompt", "N/A")
    
        # store voting power for all agents
        agent_voting_power[name] = meta.get("votingPower", 1)
    
    
    
    system_prompt = f"""
<system>
  <identity>
    <name>Supervisor AI Agent</name>
    <role>
      You are the orchestrator and reasoning core for autonomous crypto trading and investment research.
      Your primary goal is to deeply understand the <user_query> and decide which specialized agent
      should handle it next, or whether to answer directly.
    </role>
  </identity>
  <user_request>{supervisor_prompt}</user_request>
    <strategy_details>
    <asset>{strategy.get("cryptoAsset")}</asset>
    <timeframe>{strategy.get("timeframe")}</timeframe>
  </strategy_details>
  
<agents_weight_profile>
  <technical weight="{agent_voting_power['technical']}"/>
  <news_sentiment weight="{agent_voting_power['news_sentiment']}"/>
  <websearch weight="{agent_voting_power['websearch']}"/>
  <supervisor weight="{agent_voting_power['supervisor']}"/>
</agents_weight_profile>
    <past_requests>{state.request_summary}</past_request>
    <user_query>{state.user_query}</user_query>
    <conversation_state>{state.context}</conversation_state>
    <executed_trades>{[t.model_dump() for t in state.trade_executions]}</executed_trades>
  </context>

  <agent_directory>
    <agent name="crypto_price_agent">
      Do technical analysis using  — technical indicators .
      <available indicator or endpoint>{AVAILABLE_INDICATOR}</available indicator or endpoint>
    </agent>
    <agent name="news_sentiment_agent">
      sentiment Analyzes crypto-related news.
    </agent>
    <agent name="websearch_agent">
      Fetches or explains general web-based or real-time information not in crypto data sources.
    </agent>
    <agent name="trade_agent">
      Executes BUY/SELL orders or portfolio rebalancing.
      <rules>
        <rule>consider "conversation_state" and decide if its required to take trade or not .</rule>
        <rule>Do not execute trades without explicit clarity or confirmation.</rule>
      </rules>
    </agent>
  </agent_directory>

  <output_instructions>
    <format>
      Respond **strictly** in JSON as follows:
      {{
        "selected_agent": "<agent_name or FINISH>",
        "task": "<exact sub-query or instruction for that agent>",
        "reasoning": "<brief reasoning behind your choice>"
      }}
    </format>
  </output_instructions>
</system>
"""



    response = llm.invoke(system_prompt)

    # --- normalize response to string ---
    if hasattr(response, "content"):
        raw_text = response.content
    elif isinstance(response, str):
        raw_text = response
    else:
        raw_text = str(response)

    # --- try parse as JSON ---
    import json
    try:
        parsed = json.loads(raw_text)
    except Exception:
        # fallback: strip to nearest JSON object
        json_str = raw_text[raw_text.find("{"): raw_text.rfind("}") + 1]
        parsed = json.loads(json_str)

    selected_agent = parsed.get("selected_agent")
    task = parsed.get("task")
    reasoning = parsed.get("reasoning")

    # Ensure task is a string, not a dict or other type
    if isinstance(task, dict):
        task = json.dumps(task,default=str)
    elif task is None:
        task = ""
    else:
        task = str(task)

    print(system_prompt)
    # handle FINISH
    if selected_agent == "FINISH":
        # Generate comprehensive final response based on all collected context
        final_response_prompt = f"""
Be precise and to the point .Convey all message and action in less words so that user can understand easily. You have agents who worked to fulfill your guidance.

User's original query: {state.user_query}

All collected information from agents:
{json.dumps(state.context, indent=2,default=str)}

Agent execution history:
{chr(10).join([f"Step {d.step}: {d.selected_agent} - {d.task}" for d in state.decisions])}

Agent outputs:
{chr(10).join([f"{s.agent_name}: {s.agent_output}" for s in state.agent_states])}

Trade Executions Completed:
{json.dumps([t.dict() for t in state.trade_executions], indent=2,default=str)}

Previous conversation context:
Request summary: {state.request_summary}
Response summary: {state.response_summary}

Task: Synthesize all the above information into a clear, comprehensive, and well-structured response that directly answers the user's query.

Guidelines:
- Provide specific data points (crypto prices, quantities, percentages, sentiment scores, portfolio impact, etc.)
- Structure the response logically with proper formatting
- Be concise but complete
- If multiple items were requested, address each one
- Include relevant context and insights
- If trades were executed, confirm them clearly with details
- Do not mention agent names or internal processes
- Present the information as if you gathered it yourself
- Include risk warnings where appropriate

Provide your final response as plain text (not JSON).
"""

        final_response = llm.invoke(final_response_prompt)

        # Extract content from response
        if hasattr(final_response, "content"):
            state.final_output = final_response.content
        elif isinstance(final_response, str):
            state.final_output = final_response
        else:
            state.final_output = str(final_response)

        state.current_task = None
        return state

    # record decision
    decision = SupervisorDecision(
        step=step,
        selected_agent=selected_agent,
        reasoning=reasoning,
        task=task
    )
    state.decisions.append(decision)
    state.current_task = task

    return state

