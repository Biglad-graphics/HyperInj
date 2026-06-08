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

function extractFromChunk(state: any): Partial<AgenticMessage> | null {
  if (!state) return null;

  // State can be nested under "supervisor" key or flat
  const supervisor = state?.supervisor ?? state;

  const final_output: string = supervisor?.final_output ?? "";
  const decisions: AgenticDecision[] = supervisor?.decisions ?? [];
  const trace: string[] = supervisor?.trace ?? [];

  return { final_output, decisions, trace };
}

export const useAgenticWebSocket = (
  userId: string | null,
  strategyId: string | null
): UseAgenticWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<AgenticMessage[]>([]);
  const [latestOutput, setLatestOutput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  // Accumulate the latest partial message while chunks arrive
  const pendingRef = useRef<Partial<AgenticMessage>>({});

  useEffect(() => {
    if (!userId || !strategyId) return;

    const socket = new WebSocket(`${WS_BASE}/ws/chat`);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);

        if (frame.type === "chunk") {
          const extracted = extractFromChunk(frame.state);
          if (extracted) {
            // Merge into pending — later chunks overwrite earlier ones
            pendingRef.current = {
              decisions: extracted.decisions?.length ? extracted.decisions : pendingRef.current.decisions ?? [],
              final_output: extracted.final_output || pendingRef.current.final_output || "",
              trace: extracted.trace?.length ? extracted.trace : pendingRef.current.trace ?? [],
            };
            if (extracted.final_output) {
              setLatestOutput(extracted.final_output);
            }
          }
        } else if (frame.type === "final") {
          // Commit the accumulated message to the list
          const completed = pendingRef.current as AgenticMessage;
          if (completed.final_output || (completed.decisions ?? []).length > 0) {
            setMessages((prev) => [...prev, completed]);
            setLatestOutput(completed.final_output ?? "");
          }
          pendingRef.current = {};
          setIsThinking(false);
        } else if (frame.type === "error") {
          pendingRef.current = {};
          setIsThinking(false);
        }
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
      pendingRef.current = {};
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
    pendingRef.current = {};
  }, []);

  return { messages, latestOutput, isConnected, isThinking, sendMessage, clearMessages };
};
