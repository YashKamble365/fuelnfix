import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveChat = ({ socket, roomId, userName, role, recipientName }) => {
    // ... state ...
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // console.log("LiveChat Mounted. Socket:", socket?.connected, "Room:", roomId);
        scrollToBottom();
    }, [messages, isOpen, socket, roomId]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            if (data.sender === userName) return;
            setMessages((prev) => [...prev, data]);
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, userName]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && socket) {
            const msgData = {
                roomId,
                sender: userName,
                role: role,
                message: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            socket.emit('send_message', msgData);
            setMessages((prev) => [...prev, msgData]);
            setMessage('');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end pointer-events-auto">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-card/95 backdrop-blur-2xl border border-blue-500/20 rounded-[2.5rem] shadow-2xl w-80 md:w-96 overflow-hidden flex flex-col mb-4 max-h-[600px] h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-5 border-b border-blue-500/10 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                    {recipientName ? recipientName[0] : <MessageSquare className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-black tracking-tight text-lg">{recipientName || 'Support Chat'}</h3>
                                    <span className="text-xs text-blue-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                                        Online Now
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95"
                            >
                                <Minimize2 className="w-5 h-5 opacity-60" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20 scrollbar-hide">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <p className="font-bold text-foreground">No messages yet</p>
                                    <p className="text-xs text-muted-foreground mt-1">Start chatting with your {role === 'customer' ? 'provider' : 'customer'}</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isMe = msg.role === role;
                                return (
                                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end max-w-[85%]`}>
                                            {!isMe && (
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-500 shrink-0 mr-2 mb-4 border border-indigo-500/20">
                                                    {msg.sender[0]}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                {!isMe && idx === 0 && (
                                                    <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-bold uppercase tracking-wider">
                                                        {msg.sender}
                                                    </span>
                                                )}
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={`p-4 rounded-[1.25rem] text-sm font-medium shadow-sm relative ${isMe
                                                        ? 'bg-blue-500 text-white rounded-br-sm'
                                                        : 'bg-gray-100 dark:bg-zinc-800 border border-border rounded-bl-sm text-zinc-900 dark:text-zinc-100'
                                                        }`}
                                                >
                                                    <p className="leading-relaxed">{msg.message}</p>
                                                    <p className={`text-[10px] mt-1.5 text-right font-bold tracking-wide opacity-70 ${isMe ? 'text-blue-100' : 'text-zinc-400'}`}>
                                                        {msg.time}
                                                    </p>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={sendMessage} className="p-4 bg-card border-t border-border/50 flex gap-3 items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-muted/50 border border-transparent hover:border-blue-500/30 focus:border-blue-500/50 rounded-2xl px-5 py-3.5 text-sm outline-none font-medium transition-all placeholder:text-muted-foreground/70"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim()}
                                className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgb(59,130,246,0.3)] flex items-center justify-center relative group border-4 border-white dark:border-zinc-950"
                    >
                        <MessageSquare className="w-7 h-7 fill-current group-hover:scale-110 transition-transform duration-300" />

                        {/* Unread Indicator */}
                        {messages.length > 0 && messages[messages.length - 1].role !== role && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 border-2 border-white dark:border-zinc-900 rounded-full animate-bounce shadow-sm"></span>
                        )}

                        {/* Ripple Effect */}
                        <span className="absolute -inset-1 rounded-full border border-blue-500/30 animate-ping opacity-20"></span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LiveChat;
