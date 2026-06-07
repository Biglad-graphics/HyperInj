import { useState, useEffect, useRef, useCallback } from "react";

export interface AgenticDecision {
  step: number;
  selected_agent: string;
  reasoning: string;
  task: string;
}

export interface AgenticMessage {
  decisions: AgenticDecision[];
  final_output: string;
  trace: string[];
}

export interface UseAgenticWebSocketReturn {
  messages: AgenticMessage[];
  latestOutput: string;
  isConnected: boolean;
  isThinking: boolean;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

const WS_BASE = process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8000";

export const useAgenticWebSocket = (
  userId: string | null,
  strategyId: string | null
): UseAgenticWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<AgenticMessage[]>([]);
  const [latestOutput, setLatestOutput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (!userId || !strategyId) return;

    const socket = new WebSocket(`${WS_BASE}/ws/chat`);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event) => {
      try {
        const data: AgenticMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
        if (data.final_output) setLatestOutput(data.final_output);
        setIsThinking(false);
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);

    return () => socket.close();
  }, [userId, strategyId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
      setIsThinking(true);
      ws.current.send(
        JSON.stringify({
          user_id: userId,
          thread_id: strategyId,
          message: text,
        })
      );
    },
    [userId, strategyId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLatestOutput("");
  }, []);

  return { messages, latestOutput, isConnected, isThinking, sendMessage, clearMessages };
};
