import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, MessageSquare, Send, Clock, User, Info } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';

export default function LeadDetail({ user }: { user: any }) {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [commType, setCommType] = useState<'sms' | 'email' | 'internal'>('sms');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    
    // Fetch Lead Details
    fetch(`/api/leads/${id}`, { headers })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setLead(data))
      .catch(err => console.error('Lead fetch error:', err));

    // Fetch Communications
    fetch(`/api/leads/${id}/communications`, { headers })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Communications fetch error:', err);
        setMessages([]);
      });

    // Setup Socket
    socketRef.current = io();
    socketRef.current.emit('join-lead', id);

    socketRef.current.on('new-message', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        created_at: new Date().toISOString(),
        direction: 'outbound' // For simplicity in this demo
      }]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      leadId: id,
      userId: user?.id,
      type: commType,
      content: newMessage,
      userName: user?.name
    };

    socketRef.current?.emit('send-message', messageData);
    setNewMessage('');
  };

  if (!lead && !id) return null;

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/leads" className="p-2 hover:bg-[#141414]/5 rounded transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              {lead ? `${lead.first_name} ${lead.last_name}` : 'Loading...'}
            </h1>
            <p className="text-xs text-[#141414]/40 font-mono uppercase tracking-widest">Lead ID: #{id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 border-2 border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors rounded">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 border-2 border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors rounded">
            <Mail className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Chat Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] min-h-0">
          <div className="p-4 border-b-2 border-[#141414] flex items-center justify-between bg-[#E4E3E0]/30">
            <div className="flex gap-2">
              {(['sms', 'email', 'internal'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCommType(type)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-2 border-[#141414] transition-colors",
                    commType === type ? "bg-[#141414] text-[#E4E3E0]" : "bg-white text-[#141414] hover:bg-[#141414]/5"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Connection
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex flex-col max-w-[80%]",
                msg.direction === 'outbound' ? "ml-auto items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-4 border-2 border-[#141414] text-sm",
                  msg.direction === 'outbound' ? "bg-[#141414] text-[#E4E3E0] shadow-[-4px_4px_0px_0px_rgba(20,20,20,0.2)]" : "bg-white text-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]"
                )}>
                  {msg.content}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-[#141414]/40 uppercase tracking-widest">
                  {msg.type} • {format(new Date(msg.created_at), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-[#141414] bg-[#E4E3E0]/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Type your ${commType} message...`}
                className="flex-1 px-4 py-3 bg-white border-2 border-[#141414] focus:outline-none font-mono text-sm"
              />
              <button
                type="submit"
                className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#141414]/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto pr-2">
          <section className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4 flex items-center gap-2">
              <Info className="w-3 h-3" /> Lead Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Vehicle Interest</p>
                <p className="text-sm font-bold">{lead?.vehicle_interest || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Source</p>
                <p className="text-sm font-bold">{lead?.source || 'Direct'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Assigned To</p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <User className="w-3 h-3" /> {user?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Upcoming Tasks
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-[#141414]/10 rounded bg-[#E4E3E0]/10">
                <p className="text-xs font-bold">Follow-up Call</p>
                <p className="text-[10px] text-[#141414]/40 mt-1">Tomorrow at 10:00 AM</p>
              </div>
              <button className="w-full py-2 border-2 border-dashed border-[#141414]/30 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 hover:border-[#141414] hover:text-[#141414] transition-colors">
                + Add Task
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
