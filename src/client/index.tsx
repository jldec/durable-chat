import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import { useState } from "react";
import { nanoid } from "nanoid";

import { names, type ChatMessage, type Message } from "../shared";

function App() {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const socket = usePartySocket({
    party: "chat",
    room: "general",
    onMessage: (evt) => {
      const message = JSON.parse(evt.data) as Message;
      switch (message.type) {
        case "add":
          let foundIndex = messages.findIndex((m) => m.id === message.id);
          if (foundIndex === -1) {
            // probably someone else who added a message
            setMessages((messages) => [
              ...messages,
              {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
              },
            ]);
          } else {
            // this usually means we ourselves added a message
            // and it was broadcasted back
            // so let's replace the message with the new message
            setMessages((messages) => {
              return messages
                .slice(0, foundIndex)
                .concat({
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  role: message.role,
                })
                .concat(messages.slice(foundIndex + 1));
            });
          }
          break;
        case "update":
          setMessages((messages) =>
            messages.map((m) =>
              m.id === message.id
                ? {
                    id: message.id,
                    content: message.content,
                    user: message.user,
                    role: message.role,
                  }
                : m
            )
          );
          break;
        case "all":
          setMessages(message.messages);
          break;
      }
    },
  });

  return (
    <div className="chat container">
      {messages.map((message) => (
        <div key={message.id} className="row message">
          <div className="two columns user">{message.user}</div>
          <div className="ten columns">{message.content}</div>
        </div>
      ))}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const content = e.currentTarget.elements.namedItem(
            "content"
          ) as HTMLInputElement;
          const chatMessage: ChatMessage = {
            id: nanoid(8),
            content: content.value,
            user: name,
            role: "user",
          };
          setMessages((messages) => [...messages, chatMessage]);
          // we could broadcast the message here

          socket.send(
            JSON.stringify({
              type: "add",
              ...chatMessage,
            } satisfies Message)
          );

          content.value = "";
        }}
      >
        <input
          type="text"
          name="content"
          className="ten columns my-input-text"
          placeholder={`Hello ${name}! Type some message...`}
          autoComplete="off"
        />
        <button type="submit" className="send-message two columns">
          Send
        </button>
      </form>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);

root.render(<App />);
