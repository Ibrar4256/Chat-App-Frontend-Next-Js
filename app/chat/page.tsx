'use client';
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './chat.module.css';

// Define types for our messages and socket events
interface Message {
  user: string;
  message: string;
}

interface ServerToClientEvents {
  receiveMessage: (msg: Message) => void;
  'user-joined': (data: { message: string }) => void;
  'user-left': (data: { message: string }) => void;
}

interface ClientToServerEvents {
  setUsername: (username: string) => void;
  sendMessage: (msg: { message: string }) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3002');

export default function ChatRoom() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('user-joined', (data) => {
      setMessages((prevMessages) => [...prevMessages, { user: 'System', message: data.message }]);
    });

    socket.on('user-left', (data) => {
      setMessages((prevMessages) => [...prevMessages, { user: 'System', message: data.message }]);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, []);

  const setUsernameHandler = () => {
    if (username.trim()) {
      socket.emit('setUsername', username);
      setIsUsernameSet(true);
    }
  };

  const sendMessageHandler = () => {
    if (message.trim()) {
      socket.emit('sendMessage', { message });
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageHandler();
    }
  };

  return (
    <div className={styles.chatContainer}>
      {!isUsernameSet ? (
        <div className={styles.usernameForm}>
          <h2>Enter Your Username</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setUsernameHandler()}
            className={styles.input}
          />
          <button onClick={setUsernameHandler} className={styles.button}>
            Set Username
          </button>
        </div>
      ) : (
        <div className={styles.chatRoom}>
          <h1 className={styles.header}>Chat APP</h1>
          <div className={styles.messageContainer}>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`${styles.messageWrapper} ${
                  msg.user === username 
                    ? styles.currentUser
                    : msg.user === 'System' 
                    ? styles.systemMessage 
                    : styles.otherUser
                }`}
              >
                <span className={styles.message}>
                  <strong>{msg.user !== username && `${msg.user}: `}</strong>
                  {msg.message}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.inputArea}>
            <textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.textarea}
            />
            <button onClick={sendMessageHandler} className={styles.button}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}