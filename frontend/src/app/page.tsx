'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Cloud, Activity, MessageSquare, Send, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    // Simulate fetching status from backend
    setTimeout(() => setStatus('24/7 SECURE'), 1500);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // In a real deployment, this would point to your ECS ALB URL
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.content[0].text }]);
    } catch (error) {
      console.error('Failed to send:', error);
      setMessages([...newMessages, { role: 'assistant', content: "Error: Backend unreachable. Verify ECS connectivity." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 flex flex-col items-center max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex justify-between items-center mb-12"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600 rounded-xl neon-glow">
            <Cloud className="text-white h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Cloud Claw</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Activity className="text-emerald-400 h-4 w-4 animate-pulse" />
            <span className="text-xs font-mono">{status}</span>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <ShieldCheck className="text-blue-400 h-4 w-4" />
            <span className="text-xs font-mono">PRIVATE VPC</span>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full h-[70vh]">
        
        {/* Left Stats Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="glass-card p-6 h-full">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
              <Cpu className="h-4 w-4" /> System Health
            </h2>
            <div className="space-y-4">
              <StatRow label="CPU Usage" value="1.2%" progress={12} />
              <StatRow label="Memory" value="256MB / 512MB" progress={50} />
              <StatRow label="Uptime" value="14d 05h 22m" />
              <StatRow label="Region" value="us-east-1" />
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Agent Logs
              </h2>
              <div className="font-mono text-[10px] text-white/40 space-y-1 overflow-y-auto max-h-40">
                <p>[16:54:21] Task started: Web Research</p>
                <p>[16:55:02] API Call: anthropic/claude-3-sonnet</p>
                <p>[16:55:05] Context window: 12.5k tokens</p>
                <p>[17:01:10] Container health: OK</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium">Direct Agent Interface</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/20 text-center">
                <Cloud className="h-12 w-12 mb-4 opacity-10" />
                <p className="text-sm">Cloud Claw is listening...</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-violet-600 text-white shadow-lg' 
                      : 'bg-white/10 text-white/90 border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message your agent..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 pr-12"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </main>
  );
}

function StatRow({ label, value, progress }: { label: string; value: string; progress?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/40">{label}</span>
        <span className="text-white/90 font-mono">{value}</span>
      </div>
      {progress !== undefined && (
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-violet-500 rounded-full" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
}
