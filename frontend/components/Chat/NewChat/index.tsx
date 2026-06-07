import { useState, useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import { getUserId } from "../../../utils/userStorage";
import { getUserStrategies } from "../../../services/strategy.service";

type MessageContent = {
  type: "supervisor" | "agent" | "supervisor_final" | "error" | "unknown";
  currentTask?: string;
  selectedAgent?: string;
  reasoning?: string;
  step?: number;
  timestamp?: string;
  agentName?: string;
  agentInput?: string;
  toolsUsed?: string[];
  agentOutput?: string;
  finalOutput?: string;
  text?: string;
};

type Message = {
  from: "me" | "server";
  text?: string;
  content?: MessageContent;
  raw?: any;
  timestamp: string;
};

type AgentChatProps = {
  websocketUrl?: string;
  externalMessage?: string;
  onMessageSent?: () => void;
  onProcessingChange?: (isProcessing: boolean) => void;
};

const AgentChat = ({
  // websocketUrl = "ws://127.0.0.1:8000/ws/chat",
  websocketUrl = `${process.env.NEXT_PUBLIC_AI_BASE_URL}/chat`,
  externalMessage,
  onMessageSent,
  onProcessingChange,
}: AgentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageRef = useRef<string>("");

  const generateUniqueThreadId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user ID and thread ID (strategy ID) on mount
  useEffect(() => {
    const fetchUserAndStrategy = async () => {
      const currentUserId = getUserId();
      if (!currentUserId) {
        console.error("No user ID found. Please log in.");
        return;
      }

      setUserId(currentUserId);

      try {
        const strategies = await getUserStrategies(currentUserId);
        if (strategies && strategies.length > 0) {
          // Use the first strategy as thread_id
          // setThreadId(strategies[0]._id);

          const threadId = generateUniqueThreadId();
          setThreadId(threadId);

          // console.log("Using strategy as thread_id:", strategies[0]._id);
          console.log("Using strategy as thread_id:", threadId);
        } else {
          console.warn(
            "No strategies found for user. Create a strategy first."
          );
        }
      } catch (error) {
        console.error("Failed to fetch strategies:", error);
      }
    };

    fetchUserAndStrategy();
  }, []);

  // Notify parent component when processing state changes
  useEffect(() => {
    onProcessingChange?.(isProcessing);
  }, [isProcessing, onProcessingChange]);

  // Helper function to make agent names more readable
  const formatAgentNameForDisplay = (agentName: string): string => {
    // Convert camelCase or snake_case to Title Case with spaces
    return agentName
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/_/g, " ") // Replace underscores with spaces
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatResponse = (data: any): MessageContent => {
    // Extract state from chunk response
    const state = data.state;
    if (!state) {
      return {
        type: "unknown",
        text: JSON.stringify(data, null, 2),
      };
    }

    // Handle Supervisor responses
    if (state.supervisor) {
      const supervisor = state.supervisor;

      // Check if this is the final response (current_task is null and final_output exists)
      if (supervisor.current_task === null && supervisor.final_output) {
        return {
          type: "supervisor_final",
          finalOutput: supervisor.final_output,
          timestamp:
            supervisor.decisions[supervisor.decisions.length - 1]?.timestamp,
        };
      }

      // Initial/intermediate supervisor response
      const latestDecision =
        supervisor.decisions[supervisor.decisions.length - 1];
      return {
        type: "supervisor",
        currentTask: supervisor.current_task,
        selectedAgent: latestDecision?.selected_agent,
        reasoning: latestDecision?.reasoning,
        step: latestDecision?.step,
        timestamp: latestDecision?.timestamp,
      };
    }

    // Handle Agent responses (sentiment_agent, finance_agent, trade_agent, etc.)
    const agentKey = Object.keys(state).find((key) => key.endsWith("_agent"));
    if (agentKey) {
      const agentData = state[agentKey];
      const agentStates = agentData.agent_states;

      // agent_states is now an array, get the latest one
      if (agentStates && agentStates.length > 0) {
        const latestAgentState = agentStates[agentStates.length - 1];
        const latestDecision =
          agentData.decisions[agentData.decisions.length - 1];

        // Extract tool names
        const toolNames = latestAgentState.tool_call_response_pair.map(
          (tool: any) => tool.tool_name
        );

        console.log("Found agent data:", latestAgentState.agent_name);

        return {
          type: "agent",
          agentName: formatAgentNameForDisplay(latestAgentState.agent_name),
          agentInput: latestAgentState.agent_input,
          toolsUsed: toolNames,
          agentOutput: latestAgentState.agent_output,
          timestamp: latestDecision?.timestamp,
        };
      }
    }

    // Fallback for unknown format
    return {
      type: "unknown",
      text: JSON.stringify(data, null, 2),
    };
  };

  // WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket(websocketUrl);

    ws.current.onopen = () => {
      console.log("✅ Connected to WebSocket");
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log("Received:", event.data);

      try {
        const data = JSON.parse(event.data);

        // Check if this is the final signal
        if (data.type === "final") {
          setIsProcessing(false);
          console.log("✅ Workflow completed. Ready for next message.");
          return;
        }

        // Handle chunk type responses
        if (data.type === "chunk" && data.state) {
          // Format the message based on response type
          const formattedMessage = formatResponse(data);

          setMessages((prev) => [
            ...prev,
            {
              from: "server",
              content: formattedMessage,
              raw: data,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        } else {
          console.warn("Unknown message type:", data);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        setMessages((prev) => [
          ...prev,
          {
            from: "server",
            content: { type: "error", text: String(event.data) },
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("❌ Disconnected from WebSocket");
      setIsConnected(false);
      setIsProcessing(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [websocketUrl]);

  const sendMessage = (messageText: string) => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      messageText.trim() !== ""
    ) {
      if (!userId || !threadId) {
        console.error("Cannot send message: userId or threadId is missing");
        alert("Please wait for initialization or create a strategy first.");
        return;
      }

      const payload = {
        user_id: userId,
        // thread_id: threadId,
        thread_id: "6910c42cdcd64af5c6cfac34",
        message: messageText,
      };
      console.log("Sending:", payload);
      ws.current.send(JSON.stringify(payload));
      setMessages((prev) => [
        ...prev,
        {
          from: "me",
          text: messageText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsProcessing(true);
      onMessageSent?.();
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  // Handle external message from parent component
  useEffect(() => {
    if (
      externalMessage &&
      externalMessage.trim() !== "" &&
      externalMessage !== prevMessageRef.current
    ) {
      prevMessageRef.current = externalMessage;
      sendMessage(externalMessage);
    }
  }, [externalMessage]);

  const renderMessage = (msg: Message) => {
    if (msg.from === "me") {
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-theme-brand text-theme-white-fixed rounded-2xl px-4 py-3">
            <p className="text-body-1m">{msg.text}</p>
            <span className="text-caption-1m opacity-70 mt-1 block">
              {msg.timestamp}
            </span>
          </div>
        </div>
      );
    }

    const content = msg.content;
    if (!content) return null;

    // Render based on content type
    if (content.type === "supervisor") {
      return (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-purple flex items-center justify-center">
            <Icon className="w-4 h-4 fill-white" name="route" />
          </div>

          <div className="flex-1 max-w-[85%]">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-body-1s text-theme-primary">
                Supervisor Agent
              </span>
            </div>

            <div className="rounded-2xl px-4 py-3 bg-theme-on-surface border border-theme-stroke space-y-2">
              <div>
                <span className="text-body-2s text-theme-secondary">
                  Current Task:
                </span>
                <p className="text-body-1m text-theme-primary mt-1">
                  {content.currentTask}
                </p>
              </div>

              <div>
                <span className="text-body-2s text-theme-secondary">
                  Selected Agent:
                </span>
                <span className="ml-2 px-2 py-1 bg-theme-purple/10 text-theme-purple rounded text-caption-1m">
                  {content.selectedAgent}
                </span>
              </div>

              <div>
                <span className="text-body-2s text-theme-secondary">
                  Reasoning:
                </span>
                <p className="text-body-1m text-theme-tertiary mt-1 italic">
                  {content.reasoning}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-theme-stroke">
                <span className="text-caption-1m text-theme-tertiary">
                  Step {content.step}
                </span>
                <span className="text-caption-1m text-theme-tertiary">
                  {content.timestamp}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (content.type === "agent") {
      return (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-1 flex items-center justify-center">
            <Icon className="w-4 h-4 fill-white" name="cpu" />
          </div>

          <div className="flex-1 max-w-[85%]">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-body-1s text-theme-primary">
                {content.agentName}
              </span>
            </div>

            <div className="rounded-2xl px-4 py-3 bg-theme-on-surface border border-theme-stroke space-y-2">
              <div>
                <span className="text-body-2s text-theme-secondary">Task:</span>
                <p className="text-body-1m text-theme-primary mt-1">
                  {content.agentInput}
                </p>
              </div>

              <div>
                <span className="text-body-2s text-theme-secondary">
                  Tools Used:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {content.toolsUsed?.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary-1/10 text-primary-1 rounded text-caption-1m"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-body-2s text-theme-secondary">
                  Output:
                </span>
                <div className="mt-2 p-3 bg-theme-surface rounded text-theme-primary text-caption-1m whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {content.agentOutput}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-theme-stroke">
                <span className="text-caption-1m text-theme-tertiary">
                  {content.timestamp}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (content.type === "supervisor_final") {
      return (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-green flex items-center justify-center">
            <Icon className="w-4 h-4 fill-white" name="check-circle" />
          </div>

          <div className="flex-1 max-w-[85%]">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-body-1s text-theme-primary">
                Task Completed
              </span>
            </div>

            <div className="rounded-2xl px-4 py-3 bg-theme-green-100 border border-theme-green space-y-2">
              <div className="p-3  rounded-lg">
                {/* <span className="text-body-2s text-theme-secondary block mb-2">
                  Final Output:
                </span> */}
                <p className="text-body-1m text-theme-primary whitespace-pre-wrap text-gray-700">
                  {content.finalOutput}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <span className="text-caption-1m text-theme-tertiary">
                  {content.timestamp}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Unknown format fallback
    return (
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-secondary flex items-center justify-center">
          <Icon className="w-4 h-4 fill-white" name="alert-circle" />
        </div>

        <div className="flex-1 max-w-[85%]">
          <div className="rounded-2xl px-4 py-3 bg-theme-on-surface border border-theme-stroke">
            <pre className="text-caption-1m text-theme-primary whitespace-pre-wrap">
              {content.text}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-4xl mx-auto card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-stroke">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title-1s text-theme-primary">
              AI Agent Collaboration
            </h2>
            <p className="text-body-2s text-theme-secondary">
              Watch agents work together to analyze your signals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-theme-green animate-pulse" : "bg-theme-red"
              }`}
            ></div>
            <span className="text-body-2s text-theme-secondary">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-theme-tertiary mt-16">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-body-1m">
                Start a conversation with the AI agents
              </p>
              <p className="text-body-2s mt-2">
                Try asking: "Give me the sentiment of BTC"
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="animate-slideIn">
              {renderMessage(msg)}
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-theme-secondary pl-11">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-theme-brand rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-theme-brand rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-theme-brand rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
              <span className="text-body-2s">Processing...</span>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AgentChat;

// Add to global CSS
const animationStyles = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
`;
