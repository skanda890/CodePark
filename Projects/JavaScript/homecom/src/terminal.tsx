import React, { useState, useEffect } from 'react';
import { render, Text, Box } from 'ink';
import { io, Socket } from 'socket.io-client';

const TerminalUI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(12);
  const [activeCalls, setActiveCalls] = useState(0);

  useEffect(() => {
    // Establish dynamic sync pipe back to running local core server instance
    const socket: Socket = io('http://localhost:8080');

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('register-device', {
        userId: 'primary_user',
        deviceId: 'local_terminal_node',
        deviceType: 'terminal'
      });
    });

    socket.on('incoming-message', () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1} width={45}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="green">🏡 HOMECOM SYSTEM HUB</Text>
      </Box>
      
      <Box flexDirection="column" marginBottom={1}>
        <Text>Link Matrix State: {isConnected ? <Text color="green">CONNECTED</Text> : <Text color="red">OFFLINE</Text>}</Text>
        <Text>Active Call Channels: <Text color="yellow">{activeCalls}</Text></Text>
        <Text>Unread Messages:    <Text color="magenta">{unreadCount}</Text></Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingLeft={1}>
        <Text bold color="white">Console Bind Shortcuts:</Text>
        <Text> ⌨️  [C] - Initiate Target Call Connection</Text>
        <Text> ⌨️  [M] - Open Message Inbox Streams</Text>
        <Text> ⌨️  [V] - Access Record Voicemail Vault</Text>
      </Box>
    </Box>
  );
};

render(<TerminalUI />);