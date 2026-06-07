from api.xample import EXAMPLE_STRATEGY_CODE1 ,EXAMPLE_STRATEGY_CODE2 
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import json
import asyncio
from datetime import datetime

# Import your existing backtest functions
import os
import subprocess
import tempfile
import sys
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Initialize FastAPI app
app = FastAPI(
    title="Trading Strategy Backtest API",
    description="Generate and backtest trading strategies using natural language",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            model="gpt-4o-mini",
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
@app.get("/")
async def root():
    return {
        "message": "Trading Strategy Backtest API",
        "endpoints": {
            "POST /backtest": "Run a backtest (synchronous)",
            "WebSocket /ws/backtest": "Run a backtest with live updates"
        }
    }


@app.post("/backtest", response_model=BacktestResponse)
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
@app.websocket("/ws/backtest")
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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)