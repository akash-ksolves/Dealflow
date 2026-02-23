import { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Messages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/messages', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Messages fetch error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Messages</h1>
        <p className="text-[#141414]/60 mt-1 font-medium">Centralized communication history across all leads.</p>
      </header>

      <div className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        {loading ? (
          <div className="p-20 text-center text-[#141414]/40 italic">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-20 text-center text-[#141414]/40 italic">No messages found.</div>
        ) : (
          <div className="divide-y divide-[#141414]/10">
            {messages.map((msg) => (
              <div key={msg.id} className="p-6 hover:bg-[#E4E3E0]/10 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold text-xs shrink-0">
                      {msg.first_name[0]}{msg.last_name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{msg.first_name} {msg.last_name}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#E4E3E0] rounded text-[#141414]/60">
                          {msg.type}
                        </span>
                      </div>
                      <p className="text-sm text-[#141414]/80 mt-1">{msg.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-[10px] text-[#141414]/40 font-mono uppercase tracking-widest">
                          <User className="w-3 h-3" /> {msg.user_name}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[#141414]/40 font-mono uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={`/leads/${msg.lead_id}`}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#141414]/40 group-hover:text-[#141414] transition-colors"
                  >
                    View Lead <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
