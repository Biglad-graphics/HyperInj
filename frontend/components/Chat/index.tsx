import { useState } from "react";
import Message from "@/components/Message";
import NewChat from "./NewChat";

const SUGGESTED_PROMPTS = [
    "Should I buy INJ?",
    "Best trade today?",
    "Market trend for BTC?",
    "Give me the sentiment of ETH",
];

type ChatProps = {
    children?: React.ReactNode;
};

const Chat = ({ children }: ChatProps) => {
    const [message, setMessage] = useState("");
    const [triggerMessage, setTriggerMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasMessages, setHasMessages] = useState(false);

    const handleSendMessage = () => {
        if (message.trim() !== "") {
            setTriggerMessage(message);
            setHasMessages(true);
        }
    };

    const handlePromptClick = (prompt: string) => {
        setMessage(prompt);
        setTriggerMessage(prompt);
        setHasMessages(true);
    };

    const handleMessageSent = () => {
        setMessage("");
        setTriggerMessage("");
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="relative flex h-[calc(100svh-8.5rem)] xl:overflow-hidden xl:rounded-2xl md:h-[calc(100svh-11rem)] md:-mb-2">
            <div className="card flex flex-col w-[calc(100%-21.75rem)] 2xl:w-[calc(100%-20.5rem)] xl:w-full">
                <div className="flex grow overflow-auto -mx-6">
                    {children ? (
                        <div className="px-12 py-4 space-y-6 3xl:px-6 3xl:py-0">
                            {children}
                        </div>
                    ) : (
                        <NewChat
                            externalMessage={triggerMessage}
                            onMessageSent={handleMessageSent}
                            onProcessingChange={setIsProcessing}
                        />
                    )}
                </div>

                {!hasMessages && !isProcessing && (
                    <div className="flex flex-wrap gap-2 mb-3 shrink-0">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                className="px-3 py-1.5 text-body-2s text-theme-secondary border border-theme-stroke rounded-full hover:border-theme-brand hover:text-theme-brand transition-colors"
                                onClick={() => handlePromptClick(prompt)}
                                type="button"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                <Message
                    className="shrink-0"
                    value={message}
                    onChange={(e: any) => setMessage(e.target.value)}
                    onSubmit={handleSendMessage}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    logo
                    disabled={isProcessing}
                />
            </div>
        </div>
    );
};

export default Chat;
