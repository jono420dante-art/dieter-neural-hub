import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import * as localSim from "@/lib/local-sim";
import type { ChatMessage } from "@shared/schema";

export default function AIChat() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
  });

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [useLocal, setUseLocal] = useState(false);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      try {
        const res = await apiRequest("POST", "/api/chat", {
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        });
        return res.json();
      } catch {
        setUseLocal(true);
        localSim.sendChatMessage(content);
        setLocalMessages([...localSim.getChatMessages()] as unknown as ChatMessage[]);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearChat = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("DELETE", "/api/chat");
      } catch {
        setUseLocal(true);
        localSim.clearChat();
        setLocalMessages([]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    },
  });

  const displayMessages = useLocal ? localMessages : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, localMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-mono font-bold tracking-wider" style={{ color: "#3DF2E0" }}>
            DIETER AI BRAIN
          </h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: "#3D5253" }}>
            Neural conversation — Ollama + RAG + Agent System
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3DF2E0", boxShadow: "0 0 6px #3DF2E0" }} />
            <span className="text-[10px] font-mono" style={{ color: "#3DF2E0" }}>LLM ONLINE</span>
          </div>
          <button
            onClick={() => clearChat.mutate()}
            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all"
            style={{ color: "#3D5253", border: "1px solid rgba(61, 82, 83, 0.2)" }}
            data-testid="button-clear-chat"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <Card
        className="flex-1 border overflow-hidden"
        style={{ background: "rgba(11, 15, 20, 0.6)", borderColor: "rgba(61, 82, 83, 0.2)", backdropFilter: "blur(10px)" }}
      >
        <CardContent className="p-4 h-full overflow-y-auto">
          {displayMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4 opacity-20">🧠</div>
                <p className="text-sm font-mono" style={{ color: "#3D5253" }}>
                  DIETER Neural Brain awaiting input.
                </p>
                <p className="text-xs font-mono mt-1" style={{ color: "rgba(61, 82, 83, 0.5)" }}>
                  Try: "help" / "scan status" / "search threats"
                </p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {displayMessages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] px-4 py-3 rounded-lg font-mono text-xs"
                  style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, rgba(61, 242, 224, 0.12), rgba(76, 201, 240, 0.08))"
                      : "rgba(11, 15, 20, 0.8)",
                    border: `1px solid ${msg.role === "user" ? "rgba(61, 242, 224, 0.2)" : "rgba(61, 82, 83, 0.15)"}`,
                    color: "rgba(205, 204, 202, 0.9)",
                  }}
                  data-testid={`text-message-${msg.id}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold" style={{
                      color: msg.role === "user" ? "#4CC9F0" : "#3DF2E0",
                    }}>
                      {msg.role === "user" ? "COMMANDER" : "DIETER"}
                    </span>
                    <span className="text-[9px]" style={{ color: "#3D5253" }}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-lg"
                  style={{
                    background: "rgba(11, 15, 20, 0.8)",
                    border: "1px solid rgba(61, 82, 83, 0.15)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#3DF2E0", animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#3DF2E0", animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#3DF2E0", animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "#3D5253" }}>Neural processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3">
        <div
          className="flex gap-2 p-2 rounded-lg border transition-all"
          style={{
            background: "rgba(11, 15, 20, 0.6)",
            borderColor: "rgba(61, 82, 83, 0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Speak to DIETER..."
            className="flex-1 px-3 py-2 bg-transparent font-mono text-sm outline-none"
            style={{ color: "rgba(205, 204, 202, 0.9)", caretColor: "#3DF2E0" }}
            data-testid="input-chat"
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            className="px-4 py-2 rounded-md font-mono text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, rgba(61, 242, 224, 0.15), rgba(76, 201, 240, 0.15))",
              border: "1px solid rgba(61, 242, 224, 0.3)",
              color: "#3DF2E0",
            }}
            data-testid="button-send"
          >
            SEND
          </button>
        </div>
      </form>
    </div>
  );
}
