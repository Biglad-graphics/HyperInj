"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/Icon";
import { getUserId } from "../../../utils/userStorage";
import TradeCard, { TradeSignal } from "../TradeCard";
import { fetchTradeSignal, isTradeRelated } from "../../../services/tradeSignal.service";

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
  websocketUrl = `${process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8000"}/ws/chat`,
  externalMessage,
  onMessageSent,
  onProcessingChange,
}: AgentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [tradeSignal, setTradeSignal] = useState<TradeSignal | null>(null);
  const lastUserMessageRef = useRef<string>("");
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageRef = useRef<string>("");

  const generateUniqueThreadId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 12; i++) {
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

      // Always generate a thread ID so users can chat without a strategy
      const newThreadId = generateUniqueThreadId();
      setThreadId(newThreadId);
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

  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(2000);
  const unmounted = useRef(false);

  const connect = () => {
    if (unmounted.current) return;
    const socket = new WebSocket(websocketUrl);
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      reconnectDelay.current = 2000;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "final") {
          setIsProcessing(false);
          if (isTradeRelated(lastUserMessageRef.current)) {
            fetchTradeSignal(lastUserMessageRef.current).then((signal) => {
              if (signal) setTradeSignal(signal);
            });
          }
          return;
        }

        if (data.type === "error") {
          setIsProcessing(false);
          setMessages((prev) => [
            ...prev,
            {
              from: "server",
              content: { type: "error", text: data.message || "An error occurred." },
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          return;
        }

        if (data.type === "chunk" && data.state) {
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
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    socket.onerror = () => { /* handled by onclose */ };

    socket.onclose = () => {
      setIsConnected(false);
      setIsProcessing(false);
      if (!unmounted.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 15000);
          connect();
        }, reconnectDelay.current);
      }
    };
  };

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        thread_id: threadId,
        message: messageText,
      };
      lastUserMessageRef.current = messageText;
      setTradeSignal(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMessage]);

  const renderMessage = (msg: Message) => {
    if (msg.from === "me") {
      return (
        <div className="flex justify-end">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="max-w-[80%] bg-theme-brand text-theme-white-fixed rounded-2xl px-4 py-3"
          >
            <p className="text-body-1m">{msg.text}</p>
            <span className="text-caption-1m opacity-70 mt-1 block">{msg.timestamp}</span>
          </motion.div>
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

    // Error / unknown fallback
    return (
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-red/20 flex items-center justify-center">
          <Icon className="w-4 h-4 fill-theme-red" name="alert-circle" />
        </div>
        <div className="flex-1 max-w-[85%]">
          <div className="rounded-2xl px-4 py-3 bg-theme-red/10 border border-theme-red/20">
            <p className="text-body-2s text-theme-red font-medium mb-0.5">Agent error</p>
            <p className="text-caption-1m text-theme-secondary whitespace-pre-wrap">
              {content.text}
            </p>
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
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center px-6 pb-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-theme-brand/10 flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 fill-theme-brand" name="star-plus" />
              </div>
              <p className="text-body-1s text-theme-primary mb-1">HyperInj Copilot</p>
              <p className="text-body-2s text-theme-tertiary">
                Ask anything — market trends, trade signals, or just "Should I buy INJ?"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderMessage(msg)}
            </motion.div>
          ))}

          <AnimatePresence>
            {isProcessing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-3 pl-2"
              >
                <div className="w-8 h-8 rounded-full bg-theme-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 fill-theme-brand" name="star-plus" />
                </div>
                <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-theme-on-surface border border-theme-stroke">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 rounded-full bg-theme-brand"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {tradeSignal && (
              <motion.div
                key="tradecard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TradeCard signal={tradeSignal} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AgentChat;
