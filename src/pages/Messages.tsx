import { useState, useEffect, useRef, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MessageSquare, Phone, Mail, Send, User, 
  ChevronRight, Info, Clock, MoreVertical, Paperclip, 
  Smile, CheckCheck, X
} from 'lucide-react';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [commType, setCommType] = useState<'sms' | 'email' | 'internal'>('sms');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    
    // Fetch Leads
    fetch('/api/leads', { headers })
      .then(res => res.json())
      .then(data => {
        const leadList = Array.isArray(data) ? data : [];
        setLeads(leadList);
        setLoading(false);

        // Handle leadId from URL
        const leadIdFromUrl = searchParams.get('leadId');
        if (leadIdFromUrl) {
          const lead = leadList.find((l: any) => l.id === parseInt(leadIdFromUrl));
          if (lead) setSelectedLead(lead);
        }
      });

    // Fetch Users for mentions
    fetch('/api/users', { headers })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));

    // Setup Socket
    socketRef.current = io();
    socketRef.current.on('new-message', (message) => {
      setMessages(prev => {
        if (selectedLead && message.leadId === selectedLead.id) {
          return [...prev, message];
        }
        return prev;
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedLead, searchParams]);

  useEffect(() => {
    if (selectedLead) {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      fetch(`/api/leads/${selectedLead.id}/communications`, { headers })
        .then(res => res.json())
        .then(data => setMessages(Array.isArray(data) ? data : []));
      
      socketRef.current?.emit('join-lead', selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const mentions = users
      .filter(u => newMessage.includes(`@${u.name}`))
      .map(u => u.id);

    const messageData = {
      leadId: selectedLead.id,
      userId: currentUser.id,
      type: commType,
      subject: commType === 'email' ? subject : null,
      content: newMessage,
      userName: currentUser.name,
      mentions
    };

    socketRef.current?.emit('send-message', messageData);
    setNewMessage('');
    setSubject('');
  };

  const filteredLeads = leads.filter(l => 
    `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Leads List */}
      <aside className="w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-black tracking-tighter text-slate-900 mb-4 uppercase">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={cn(
                "w-full p-4 flex items-center gap-4 transition-all border-b border-slate-100/50",
                selectedLead?.id === lead.id ? "bg-white shadow-sm z-10" : "hover:bg-white/50"
              )}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm shadow-inner">
                  {lead.first_name[0]}{lead.last_name[0]}
                </div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{lead.first_name} {lead.last_name}</p>
                </div>
                <p className="text-xs text-slate-500 truncate line-clamp-1">
                  {lead.vehicle_interest || 'General Inquiry'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-white min-w-0 relative">
        {selectedLead ? (
          <>
            <header className="h-20 px-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                  {selectedLead.first_name[0]}{selectedLead.last_name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedLead.first_name} {selectedLead.last_name}</h3>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCallModalOpen(true)}
                  className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {messages.map((msg, i) => {
                const isMine = msg.user_id === currentUser.id;
                return (
                  <div key={i} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[70%] p-4 text-sm relative transition-all duration-200",
                      isMine 
                        ? "bg-brand-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-brand-100" 
                        : "bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm"
                    )}>
                      {msg.subject && (
                        <div className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b",
                          isMine ? "border-white/20" : "border-slate-100"
                        )}>
                          Subject: {msg.subject}
                        </div>
                      )}
                      <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      
                      <div className={cn(
                        "absolute -bottom-2 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm",
                        isMine ? "-left-2" : "-right-2"
                      )}>
                        {msg.type === 'email' && <Mail className="w-2.5 h-2.5 text-slate-400" />}
                        {msg.type === 'sms' && <MessageSquare className="w-2.5 h-2.5 text-slate-400" />}
                        {msg.type === 'internal' && <Info className="w-2.5 h-2.5 text-slate-400" />}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-brand-500" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="p-6 bg-white border-t border-slate-100">
              <div className="flex gap-4 mb-4">
                {(['sms', 'email', 'internal'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setCommType(type)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all",
                      commType === type 
                        ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100" 
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSendMessage} className="space-y-3">
                {commType === 'email' && (
                  <input
                    type="text"
                    placeholder="Email Subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-medium"
                  />
                )}
                <div className="flex items-end gap-3 bg-slate-50 rounded-2xl p-2 border border-slate-100 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all">
                  <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value);
                      if (e.target.value.endsWith('@')) setShowMentions(true);
                      else if (!e.target.value.includes('@')) setShowMentions(false);
                    }}
                    placeholder={`Type your ${commType} message...`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                  />
                  
                  {showMentions && (
                    <div className="absolute bottom-full left-0 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto p-2">
                      {users.filter(u => u.id !== currentUser.id).map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setNewMessage(prev => prev + u.name + ' ');
                            setShowMentions(false);
                          }}
                          className="w-full p-2 text-left text-xs hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors"
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </footer>

            {/* Info Drawer */}
            {isDrawerOpen && selectedLead && (
              <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-slate-100 shadow-2xl z-40 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Lead Details</h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Contact Info</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{selectedLead.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{selectedLead.phone}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vehicle Interest</h4>
                    <p className="text-sm font-bold text-slate-900">{selectedLead.vehicle_interest || 'Not specified'}</p>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Source</h4>
                    <p className="text-sm font-bold text-slate-900">{selectedLead.source}</p>
                  </section>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 bg-slate-50/30">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200 animate-bounce duration-[3000ms]">
              <MessageSquare className="w-10 h-10 text-brand-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Select a Conversation</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 font-medium">Choose a lead from the left to start communicating in real-time.</p>
            </div>
          </div>
        )}
      </main>

      {/* Call Modal */}
      {isCallModalOpen && selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Phone className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter text-slate-900">CALLING LEAD</h2>
              <p className="text-slate-500 font-medium">{selectedLead.first_name} {selectedLead.last_name}</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-slate-900">{selectedLead.phone}</p>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <button 
                onClick={() => setIsCallModalOpen(false)}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                End Call
              </button>
              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">Other communications are paused during call</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
