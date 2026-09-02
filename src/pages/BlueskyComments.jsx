import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, RefreshCw, User, Radio, Activity, AlertCircle } from 'lucide-react';
import './BlueskyComments.css';

const JETSTREAM_URL = 'wss://jetstream2.us-east.bsky.network/subscribe';
const PUBLIC_API = 'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle';

const BlueskyComments = () => {
    // Priority: Env variable > default placeholder
    const defaultHandle = import.meta.env.VITE_BLUESKY_TARGET_HANDLE || 'bsky.app';
    const [handle, setHandle] = useState('trendlytic.bsky.social');
    const [connectedDid, setConnectedDid] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [statusData, setStatusData] = useState({ state: 'idle', msg: 'Ready to connect' }); // idle, resolving, connecting, live, error
    const [comments, setComments] = useState([]);

    // WebSockets refs to avoid re-renders and closure staleness
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // --- 1. Resolution Logic ---
    const resolveHandle = async (targetHandle) => {
        try {
            setStatusData({ state: 'resolving', msg: `Resolving ${targetHandle}...` });
            const res = await fetch(`${PUBLIC_API}?handle=${targetHandle}`);
            if (!res.ok) throw new Error('Handle not found');
            const data = await res.json();
            return data.did;
        } catch (err) {
            console.error('Resolution error:', err);
            setStatusData({ state: 'error', msg: `Could not resolve ${targetHandle}` });
            return null;
        }
    };

    // --- 2. WebSocket Logic ---
    const connectToJetstream = useCallback((did) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        setStatusData({ state: 'connecting', msg: 'Connecting to Jetstream...' });

        // Construct query params for filter
        const params = new URLSearchParams();
        params.append('wantedCollections', 'app.bsky.feed.post');
        params.append('wantedDids', did);

        const ws = new WebSocket(`${JETSTREAM_URL}?${params.toString()}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[Bluesky] Connected to Jetstream');
            setIsConnected(true);
            setConnectedDid(did);
            setStatusData({ state: 'live', msg: 'Listening for live comments...' });
        };

        ws.onmessage = (event) => {
            try {
                const updatedData = JSON.parse(event.data);

                // --- 3. Filter for Posts and Comments ---
                // Since we subscribe with 'wantedDids', all posts here are from the target account.
                if (updatedData.commit?.operation === 'create') {
                    const record = updatedData.commit.record;

                    const newEntry = {
                        id: updatedData.commit.rkey,
                        text: record.text,
                        createdAt: new Date(record.createdAt),
                        did: updatedData.did,
                        authorDid: updatedData.did.slice(0, 12) + '...',
                        isReply: !!record.reply // Identify if it's a comment for styling
                    };

                    setComments(prev => [newEntry, ...prev].slice(0, 50));
                }
            } catch (err) {
                console.warn('[Bluesky] Parse error', err);
            }
        };

        ws.onclose = () => {
            console.log('[Bluesky] Disconnected');
            setIsConnected(false);
            if (statusData.state !== 'idle') {
                setStatusData({ state: 'error', msg: 'Disconnected. Reconnecting...' });
                reconnectTimeoutRef.current = setTimeout(() => connectToJetstream(did), 3000);
            }
        };

        ws.onerror = (err) => {
            console.error('[Bluesky] WebSocket error', err);
            ws.close();
        };

    }, [statusData.state]);

    const handleConnect = async () => {
        // Clear previous state
        setComments([]);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        const did = await resolveHandle(handle);
        if (did) {
            connectToJetstream(did);
        }
    };

    const handleDisconnect = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        setIsConnected(false);
        setStatusData({ state: 'idle', msg: 'Stopped' });
        setConnectedDid(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

    return (
        <div className="bluesky-page">
            <div className="bluesky-container">
                <header className="bluesky-header">
                    <div className="logo-section">
                        <Activity className="text-blue-500" size={32} />
                        <div>
                            <h1>Bluesky Jetstream Listener</h1>
                            <p>Real-time comment stream for a specific account</p>
                        </div>
                    </div>
                    <div className="status-badge" data-status={statusData.state}>
                        <div className="dot"></div>
                        <span>{statusData.msg}</span>
                    </div>
                </header>

                <div className="control-panel">
                    <div className="input-group">
                        <User size={20} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Enter Bluesky Handle (e.g. bsky.app)"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            disabled={isConnected}
                        />
                    </div>

                    {!isConnected ? (
                        <button className="btn-connect" onClick={handleConnect} disabled={statusData.state === 'resolving'}>
                            <Radio size={18} />
                            Start Listening
                        </button>
                    ) : (
                        <button className="btn-disconnect" onClick={handleDisconnect}>
                            <AlertCircle size={18} />
                            Stop Stream
                        </button>
                    )}
                </div>

                <div className="comments-stream">
                    <div className="stream-header">
                        <h2>Live Stream {connectedDid ? `for ${handle}` : ''}</h2>
                        <span className="count-badge">{comments.length} items</span>
                    </div>

                    <div className="comments-list">
                        <AnimatePresence>
                            {comments.length === 0 && (
                                <div className="empty-state">
                                    <MessageSquare size={48} />
                                    <p>Waiting for real-time posts or comments...</p>
                                    <small>Only new activity occurring right now will appear here.</small>
                                </div>
                            )}
                            {comments.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`comment-card ${entry.isReply ? 'is-reply' : 'is-post'}`}
                                >
                                    <div className="comment-header">
                                        <div className="author-info">
                                            <span className="author-did">{entry.authorDid}</span>
                                            <span className={`type-badge ${entry.isReply ? 'bg-blue' : 'bg-purple'}`}>
                                                {entry.isReply ? 'Comment' : 'Post'}
                                            </span>
                                        </div>
                                        <span className="time">{entry.createdAt.toLocaleTimeString()}</span>
                                    </div>
                                    <div className="comment-body">
                                        {entry.text}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlueskyComments;
