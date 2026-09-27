import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Hash,
  Search,
  Paperclip,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  avatarText: string;
  time: string;
  text: string;
  channelId: string;
  audience: 'internal' | 'client';
  projectId?: string;
  senderRole?: 'employee' | 'client' | 'manager';
}

const CLIENT_THREADS = [
  { id: 'project-bc-08-26', name: 'Project BC-08-26', unread: 2, topic: 'Client questions, RFIs, and deliverables', client: 'Northstar Builders', safeEmployee: 'Project Engineer — UK' },
  { id: 'metro-heights', name: 'Metro Heights', unread: 0, topic: 'Drawing reviews and approved changes', client: 'Turner Construction', safeEmployee: 'BIM Coordinator — AR' },
];

const CHANNELS = [
  { id: 'estimating-ops', name: 'estimating-ops', unread: 2, topic: 'Daily pre-con takeoff coordination' },
  { id: 'clash-resolution', name: 'clash-resolution', unread: 0, topic: 'Revit / Navisworks BIM clash hotline' },
  { id: 'rfi-hotline', name: 'rfi-hotline', unread: 1, topic: 'Live GC questions & architect responses' },
  { id: 'general-contractors', name: 'general-contractors', unread: 0, topic: 'Turner, Clark, Skanska direct coms' },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'Marcus Vance',
    avatarText: 'MV',
    time: '09:14 AM',
    text: 'Turner Construction confirmed RFI-089 resolution on Metro Heights Level 14-28 rebar density. Quantities updated in QTO model.',
    channelId: 'estimating-ops',
    audience: 'internal',
    senderRole: 'employee',
  },
  {
    id: 'm-2',
    sender: 'Elena Rostova',
    avatarText: 'ER',
    time: '09:28 AM',
    text: 'LOD 350 geometry on St. Jude medical gas lines is now cleanly aligned with structural ribs. Zero MEP clashes remaining.',
    channelId: 'estimating-ops',
    audience: 'internal',
    senderRole: 'employee',
  },
  {
    id: 'm-3',
    sender: 'Umer Khayam',
    avatarText: 'UK',
    time: '09:42 AM',
    text: 'Biotech Innovation Lab peer review report complete. All 14 divisions reconciled with 0.08% delta.',
    channelId: 'estimating-ops',
    audience: 'internal',
    senderRole: 'employee',
  },
  {
    id: 'm-4',
    sender: 'Syed Ahmed',
    avatarText: 'SA',
    time: '10:05 AM',
    text: 'Monitoring Balfour Beatty on RFI-104. If ASTM A992 grade variance is approved by 2 PM, warehouse estimate will be ready for package release.',
    channelId: 'rfi-hotline',
    audience: 'internal',
    senderRole: 'employee',
  },
];

export const MessagesChannelsView: React.FC = () => {
  const [audience, setAudience] = useState<'internal' | 'client'>('internal');
  const [activeChannel, setActiveChannel] = useState('estimating-ops');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<'message' | 'rfi' | 'change_request'>('message');

  const visibleChannels = audience === 'internal' ? CHANNELS : CLIENT_THREADS;
  const channelMessages = messages.filter((m) => m.channelId === activeChannel && m.audience === audience);
  const currentChannelInfo = visibleChannels.find((c) => c.id === activeChannel);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: audience === 'internal' ? 'Marcus Vance' : 'Client contact',
      avatarText: audience === 'internal' ? 'MV' : 'CC',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageType === 'rfi' ? `RFI: ${inputText.trim()}` : messageType === 'change_request' ? `CHANGE REQUEST: ${inputText.trim()}` : inputText.trim(),
      channelId: activeChannel,
      audience,
      projectId: audience === 'client' ? activeChannel : undefined,
      senderRole: audience === 'internal' ? 'employee' : 'client',
    };

    setMessages([...messages, newMsg]);
    setInputText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>COLLABORATION</span>
            <span>/</span>
            <span>TEAM CHANNELS & DIRECT COMS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Messages & Operational Channels
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Internal pre-con communications, engineering clash threads, and live RFI notifications
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg h-[620px] flex flex-col md:flex-row overflow-hidden">
        {/* Left Channel Sidebar */}
        <div className="w-full md:w-64 bg-[#0b1326] border-r border-[#222a3d] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#222a3d] space-y-2"><div className="grid grid-cols-2 rounded-lg bg-[#131b2e] p-1"><button type="button" onClick={() => { setAudience('internal'); setActiveChannel('estimating-ops'); }} className={`rounded px-2 py-1.5 text-[10px] font-bold ${audience === 'internal' ? 'bg-[#4edea3] text-[#003824]' : 'text-[#86948a]'}`}>Employee team</button><button type="button" onClick={() => { setAudience('client'); setActiveChannel(CLIENT_THREADS[0].id); }} className={`rounded px-2 py-1.5 text-[10px] font-bold ${audience === 'client' ? 'bg-[#3b82f6] text-white' : 'text-[#86948a]'}`}>Client portal</button></div><div className="font-mono text-[10px] font-semibold text-[#86948a] uppercase tracking-wider">{audience === 'internal' ? 'Operational channels' : 'Project conversations'}</div></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {visibleChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                  activeChannel === ch.id
                    ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                    : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Hash className={`w-3.5 h-3.5 ${activeChannel === ch.id ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                  <span className="truncate">{ch.name}</span>
                </div>
                {ch.unread > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#4edea3] text-[#003824] text-[10px] font-mono font-bold">
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-[#222a3d] text-xs font-mono text-[#86948a]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
              <span>14 Estimators Online</span>
            </div>
          </div>
        </div>

        {/* Right Chat Message Surface */}
        <div className="flex-1 flex flex-col bg-[#131b2e]">
          {/* Channel Header */}
          <div className="p-3.5 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]/60">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#4edea3]" />
                <span>{currentChannelInfo?.name}</span>
              </div>
              <div className="text-[11px] text-[#86948a]">{currentChannelInfo?.topic}</div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${audience === 'internal' ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20' : 'bg-[#3b82f6]/10 text-[#7db2ff] border-[#3b82f6]/20'}`}>
              {audience === 'internal' ? 'ENCRYPTED INTERNAL' : 'PROXIED CLIENT THREAD'}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {channelMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#222a3d] border border-[#4edea3]/30 flex items-center justify-center text-xs font-bold text-[#4edea3] shrink-0">
                  {msg.avatarText}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{msg.sender}</span>
                    <span className="text-[10px] font-mono text-[#86948a]">{msg.time}</span>
                  </div>
                  <div className="text-xs text-[#dae2fd] bg-[#0b1326] border border-[#222a3d] rounded-lg p-3 max-w-xl leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#222a3d] bg-[#0b1326] space-y-2"><div className="flex items-center justify-between gap-2">{audience === 'client' ? <p className="text-[10px] text-[#7db2ff]">Privacy proxy active · employees see only project-safe identity and context</p> : <p className="text-[10px] text-[#86948a]">Internal notes remain hidden from clients</p>}<select aria-label="Message type" value={messageType} onChange={(event) => setMessageType(event.target.value as typeof messageType)} className="rounded border border-[#2b3851] bg-[#131b2e] px-2 py-1 text-[10px] text-white"><option value="message">Message</option><option value="rfi">Create RFI</option><option value="change_request">Change request</option></select></div><div className="flex items-center gap-2"><input
              type="text"
              placeholder={`Message #${currentChannelInfo?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
            <button
              type="submit"
              className="h-8 px-3.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button></div>
          </form>
        </div>
      </div>
    </div>
  );
};
