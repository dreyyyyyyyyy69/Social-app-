
import React from 'react';
import { AppView, User } from '../types';
import { Globe, MessageSquare, Users, UserCircle, LogOut, Flame, Moon, Heart } from 'lucide-react';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onLogout: () => void;
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout, currentUser }) => {
  const menuItems = [
    { id: 'feed', label: 'World', icon: Globe },
    { id: 'discover', label: 'Match', icon: Flame },
    { id: 'liked', label: 'Liked', icon: Heart },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'astrology', label: 'Vedic', icon: Moon },
    { id: 'people', label: 'Connect', icon: Users },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r h-full flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
          S
        </div>
        <span className="hidden md:block text-xl font-extrabold tracking-tight text-indigo-900">SocialWorld</span>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as AppView)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
              activeView === item.id 
                ? 'bg-indigo-50 text-indigo-600 font-bold' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} className={item.id === 'discover' ? 'text-orange-500' : item.id === 'liked' ? 'text-rose-500' : ''} />
            <span className="hidden md:block text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={22} />
          <span className="hidden md:block font-bold text-sm">Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
