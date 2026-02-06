
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { rtdb } from '../firebase';
import { ref, push, onValue, update, get } from 'firebase/database';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, MessageSquare, Image as ImageIcon, Zap, X, Gamepad2, Mic, Play, Layout, Clock, 
  BarChart3, Star, CheckCircle2, XCircle, Moon, Languages, Sparkles, Wand2, Paintbrush,
  ChevronLeft, Users
} from 'lucide-react';

interface ChatSectionProps {
  user: User;
  onViewProfile: (uid: string) => void;
  externalSelectedContact?: User | null;
}

const ChatSection: React.FC<ChatSectionProps> = ({ user, onViewProfile, externalSelectedContact }) => {
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(externalSelectedContact || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Advanced Features State
  const [aiVariations, setAiVariations] = useState<string[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatLang, setChatLang] = useState<'hinglish' | 'hindi'>('hinglish');
  const [chatWallpaper, setChatWallpaper] = useState<string>('rgba(249, 250, 251, 0.5)');
  
  const [astroDetails, setAstroDetails] = useState<any>(null);
  const [showAstroForm, setShowAstroForm] = useState(false);
  const [tempAstro, setTempAstro] = useState({ name: '', dob: '', time: '', place: '' });

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioChunks = useRef<Blob[]>([]);

  const wallpapers = [
    { name: 'Default', value: 'rgba(249, 250, 251, 0.5)' },
    { name: 'Midnight', value: 'linear-gradient(to bottom, #1e1b4b, #312e81)' },
    { name: 'Sunset', value: 'linear-gradient(to top right, #ffedd5, #fee2e2)' },
    { name: 'Doodle', value: 'url("https://www.transparenttextures.com/patterns/cubes.png")' },
    { name: 'Ocean', value: 'linear-gradient(to bottom, #e0f2fe, #7dd3fc)' }
  ];

  useEffect(() => {
    if (externalSelectedContact) setSelectedContact(externalSelectedContact);
  }, [externalSelectedContact]);

  useEffect(() => {
    onValue(ref(rtdb, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ ...val, id }))
          .filter(u => u.id !== user.id && (user.friends?.includes(u.id) || user.likedProfiles?.includes(u.id)));
        setContacts(list);
      }
    });
  }, [user.id, user.friends, user.likedProfiles]);

  useEffect(() => {
    if (selectedContact) {
      const chatId = [user.id, selectedContact.id].sort().join('_');
      onValue(ref(rtdb, `messages/${chatId}`), (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val })) as Message[];
          setMessages(list);
        } else setMessages([]);
      });
      onValue(ref(rtdb, `chatMetadata/${chatId}/astro`), (snap) => setAstroDetails(snap.val()));
    }
  }, [selectedContact, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (text: string = input, gameMeta: any = null, vn: string | null = null) => {
    if (!selectedContact || (!text.trim() && !image && !gameMeta && !vn)) return;
    
    const isFriend = user.friends?.includes(selectedContact.id);
    if (!isFriend && text.split(/\s+/).length > 50) {
      alert("Non-friends can only send messages up to 50 words!");
      return;
    }

    const chatId = [user.id, selectedContact.id].sort().join('_');
    const msgData: any = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: text,
      image: image || null,
      voiceNote: vn || null,
      isEphemeral: isEphemeral,
      timestamp: Date.now(),
      ...gameMeta
    };

    await push(ref(rtdb, `messages/${chatId}`), msgData);
    setInput(''); setImage(null); setIsEphemeral(false); setAiVariations([]); setSmartSuggestions([]);
    
    if (selectedContact.isBot) triggerBotReply(text, chatId, selectedContact);
  };

  const triggerBotReply = async (userText: string, chatId: string, bot: User) => {
    setIsBotTyping(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are @${bot.username}. Friend says: "${userText}". Reply in 3-8 words, Hinglish slang, Gen-Z vibe. 1 emoji.`;
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setTimeout(async () => {
            if (res.text) {
                await push(ref(rtdb, `messages/${chatId}`), {
                    senderId: bot.id,
                    receiverId: user.id,
                    content: res.text.trim(),
                    timestamp: Date.now()
                });
            }
            setIsBotTyping(false);
        }, 1500);
    } catch (e) { setIsBotTyping(false); }
  };

  // GEN-Z & TRANSLATOR
  const getGenZSuggestions = async () => {
    if (!input.trim()) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Rewrite "${input}" into 3 short Gen-Z ${chatLang} variations. Separated by |. Max 6 words each. Use ${chatLang} slang exclusively. Just the variations.`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (res.text) setAiVariations(res.text.split('|').map(s => s.trim()));
    } catch (e) {}
  };

  const translateToEnglish = async () => {
    if (!input.trim()) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Translate this text to natural, standard English: "${input}". Just the translated text.` });
      if (res.text) setInput(res.text.trim());
    } catch (e) {}
  };

  const getSmartSuggestions = async () => {
    if (messages.length === 0) return;
    setIsBotTyping(true);
    try {
      const history = messages.slice(-5).map(m => m.content).join('\n');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Based on this chat history:\n${history}\nProvide 4 short, interesting reply suggestions. Use Hinglish. Separated by |. Max 5 words each.`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (res.text) setSmartSuggestions(res.text.split('|').map(s => s.trim()));
    } catch (e) {} finally { setIsBotTyping(false); }
  };

  // GAMES & ASTRO
  const playTruthDare = async () => {
    setShowGameMenu(false);
    setIsBotTyping(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Send one spicy Gen-Z Truth or Dare. Just the text." });
    if (res.text) handleSendMessage(`🎲 T&D: ${res.text.trim()}`, { isGame: true, gameType: 'truthdare', status: 'pending' });
    setIsBotTyping(false);
  };

  const handleGameAction = async (msgId: string, status: 'completed' | 'failed') => {
    const chatId = [user.id, selectedContact!.id].sort().join('_');
    await update(ref(rtdb, `messages/${chatId}/${msgId}`), { status });
    if (status === 'failed') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Give a funny, embarrassing punishment for failing a dare. Hinglish. Short." });
      if (res.text) handleSendMessage(`💀 PUNISHMENT: ${res.text.trim()}`);
    }
  };

  const getReportCard = async () => {
    setShowGameMenu(false);
    setIsBotTyping(true);
    const history = messages.slice(-20).map(m => `${m.senderId === user.id ? 'A' : 'B'}: ${m.content}`).join('\n');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze relationship based on chat: ${history}. Hinglish. Format: TYPE | SCORE | ANALYSIS.`;
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    if (res.text) {
      const [type, score, analysis] = res.text.split('|');
      handleSendMessage(`📊 REPORT CARD:\n\n❤️ Type: ${type}\n🔥 Score: ${score}\n📝 Analysis: ${analysis}`, { isGame: true, gameType: 'report' });
    }
    setIsBotTyping(false);
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunks.current = [];
        recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
        recorder.onstop = () => {
            const reader = new FileReader();
            reader.onloadend = () => handleSendMessage('', null, reader.result as string);
            reader.readAsDataURL(new Blob(audioChunks.current, { type: 'audio/webm' }));
        };
        recorder.start(); setMediaRecorder(recorder); setIsRecording(true);
    } catch (e) { alert("Mic access denied"); }
  };

  return (
    <div className="bg-white md:rounded-[40px] shadow-2xl border flex h-[calc(100dvh-80px)] md:h-[calc(100vh-140px)] overflow-hidden font-inter relative">
      {/* Sidebar - Contacts (Hidden on mobile if chat is selected) */}
      <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex-col bg-indigo-50/10`}>
        <div className="p-4 md:p-6 border-b flex items-center justify-between bg-white">
            <h3 className="font-black text-indigo-900 text-sm uppercase tracking-widest italic">Vibe List</h3>
            <MessageSquare size={18} className="text-indigo-600" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(f => (
            <button key={f.id} onClick={() => setSelectedContact(f)} className={`w-full flex items-center gap-4 p-4 hover:bg-white transition-all border-b border-gray-50 ${selectedContact?.id === f.id ? 'bg-white shadow-sm border-l-4 border-l-indigo-600' : ''}`}>
               <img src={f.avatar} className="w-12 h-12 rounded-full border shadow-sm" />
               <div className="text-left truncate flex-1">
                 <p className="font-black text-gray-900 text-sm italic">@{f.username}</p>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{user.friends?.includes(f.id) ? 'Friend' : 'Match'}</p>
               </div>
            </button>
          ))}
          {contacts.length === 0 && (
            <div className="p-10 text-center text-gray-400">
               {/* Added 'Users' to lucide-react import */}
               <Users size={32} className="mx-auto mb-2 opacity-20" />
               <p className="text-[10px] font-black uppercase tracking-widest">No Vibes Yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area (Hidden on mobile if no contact selected) */}
      <div className={`${!selectedContact ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-white relative`}>
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 md:px-6 md:py-4 bg-white/95 backdrop-blur-xl border-b flex items-center justify-between z-20 shadow-sm sticky top-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-gray-400"><ChevronLeft size={24} /></button>
                <img src={selectedContact.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full border shadow-sm" />
                <div className="truncate">
                   <h4 className="font-black text-gray-900 text-sm italic">@{selectedContact.username}</h4>
                   <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">Active Now</p>
                </div>
              </div>
              <div className="flex gap-1 md:gap-2 relative">
                 <button onClick={() => setShowGameMenu(!showGameMenu)} className="p-2 md:p-2.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Gamepad2 size={18} /></button>
                 <button onClick={() => setShowSettings(!showSettings)} className="p-2 md:p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Layout size={18} /></button>
                 
                 {/* Game Menu */}
                 {showGameMenu && (
                  <div className="absolute top-12 right-0 w-48 md:w-52 bg-white border-2 border-orange-100 shadow-2xl rounded-3xl z-50 p-2 space-y-1 animate-in zoom-in duration-200">
                     <button onClick={playTruthDare} className="w-full text-left p-2.5 hover:bg-orange-50 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase text-orange-600"><Zap size={14} /> Truth or Dare</button>
                     <button onClick={() => { setShowAstroForm(true); setShowGameMenu(false); }} className="w-full text-left p-2.5 hover:bg-purple-50 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase text-purple-600"><Moon size={14} /> Vedic Astro</button>
                     <button onClick={getReportCard} className="w-full text-left p-2.5 hover:bg-green-50 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase text-green-600"><BarChart3 size={14} /> Report Card</button>
                  </div>
                 )}

                 {/* Settings Menu */}
                 {showSettings && (
                  <div className="absolute top-12 right-0 w-60 md:w-64 bg-white border-2 border-indigo-100 shadow-2xl rounded-3xl z-50 p-4 space-y-4 animate-in zoom-in duration-200">
                     <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Languages size={10}/> Language</p>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                          <button onClick={() => setChatLang('hinglish')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${chatLang === 'hinglish' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}>Hinglish</button>
                          <button onClick={() => setChatLang('hindi')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${chatLang === 'hindi' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}>Hindi</button>
                        </div>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Paintbrush size={10}/> Wallpaper</p>
                        <div className="grid grid-cols-5 gap-2">
                           {wallpapers.map(w => (
                             <button key={w.name} onClick={() => setChatWallpaper(w.value)} className="w-full aspect-square rounded-lg border-2 border-white shadow-sm" style={{ background: w.value.includes('url') ? '#eee' : w.value }} title={w.name} />
                           ))}
                        </div>
                     </div>
                     <button onClick={() => setShowSettings(false)} className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase">Close</button>
                  </div>
                 )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 transition-all" style={{ background: chatWallpaper, backgroundSize: 'cover' }}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                   <div className="max-w-[90%] md:max-w-[75%]">
                      <div className={`p-3 md:p-4 rounded-[24px] md:rounded-[28px] shadow-sm md:shadow-lg relative ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none'}`}>
                        {m.image && <img src={m.image} className="w-full rounded-xl mb-2 max-h-52 md:max-h-60 object-cover" alt="sent" />}
                        {m.voiceNote && <div className="flex items-center gap-3 py-1.5 px-2 bg-black/10 rounded-xl mb-2"><Play size={12} fill="currentColor" /> <div className="h-1 flex-1 bg-white/20 rounded-full"></div> <span className="text-[8px] font-black uppercase">VN</span></div>}
                        {m.content && <p className="text-sm md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                        
                        {m.isGame && m.gameType === 'truthdare' && m.status === 'pending' && m.senderId !== user.id && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleGameAction(m.id, 'completed')} className="bg-green-500/20 text-green-500 px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Done</button>
                            <button onClick={() => handleGameAction(m.id, 'failed')} className="bg-rose-500/20 text-rose-500 px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"><XCircle size={10}/> Fail</button>
                          </div>
                        )}
                        {m.status && <div className="absolute -bottom-4 right-1 text-[7px] font-black uppercase text-gray-400 italic tracking-widest">{m.status}</div>}
                      </div>
                   </div>
                </div>
              ))}
              {isBotTyping && <div className="flex justify-start"><div className="bg-white/50 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-gray-400 animate-pulse uppercase">Typing...</div></div>}
              <div ref={scrollRef} />
            </div>

            {/* Footer Input Area */}
            <div className="p-2 md:p-6 bg-white border-t relative">
               {/* Suggestions List */}
               {smartSuggestions.length > 0 && (
                 <div className="absolute bottom-full left-2 right-2 md:left-4 md:right-4 bg-white/90 backdrop-blur-md border shadow-2xl p-3 mb-2 rounded-[24px] flex overflow-x-auto no-scrollbar gap-2 animate-in slide-in-from-bottom-2 z-30">
                    {smartSuggestions.map((s, i) => (
                      <button key={i} onClick={() => { setInput(s); setSmartSuggestions([]); }} className="whitespace-nowrap px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black border border-indigo-100">{s}</button>
                    ))}
                    <button onClick={() => setSmartSuggestions([])} className="p-1 text-gray-400 sticky right-0 bg-white/90 rounded-full"><X size={14}/></button>
                 </div>
               )}

               {/* AI Tool Row - Scrollable on mobile */}
               <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={getGenZSuggestions} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"><Zap size={12}/> Gen-Z</button>
                  <button onClick={translateToEnglish} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase"><Languages size={12}/> To Eng</button>
                  <button onClick={getSmartSuggestions} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-full text-[9px] font-black uppercase border border-yellow-100"><Sparkles size={12}/> AI Replies</button>
                  {astroDetails && astroDetails[selectedContact.id] && (
                    <button onClick={async () => {
                        if (!input.trim()) return alert("Pucho!");
                        setIsBotTyping(true);
                        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Vedic Astro Persona: "${input}". 15 words, mysterious.` });
                        if (res.text) handleSendMessage(`🔮 ASTRO: ${res.text.trim()}`);
                        setIsBotTyping(false);
                    }} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-full text-[9px] font-black uppercase"><Star size={12}/> Astro</button>
                  )}
               </div>

               {/* Variations Popup */}
               {aiVariations.length > 0 && (
                 <div className="absolute bottom-full left-2 right-2 md:left-4 md:right-4 bg-white border-4 border-indigo-600 rounded-[28px] shadow-2xl p-3 mb-3 z-50 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Gen-Z Vibes</span>
                      <button onClick={() => setAiVariations([])} className="p-1 text-gray-400"><X size={14}/></button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       {aiVariations.map((v, i) => (
                         <button key={i} onClick={() => { setInput(v); setAiVariations([]); }} className="text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-[11px] font-bold border border-indigo-100 truncate">
                           {v}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               {/* Input Bar */}
               <div className="flex items-end gap-2 bg-gray-50 p-1.5 md:p-2 rounded-[28px] md:rounded-[32px] border border-gray-100 ring-2 md:ring-4 ring-indigo-50/50">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    {image && <div className="relative inline-block w-12 ml-2 mb-1"><img src={image} className="w-12 h-12 object-cover rounded-lg border shadow-sm" /><button onClick={() => setImage(null)} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5"><X size={8}/></button></div>}
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type vibe..." className="w-full px-3 py-2 bg-transparent outline-none text-sm resize-none font-medium h-10 md:h-12 leading-tight" />
                  </div>
                  <div className="flex items-center gap-0.5 mb-1">
                    <label className="p-2 text-gray-400 hover:text-indigo-600 cursor-pointer"><ImageIcon size={20}/><input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       const f = e.target.files?.[0];
                       if (f) { const r = new FileReader(); r.onloadend = () => setImage(r.result as string); r.readAsDataURL(f); }
                    }}/></label>
                    <button onMouseDown={startRecording} onMouseUp={() => mediaRecorder?.stop()} className={`p-2 transition-all ${isRecording ? 'bg-rose-100 text-rose-600 rounded-full' : 'text-gray-400 hover:text-indigo-600'}`}><Mic size={20}/></button>
                    <button onClick={() => handleSendMessage()} disabled={!input.trim() && !image} className={`p-2.5 rounded-xl shadow-lg transition-all ${!input.trim() && !image ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white'}`}><Send size={18} /></button>
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-indigo-50/20">
             <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center text-indigo-600 mb-6 animate-bounce"><MessageSquare size={40} /></div>
             <h3 className="text-xl font-black text-gray-900 tracking-tighter italic italic">World's Coolest Chat</h3>
             <p className="text-gray-400 text-xs font-medium mt-2">Pick a vibe and start the conversation.</p>
          </div>
        )}
      </div>

      {/* Astro Form Modal (Private) */}
      {showAstroForm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[40px] p-8 relative shadow-2xl">
            <button onClick={() => setShowAstroForm(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full"><X size={18}/></button>
            <h3 className="text-xl font-black mb-6 italic tracking-tighter text-purple-900 text-center">Vedic Private Entry</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-xs" value={tempAstro.name} onChange={e => setTempAstro({...tempAstro, name: e.target.value})} />
              <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-xs text-gray-400" value={tempAstro.dob} onChange={e => setTempAstro({...tempAstro, dob: e.target.value})} />
              <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-xs text-gray-400" value={tempAstro.time} onChange={e => setTempAstro({...tempAstro, time: e.target.value})} />
              <input type="text" placeholder="Birth City" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-xs" value={tempAstro.place} onChange={e => setTempAstro({...tempAstro, place: e.target.value})} />
              <button onClick={async () => {
                const chatId = [user.id, selectedContact!.id].sort().join('_');
                await update(ref(rtdb, `chatMetadata/${chatId}/astro/${user.id}`), tempAstro);
                setShowAstroForm(false);
              }} className="w-full py-4 bg-purple-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl">Secure Connect</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ChatSection;
