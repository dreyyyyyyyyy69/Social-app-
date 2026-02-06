
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { rtdb } from '../firebase';
import { ref, update, set } from 'firebase/database';
import { RefreshCw, Sparkles, X } from 'lucide-react';

interface ProfileSetupProps {
  user: User;
  onComplete: () => void;
  isEditing?: boolean;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onComplete, isEditing }) => {
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState(user.avatarStyle || 'avataaars');
  const [seed, setSeed] = useState(user.id);

  const avatarStyles = ['avataaars', 'bottts', 'lorelei', 'adventurer', 'fun-emoji'];
  const currentAvatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) return alert('Username too short');
    
    setLoading(true);
    try {
      const formattedUsername = username.toLowerCase().replace(/\s/g, '_');
      const userRef = ref(rtdb, `users/${user.id}`);
      
      const updateData = {
        avatar: currentAvatar,
        avatarStyle: style,
        username: formattedUsername,
        bio
      };

      if (isEditing) {
        await update(userRef, updateData);
      } else {
        await set(userRef, {
          ...updateData,
          id: user.id,
          email: user.email,
          friends: {},
          sentRequests: {},
          receivedRequests: {},
          likedProfiles: {}
        });
      }
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50/30 flex items-center justify-center p-6 font-inter">
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-white relative">
        {isEditing && (
           <button onClick={onComplete} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
        )}
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-shrink-0 text-center">
             <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">Visual Style</h2>
             <div className="relative inline-block">
               <div className="w-40 h-40 rounded-[40px] bg-indigo-50 border-4 border-indigo-100 p-2 shadow-inner">
                 <img src={currentAvatar} className="w-full h-full object-contain" alt="Avatar Preview" />
               </div>
               <button 
                onClick={() => setSeed(Math.random().toString(36).substring(7))}
                className="absolute -bottom-4 -right-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:rotate-180 transition-all"
               >
                 <RefreshCw size={20} />
               </button>
             </div>
             
             <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-[200px] mx-auto">
               {avatarStyles.map(s => (
                 <button 
                  key={s} 
                  onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${
                    style === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                 >
                   {s.replace('-', ' ')}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter italic italic">{isEditing ? 'Refresh Vibe ✨' : 'Vibe Check! ✨'}</h2>
            <p className="text-gray-500 mb-8 font-medium">{isEditing ? 'Update your identity.' : 'Claim your username and start the game.'}</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 font-black">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bio / Vibe</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black py-5 rounded-[24px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? 'Processing...' : isEditing ? 'Save Changes' : 'Enter the World'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
