
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { rtdb } from '../firebase';
import { ref, onValue, update, set } from 'firebase/database';
import { Heart, X, Sparkles } from 'lucide-react';

interface DiscoverProps {
  user: User;
}

const Discover: React.FC<DiscoverProps> = ({ user }) => {
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const bots = [
      { id: 'bot_1', username: 'zoya_poet', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoya', bio: 'Living in verses and chai. ☕️ | Poetess | Dreamer', isBot: true, email: 'zoya@social.bot' },
      { id: 'bot_2', username: 'aryan_tech', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan', bio: 'Building the future one line of code at a time. 💻', isBot: true, email: 'aryan@social.bot' },
      { id: 'bot_3', username: 'ishani_gamer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishani', bio: 'Don\'t ask me to pause online games. 🎮 | Valorant fan', isBot: true, email: 'ishani@social.bot' },
      { id: 'bot_4', username: 'kabir_fitness', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir', bio: 'Gym is my therapy. 🏋️‍♂️ | Nutriton | Growth', isBot: true, email: 'kabir@social.bot' },
      { id: 'bot_5', username: 'mira_art', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mira', bio: 'Painting my own reality. 🎨 | Aesthetic seeker', isBot: true, email: 'mira@social.bot' }
    ];

    bots.forEach(bot => {
      set(ref(rtdb, `users/${bot.id}`), { ...bot, friends: {}, receivedRequests: {}, sentRequests: {} });
    });

    const unsubscribe = onValue(ref(rtdb, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ ...val, id }))
          .filter(u => u.id !== user.id && !user.friends?.includes(u.id) && !user.likedProfiles?.includes(u.id));
        setProfiles(list);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleMatch = async (targetId: string) => {
    const updates: any = {};
    updates[`/users/${user.id}/likedProfiles/${targetId}`] = true;
    await update(ref(rtdb), updates);
    setCurrentIndex(prev => prev + 1);
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <Sparkles size={64} className="text-indigo-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 italic tracking-tighter">Vibe Limit Reached!</h2>
        <p className="text-gray-500 mt-2 font-medium">Check your Liked list or come back later.</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="flex justify-center items-center py-10 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-sm relative aspect-[3/4] bg-white rounded-[40px] shadow-2xl overflow-hidden border">
        <img src={currentProfile.avatar} className="w-full h-full object-cover bg-gray-100" alt="Profile" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-8 w-full text-white">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black italic tracking-tighter">@{currentProfile.username}</h2>
            {currentProfile.isBot && <Sparkles size={16} className="text-yellow-400" />}
          </div>
          <p className="text-gray-200 text-sm mb-6 line-clamp-2 font-medium">{currentProfile.bio || "No bio yet."}</p>
          
          <div className="flex justify-center gap-6">
            <button onClick={handleSkip} className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all border border-white/20">
              <X size={32} className="text-white" />
            </button>
            <button onClick={() => handleMatch(currentProfile.id)} className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl">
              <Heart size={32} fill="white" className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;
