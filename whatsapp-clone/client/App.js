import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket.on('message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });
    }, []);

    const register = async () => {
        await axios.post('http://localhost:5000/register', { username, password });
    };

    const login = async () => {
        const response = await axios.post('http://localhost:5000/login', { username, password });
        setToken(response.data.token);
    };

    const sendMessage = () => {
        socket.emit('message', { token, content: message });
        setMessage('');
    };

    return (
        <div>
            <h1>WhatsApp Clone</h1>
            <div>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={register}>Register</button>
                <button onClick={login}>Login</button>
            </div>
            <div>
                <input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
                <button onClick={sendMessage}>Send</button>
            </div>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg.content}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;
