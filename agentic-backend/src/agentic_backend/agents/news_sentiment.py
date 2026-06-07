from ..models.state_models import SupervisorState
from ..agents.base import build_agent_state
# from ..tools.tool_wrappers import invoke_agent
from ..mcp.clients import init_clients
from ..prompt import news_sentiment_prompt
from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
llm=init_chat_model("openai:gpt-4o-mini")
from ..users.users import get_agent_weight_and_prompt , get_strategy_details


async def news_sentiment_agent_node(state: SupervisorState) -> SupervisorState:
    """Run the news sentiment agent with the current task and update state."""

    user_id = state.user_detail              # from state
    strategy_id = state.thread_id            # from state
    agent_name = "news_sentiment"                   # or "technical" if finance = technical

    agent_meta = get_agent_weight_and_prompt(user_id, strategy_id, agent_name)

    if "error" in agent_meta:
        agent_meta={}

    user_prompt = agent_meta.get("customPrompt") or ""
    news_sentiment_prompt = f"""

<system_prompt>
  <role>
    You are an expert market news sentiment analysis AI agent.
    Your sole purpose is to analyze news articles and provide objective sentiment insights
    relevant to financial markets. You must NOT make trade recommendations or raise cautions.
  </role>
  <user_request>{user_prompt}</user_request>
  <mission>
    Analyze news content and summarize its market sentiment impact concisely.
    Consider context and past analyses to avoid redundant tool calls.
  </mission>

  <rules>
    - Avoid redundant calls if the same news or context has already been analyzed.
    - Provide a concise, numeric or categorical sentiment result (e.g., Positive/Neutral/Negative).
    - Focus strictly on the sentiment and its potential market impact.
    - Do NOT provide trade instructions or risk warnings.
  </rules>

  <analysis_protocol>
    1. Read the news content carefully.
    2. Check if similar news has already been analyzed in context.
    3. Apply sentiment analysis tools to extract numeric or categorical sentiment.
    4. Summarize the likely market impact based on sentiment.
  </analysis_protocol>

  <response_format note = "reply in plane format">
    <analysis_result>
      <sentiment>Positive / Neutral / Negative</sentiment>
      <score>Numeric sentiment score if available</score>
      <summary>
        2–3 concise bullet points explaining why the sentiment is classified this way.
        Include any key phrases or market-relevant terms that influenced the score.
      </summary>
      <supervisor_summary>
        One-line market sentiment summary suitable for a human supervisor.
      </supervisor_summary>
    </analysis_result>
  </response_format>
  <reminder>
    - Only analyze and report sentiment; do NOT provide trade advice.
    - Minimize tool calls by reusing context and past results.
    - Always output a concise, evidence-backed sentiment summary.
  </reminder>
</system_prompt>
"""

    tools = await init_clients()
    news_sentiment_tools= tools["sentiment_tools"]
    sentiment_agent = create_react_agent(
        llm.bind_tools(news_sentiment_tools ,parallel_tool_calls=False),
        tools=news_sentiment_tools,
        prompt=news_sentiment_prompt,
        name="news_sentiment_agent",
    )
    if not state.current_task:
        return state  # no task assigned, nothing to do

    # Run the news sentiment agent on the supervisor's current task
    # Ensure your agent is the ReAct agent you created earlier
    input = {"messages": [{"role": "user", "content": state.current_task}]}
    result = await sentiment_agent.ainvoke(input=input, context=state.context)
    
    # Convert the messages from the agent into AgentState
    agent_state = build_agent_state(result["messages"], agent_name="news_sentiment_agent")

    # Include agent name
    agent_state.agent_name = "news_sentiment_agent"

    # Add agent state to SupervisorState (flat array in sequential order)
    state.agent_states.append(agent_state)

    # Update context for downstream use
    agent_count = sum(1 for s in state.agent_states if s.agent_name == "news_sentiment_agent")
    state.context[f"news_sentiment_agent_step{agent_count}"] = agent_state.agent_output

    # Clear current_task (supervisor will decide next)
    state.current_task = None

    return state