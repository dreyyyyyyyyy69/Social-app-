
import React, { useState, useEffect } from 'react';
import { Post, User } from '../types';
import { rtdb } from '../firebase';
import { ref, push, onValue } from 'firebase/database';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, X } from 'lucide-react';

interface FeedProps {
  user: User;
  filterUserId?: string;
  onViewProfile: (uid: string) => void;
}

const Feed: React.FC<FeedProps> = ({ user, filterUserId, onViewProfile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const postsRef = ref(rtdb, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let postList = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
          likes: val.likes ? Object.keys(val.likes) : []
        }));
        if (filterUserId) postList = postList.filter(p => p.userId === filterUserId);
        postList.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postList);
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, [filterUserId]);

  const handlePost = async () => {
    if ((!content.trim() && !image) || isPosting) return;
    setIsPosting(true);
    await push(ref(rtdb, 'posts'), {
      userId: user.id,
      username: user.username,
      content,
      image: image || null,
      timestamp: Date.now(),
      likes: {}
    });
    setContent('');
    setImage(null);
    setIsPosting(false);
  };

  return (
    <div className={`space-y-6 ${filterUserId ? '' : 'max-w-2xl mx-auto'} pb-20`}>
      {!filterUserId && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ring-4 ring-indigo-50/30">
          <div className="flex gap-4">
            <img src={user.avatar} onClick={() => onViewProfile(user.id)} className="w-12 h-12 rounded-full border cursor-pointer" />
            <div className="flex-1">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." className="w-full bg-transparent border-none text-lg focus:ring-0 resize-none h-20" />
              {image && (
                <div className="relative mb-4 mt-2">
                  <img src={image} className="rounded-2xl max-h-80 w-full object-cover border-2 border-white shadow-lg" />
                  <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full"><X size={16}/></button>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <label className="cursor-pointer text-indigo-600 flex items-center gap-2">
                  <ImageIcon size={22} />
                  <span className="text-xs font-bold">Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                        const reader = new FileReader();
                        reader.onloadend = () => setImage(reader.result as string);
                        reader.readAsDataURL(f);
                    }
                  }} />
                </label>
                <button onClick={handlePost} disabled={isPosting || (!content.trim() && !image)} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-full shadow-lg disabled:opacity-50">Post</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.map(post => (
          <article key={post.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} 
                  onClick={() => onViewProfile(post.userId)}
                  className="w-10 h-10 rounded-full border cursor-pointer" 
                />
                <div onClick={() => onViewProfile(post.userId)} className="cursor-pointer">
                  <h3 className="font-bold text-gray-900 leading-none">@{post.username}</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              {post.content && <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>}
            </div>
            {post.image && <img src={post.image} className="w-full object-cover max-h-[500px]" alt="Post" />}
            <div className="px-6 py-4 flex items-center gap-8 text-gray-500 border-t bg-gray-50/30">
               <button className="flex items-center gap-2 hover:text-red-500"><Heart size={18} /> {post.likes.length}</button>
               <button className="flex items-center gap-2 hover:text-indigo-500"><MessageCircle size={18} /> 0</button>
               <button className="flex items-center gap-2 ml-auto"><Share2 size={18} /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Feed;
