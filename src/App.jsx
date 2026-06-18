import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Megaphone, FileText, Save, Send, Droplet, User, MapPin, Clock, 
  Pencil, Trash2, Phone, MessageSquare, Activity, Award, Calendar, 
  Sparkles, Search, Users, Scale, Copy, Lock, Plus, RefreshCw, 
  UserPlus, Shield, Ban, Unlock, LogOut, Eye, EyeOff, Zap, Home, 
  Heart, Stethoscope, Check, AlertTriangle, X, Info, Download, History, Image as ImageIcon
} from 'lucide-react';

export default function App() {
  // আগের সকল স্টেট
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('home');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [newDonor, setNewDonor] = useState({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });

  // নতুন ফিচার: পোস্টের স্টেট
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ caption: '', file: null });

  // অন্যান্য বিদ্যমান স্টেট
  const [allLogs, setAllLogs] = useState([]);

  useEffect(() => {
    fetchDonors();
    fetchRequests();
    fetchVolunteers();
    fetchAllLogs();
    fetchPosts(); // নতুন: পোস্ট লোড করা
  }, []);

  // নতুন: পোস্ট ফেচিং
  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  // নতুন: পোস্ট সাবমিট ও ইমেজ আপলোড
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.caption && !newPost.file) return showToast('কিছু লিখুন বা ছবি দিন', 'error');
    
    let mediaUrl = null;
    if (newPost.file) {
      const fileName = `${Date.now()}_${newPost.file.name}`;
      const { data, error } = await supabase.storage.from('posts').upload(fileName, newPost.file);
      if (error) return showToast('ছবি আপলোড ব্যর্থ', 'error');
      mediaUrl = data.path;
    }

    const { error } = await supabase.from('posts').insert([{ caption: newPost.caption, media_url: mediaUrl }]);
    if (error) return showToast('পোস্ট ব্যর্থ', 'error');
    
    showToast('পোস্ট সফল হয়েছে!', 'success');
    setNewPost({ caption: '', file: null });
    fetchPosts();
  };

  // নতুন: পোস্ট ডিলিট
  const deletePost = async (postId, mediaPath) => {
    if (mediaPath) await supabase.storage.from('posts').remove([mediaPath]);
    await supabase.from('posts').delete().eq('id', postId);
    showToast('পোস্ট ডিলিট হয়েছে', 'success');
    fetchPosts();
  };

  const showToast = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
  };

  // আপনার আগের সকল ফাংশনগুলো (fetchDonors, fetchRequests, etc.) ঠিক এই জায়গায় একইভাবে থাকবে...
  // আমি এখানে জায়গা বাঁচাতে পুরনো ফাংশনগুলো পুনরায় লিখলাম না, সেগুলো আপনার আগের কোড থেকে একইভাবে এখানে রেখে দেবেন।

  // ... অ্যাপের বাকি সব রেন্ডারিং লজিক এখানে থাকবে ...

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* হেডার এবং অন্যান্য ট্যাব কন্টেন্ট এখানে থাকবে */}

      {/* নোটিশ বোর্ড ট্যাব */}
      {activeTab === 'notice' && (
        <div className="space-y-6 p-4">
          
          {/* নতুন: অ্যাডমিন পোস্ট করার ফর্ম */}
          {isUnlocked && (
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
              <h3 className="font-bold text-sm">নতুন আপডেট পোস্ট করুন</h3>
              <textarea 
                className="w-full border p-2 rounded-lg text-sm" 
                placeholder="কি ঘটছে?" 
                value={newPost.caption} 
                onChange={e => setNewPost({...newPost, caption: e.target.value})} 
              />
              <input type="file" onChange={e => setNewPost({...newPost, file: e.target.files[0]})} className="text-xs" />
              <button onClick={handlePostSubmit} className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm">
                পাবলিশ করুন
              </button>
            </div>
          )}

          {/* নতুন: পোস্ট ফিড */}
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl shadow p-4 border relative">
                {isUnlocked && (
                  <button onClick={() => deletePost(post.id, post.media_url)} className="absolute top-2 right-2 text-rose-500">
                    <Trash2 className="w-4" />
                  </button>
                )}
                <p className="mb-2 text-sm text-slate-800">{post.caption}</p>
                {post.media_url && (
                  <img src={supabase.storage.from('posts').getPublicUrl(post.media_url).data.publicUrl} className="rounded-lg w-full" alt="post" />
                )}
              </div>
            ))}
          </div>

          {/* আগের জরুরি রক্তের নোটিশ বোর্ড */}
          <div className="border-t pt-4">
            <h2 className="font-bold text-lg mb-3">জরুরি রক্তের আবেদনসমূহ</h2>
            {/* আপনার আগের emergencyRequests ম্যাপ লজিক এখানে */}
          </div>
        </div>
      )}

      {/* ফুটার */}
      <footer className="text-center p-6 text-xs text-slate-500 border-t mt-10">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী।</p>
        <p className="font-bold">কারিগরি সহযোগিতায়: অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</p>
      </footer>
    </div>
  );
}
