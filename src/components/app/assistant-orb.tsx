import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Mic, MicOff, Send, X, Sparkles, Loader2 } from "lucide-react";
import { cls } from "@/lib/format";
import { auth } from "@/lib/firebase";

const ASSISTANT_URL = "https://us-central1-pink-love-gestao.cloudfunctions.net/assistant";

type Message = { role: "user" | "assistant"; text: string; upsell?: boolean };
type AssistantResult = { text: string; upsell?: boolean };

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

async function sendToAssistant(text: string): Promise<AssistantResult> {
  const user = auth.currentUser;
  if (!user) return { text: "Você precisa estar logada para usar o assistente." };

  const token = await user.getIdToken();

  const res = await fetch(ASSISTANT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (res.status === 402) {
    const data = await res.json().catch(() => null) as { message?: string } | null;
    return {
      text: data?.message ?? "Você já usou suas interações gratuitas. Assine por R$9,90/mês para continuar.",
      upsell: true,
    };
  }

  if (!res.ok) return { text: "Erro ao processar o comando. Tente novamente." };
  const data = await res.json() as { message?: string };
  return { text: data.message ?? "Pronto!" };
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "pt-BR";
  utt.rate = 1.1;
  window.speechSynthesis.speak(utt);
}

export function AssistantOrb() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const recogRef = React.useRef<SpeechRecognition | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hasSpeech = !!getSpeechRecognition();

  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        text: "Oi! Pode falar ou digitar o que precisa — registro de vendas, estoque, faturamento, próximos eventos...",
      }]);
    }
  }, [open, messages.length]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = React.useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const { text: reply, upsell } = await sendToAssistant(trimmed);
      setMessages(m => [...m, { role: "assistant", text: reply, upsell }]);
      if (!upsell) speak(reply);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleMic = React.useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SR();
    recog.lang = "pt-BR";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) submit(transcript);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recog.start();
    recogRef.current = recog;
    setListening(true);
  }, [listening, submit]);

  return (
    <>
      {/* Painel de chat */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-80 md:w-96 flex flex-col rounded-3xl bg-card border border-border shadow-glow overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary-dark text-primary-foreground">
            <div className="size-8 rounded-full bg-primary-foreground/20 grid place-items-center">
              <Sparkles className="size-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">Assistente Decora</div>
              <div className="text-[10px] opacity-70">Voz ou texto — em português</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="size-7 rounded-full hover:bg-primary-foreground/20 grid place-items-center transition-colors"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72 bg-surface">
            {messages.map((m, i) => (
              <div key={i} className={cls("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                <div className={cls(
                  "max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed whitespace-pre-line",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm"
                )}>
                  {m.text}
                </div>
                {m.upsell && (
                  <Link
                    to="/app/settings"
                    onClick={() => setOpen(false)}
                    className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
                  >
                    Assinar por R$9,90/mês →
                  </Link>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border text-xs px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin text-primary" />
                  <span className="text-muted-foreground">pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-border bg-card">
            {hasSpeech && (
              <button
                onClick={toggleMic}
                className={cls(
                  "size-9 rounded-full grid place-items-center shrink-0 transition-colors",
                  listening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-secondary text-muted-foreground hover:bg-primary-soft hover:text-primary"
                )}
                aria-label={listening ? "Parar gravação" : "Gravar áudio"}
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
              placeholder={listening ? "Ouvindo..." : "Digite ou fale um comando..."}
              disabled={listening || loading}
              className="flex-1 text-xs bg-surface rounded-xl px-3 py-2 border border-border focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 hover:bg-primary-dark disabled:opacity-40 transition-colors"
              aria-label="Enviar"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Botão flutuante (orb) */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Assistente de voz"
        className={cls(
          "fixed bottom-5 right-4 z-50 size-14 rounded-full shadow-glow flex items-center justify-center transition-all duration-200",
          open
            ? "bg-primary-dark text-primary-foreground scale-95"
            : "bg-primary text-primary-foreground hover:scale-110 hover:shadow-[0_0_24px_4px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
        )}
      >
        {open ? (
          <X className="size-5" />
        ) : (
          <div className="relative">
            <Sparkles className="size-5" />
            {!listening && (
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-400 border-2 border-primary" />
            )}
          </div>
        )}
      </button>
    </>
  );
}
