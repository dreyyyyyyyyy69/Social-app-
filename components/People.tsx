
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { rtdb } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { UserPlus, Clock, Check, X, Search, Users } from 'lucide-react';

interface PeopleProps {
  user: User;
  onViewProfile: (uid: string) => void;
}

const People: React.FC<PeopleProps> = ({ user, onViewProfile }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    onValue(ref(rtdb, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({
            ...val,
            id,
            friends: val.friends ? Object.keys(val.friends) : [],
            sentRequests: val.sentRequests ? Object.keys(val.sentRequests) : [],
            receivedRequests: val.receivedRequests ? Object.keys(val.receivedRequests) : []
          }))
          .filter(u => u.id !== user.id);
        setAllUsers(list);
      }
    });
  }, [user.id]);

  const sendRequest = async (targetId: string) => {
    const updates: any = {};
    updates[`/users/${user.id}/sentRequests/${targetId}`] = true;
    updates[`/users/${targetId}/receivedRequests/${user.id}`] = true;
    await update(ref(rtdb), updates);
  };

  const filteredUsers = allUsers.filter(u => {
    if (user.friends.includes(u.id) || user.receivedRequests.includes(u.id)) return false;
    return u.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Discover People</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <img 
              src={u.avatar} 
              onClick={() => onViewProfile(u.id)}
              className="w-20 h-20 rounded-full mx-auto border-4 border-gray-50 mb-4 cursor-pointer" 
            />
            <h3 onClick={() => onViewProfile(u.id)} className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors">@{u.username}</h3>
            <div className="mt-6">
              {user.sentRequests.includes(u.id) ? (
                <button disabled className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2"><Clock size={18} /> Requested</button>
              ) : (
                <button onClick={() => sendRequest(u.id)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md">Add Friend</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default People;
