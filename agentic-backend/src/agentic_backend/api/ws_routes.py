from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from uuid import uuid4
from ..models.state_models import SupervisorState
from ..services.orchestrator import run_sync
from ..services.persistence import get_thread_memory, update_thread_memory
from fastapi.encoders import jsonable_encoder
from typing import List, Dict
import asyncio
from ..api.xample import EXAMPLE_STRATEGY_CODE1 ,EXAMPLE_STRATEGY_CODE2 
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import json
import asyncio
import os
from datetime import datetime
import ast
from datetime import datetime
import subprocess
import tempfile
import sys
from openai import OpenAI
from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())
router = APIRouter()

def serialize_state(obj):
    """
    Recursively serialize any object to JSON-compatible format.
    Handles Pydantic models, datetime objects, and nested structures.
    """
    # Handle None
    if obj is None:
        return None
    
    # Handle Pydantic models
    if hasattr(obj, 'model_dump'):
        return obj.model_dump(mode='json')
    
    # Handle datetime objects
    if isinstance(obj, datetime):
        return obj.isoformat()
    
    # Handle dictionaries
    if isinstance(obj, dict):
        return {key: serialize_state(value) for key, value in obj.items()}
    
    # Handle lists
    if isinstance(obj, list):
        return [serialize_state(item) for item in obj]
    
    # Handle tuples
    if isinstance(obj, tuple):
        return [serialize_state(item) for item in obj]
    
    # Return primitive types as-is
    if isinstance(obj, (str, int, float, bool)):
        return obj
    
    # For anything else, try to convert to string
    try:
        return str(obj)
    except:
        return None
#   const payload = {
#     user_id: userId,
#     strategy_id: strategyId,
#     timeframe: timeframe,
#     asset_symbol: assetSymbol,
#     indicator_name: indicatorName,
#     direction: direction
#   }

import traceback
@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            msg = await websocket.receive_text()
            msg = ast.literal_eval(msg)
            
            thread_id = msg.get("thread_id", "default")
            user_id = msg.get("user_id", "User")
            user_message = msg.get("message", "")
            print(f"Received message for thread {thread_id}: {user_message}")

            # Load existing memory for this thread
            print("==========================================",type(thread_id),type(user_id))
            memory = get_thread_memory(user_id, thread_id)
            print("=============================================================",memory)
            # Create state with memory context
            incoming_state = SupervisorState(
                user_query=user_message,
                request_summary=memory["request_summary"] if memory else None,
                response_summary=memory["response_summary"] if memory else None,
                user_detail=user_id,
                thread_id=thread_id,
            )
            # print(incoming_state)

            # Track only the final state
            final_state = None
            kwargs={
                "user_id":user_id,
                
            }
            try:
                async for chunk in run_sync(incoming_state, thread_id=thread_id, **kwargs):
                    chunk_data = serialize_state(chunk)

                    # Keep updating final_state (last one will have everything)
                    final_state = chunk_data

                    await websocket.send_json({
                        "type": "chunk",
                        "thread_id": thread_id,
                        "state": chunk_data
                    })

            except asyncio.CancelledError:
                print(f"WebSocket task cancelled for thread {thread_id}")
                break

            except Exception as e:
                tb = traceback.format_exc()
                print("Exception occurred:", tb)
                try:
                    await websocket.send_json({
                        "type": "error",
                        "thread_id": thread_id,
                        "message": str(e) or tb
                    })
                except Exception:
                    # WebSocket might already be closed
                    pass
                break

            # Update memory after conversation turn
            if final_state:
                # Extract final output from the nested state structure
                state_obj = final_state.get("supervisor") if isinstance(final_state, dict) else final_state
                final_output = state_obj.get("final_output") if isinstance(state_obj, dict) else getattr(state_obj, "final_output", None)

                # Save complete conversation turn with final state (which includes full execution)
                conversation_entry = {
                    "user_query": user_message,
                    "final_state": final_state,  # Complete state with all decisions, agent_states, context
                    "final_response": final_output or "Processing...",
                }

                # Update memory with summaries and raw conversation
                update_thread_memory(
                    user_id=user_id,
                    thread_id=thread_id,
                    request_summary=f"{user_message}",
                    response_summary=f"{final_output or 'Processing...'}",
                    conversation_entry=conversation_entry
                )

            # Send final message
            try:
                await websocket.send_json({
                    "type": "final",
                    "thread_id": thread_id
                })
            except Exception:
                # WebSocket might already be closed
                pass

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except asyncio.CancelledError:
        print("WebSocket connection cancelled during shutdown")
    except Exception as e:
        print(f"Unexpected WebSocket error: {e}")

# @router.websocket("/ws/spy")
# async def cron_point(websocket: WebSocket):
#     await websocket.accept()

#     try:
#         while True:
#             msg = await websocket.receive_text()
#             msg = ast.literal_eval(msg)
#             user_id = msg.get("user_id", "default")
#             strategy_id=msg.get("strategyId","default")







@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.get("/threads/{user_id}")
async def get_user_thread_list(user_id: str):
    """Get all thread IDs for a user with their request summaries and last updated timestamps."""
    from ..services.persistence import get_user_threads, get_thread_memory
    thread_ids = get_user_threads(user_id)

    # Build thread list with summaries and timestamps
    threads = []
    for thread_id in thread_ids:
        memory = get_thread_memory(user_id, thread_id)
        threads.append({
            "thread_id": thread_id,
            "request_summary": memory.get("request_summary", "") if memory else "",
            "last_updated": memory.get("last_updated", "") if memory else ""
        })

    # Sort by last_updated descending (most recent first)
    threads.sort(key=lambda x: x["last_updated"], reverse=True)

    return {"user_id": user_id, "threads": threads}


@router.get("/threads/{user_id}/{thread_id}")
async def get_thread_history(user_id: str, thread_id: str):
    """Get conversation history for a specific thread."""
    memory = get_thread_memory(user_id, thread_id)
    if not memory:
        return {"error": "Thread not found"}
    return {
        "user_id": user_id,
        "thread_id": thread_id,
        "memory": memory
    }


@router.delete("/threads/{user_id}/{thread_id}")
async def delete_thread(user_id: str, thread_id: str):
    """Delete a conversation thread."""
    from ..services.persistence import clear_thread_memory
    clear_thread_memory(user_id, thread_id)
    return {"status": "deleted", "user_id": user_id, "thread_id": thread_id}


@router.get("/threads/{user_id}/{thread_id}/report")
async def generate_thread_report(user_id: str, thread_id: str):
    """Generate a markdown report for a specific thread using LLM."""
    from ..services.persistence import get_thread_memory
    from langchain.chat_models import init_chat_model
    from dotenv import load_dotenv, find_dotenv

    load_dotenv(find_dotenv())

    # Get conversation history
    memory = get_thread_memory(user_id, thread_id)
    if not memory:
        return {"error": "Thread not found"}

    # Extract conversation entries
    conversation_history = memory.get("raw_conversation", [])
    if not conversation_history:
        return {"error": "No conversation history found for this thread"}

    # Build context from conversation history
    conversation_text = ""
    for idx, entry in enumerate(conversation_history, 1):
        user_query = entry.get("user_query", "")
        final_response = entry.get("final_response", "")
        conversation_text += f"\n### Exchange {idx}\n**User Query:** {user_query}\n\n**Response:** {final_response}\n"

    # Initialize LLM
    llm = init_chat_model("openai:gpt-4o-mini")

    # Create prompt for report generation
    report_prompt = f"""
You are a professional financial report writer. Generate a comprehensive markdown report based on the following conversation history between a user and a financial advisory system.

Thread ID: {thread_id}
User ID: {user_id}

Conversation History:
{conversation_text}

Generate a well-structured markdown report that includes:
1. **Executive Summary**: Brief overview of the conversation and key topics discussed
2. **Key Queries and Insights**: Summarize each major query and the insights provided
3. **Financial Recommendations**: Consolidate any recommendations or advice given
4. **Data Points**: List important financial metrics, stock prices, or data mentioned
5. **Action Items**: Any suggested actions or next steps for the user
6. **Conclusion**: Final summary and overall assessment

Requirements:
- Use proper markdown formatting (headers, lists, bold, italic, tables if appropriate)
- Be concise but comprehensive
- Focus on financial insights and actionable information
- Use professional language
- Structure the report logically
- Return ONLY plain markdown content without any code fence markers (no ```markdown, no ```, no triple backticks)
- Do not wrap the markdown in code blocks

Generate the markdown report now:
"""

    # Generate report using LLM
    response = llm.invoke(report_prompt)

    # Extract markdown content
    if hasattr(response, "content"):
        markdown_report = response.content

    # Remove markdown code fence markers if present
    markdown_report = markdown_report.strip()
    # Remove opening fence (```markdown, ```md, or ```)
    if markdown_report.startswith("```"):
        # Remove the backticks and any language identifier
        lines = markdown_report.split("\n")
        lines = lines[1:]  # Remove first line with opening fence
        markdown_report = "\n".join(lines)

    # Remove closing fence (```)
    if markdown_report.endswith("```"):
        lines = markdown_report.split("\n")
        lines = lines[:-1]  # Remove last line with closing fence
        markdown_report = "\n".join(lines)

    markdown_report = markdown_report.strip()

    # Return strict markdown
    return {
        "user_id": user_id,
        "thread_id": thread_id,
        "report": markdown_report,
        "format": "markdown"
    }



# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Pydantic models
class BacktestRequest(BaseModel):
    strategy_description: str = Field(..., description="Natural language description of the trading strategy")
    ticker: str = Field(default="ETH-USD", description="Stock/crypto ticker symbol")
    days: int = Field(default=365, ge=1, le=3650, description="Number of historical days to backtest")

class BacktestResponse(BaseModel):
    status: str
    strategy_description: str
    ticker: str
    days: int
    backtest_results: Optional[dict] = None
    generated_code: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None

def generate_strategy_code(strategy_description: str, ticker: str = "ETH-USD", days: int = 365) -> str:
    """Generate backtesting code using GPT-4 Mini"""
    
    prompt = f"""
You are an expert quantitative trading developer. Generate production-ready Python backtesting code using the Backtrader framework.

CRITICAL REQUIREMENTS:
1. Use the EXACT structure, imports, and coding style from the reference example code provided.
2. Generate ONLY valid, error-free Python code.
3. Output ONLY the complete Python script with NO explanations, markdown, or extra text.
4. Use ticker: {ticker}
5. Use historical days: {days} and interval: 1d
6. All indicators used must be configurable via strategy params.
7. Strategy trading logic must generate multiple trades.
8. Use notify_trade() or notify_order() to log closed trades.
9. Use only cerebro.broker.setcommission(commission=0.001).
10. Set starting cash to 10000.
11. Add all standard analyzers: TradeAnalyzer, SharpeRatio, DrawDown, Returns, SQN, AvgHoldPeriod.
12. Output JSON report with markers __JSON_REPORT_START__ and __JSON_REPORT_END__.
13. NEVER use emoji characters (🚀, 📊, etc.) in print statements - use ASCII text only.
14. Ensure all code is compatible with Windows cp1252 and UTF-8 encoding.

REFERENCE EXAMPLES:
Example 1:
{EXAMPLE_STRATEGY_CODE1}

Example 2:
{EXAMPLE_STRATEGY_CODE2}

USER STRATEGY:
{strategy_description}

Generate complete backtesting code now. Output ONLY the code.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional Python developer specializing in quantitative trading. Generate only valid, executable code."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=4000
        )
        
        generated_code = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if generated_code.startswith("```"):
            generated_code = generated_code.split("```")[1]
            if generated_code.startswith("python"):
                generated_code = generated_code[6:]
        if generated_code.endswith("```"):
            generated_code = generated_code[:-3]
        
        return generated_code.strip()
    
    except Exception as e:
        raise Exception(f"Error generating code with OpenAI: {str(e)}")


def run_backtest_subprocess(generated_code: str) -> dict:
    """Run backtest in subprocess and return results"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as tmp_file:
        tmp_file.write(generated_code)
        tmp_file_path = tmp_file.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_file_path],
            capture_output=True,
            text=True,
            timeout=300
        )

        output = result.stdout
        error_output = result.stderr
        json_report = None
        error_message = None

        if "__JSON_REPORT_START__" in output and "__JSON_REPORT_END__" in output:
            try:
                json_str = output.split("__JSON_REPORT_START__")[1].split("__JSON_REPORT_END__")[0].strip()
                json_report = json.loads(json_str)
            except json.JSONDecodeError as e:
                error_message = f"JSON parse error: {str(e)}"

        # If execution failed, capture stderr as error message
        if result.returncode != 0 and error_output:
            error_message = error_output.strip()

        return {
            "status": "success" if result.returncode == 0 and json_report else "error",
            "backtest_results": json_report,
            "stdout": output,
            "stderr": error_output,
            "return_code": result.returncode,
            "error": error_message
        }

    except subprocess.TimeoutExpired:
        return {"status": "timeout", "error": "Backtest execution timed out", "return_code": -1}
    except Exception as e:
        return {"status": "error", "error": str(e), "return_code": -1}
    finally:
        try:
            os.unlink(tmp_file_path)
        except:
            pass


# REST API Endpoints
@router.get("/")
async def root():
    return {
        "message": "Trading Strategy Backtest API",
        "endpoints": {
            "POST /backtest": "Run a backtest (synchronous)",
            "WebSocket /ws/backtest": "Run a backtest with live updates"
        }
    }


@router.post("/backtest", response_model=BacktestResponse)
async def backtest_strategy(request: BacktestRequest):
    """
    Synchronous backtest endpoint - returns results after completion
    """
    start_time = datetime.now()
    
    try:
        # Generate code
        generated_code = generate_strategy_code(
            request.strategy_description,
            request.ticker,
            request.days
        )
        
        # Run backtest
        backtest_result = run_backtest_subprocess(generated_code)
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Prepare error message with detailed info
        error_msg = backtest_result.get("error")
        if not error_msg and backtest_result["status"] == "error":
            stderr = backtest_result.get("stderr", "")
            if stderr:
                error_msg = f"Execution error: {stderr[:500]}"  # Limit error message length
            else:
                error_msg = "Backtest failed with unknown error"

        return BacktestResponse(
            status=backtest_result["status"],
            strategy_description=request.strategy_description,
            ticker=request.ticker,
            days=request.days,
            backtest_results=backtest_result.get("backtest_results"),
            generated_code=generated_code,
            error=error_msg,
            execution_time=execution_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket Endpoint
@router.websocket("/ws/backtest")
async def websocket_backtest(websocket: WebSocket):
    """
    WebSocket endpoint - streams code generation and backtest results
    """
    await websocket.accept()
    
    try:
        # Receive backtest request
        data = await websocket.receive_json()
        
        strategy_description = data.get("strategy_description")
        ticker = data.get("ticker", "ETH-USD")
        days = data.get("days", 365)
        
        if not strategy_description:
            await websocket.send_json({
                "type": "error",
                "message": "strategy_description is required"
            })
            await websocket.close()
            return
        
        # Send acknowledgment
        await websocket.send_json({
            "type": "status",
            "message": "Generating strategy code...",
            "progress": 10
        })
        
        # Generate code
        try:
            generated_code = generate_strategy_code(strategy_description, ticker, days)
            
            # Send generated code
            await websocket.send_json({
                "type": "code_generated",
                "message": "Strategy code generated successfully",
                "progress": 40,
                "data": {
                    "generated_code": generated_code,
                    "code_length": len(generated_code)
                }
            })
            
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Code generation failed: {str(e)}"
            })
            await websocket.close()
            return
        
        # Send backtest starting message
        await websocket.send_json({
            "type": "status",
            "message": "Running backtest...",
            "progress": 60
        })
        
        # Run backtest
        try:
            backtest_result = run_backtest_subprocess(generated_code)

            # Send backtest results
            message_text = "Backtest completed successfully" if backtest_result["status"] == "success" else f"Backtest failed: {backtest_result.get('error', 'Unknown error')}"
            await websocket.send_json({
                "type": "backtest_complete",
                "message": message_text,
                "progress": 100,
                "data": {
                    "status": backtest_result["status"],
                    "strategy_description": strategy_description,
                    "ticker": ticker,
                    "days": days,
                    "backtest_results": backtest_result.get("backtest_results"),
                    "error": backtest_result.get("error"),
                    "stderr": backtest_result.get("stderr") if backtest_result.get("stderr") else None,
                    "return_code": backtest_result.get("return_code")
                }
            })
            
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Backtest execution failed: {str(e)}"
            })
        
        # Keep connection open briefly then close
        await asyncio.sleep(1)
        await websocket.close()
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Unexpected error: {str(e)}"
            })
            await websocket.close()
        except:
            pass