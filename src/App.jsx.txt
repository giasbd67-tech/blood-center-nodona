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
  // ১. কোর অ্যাপ্লিকেশন স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [posts, setPosts] = useState([]); 
  const [allLogs, setAllLogs] = useState([]);

  // ২. ফিল্টারিং এবং ট্যাব কন্ট্রোল স্টেট
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  // ৩. ফর্ম ইনপুট স্টেটসমূহ
  const [newDonor, setNewDonor] = useState({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  const [newRequest, setNewRequest] = useState({ id: null, patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '', points: '' });
  const [newPost, setNewPost] = useState({ caption: '', file: null });
  const [newLog, setNewLog] = useState({ patient_name: '', hospital: '', date: '' });

  // ৪. অথেনটিকেশন ও মোডাল স্টেটসমূহ
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerPassword, setVolunteerPassword] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogDonor, setActiveLogDonor] = useState(null);

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // কাস্টম নোটিফিকেশন প্রদর্শনকারী হেল্পার
  const showToast = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
  };

  // ডেটা ফেচিং এবং ক্যাশিং লজিক
  useEffect(() => {
    fetchDonors();
    fetchRequests();
    fetchVolunteers();
    fetchPosts();
    fetchLogs();

    const cachedDonors = localStorage.getItem('cached_donors');
    const cachedRequests = localStorage.getItem('cached_requests');
    if (cachedDonors) setDonors(JSON.parse(cachedDonors));
    if (cachedRequests) setEmergencyRequests(JSON.parse(cachedRequests));
  }, []);

  const fetchDonors = async () => {
    const { data } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
    if (data) { setDonors(data); localStorage.setItem('cached_donors', JSON.stringify(data)); }
  };

  const fetchRequests = async () => {
    const { data } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
    if (data) { setEmergencyRequests(data); localStorage.setItem('cached_requests', JSON.stringify(data)); }
  };

  const fetchVolunteers = async () => {
    const { data } = await supabase.from('volunteers').select('*').order('points', { ascending: false });
    if (data) setVolunteers(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('donation_logs').select('*').order('date', { ascending: false });
    if (data) setAllLogs(data);
  };

  // রক্তদাতা নিবন্ধন ও এডিট হ্যান্ডলার
  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.address) return showToast('অনুগ্রহ করে সব তথ্য দিন', 'error');

    if (newDonor.id) {
      const { error } = await supabase.from('donors').update(newDonor).eq('id', newDonor.id);
      if (!error) { showToast('রক্তদাতার তথ্য আপডেট হয়েছে', 'success'); resetDonorForm(); fetchDonors(); }
    } else {
      const { error } = await supabase.from('donors').insert([newDonor]);
      if (!error) { showToast('নতুন রক্তদাতা নিবন্ধিত হয়েছে!', 'success'); resetDonorForm(); fetchDonors(); }
    }
  };

  const resetDonorForm = () => {
    setNewDonor({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  };

  // জরুরি রক্ত রিকোয়েস্ট হ্যান্ডলার
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newRequest.patient_name || !newRequest.hospital || !newRequest.phone) return showToast('সব ফিল্ড পূরণ করুন', 'error');

    const { error } = await supabase.from('emergency_requests').insert([newRequest]);
    if (!error) { showToast('জরুরি রক্তের আবেদন পোস্ট করা হয়েছে', 'success'); setNewRequest({ id: null, patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); fetchRequests(); }
  };

  const deleteRequest = async (id) => {
    const { error } = await supabase.from('emergency_requests').delete().eq('id', id);
    if (!error) { showToast('আবেদনটি মুছে ফেলা হয়েছে', 'success'); fetchRequests(); }
  };

  // ফেসবুক স্টাইল পোস্ট এবং ইমেজ স্টোরেজ আপলোড লজিক
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.caption && !newPost.file) return showToast('কিছু লিখুন অথবা একটি ছবি সিলেক্ট করুন', 'error');

    let mediaUrl = null;
    if (newPost.file) {
      const fileName = `${Date.now()}_${newPost.file.name}`;
      const { data, error: uploadError } = await supabase.storage.from('posts').upload(fileName, newPost.file);
      if (uploadError) return showToast('ছবি আপলোড ব্যর্থ হয়েছে', 'error');
      mediaUrl = data.path;
    }

    const { error } = await supabase.from('posts').insert([{ caption: newPost.caption, media_url: mediaUrl }]);
    if (!error) { showToast('পোস্টটি সফলভাবে প্রকাশিত হয়েছে', 'success'); setNewPost({ caption: '', file: null }); fetchPosts(); }
  };

  const deletePost = async (postId, mediaPath) => {
    if (mediaPath) {
      await supabase.storage.from('posts').remove([mediaPath]);
    }
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) { showToast('পোস্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে', 'success'); fetchPosts(); }
  };

  // ভলান্টিয়ার সিকিউরিটি ও পয়েন্ট লিডারবোর্ড সিস্টেম
  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    if (!newVolunteer.name || !newVolunteer.phone || !newVolunteer.password) return showToast('সব তথ্য পূরণ করুন', 'error');
    const { error } = await supabase.from('volunteers').insert([{ ...newVolunteer, points: parseInt(newVolunteer.points) || 0, is_active: true }]);
    if (!error) { showToast('নতুন ভলান্টিয়ার যুক্ত হয়েছে', 'success'); setNewVolunteer({ name: '', phone: '', password: '', points: '' }); fetchVolunteers(); }
  };

  const checkVolunteerAccess = async (phone, pass) => {
    const { data, error } = await supabase.from('volunteers').select('*').eq('phone', phone).single();
    if (data && data.password === pass && data.is_active) {
      setIsUnlocked(true);
      localStorage.setItem('v_phone', phone);
      localStorage.setItem('v_pass', pass);
      showToast('অ্যাডমিন অ্যাক্সেস আনলক হয়েছে!', 'success');
    } else {
      showToast('ভুল ফোন নম্বর অথবা পাসওয়ার্ড', 'error');
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    localStorage.removeItem('v_pass');
    showToast('লগআউট সম্পন্ন হয়েছে', 'info');
  };

  // স্মার্ট হিস্ট্রি ট্র্যাকিং লজিক
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!newLog.patient_name || !newLog.hospital || !newLog.date) return showToast('সব তথ্য দিন', 'error');

    const { error } = await supabase.from('donation_logs').insert([{ donor_id: activeLogDonor.id, ...newLog }]);
    if (!error) {
      const updatedCount = (parseInt(activeLogDonor.activity_count) || 0) + 1;
      await supabase.from('donors').update({ activity_count: updatedCount, last_donation_date: newLog.date }).eq('id', activeLogDonor.id);
      showToast('রক্তদানের ইতিহাস রেকর্ড করা হয়েছে', 'success');
      setNewLog({ patient_name: '', hospital: '', date: '' });
      fetchDonors();
      fetchLogs();
      setShowLogModal(false);
    }
  };

  // রক্তদাতার এলিজিবিলিটি বা যোগ্যতা ক্যালকুলেটর
  const checkEligibility = (lastDate) => {
    if (!lastDate) return { eligible: true, daysLeft: 0 };
    const last = new Date(lastDate);
    const today = new Date();
    const diffTime = today - last;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 90 ? { eligible: true, daysLeft: 0 } : { eligible: false, daysLeft: 90 - diffDays };
  };

  // ডোনেশন সংখ্যা অনুযায়ী স্মার্ট ব্যাজ কোয়ালিফায়ার
  const getDonorBadge = (count) => {
    const num = parseInt(count) || 0;
    if (num >= 10) return { title: 'লাইভ সেভার লিজেন্ড', color: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white animate-pulse' };
    if (num >= 5) return { title: 'স্টার দাতা', color: 'bg-purple-600 text-white' };
    if (num >= 1) return { title: 'নিয়মিত দাতা', color: 'bg-green-600 text-white' };
    return { title: 'নতুন দাতা', color: 'bg-slate-400 text-white' };
  };

  // ৫. HTML5 ক্যানভাস প্রিমিয়াম আইডি কার্ড জেনারেটর
  const drawDonorCard = (donor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 450, 270);
    grad.addColorStop(0, '#e11d48'); 
    grad.addColorStop(1, '#9f1239'); 
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 450, 270);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 12, 426, 246);

    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 30, 45);

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(30, 55); ctx.lineTo(420, 55); ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`নাম: ${donor.name}`, 30, 90);
    ctx.fillText(`রক্তের গ্রুপ: ${donor.blood_group}`, 30, 125);
    ctx.fillText(`মোবাইল: ${donor.phone}`, 30, 160);
    ctx.fillText(`ঠিকানা: ${donor.address}`, 30, 195);

    const badge = getDonorBadge(donor.activity_count).title;
    ctx.fillStyle = '#d97706';
    ctx.fillRect(280, 75, 135, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(badge, 295, 93);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText('কারিগরি সহযোগিতায়: অ্যাপ ডেভেলপার: গিয়াস উদ্দিন', 30, 240);

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `DonorCard_${donor.name}.png`;
    link.href = url;
    link.click();
    showToast('আইডি কার্ড ডাউনলোড সফল হয়েছে', 'success');
  };

  // ৬. HTML5 ক্যানভাস সম্মাননা স্মারক ও সার্টিফিকেট জেনারেটর
  const drawCertificate = (name, type, count) => {
    const canvas = document.createElement('canvas');
    canvas.width = 650;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, 650, 450);
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 12;
    ctx.strokeRect(15, 15, 620, 420);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, 598, 398);

    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('সম্মাননা স্মারক ও সনদপত্র', 325, 80);

    ctx.fillStyle = '#334155';
    ctx.font = 'italic 16px Arial, sans-serif';
    ctx.fillText('কৃতজ্ঞতা ও আন্তরিকতার সাথে স্বীকৃতি দেওয়া যাচ্ছে যে,', 325, 130);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText(name, 325, 180);

    ctx.fillStyle = '#475569';
    ctx.font = '15px Arial, sans-serif';
    if (type === 'donor') {
      ctx.fillText(`তিনি একজন মানবিক রক্তদাতা হিসেবে আমাদের সংস্থায় মোট ${count} বার`, 325, 230);
      ctx.fillText('রক্তদান করে মুমূর্ষু রোগীর জীবন বাঁচাতে মহৎ অবদান রেখেছেন।', 325, 260);
    } else {
      ctx.fillText(`তিনি একজন সক্রিয় ভলান্টিয়ার হিসেবে আমাদের মানবিক কার্যক্রমে`, 325, 230);
      ctx.fillText(`অদম্য শ্রম ও নিঃস্বার্থ সেবা দিয়ে মোট ${count} পয়েন্ট অর্জন করেছেন।`, 325, 260);
    }

    ctx.fillText('আমরা তাঁর সুস্বাস্থ্য, দীর্ঘায়ু ও কল্যাণ কামনা করি।', 325, 305);

    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 325, 355);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('কারিগরি সহযোগিতায়: অ্যাপ ডেভেলপার: গিয়াস উদ্দিন', 325, 395);

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Certificate_${name}.png`;
    link.href = url;
    link.click();
    showToast('সম্মাননা সনদপত্র ডাউনলোড সফল হয়েছে', 'success');
  };

  // ফিল্টারিং ক্যালকুলেশন
  const filteredDonors = donors.filter(d => {
    const matchesGroup = selectedGroup === 'All' || d.blood_group === selectedGroup;
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.phone.includes(searchTerm);
    
    const eligibility = checkEligibility(d.last_donation_date);
    const matchesEligibility = eligibilityFilter === 'All' || 
                               (eligibilityFilter === 'Eligible' && eligibility.eligible) || 
                               (eligibilityFilter === 'Ineligible' && !eligibility.eligible);

    return matchesGroup && matchesSearch && matchesMatchesEligibility;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24 font-sans">
      {/* গ্লোবাল কাস্টম টোস্ট নোটিফিকেশন */}
      {notification.show && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-xl border text-center font-bold text-sm transition-all duration-300 bg-white ${notification.type === 'success' ? 'border-green-500 text-green-600' : notification.type === 'error' ? 'border-rose-500 text-rose-600' : 'border-blue-500 text-blue-600'}`}>
          {notification.message}
        </div>
      )}

      {/* ব্র্যান্ডেড হেডার */}
      <header className="bg-rose-600 text-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 animate-pulse" />
          <h1 className="font-black text-lg tracking-wide">ব্লাড সেন্টার নদোনা</h1>
        </div>
        <div>
          {isUnlocked ? (
            <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"><LogOut className="w-4" /> প্যানেল লক করুন</button>
          ) : (
            <button onClick={() => setActiveTab('volunteer')} className="bg-white text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"><Lock className="w-4" /> আনলক প্যানেল</button>
          )}
        </div>
      </header>

      {/* মেইন কন্টেন্ট ভিউ কন্ট্রোলার */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* ক. হোম ট্যাব ভিউ */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white p-6 rounded-2xl shadow-lg text-center space-y-2">
              <h2 className="text-xl font-black">মানবতার কল্যাণে রক্তদান</h2>
              <p className="text-xs text-rose-100">আপনার এক ব্যাগ রক্ত বাঁচাতে পারে একটি মুমূর্ষু প্রাণ। আজই নিবন্ধিত হয়ে পাশে দাঁড়ান।</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl shadow-sm text-center border"><Users className="w-5 h-5 mx-auto text-rose-500 mb-1" /><div className="text-lg font-black">{donors.length}</div><div className="text-[10px] text-slate-400">মোট দাতা</div></div>
              <div className="bg-white p-4 rounded-xl shadow-sm text-center border"><Megaphone className="w-5 h-5 mx-auto text-amber-500 mb-1" /><div className="text-lg font-black">{emergencyRequests.length}</div><div className="text-[10px] text-slate-400">জরুরি আবেদন</div></div>
              <div className="bg-white p-4 rounded-xl shadow-sm text-center border"><Award className="w-5 h-5 mx-auto text-purple-500 mb-1" /><div className="text-lg font-black">{volunteers.length}</div><div className="text-[10px] text-slate-400">ভলান্টিয়ার</div></div>
            </div>
          </div>
        )}

        {/* খ. স্মার্ট নোটিশ ও ফেসবুক পোস্ট ট্যাব ভিউ */}
        {activeTab === 'notice' && (
          <div className="space-y-6 animate-fadeIn">
            {/* ফেসবুক স্টাইল পোস্ট করার ইন্টারফেস (শুধুমাত্র আনলকড অ্যাডমিন মোডে দৃশ্যমান) */}
            {isUnlocked && (
              <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1.5"><Sparkles className="w-4 text-rose-500" /> নতুন আপডেট বা নোটিশ পোস্ট করুন</h3>
                <textarea className="w-full border p-3 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500" rows="3" placeholder="ফেসবুকের মতো কিছু লিখুন..." value={newPost.caption} onChange={e => setNewPost({...newPost, caption: e.target.value})} />
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <input type="file" accept="image/*" onChange={e => setNewPost({...newPost, file: e.target.files[0]})} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700" />
                </div>
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center gap-2 transition-all shadow-sm"><Send className="w-4" /> পাবলিশ করুন</button>
              </form>
            )}

            {/* ফেসবুক স্টাইলের মূল পোস্ট ফিড তালিকা */}
            <div className="space-y-4">
              <h2 className="font-black text-sm text-slate-500 tracking-wider uppercase">সর্বশেষ সামাজিক আপডেটসমূহ</h2>
              {posts.length === 0 ? <p className="text-center text-xs text-slate-400">কোনো সামাজিক পোস্ট পাওয়া যায়নি</p> : posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 relative space-y-3">
                  {isUnlocked && (
                    <button onClick={() => deletePost(post.id, post.media_url)} className="absolute top-3 right-3 text-rose-500 hover:bg-rose-50 p-1.5 rounded-full transition-all"><Trash2 className="w-4 h-4" /></button>
                  )}
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                  {post.media_url && (
                    <img src={supabase.storage.from('posts').getPublicUrl(post.media_url).data.publicUrl} className="rounded-xl w-full max-h-64 object-cover border" alt="Post attachment" />
                  )}
                  <div className="text-[10px] text-slate-400">{new Date(post.created_at).toLocaleDateString('bn-BD')}</div>
                </div>
              ))}
            </div>

            {/* জরুরি রক্তের রিকোয়েস্ট উইজেট ও ফর্ম */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              {isUnlocked && (
                <form onSubmit={handleRequestSubmit} className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
                  <h3 className="font-bold text-sm text-slate-700">জরুরি রক্তের আবেদন ফরম</h3>
                  <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="রোগীর নাম" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} />
                  <select className="w-full border p-2.5 rounded-xl text-sm" value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})}><{bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}</select>
                  <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="হাসপাতাল/লোকেশন" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} />
                  <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="মোবাইল নম্বর" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} />
                  <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="কখন রক্ত লাগবে (যেমন: আগামীকাল সকাল ১০টা)" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} />
                  <button type="submit" className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm">আবেদন যুক্ত করুন</button>
                </form>
              )}

              <h2 className="font-black text-sm text-slate-500 tracking-wider uppercase">জরুরি রক্তের লাইভ রিকোয়েস্টসমূহ</h2>
              {emergencyRequests.map(req => (
                <div key={req.id} className="bg-rose-50 border border-rose-100 p-4 rounded-xl relative space-y-2">
                  {isUnlocked && <button onClick={() => deleteRequest(req.id)} className="absolute top-2 right-2 text-rose-500"><X className="w-4" /></button>}
                  <div className="flex justify-between items-center"><span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-lg text-xs">{req.blood_group}</span><span className="text-xs text-slate-500 font-bold">{req.needed_time}</span></div>
                  <p className="text-xs font-bold text-slate-700">রোগী: {req.patient_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5" /> {req.hospital}</p>
                  <a href={`tel:${req.phone}`} className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-600 font-bold px-3 py-1.5 rounded-lg text-xs mt-1 shadow-sm"><Phone className="w-3.5" /> কল করুন</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* গ. সার্চ ও স্মার্ট ব্যবস্থাপনা ট্যাব ভিউ */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
              <div className="relative">
                <Search className="absolute top-3 left-3 w-4 h-4 text-slate-400" />
                <input type="text" className="w-full border pl-9 p-2.5 rounded-xl text-sm" placeholder="নাম বা ঠিকানা দিয়ে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="border p-2 rounded-xl text-xs bg-slate-50 font-bold" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>{bloodGroups.map(g => <option key={g} value={g}>{g === 'All' ? 'সব গ্রুপ' : g}</option>)}</select>
                <select className="border p-2 rounded-xl text-xs bg-slate-50 font-bold" value={eligibilityFilter} onChange={e => setEligibilityFilter(e.target.value)}><option value="All">সব দাতা</option><option value="Eligible">রক্তদানে প্রস্তুত</option><option value="Ineligible">অপ্রস্তুত দাতা</option></select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredDonors.slice(0, visibleDonorsCount).map(donor => {
                const eligibility = checkEligibility(donor.last_donation_date);
                const badge = getDonorBadge(donor.activity_count);
                return (
                  <div key={donor.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-800 text-base flex items-center gap-1.5">{donor.name} <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.color}`}>{badge.title}</span></h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5" /> {donor.address} ({donor.gender})</p>
                      </div>
                      <span className="bg-rose-50 text-rose-600 font-black px-3 py-1.5 rounded-xl text-sm border border-rose-100">{donor.blood_group}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-b py-2 my-1">
                      <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5" /> শেষ রক্তদান: {donor.last_donation_date || 'নাই'}</span>
                      {eligibility.eligible ? (
                        <span className="text-green-600 font-bold flex items-center gap-0.5"><Check className="w-4" /> প্রস্তুত</span>
                      ) : (
                        <span className="text-rose-500 font-bold flex items-center gap-0.5"><AlertTriangle className="w-3.5" /> {eligibility.daysLeft} দিন বাকি</span>
                      )}
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      <a href={`tel:${donor.phone}`} className="bg-rose-600 text-white font-bold p-2 rounded-xl text-xs flex items-center gap-1 shadow-sm"><Phone className="w-3.5" /> কল</a>
                      <button onClick={() => { setActiveLogDonor(donor); setShowLogModal(true); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 rounded-xl text-xs flex items-center gap-1"><History className="w-3.5" /> ইতিহাস ({donor.activity_count || 0})</button>
                      <button onClick={() => drawDonorCard(donor)} className="bg-blue-50 border border-blue-100 text-blue-600 font-bold p-2 rounded-xl text-xs flex items-center gap-1"><Download className="w-3.5" /> আইডি কার্ড</button>
                      <button onClick={() => drawCertificate(donor.name, 'donor', donor.activity_count || 0)} className="bg-amber-50 border border-amber-100 text-amber-600 font-bold p-2 rounded-xl text-xs flex items-center gap-1"><Award className="w-3.5" /> সনদপত্র</button>
                      {isUnlocked && (
                        <button onClick={() => setNewDonor(donor) || setActiveTab('register')} className="bg-slate-100 text-slate-500 p-2 rounded-xl text-xs"><Pencil className="w-3.5" /></button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredDonors.length > visibleDonorsCount && (
                <button onClick={() => setVisibleDonorsCount(prev => prev + 10)} className="w-full text-center py-2.5 text-xs text-rose-600 bg-white font-bold rounded-xl border">আরো লোড করুন</button>
              )}
            </div>
          </div>
        )}

        {/* ঘ. রক্তদাতা নিবন্ধন ট্যাব ভিউ */}
        {activeTab === 'register' && (
          <form onSubmit={handleDonorSubmit} className="bg-white p-5 rounded-2xl shadow-sm border space-y-4 animate-fadeIn">
            <h3 className="font-black text-slate-800 text-base">{newDonor.id ? 'রক্তদাতার তথ্য আপডেট করুন' : 'নতুন রক্তদাতা নিবন্ধন ফরম'}</h3>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">রক্তদাতার নাম</label><input type="text" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">রক্তের গ্রুপ</label><select className="w-full border p-2.5 rounded-xl text-sm font-bold" value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})}>{bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">লিঙ্গ</label><select className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})}><option value="পুরুষ">পুরুষ</option><option value="নারী">নারী</option></select></div>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">মোবাইল নম্বর</label><input type="text" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">স্থায়ী ঠিকানা</label><input type="text" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">শেষ রক্তদানের তারিখ</label><input type="date" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">বয়স</label><input type="number" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">ওজন (কেজি)</label><input type="number" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">মোট রক্তদান</label><input type="number" className="w-full border p-2.5 rounded-xl text-sm" value={newDonor.activity_count} onChange={e => setNewDonor({...newDonor, activity_count: e.target.value})} /></div>
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl text-sm shadow-md flex justify-center gap-2 items-center"><Save className="w-4" /> ডাটা সংরক্ষণ করুন</button>
            {newDonor.id && <button type="button" onClick={resetDonorForm} className="w-full bg-slate-100 text-slate-500 font-bold py-2 rounded-xl text-xs">নতুন নিবন্ধন মোডে ফিরে যান</button>}
          </form>
        )}

        {/* ঙ. ভলান্টিয়ার সিস্টেম ও এডমিন প্যানেল ট্যাব ভিউ */}
        {activeTab === 'volunteer' && (
          <div className="space-y-6 animate-fadeIn">
            {!isUnlocked && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-1.5"><Shield className="w-5 text-rose-500" /> সিকিউরিটি প্যানেল আনলক করুন</h3>
                <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="ভলান্টিয়ার মোবাইল নম্বর" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} />
                <input type="password" className="w-full border p-2.5 rounded-xl text-sm" placeholder="পাসওয়ার্ড" value={volunteerPassword} onChange={e => setVolunteerPassword(e.target.value)} />
                <button type="button" onClick={() => checkVolunteerAccess(volunteerPhone, volunteerPassword)} className="w-full bg-rose-600 text-white font-bold py-2.5 rounded-xl text-sm">প্যানেল ভেরিফাই করুন</button>
              </div>
            )}

            {isUnlocked && (
              <form onSubmit={handleVolunteerSubmit} className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
                <h3 className="font-black text-slate-800 text-sm">নতুন ভলান্টিয়ার টিম মেম্বার যুক্ত করুন</h3>
                <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="মেম্বারের নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} />
                <input type="text" className="w-full border p-2.5 rounded-xl text-sm" placeholder="মোবাইল নম্বর" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} />
                <input type="password" className="w-full border p-2.5 rounded-xl text-sm" placeholder="লগইন পাসওয়ার্ড সেট করুন" value={newVolunteer.password} onChange={e => setNewVolunteer({...newVolunteer, password: e.target.value})} />
                <input type="number" className="w-full border p-2.5 rounded-xl text-sm" placeholder="কাজের প্রাথমিক পয়েন্ট" value={newVolunteer.points} onChange={e => setNewVolunteer({...newVolunteer, points: e.target.value})} />
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm">ভলান্টিয়ার সেভ করুন</button>
              </form>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4">
              <h3 className="font-black text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5"><Award className="w-4 text-amber-500" /> ভলান্টিয়ার অ্যাক্টিভিটি লিডারবোর্ড</h3>
              <div className="space-y-2">
                {volunteers.map((v, idx) => (
                  <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-400 bg-white border w-5 h-5 flex items-center justify-center rounded-md shadow-sm">{idx + 1}</span>
                      <div>
                        <div className="text-xs font-black text-slate-700">{v.name}</div>
                        <div className="text-[10px] text-slate-400">{v.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-50 text-amber-600 border border-amber-100 font-bold px-2.5 py-0.5 rounded-lg text-xs">{v.points || 0} Pts</span>
                      <button onClick={() => drawCertificate(v.name, 'volunteer', v.points || 0)} className="text-slate-400 hover:text-amber-500"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* স্মার্ট ডোনেশন হিস্ট্রি ট্র্যাকিং মোডাল */}
      {showLogModal && activeLogDonor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-1"><History className="w-4 text-rose-500" /> {activeLogDonor.name}-এর ইতিহাস</h3>
              <button onClick={() => setShowLogModal(false)} className="bg-slate-100 p-1 rounded-full"><X className="w-4" /></button>
            </div>
            
            <div className="space-y-2">
              {allLogs.filter(l => l.donor_id === activeLogDonor.id).length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">পূর্বে রক্তদানের কোনো বিবরণ পাওয়া যায়নি।</p>
              ) : allLogs.filter(l => l.donor_id === activeLogDonor.id).map(log => (
                <div key={log.id} className="bg-slate-50 border p-2.5 rounded-xl text-xs space-y-0.5">
                  <div className="font-bold text-slate-700">রোগী: {log.patient_name}</div>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin className="w-3" /> {log.hospital}</div>
                  <div className="text-slate-400 flex items-center gap-1"><Calendar className="w-3" /> তারিখ: {log.date}</div>
                </div>
              ))}
            </div>

            {isUnlocked && (
              <form onSubmit={handleLogSubmit} className="bg-slate-50 border p-3 rounded-2xl space-y-2.5">
                <div className="text-xs font-black text-slate-600">নতুন ডোনেশন হিস্ট্রি রেকর্ড যুক্ত করুন</div>
                <input type="text" placeholder="রোগীর নাম" className="w-full border bg-white p-2 rounded-xl text-xs" value={newLog.patient_name} onChange={e => setNewLog({...newLog, patient_name: e.target.value})} />
                <input type="text" placeholder="হাসপাতাল" className="w-full border bg-white p-2 rounded-xl text-xs" value={newLog.hospital} onChange={e => setNewLog({...newLog, hospital: e.target.value})} />
                <input type="date" className="w-full border bg-white p-2 rounded-xl text-xs" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
                <button type="submit" className="w-full bg-rose-600 text-white text-xs font-bold py-2 rounded-xl">ইতিহাস সেভ ও কাউন্ট বৃদ্ধি করুন</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* বটম রেসপন্সিভ ট্যাব নেভিগেশন বার */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around shadow-xl z-40 max-w-md mx-auto rounded-t-2xl">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center text-[10px] font-bold transition-all px-2 py-1 rounded-xl ${activeTab === 'home' ? 'text-rose-600 bg-rose-50Scale' : 'text-slate-400'}`}><Home className="w-5 h-5 mb-0.5" />হোম</button>
        <button onClick={() => setActiveTab('notice')} className={`flex flex-col items-center justify-center text-[10px] font-bold transition-all px-2 py-1 rounded-xl ${activeTab === 'notice' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}><Megaphone className="w-5 h-5 mb-0.5" />নোটিশ</button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center justify-center text-[10px] font-bold transition-all px-2 py-1 rounded-xl ${activeTab === 'search' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}><Search className="w-5 h-5 mb-0.5" />খুঁজুন</button>
        <button onClick={() => setActiveTab('register')} className={`flex flex-col items-center justify-center text-[10px] font-bold transition-all px-2 py-1 rounded-xl ${activeTab === 'register' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}><UserPlus className="w-5 h-5 mb-0.5" />নিবন্ধন</button>
        <button onClick={() => setActiveTab('volunteer')} className={`flex flex-col items-center justify-center text-[10px] font-bold transition-all px-2 py-1 rounded-xl ${activeTab === 'volunteer' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}><Users className="w-5 h-5 mb-0.5" />ভলান্টিয়ার</button>
      </nav>

      {/* অফিসিয়াল ট্রাস্ট ও কারিগরি পার্টনার ফুটার */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed border-t border-slate-200/60 pt-6">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto whitespace-nowrap">
          <span className="text-xs font-medium text-slate-400 leading-normal">কারিগরি সহযোগিতায়:</span>
          <span className="text-slate-600 font-black text-xs">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
