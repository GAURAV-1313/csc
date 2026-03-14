import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { api } from "../services/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetProps = {
  page: "dashboard" | "form";
  serviceType?: string;
  applicationId?: string | null;
  context?: Record<string, unknown>;
};

export default function ChatWidget({ page, serviceType, applicationId, context }: ChatWidgetProps) {
  const initialLang = (localStorage.getItem("ui_lang") as "hi" | "en") || "hi";
  const [lang, setLang] = useState<"hi" | "en" | "hinglish">(initialLang);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        initialLang === "hi"
          ? "नमस्ते! मैं CSC ऑपरेटर असिस्टेंट हूँ। फॉर्म, दस्तावेज़ या वैलिडेशन में मदद चाहिए?"
          : "Hi! I’m your CSC operator assistant. Need help with forms, documents, or validation?"
    }
  ]);

  useEffect(() => {
    localStorage.setItem("ui_lang", lang === "hinglish" ? "hi" : lang);
  }, [lang]);

  useEffect(() => {
    if (!context?.autoOpen) return;
    setOpen(true);
  }, [context?.autoOpen]);

  const copy = useMemo(
    () => ({
      hi: {
        title: "CSC सहायक",
        hint: "फॉर्म, दस्तावेज़, या नियमों के बारे में पूछें",
        placeholder: "अपना सवाल लिखें...",
        send: "भेजें",
        langLabel: "भाषा",
        clear: "क्लियर",
        loading: "सोच रहा है..."
      },
      en: {
        title: "CSC Assistant",
        hint: "Ask about forms, documents, or validation rules",
        placeholder: "Type your question...",
        send: "Send",
        langLabel: "Language",
        clear: "Clear",
        loading: "Thinking..."
      },
      hinglish: {
        title: "CSC Assistant",
        hint: "Form, documents, ya validation rules ke baare mein puchho",
        placeholder: "Apna sawal likho...",
        send: "Send",
        langLabel: "Language",
        clear: "Clear",
        loading: "Soch raha hoon..."
      }
    }),
    []
  );

  const t = copy[lang];

  const pushMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, content }
    ]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    pushMessage("user", text);
    setLoading(true);
    try {
      const reply = await api.chatAssistant({
        message: text,
        language: lang,
        page,
        serviceType,
        applicationId,
        context
      });
      pushMessage("assistant", reply.reply || "No response.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to reach assistant.";
      pushMessage("assistant", message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages((prev) => prev.slice(0, 1));
  };

  return (
    <div className={`csc-chat ${open ? "open" : ""}`} aria-live="polite">
      {!open && (
        <button className="csc-chat-fab" type="button" onClick={() => setOpen(true)}>
          💬
        </button>
      )}

      {open && (
        <div className="csc-chat-panel">
          <div className="csc-chat-header">
            <div>
              <h4>{t.title}</h4>
              <p>{t.hint}</p>
            </div>
            <button className="csc-chat-close" type="button" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="csc-chat-controls">
            <label>
              {t.langLabel}
              <select value={lang} onChange={(e) => setLang(e.target.value as "hi" | "en" | "hinglish")}>
                <option value="hi">हिंदी</option>
                <option value="en">English</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </label>
            <button type="button" className="csc-chat-clear" onClick={clearChat}>
              {t.clear}
            </button>
          </div>

          <div className="csc-chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`csc-chat-msg ${msg.role}`}>
                <div className="bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="csc-chat-msg assistant">
                <div className="bubble">{t.loading}</div>
              </div>
            )}
          </div>

          <div className="csc-chat-input">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
            />
            <button type="button" className="btn" onClick={handleSend}>
              {t.send}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
