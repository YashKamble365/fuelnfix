import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '../lib/api';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const joinedRooms = useRef(new Set());
    const userRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            userRef.current = JSON.parse(storedUser);
        }

        const newSocket = io(API_BASE_URL, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[SocketContext] Connected:', newSocket.id);
            // Re-join all previously joined rooms upon reconnection
            if (userRef.current?._id) {
                newSocket.emit('join_room', userRef.current._id);
                joinedRooms.current.add(userRef.current._id);
            }
            
            joinedRooms.current.forEach(room => {
                if (room !== userRef.current?._id) {
                    newSocket.emit('join_room', room);
                }
            });
            console.log('[SocketContext] Re-joined rooms:', Array.from(joinedRooms.current));
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('[SocketContext] Reconnected after', attemptNumber, 'attempts');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[SocketContext] Disconnected:', reason);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const joinRoom = (roomId) => {
        if (socket && roomId && !joinedRooms.current.has(roomId)) {
            socket.emit('join_room', roomId);
            joinedRooms.current.add(roomId);
            console.log('[SocketContext] Joined room:', roomId);
        }
    };

    const leaveRoom = (roomId) => {
        if (socket && roomId) {
            socket.emit('leave_room', roomId);
            joinedRooms.current.delete(roomId);
            console.log('[SocketContext] Left room:', roomId);
        }
    };

    // Helper to refresh user info in context if it changes
    const updateSocketUser = (user) => {
        userRef.current = user;
        if (socket && user?._id) {
            socket.emit('join_room', user._id);
            joinedRooms.current.add(user._id);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, joinRoom, leaveRoom, updateSocketUser }}>
            {children}
        </SocketContext.Provider>
    );
};
