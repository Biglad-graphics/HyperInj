"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/Icon";
import { getUserId } from "../../../utils/userStorage";

type Message = {
  id: string;
  from: "me" | "ai" | "error";
  text: string;
  timestamp: string;
  streaming?: boolean;
};

type AgentChatProps = {
  websocketUrl?: string;
  externalMessage?: string;
  onMessageSent?: () => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  selectedAgent?: string;
};

const AgentChat = ({
  websocketUrl = `${process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8000"}/ws/chat`,
  externalMessage,
  onMessageSent,
  onProcessingChange,
  selectedAgent = "injective_analyst",
}: AgentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageRef = useRef<string>("");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(2000);
  const unmounted = useRef(false);
  const streamingIdRef = useRef<string | null>(null);

  const generateId = () => Math.random().toString(36).slice(2, 10);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const uid = getUserId();
    if (uid) setUserId(uid);
    setThreadId(generateId() + generateId());
  }, []);

  useEffect(() => {
    onProcessingChange?.(isProcessing);
  }, [isProcessing, onProcessingChange]);

  const connect = useCallback(() => {
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
          streamingIdRef.current = null;
          setMessages((prev) =>
            prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
          );
          return;
        }

        if (data.type === "error") {
          setIsProcessing(false);
          streamingIdRef.current = null;
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              from: "error",
              text: data.message || "An error occurred. Please try again.",
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          return;
        }

        if (data.type === "chunk") {
          const finalOutput =
            data.state?.supervisor?.final_output ??
            data.state?.final_output ??
            null;
          if (!finalOutput) return;

          if (!streamingIdRef.current) {
            const id = generateId();
            streamingIdRef.current = id;
            setMessages((prev) => [
              ...prev,
              {
                id,
                from: "ai",
                text: finalOutput,
                timestamp: new Date().toLocaleTimeString(),
                streaming: true,
              },
            ]);
          } else {
            const sid = streamingIdRef.current;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === sid ? { ...m, text: finalOutput } : m
              )
            );
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    socket.onerror = () => {};
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websocketUrl]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !text.trim()) return;
      if (!userId || !threadId) return;

      ws.current.send(
        JSON.stringify({
          user_id: userId,
          thread_id: threadId,
          message: text,
          agent: selectedAgent,
        })
      );

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          from: "me",
          text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsProcessing(true);
      streamingIdRef.current = null;
      onMessageSent?.();
    },
    [userId, threadId, selectedAgent, onMessageSent]
  );

  useEffect(() => {
    if (
      externalMessage &&
      externalMessage.trim() &&
      externalMessage !== prevMessageRef.current
    ) {
      prevMessageRef.current = externalMessage;
      sendMessage(externalMessage);
    }
  }, [externalMessage, sendMessage]);

  const renderMessage = (msg: Message) => {
    if (msg.from === "me") {
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-theme-brand text-white rounded-2xl px-4 py-3">
            <p className="text-body-1m">{msg.text}</p>
            <span className="text-caption-1m opacity-60 mt-1 block">{msg.timestamp}</span>
          </div>
        </div>
      );
    }

    if (msg.from === "error") {
      return (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-red/20 flex items-center justify-center">
            <Icon className="w-4 h-4 fill-theme-red" name="alert-circle" />
          </div>
          <div className="rounded-2xl px-4 py-3 bg-theme-red/10 border border-theme-red/20 max-w-[85%]">
            <p className="text-caption-1m text-theme-red">{msg.text}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-brand/10 flex items-center justify-center">
          <Icon className="w-4 h-4 fill-theme-brand" name="star-plus" />
        </div>
        <div className="flex-1 max-w-[85%]">
          <div className="rounded-2xl px-4 py-3 bg-theme-on-surface border border-theme-stroke">
            <p className="text-body-1m text-theme-primary whitespace-pre-wrap leading-relaxed">
              {msg.text}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-theme-brand rounded-sm animate-pulse align-middle" />
              )}
            </p>
            <span className="text-caption-1m text-theme-tertiary mt-2 block">{msg.timestamp}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-4xl mx-auto card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-stroke shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title-1s text-theme-primary">Injective AI Assistant</h2>
            <p className="text-body-2s text-theme-secondary">
              Specialist agents — Injective ecosystem only
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isConnected ? "bg-theme-green" : "bg-theme-red"
              }`}
            />
            <span className="text-body-2s text-theme-secondary">
              {isConnected ? "Connected" : "Connecting…"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
              <p className="text-body-1s text-theme-primary mb-1">HyperInj AI Assistant</p>
              <p className="text-body-2s text-theme-tertiary">
                Ask anything about Injective — INJ, staking, perps, governance, on-chain data.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderMessage(msg)}
          </motion.div>
        ))}

        <AnimatePresence>
          {isProcessing && !streamingIdRef.current && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
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
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AgentChat;
