import React, { useState } from "react";
import styles from "../../styles/chatbot.module.css";

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 ¡Hola! Soy tu asistente virtual de Powerlifting. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");

  const model = "mistralai/Mistral-7B-Instruct-v0.2"; // Puedes usar otro si prefieres

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Eres un asistente útil que responde en español sobre powerlifting. Usuario: ${input}`,
          }),
        }
      );

      const data = await response.json();
      const botReply =
        data?.[0]?.generated_text ||
        data?.generated_text ||
        "Lo siento, no entendí la pregunta 😅.";

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: botReply.replace(/^.*Usuario:/, "").trim() },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Hubo un error al conectar con el servidor 😢." },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className={styles.chatContainer}>
      {/* Botón flotante */}
      {!isOpen && (
        <button className={styles.chatButton} onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <span>Asistente Powerlifting 🤖</span>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.message} ${
                  msg.sender === "user" ? styles.userMsg : styles.botMsg
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className={styles.chatInput}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu mensaje..."
            />
            <button onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
