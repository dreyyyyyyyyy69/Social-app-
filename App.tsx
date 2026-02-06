
import React, { useState, useEffect } from 'react';
import { User, AppView, Post } from './types';
import Auth from './components/Auth';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import People from './components/People';
import ChatSection from './components/ChatSection';
import Discover from './components/Discover';
import ProfileSetup from './components/ProfileSetup';
import { auth, rtdb } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, update, push } from 'firebase/database';
import { Moon, MessageCircle, Zap, UserPlus, UserCheck, Heart, Settings, Edit3 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const VedicAstrology: React.FC<{ user: User }> = ({ user }) => {
  const [reading, setReading] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getVedicInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Based on this user's bio: "${user.bio || 'A seeker of truth and connection'}", generate a brief, mystical Vedic Astrology reading. Include their 'Moon Sign' characteristics, a 'Daily Remedy', and a 'Mantra'. Format it with emojis.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setReading(response.text || 'The stars are silent today.');
    } catch (e) {
      setReading('Could not connect to the heavens.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-8 md:p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Moon size={200} /></div>
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-6 tracking-tighter italic">Vedic Destiny</h2>
          {!reading ? (
            <button onClick={getVedicInsight} disabled={loading} className="px-10 py-5 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3 mx-auto transition-transform hover:scale-105 active:scale-95">
              {loading ? 'Consulting...' : 'Generate My Reading'}
            </button>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-left animate-in zoom-in duration-300">
               <div className="whitespace-pre-wrap font-medium text-indigo-50 leading-loose">{reading}</div>
               <button onClick={() => setReading('')} className="mt-8 text-xs font-black uppercase text-indigo-300 hover:text-white">New Alignment</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<AppView>('feed');
  const [isProfilePending, setIsProfilePending] = useState(false);
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [viewedUserPostCount, setViewedUserPostCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        onValue(ref(rtdb, `users/${firebaseUser.uid}`), (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setCurrentUser({
              ...data,
              id: firebaseUser.uid,
              friends: data.friends ? Object.keys(data.friends) : [],
              sentRequests: data.sentRequests ? Object.keys(data.sentRequests) : [],
              receivedRequests: data.receivedRequests ? Object.keys(data.receivedRequests) : [],
              likedProfiles: data.likedProfiles ? Object.keys(data.likedProfiles) : []
            });
            setIsProfilePending(!data.username);
          } else {
            // New user, no data in DB yet - set placeholder and force profile setup
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: '',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              friends: [],
              sentRequests: [],
              receivedRequests: [],
              likedProfiles: []
            });
            setIsProfilePending(true);
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (viewedProfileId) {
      const userRef = ref(rtdb, `users/${viewedProfileId}`);
      onValue(userRef, (snap) => {
        const d = snap.val();
        if (d) setViewedUser({ 
          ...d, 
          id: viewedProfileId,
          friends: d.friends ? Object.keys(d.friends) : [],
          sentRequests: d.sentRequests ? Object.keys(d.sentRequests) : [],
          receivedRequests: d.receivedRequests ? Object.keys(d.receivedRequests) : [],
          likedProfiles: d.likedProfiles ? Object.keys(d.likedProfiles) : []
        });
      });

      const postsRef = ref(rtdb, 'posts');
      onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const count = Object.values(data).filter((p: any) => p.userId === viewedProfileId).length;
          setViewedUserPostCount(count);
        } else { setViewedUserPostCount(0); }
      });
    }
  }, [viewedProfileId]);

  const handleViewProfile = (uid: string) => {
    setViewedProfileId(uid);
    setActiveView('profile');
  };

  const handleGoToChat = (targetUser: User) => {
    setSelectedChatUser(targetUser);
    setActiveView('chat');
    setViewedProfileId(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveView('feed');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-indigo-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!currentUser) return <Auth onLogin={() => {}} />;
  if (isProfilePending) return <ProfileSetup user={currentUser} onComplete={() => setIsProfilePending(false)} />;

  if (activeView === 'edit-profile') {
    return <ProfileSetup user={currentUser} onComplete={() => setActiveView('profile')} isEditing={true} />;
  }

  const displayUser = viewedProfileId && viewedUser ? viewedUser : currentUser;
  const isOwnProfile = displayUser.id === currentUser.id;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={(v) => { setActiveView(v); setViewedProfileId(null); }} onLogout={handleLogout} currentUser={currentUser} />

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900 capitalize tracking-tighter">
            {activeView === 'feed' ? 'The World' : activeView === 'liked' ? 'Saved Profiles' : activeView}
          </h1>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border">
               <img src={currentUser.avatar} className="w-6 h-6 rounded-full" />
               <span className="text-sm font-bold">@{currentUser.username}</span>
             </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {activeView === 'feed' && <Feed user={currentUser} onViewProfile={handleViewProfile} />}
          {activeView === 'discover' && <Discover user={currentUser} />}
          {activeView === 'astrology' && <VedicAstrology user={currentUser} />}
          {activeView === 'people' && <People user={currentUser} onViewProfile={handleViewProfile} />}
          {activeView === 'chat' && <ChatSection user={currentUser} onViewProfile={handleViewProfile} externalSelectedContact={selectedChatUser} />}
          
          {activeView === 'liked' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
               {currentUser.likedProfiles.length === 0 ? (
                 <div className="col-span-full text-center py-20">
                   <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No saved matches yet</p>
                 </div>
               ) : (
                 currentUser.likedProfiles.map(id => (
                   <div key={id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} className="w-20 h-20 rounded-full mx-auto border-4 border-gray-50 mb-4 cursor-pointer" onClick={() => handleViewProfile(id)} />
                     <h3 className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => handleViewProfile(id)}>Profile Linked</h3>
                     <button onClick={() => { setViewedProfileId(id); setActiveView('chat'); }} className="mt-4 w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100">Message</button>
                   </div>
                 ))
               )}
             </div>
          )}

          {activeView === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
               <div className="p-10 text-center bg-white rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
                  {isOwnProfile && (
                    <button onClick={() => setActiveView('edit-profile')} className="absolute top-6 right-6 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                      <Edit3 size={18} className="text-gray-400" />
                    </button>
                  )}
                  <img src={displayUser.avatar} className="w-32 h-32 rounded-full mx-auto border-8 border-indigo-50 shadow-xl mb-6 bg-white" />
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">@{displayUser.username}</h2>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">{displayUser.bio || "No bio yet."}</p>
                  
                  {!isOwnProfile && (
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <button onClick={() => handleGoToChat(displayUser)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                        <MessageCircle size={16} /> Message
                      </button>
                    </div>
                  )}

                  <div className="mt-10 flex justify-center gap-12 border-t pt-8 border-gray-50">
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900">{(displayUser.friends || []).length}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Friends</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900">{isOwnProfile ? (currentUser as any).postCount || 0 : viewedUserPostCount}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Posts</p>
                    </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Content Stream</h3>
                  <Feed user={currentUser} filterUserId={displayUser.id} onViewProfile={handleViewProfile} />
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
