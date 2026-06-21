import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// আধুনিক আউটলাইন ও মিনিমালিস্ট আইকন প্যাক ইমপোর্ট
import { 
  Megaphone, 
  FileText, 
  Save, 
  Send, 
  Droplet, 
  User, 
  MapPin, 
  Clock, 
  Pencil, 
  Trash2, 
  Phone, 
  MessageSquare, 
  Activity, 
  Award, 
  Calendar, 
  Sparkles, 
  Search, 
  Users, 
  Scale, 
  Copy, 
  Lock, 
  Plus, 
  RefreshCw, 
  UserPlus, 
  Shield, 
  Ban, 
  Unlock, 
  LogOut, 
  Eye, 
  EyeOff, 
  Zap, 
  Home, 
  Heart, 
  Stethoscope, 
  Check, 
  AlertTriangle, 
  X,
  Info,
  Download,
  History,
  Image,
  Video,
  Share2
} from 'lucide-react';

export default function App() {
  // অ্যাপ স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [posts, setPosts] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('home'); 

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    name: '', phone: '', bloodGroup: '', address: '', lastDonation: '', isAvailable: true
  });
  const [requestData, setRequestData] = useState({
    patientName: '', hospital: '', bloodGroup: '', date: '', contact: '',
    time: '', bagCount: '1'
  });
  const [volunteerData, setVolunteerData] = useState({
    name: '', phone: '', address: ''
  });

  // পোস্ট ফর্ম স্টেট
  const [newPost, setNewPost] = useState({
    title: '', content: '', mediaFile: null
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // অ্যাডমিন ও সিকিউরিটি স্টেট
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // ভলান্টিয়ার ও লক প্যানেল স্টেট
  const [showVolunteerLogin, setShowVolunteerLogin] = useState(false);
  const [volunteerLoginPhone, setVolunteerLoginPhone] = useState('');
  const [volunteerLoginPassword, setVolunteerLoginPassword] = useState('');
  const [isVolunteerLogged, setIsVolunteerLogged] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // ডোনার লগ (History) স্টেট
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDonorForLog, setSelectedDonorForLog] = useState(null);
  const [logFormData, setLogFormData] = useState({ patient_name: '', hospital: '', date: '' });
  const [donorLogs, setDonorLogs] = useState([]);

  // UI ইন্টার‍্যাকশন স্টেট
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  useEffect(() => {
    fetchDonors();
    fetchEmergencyRequests();
    fetchVolunteers();
    fetchPosts();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  // --- ডাটাবেস ফেচিং ফাংশনস ---
  const fetchDonors = async () => {
    const { data, error } = await supabase.from('donors').select('*').order('created_at', { ascending: false });
    if (!error) setDonors(data);
  };

  const fetchEmergencyRequests = async () => {
    const { data, error } = await supabase.from('emergency_requests').select('*').order('created_at', { ascending: false });
    if (!error) setEmergencyRequests(data);
  };

  const fetchVolunteers = async () => {
    const { data, error } = await supabase.from('volunteers').select('*').order('created_at', { ascending: false });
    if (!error) setVolunteers(data);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase.from('noakhali_posts').select('*').order('created_at', { ascending: false });
    if (!error) setPosts(data);
  };

  // --- পোস্ট সাবমিট (ফাইল আপলোড সহ) ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) {
      showNotification('শিরোনাম এবং বিস্তারিত তথ্য আবশ্যক!', 'error');
      return;
    }
  
    setIsSubmittingPost(true);
    try {
      let mediaUrl = null;
      let mediaType = null;
  
      if (newPost.mediaFile) {
        const fileExt = newPost.mediaFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
  
        // 'noakhali_posts' বাকেট ব্যবহার করা হয়েছে
        const { error: uploadError } = await supabase.storage
          .from('noakhali_posts')
          .upload(filePath, newPost.mediaFile);
  
        if (uploadError) {
            console.error("Upload error details:", uploadError);
            throw new Error(`ফাইল আপলোড ব্যর্থ: ${uploadError.message}`);
        }
  
        const { data: publicUrlData } = supabase.storage
          .from('noakhali_posts')
          .getPublicUrl(filePath);
  
        mediaUrl = publicUrlData.publicUrl;
        mediaType = newPost.mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }
  
      const { error: insertError } = await supabase.from('noakhali_posts').insert([
        {
          title: newPost.title,
          content: newPost.content,
          media_url: mediaUrl,
          media_type: mediaType
        }
      ]);
  
      if (insertError) throw insertError;
  
      showNotification('পোস্ট সফলভাবে প্রকাশিত হয়েছে!');
      setNewPost({ title: '', content: '', mediaFile: null });
      fetchPosts();
    } catch (error) {
      console.error("Post Submission Error:", error);
      showNotification(error.message, 'error');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('এই পোস্টটি মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('noakhali_posts').delete().eq('id', id);
      if (error) showNotification('পোস্ট মুছতে সমস্যা হয়েছে', 'error');
      else {
        showNotification('পোস্ট মুছে ফেলা হয়েছে');
        fetchPosts();
      }
    }
  };

  // --- অ্যাডমিন প্যানেল ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPhone === '1813132013' && adminPassword === '132013') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPhone('');
      setAdminPassword('');
      showNotification('অ্যাডমিন প্যানেল আনলক হয়েছে');
    } else {
      showNotification('ভুল আইডি বা পাসওয়ার্ড!', 'error');
    }
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    const volunteer = volunteers.find(v => v.phone === volunteerLoginPhone);
    if (!volunteer) {
      showNotification('এই নাম্বারে কোনো ভলান্টিয়ার নেই!', 'error');
      return;
    }
    if (!volunteer.custom_password) {
      showNotification('আপনার কোনো পাসওয়ার্ড সেট করা নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।', 'error');
      return;
    }
    if (volunteer.custom_password === volunteerLoginPassword) {
      setIsVolunteerLogged(true);
      setShowVolunteerLogin(false);
      setVolunteerLoginPhone('');
      setVolunteerLoginPassword('');
      showNotification('ভলান্টিয়ার প্যানেল আনলক হয়েছে');
    } else {
      showNotification('ভুল পাসওয়ার্ড!', 'error');
    }
  };

  const openPassModal = (id) => {
    setSelectedVolunteerId(id);
    setShowPassModal(true);
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (masterCode !== '132013') {
      showNotification('ভুল মাষ্টার সিকিউরিটি কোড!', 'error');
      return;
    }
    const { error } = await supabase.from('volunteers').update({ custom_password: newPassword }).eq('id', selectedVolunteerId);
    if (!error) {
      showNotification('পাসওয়ার্ড সেট করা হয়েছে');
      setShowPassModal(false);
      setMasterCode('');
      setNewPassword('');
      fetchVolunteers();
    } else {
      showNotification('পাসওয়ার্ড সেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // --- ডোনার লগ (রক্তদানের ইতিহাস) ফাংশনস ---
  const openLogModal = async (donor) => {
    setSelectedDonorForLog(donor);
    setShowLogModal(true);
    const { data, error } = await supabase.from('donor_logs').select('*').eq('donor_id', donor.id).order('date', { ascending: false });
    if (!error) setDonorLogs(data);
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('donor_logs').insert([{ donor_id: selectedDonorForLog.id, ...logFormData }]);
    if (!error) {
      showNotification('রক্তদানের রেকর্ড যুক্ত হয়েছে');
      setLogFormData({ patient_name: '', hospital: '', date: '' });
      openLogModal(selectedDonorForLog); // রিলোড লগস
    } else {
      showNotification('রেকর্ড যুক্ত করতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('এই রেকর্ডটি মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('donor_logs').delete().eq('id', logId);
      if (!error) {
        showNotification('রেকর্ড মুছে ফেলা হয়েছে');
        openLogModal(selectedDonorForLog);
      }
    }
  };

  // --- ডোনার ও রিকুয়েস্ট লজিক ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('donors').insert([formData]);
    if (!error) {
      showNotification('ডোনার সফলভাবে নিবন্ধিত হয়েছেন!');
      setFormData({ name: '', phone: '', bloodGroup: '', address: '', lastDonation: '', isAvailable: true });
      fetchDonors();
    } else showNotification('নিবন্ধনে সমস্যা হয়েছে!', 'error');
    setLoading(false);
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('emergency_requests').insert([requestData]);
    if (!error) {
      showNotification('জরুরি রক্তের নোটিশ পোস্ট হয়েছে!');
      setRequestData({ patientName: '', hospital: '', bloodGroup: '', date: '', contact: '', time: '', bagCount: '1' });
      fetchEmergencyRequests();
      setActiveTab('notice');
    } else showNotification('নোটিশ পোস্ট করতে সমস্যা হয়েছে!', 'error');
    setLoading(false);
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('volunteers').insert([volunteerData]);
    if (!error) {
      showNotification('ভলান্টিয়ার হিসেবে নিবন্ধন সফল!');
      setVolunteerData({ name: '', phone: '', address: '' });
      fetchVolunteers();
    } else showNotification('নিবন্ধনে সমস্যা হয়েছে!', 'error');
    setLoading(false);
  };

  const handleDelete = async (id, table) => {
    if (window.confirm('আপনি কি নিশ্চিত?')) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        showNotification('সফলভাবে মুছে ফেলা হয়েছে!');
        if (table === 'donors') fetchDonors();
        else if (table === 'emergency_requests') fetchEmergencyRequests();
        else if (table === 'volunteers') fetchVolunteers();
      }
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const { error } = await supabase.from('donors').update({ isAvailable: !currentStatus }).eq('id', id);
    if (!error) fetchDonors();
  };

  // --- ফিল্টার লজিক ---
  const checkEligibility = (lastDonationDate) => {
    if (!lastDonationDate) return { isEligible: true, daysLeft: 0, statusText: '언제든 가능' };
    const today = new Date();
    const donationDate = new Date(lastDonationDate);
    const diffTime = Math.abs(today - donationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isEligible = diffDays >= 90;
    return {
      isEligible,
      daysLeft: isEligible ? 0 : 90 - diffDays,
      diffDays
    };
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          donor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || donor.bloodGroup === selectedGroup;
    
    let matchesEligibility = true;
    if (eligibilityFilter === 'Eligible') {
      matchesEligibility = checkEligibility(donor.lastDonation).isEligible;
    } else if (eligibilityFilter === 'NotEligible') {
      matchesEligibility = !checkEligibility(donor.lastDonation).isEligible;
    }

    return matchesSearch && matchesGroup && matchesEligibility;
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // --- রেন্ডার সেকশনস ---

  // 1. হোম সেকশন (নোয়াখালী পোস্ট)
  const renderHomeSection = () => (
    <div className="space-y-6">
      {/* নোয়াখালী পোস্ট ব্যানার */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Activity className="w-6 h-6 text-emerald-50" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">নোয়াখালী পোস্ট</h2>
            <p className="text-emerald-100 text-xs font-medium opacity-90 mt-0.5">রক্তদান ও সামাজিক সচেতনতা</p>
          </div>
        </div>
      </div>

      {/* অ্যাডমিন পোস্ট ক্রিয়েট প্যানেল */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-500"/> নতুন পোস্ট তৈরি করুন
          </h3>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="পোস্টের শিরোনাম..." 
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              className="w-full border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
            />
            <textarea 
              placeholder="বিস্তারিত লিখুন..." 
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="w-full border border-slate-200 p-3 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-emerald-400 transition-all cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={(e) => setNewPost({...newPost, mediaFile: e.target.files[0]})}
                />
                <Image className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                <span className="text-xs font-medium text-slate-500 group-hover:text-emerald-600">
                  {newPost.mediaFile ? newPost.mediaFile.name : 'ছবি বা ভিডিও যুক্ত করুন'}
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isSubmittingPost}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmittingPost ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmittingPost ? 'পোস্ট আপলোড হচ্ছে...' : 'পোস্ট পাবলিশ করুন'}
            </button>
          </form>
        </div>
      )}

      {/* পোস্ট ফিড */}
      <div className="space-y-5">
        {posts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">বর্তমানে নোয়াখালী পোস্টে কোনো আপডেট নেই।</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{post.title}</h3>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    {new Date(post.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* মিডিয়া রেন্ডারিং */}
              {post.media_url && (
                <div className="w-full bg-slate-100 max-h-80 overflow-hidden flex items-center justify-center">
                  {post.media_type === 'video' ? (
                     <video src={post.media_url} controls className="w-full h-auto max-h-80 object-cover" />
                  ) : (
                     <img src={post.media_url} alt="Post media" className="w-full h-auto max-h-80 object-cover" loading="lazy" />
                  )}
                </div>
              )}

              <div className="p-4">
                <p className={`text-slate-600 text-sm leading-relaxed ${expandedPostId === post.id ? '' : 'line-clamp-3'}`}>
                  {post.content}
                </p>
                {post.content.length > 150 && (
                  <button 
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    className="text-emerald-600 font-bold text-xs mt-2 hover:underline focus:outline-none"
                  >
                    {expandedPostId === post.id ? 'সংক্ষিপ্ত করুন' : 'আরও পড়ুন'}
                  </button>
                )}
              </div>
              
              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => {
                     const shareText = `${post.title}\n\n${post.content}\n\n${post.media_url ? post.media_url : ''}\n\n- ব্লাড সেন্টার নদোনা নোয়াখালী`;
                     copyToClipboard(shareText);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50"
                >
                  <Share2 className="w-3.5 h-3.5" /> শেয়ার (কপি)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 2. জরুরি নোটিশ সেকশন
  const renderNoticeSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-600 to-red-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
            <Megaphone className="w-6 h-6 text-rose-50" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">জরুরি রক্তের লাইভ নোটিশ বোর্ড</h2>
            <p className="text-rose-100 text-xs font-medium opacity-90 mt-0.5">মুহূর্তের মধ্যে মুমূর্ষু রোগীর জীবন বাঁচান</p>
          </div>
        </div>
      </div>

      {(isAdmin || isVolunteerLogged) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
           <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Plus className="w-4 h-4 text-rose-500"/> নতুন জরুরি নোটিশ যোগ করুন
           </h3>
          <form onSubmit={handleEmergencySubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <input type="text" placeholder="রোগীর নাম" value={requestData.patientName} onChange={(e) => setRequestData({...requestData, patientName: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-medium w-full focus:ring-2 focus:ring-rose-500/20 outline-none" required />
              <input type="text" placeholder="হাসপাতাল ও স্থান" value={requestData.hospital} onChange={(e) => setRequestData({...requestData, hospital: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-medium w-full focus:ring-2 focus:ring-rose-500/20 outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <select value={requestData.bloodGroup} onChange={(e) => setRequestData({...requestData, bloodGroup: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-bold w-full text-slate-700 bg-white" required>
                <option value="" disabled>রক্তের গ্রুপ</option>
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <input type="number" placeholder="কয় ব্যাগ লাগবে?" value={requestData.bagCount} onChange={(e) => setRequestData({...requestData, bagCount: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-medium w-full" required />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
               <input type="date" value={requestData.date} onChange={(e) => setRequestData({...requestData, date: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-medium w-full text-slate-600" required />
               <input type="time" value={requestData.time} onChange={(e) => setRequestData({...requestData, time: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-medium w-full text-slate-600" />
            </div>
            <input type="tel" placeholder="যোগাযোগের মোবাইল নাম্বার" value={requestData.contact} onChange={(e) => setRequestData({...requestData, contact: e.target.value})} className="border border-slate-200 p-2.5 rounded-xl text-xs font-bold w-full focus:ring-2 focus:ring-rose-500/20 outline-none" required />
            
            <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2">
              <Send className="w-4 h-4"/> নোটিশ পাবলিশ করুন
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {emergencyRequests.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
            <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">বর্তমানে কোনো জরুরি রক্তের প্রয়োজন নেই।</p>
          </div>
        ) : (
          emergencyRequests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-rose-100 shadow-sm shadow-rose-100/50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg tracking-wider">LIVE</div>
              
              <div className="p-4 flex gap-4">
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 mt-1">
                   <Droplet className="w-5 h-5 mb-0.5 fill-rose-100" />
                   <span className="font-black text-sm">{req.bloodGroup}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm mb-1 truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400"/> {req.patientName}
                  </h3>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5"/>
                      <span className="line-clamp-2">স্থান: {req.hospital}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        <Calendar className="w-3 h-3"/> {req.date} {req.time && `| ${req.time}`}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        <Stethoscope className="w-3 h-3"/> {req.bagCount} ব্যাগ প্রয়োজন
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                 <a href={`tel:${req.contact}`} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg font-bold text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm">
                   <Phone className="w-3.5 h-3.5"/> কল দিন
                 </a>
                 <a href={`https://wa.me/${req.contact}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-xs flex justify-center items-center gap-1.5 transition-colors shadow-sm">
                   <MessageSquare className="w-3.5 h-3.5"/> হোয়াটসঅ্যাপ
                 </a>
                 {(isAdmin || isVolunteerLogged) && (
                   <button onClick={() => handleDelete(req.id, 'emergency_requests')} className="px-3 py-2 bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4"/>
                   </button>
                 )}
              </div>
              <div className="px-4 py-2 bg-white border-t border-slate-100 text-center">
                 <button 
                   onClick={() => {
                     const shareText = `জরুরি রক্তের প্রয়োজন!\nরোগী: ${req.patientName}\nরক্তের গ্রুপ: ${req.bloodGroup}\nস্থান: ${req.hospital}\nতারিখ: ${req.date}\nযোগাযোগ: ${req.contact}\n\n- ব্লাড সেন্টার নদোনা নোয়াখালী`;
                     copyToClipboard(shareText);
                   }}
                   className="text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center justify-center gap-1 w-full"
                 >
                   <Copy className="w-3 h-3"/> সোশ্যাল মিডিয়ায় শেয়ার নোটিশ (কপি)
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 3. খুঁজুন সেকশন (ডোনার সার্চ)
  const renderSearchSection = () => (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-lg">
         <h2 className="text-lg font-black flex items-center gap-2 mb-4">
           <Search className="w-5 h-5 text-rose-400"/> ডোনার খুঁজুন
         </h2>
         <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="w-4 h-4 text-slate-400"/>
              </div>
              <input 
                type="text" 
                placeholder="এলাকা বা ডোনারের নাম লিখে খুঁজুন..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 p-3 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setSelectedGroup('All')} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${selectedGroup === 'All' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>সব গ্রুপ</button>
              {bloodGroups.map(bg => (
                <button key={bg} onClick={() => setSelectedGroup(bg)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${selectedGroup === bg ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                  {bg}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEligibilityFilter('All')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors ${eligibilityFilter === 'All' ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-slate-400'}`}>সব ডোনার</button>
              <button onClick={() => setEligibilityFilter('Eligible')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors ${eligibilityFilter === 'Eligible' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>রক্তদানে প্রস্তুত</button>
              <button onClick={() => setEligibilityFilter('NotEligible')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors ${eligibilityFilter === 'NotEligible' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'}`}>বিশ্রামে আছেন</button>
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center px-1">
         <span className="text-xs font-bold text-slate-500">মোট ডোনার: <span className="text-slate-800">{filteredDonors.length} জন</span></span>
      </div>

      <div className="space-y-3">
        {filteredDonors.map(donor => {
          const eligibility = checkEligibility(donor.lastDonation);
          return (
            <div key={donor.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-rose-600 flex-shrink-0 relative">
                       <Droplet className="w-6 h-6 fill-rose-100" />
                       <span className="absolute font-black text-xs">{donor.bloodGroup}</span>
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                         {donor.name}
                         {eligibility.isEligible && donor.isAvailable && <Check className="w-3.5 h-3.5 text-emerald-500 bg-emerald-50 rounded-full p-0.5"/>}
                       </h3>
                       <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                         <MapPin className="w-3 h-3"/> {donor.address}
                       </p>
                    </div>
                 </div>
                 {/* Status Badge */}
                 <div className="flex flex-col items-end gap-1">
                    {donor.isAvailable ? (
                      eligibility.isEligible ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-1 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5"/> প্রস্তুত
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5"/> বিশ্রামে ({eligibility.daysLeft} দিন)
                        </span>
                      )
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5"/> সাময়িক বন্ধ
                      </span>
                    )}
                 </div>
              </div>

              {donor.lastDonation && (
                <div className="bg-slate-50 rounded-lg p-2 text-[10px] text-slate-600 font-medium flex justify-between items-center border border-slate-100">
                  <span>শেষ রক্তদান: {donor.lastDonation}</span>
                  <span className="text-slate-400">({eligibility.diffDays} দিন আগে)</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                 <a href={`tel:${donor.phone}`} className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold text-xs flex justify-center items-center gap-1.5 hover:bg-slate-900 transition-colors">
                   <Phone className="w-3.5 h-3.5"/> কল
                 </a>
                 {(isAdmin || isVolunteerLogged) && (
                    <button onClick={() => openLogModal(donor)} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs flex items-center gap-1 border border-indigo-100 hover:bg-indigo-100">
                      <History className="w-4 h-4"/> লগ
                    </button>
                 )}
                 {isAdmin && (
                   <button onClick={() => toggleAvailability(donor.id, donor.isAvailable)} className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 border ${donor.isAvailable ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                     {donor.isAvailable ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                   </button>
                 )}
                 {(isAdmin || isVolunteerLogged) && (
                   <button onClick={() => handleDelete(donor.id, 'donors')} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100">
                     <Trash2 className="w-4 h-4"/>
                   </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 4. নিবন্ধন সেকশন (ডোনার)
  const renderRegisterSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
           <Droplet className="w-12 h-12 text-rose-400 mx-auto mb-3 drop-shadow-md fill-rose-400/20" />
           <h2 className="text-xl font-black mb-1.5">নতুন রক্তদাতা নিবন্ধন</h2>
           <p className="text-indigo-100 text-xs font-medium">আপনার এক ফোঁটা রক্ত বাঁচাতে পারে একটি জীবন</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
               <User className="w-3.5 h-3.5 text-indigo-500"/> সম্পূর্ণ নাম
             </label>
             <input type="text" placeholder="ডোনারের নাম লিখুন" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/50" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                 <Phone className="w-3.5 h-3.5 text-indigo-500"/> মোবাইল নাম্বার
               </label>
               <input type="tel" placeholder="01XXX..." value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/50" required />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                 <Activity className="w-3.5 h-3.5 text-rose-500"/> রক্তের গ্রুপ
               </label>
               <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm" required>
                 <option value="" disabled>নির্বাচন করুন</option>
                 {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
               </select>
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
               <MapPin className="w-3.5 h-3.5 text-rose-500"/> বর্তমান ঠিকানা (এলাকা/গ্রাম)
             </label>
             {/* Text input as mandated by correction ledger */}
             <input type="text" placeholder="যেমন: নদোনা বাজার" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm bg-slate-50/50" required />
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
               <Calendar className="w-3.5 h-3.5 text-slate-500"/> শেষ রক্তদানের তারিখ (যদি থাকে)
             </label>
             <input type="date" value={formData.lastDonation} onChange={(e) => setFormData({...formData, lastDonation: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm bg-slate-50/50" />
          </div>

          <div className="pt-2">
             <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2">
               <Save className="w-4 h-4"/> {loading ? 'সংরক্ষণ হচ্ছে...' : 'নিবন্ধন সম্পন্ন করুন'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  // 5. ভলান্টিয়ার সেকশন
  const renderVolunteerSection = () => (
    <div className="space-y-6">
       <div className="bg-slate-800 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>
         <Users className="w-12 h-12 text-rose-400 mx-auto mb-3" />
         <h2 className="text-xl font-black mb-1">ভলান্টিয়ার প্যানেল</h2>
         <p className="text-slate-400 text-xs">ব্লাড সেন্টারের কার্যক্রম পরিচালনায় যুক্ত হোন</p>
       </div>

       {isAdmin && (
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
           <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
             <UserPlus className="w-4 h-4 text-rose-500"/> নতুন ভলান্টিয়ার যুক্ত করুন
           </h3>
           <form onSubmit={handleVolunteerSubmit} className="space-y-3">
             <input type="text" placeholder="ভলান্টিয়ারের নাম" value={volunteerData.name} onChange={(e) => setVolunteerData({...volunteerData, name: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs" required />
             <input type="tel" placeholder="মোবাইল নাম্বার" value={volunteerData.phone} onChange={(e) => setVolunteerData({...volunteerData, phone: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs" required />
             <input type="text" placeholder="ঠিকানা" value={volunteerData.address} onChange={(e) => setVolunteerData({...volunteerData, address: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs" required />
             <button type="submit" className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs">যুক্ত করুন</button>
           </form>
         </div>
       )}

       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500"/> দায়িত্বরত ভলান্টিয়ারগণ
            </h3>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md">{volunteers.length} জন</span>
         </div>
         <div className="divide-y divide-slate-100">
            {volunteers.map(vol => (
              <div key={vol.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-5 h-5"/>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{vol.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/> {vol.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${vol.phone}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                    <Phone className="w-4 h-4"/>
                  </a>
                  {isAdmin && (
                    <>
                      <button onClick={() => openPassModal(vol.id)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                        <Lock className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleDelete(vol.id, 'volunteers')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
         </div>
       </div>

       {/* Volunteer Auth Context */}
       {!isAdmin && !isVolunteerLogged && (
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 bg-rose-50/30">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-rose-600"/> ভলান্টিয়ার প্যানেল আনলক
            </h3>
            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
              ভলান্টিয়ার প্যানেল পরিচালনার জন্য আপনার রেজিস্টার্ড মোবাইল নাম্বার ও অ্যাডমিনের দেওয়া কাস্টম পাসওয়ার্ড দিয়ে আনলক করুন।
            </p>
            {!showVolunteerLogin ? (
               <button onClick={() => setShowVolunteerLogin(true)} className="w-full bg-white border-2 border-rose-200 text-rose-600 py-2.5 rounded-xl font-bold text-xs hover:bg-rose-50 transition-colors">
                 লগইন করতে ক্লিক করুন
               </button>
            ) : (
               <form onSubmit={handleVolunteerUnlock} className="space-y-3">
                 <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নাম্বার" value={volunteerLoginPhone} onChange={(e) => setVolunteerLoginPhone(e.target.value)} className="w-full border border-rose-200 p-2.5 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none" required />
                 <input type="password" placeholder="পাসওয়ার্ড দিন" value={volunteerLoginPassword} onChange={(e) => setVolunteerLoginPassword(e.target.value)} className="w-full border border-rose-200 p-2.5 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none" required />
                 <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-rose-700">আনলক করুন</button>
                    <button type="button" onClick={() => setShowVolunteerLogin(false)} className="px-4 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs">বাতিল</button>
                 </div>
               </form>
            )}
         </div>
       )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-rose-200 text-slate-800 pb-20">
      {/* Toast Notification */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
          <div className={`rounded-xl p-4 flex items-center gap-3 shadow-2xl ${messageType === 'error' ? 'bg-rose-600 shadow-rose-600/30 text-white' : 'bg-slate-800 shadow-slate-800/30 text-white'}`}>
            {messageType === 'error' ? <AlertTriangle className="w-5 h-5 flex-shrink-0"/> : <Check className="w-5 h-5 flex-shrink-0 text-emerald-400"/>}
            <p className="text-sm font-bold leading-tight">{message}</p>
          </div>
        </div>
      )}

      {/* Copy Toast */}
      {showCopyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400"/> কপি হয়েছে!
        </div>
      )}

      {/* Modern Header */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md shadow-rose-500/20 text-white relative">
                 <Droplet className="w-5 h-5 fill-rose-100" />
                 <Sparkles className="w-3 h-3 absolute top-1 right-1 text-rose-200 animate-pulse"/>
              </div>
              <div>
                <h1 className="text-[15px] font-black tracking-tight text-slate-800 leading-none mb-1">
                  ব্লাড সেন্টার <span className="text-rose-600">নদোনা</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-500 leading-none">সোনাইমুড়ী, নোয়াখালী।</p>
              </div>
            </div>

            {/* Auth Button */}
            <div>
              {isAdmin ? (
                <button onClick={() => setIsAdmin(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5"/> প্যানেল বন্ধ
                </button>
              ) : isVolunteerLogged ? (
                 <button onClick={() => setIsVolunteerLogged(false)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-100">
                  <LogOut className="w-3.5 h-3.5"/> ভলান্টিয়ার প্যানেল বন্ধ
                </button>
              ) : (
                <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="bg-white border border-slate-200 shadow-sm text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5"/> অ্যাডমিন
                </button>
              )}
            </div>
          </div>

          {/* Admin Login Dropdown */}
          {showAdminLogin && !isAdmin && (
            <div className="absolute top-16 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 mt-2 animate-in fade-in slide-in-from-top-4 z-50">
               <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45"></div>
               <div className="relative">
                 <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                   <Lock className="w-4 h-4 text-rose-500"/> অ্যাডমিন ভেরিফিকেশন
                 </h3>
                 <form onSubmit={handleAdminLogin} className="space-y-3">
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">ইউজার আইডি</label>
                     <input type="text" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="w-full border-2 border-slate-100 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:border-rose-500 focus:ring-0 outline-none transition-colors bg-slate-50" placeholder="ইউজার আইডি দিন" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">গোপন পাসওয়ার্ড</label>
                     <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full border-2 border-slate-100 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:border-rose-500 focus:ring-0 outline-none transition-colors bg-slate-50" placeholder="পাসওয়ার্ড দিন" />
                   </div>
                   <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-slate-800/20 mt-2">
                     লগইন করুন
                   </button>
                 </form>
               </div>
            </div>
          )}
        </div>
      </header>

      {/* Modern Mobile Navigation (ট্যাবের অর্ডার আপডেট করা হয়েছে) */}
      <nav className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm shadow-slate-200/20">
        <div className="flex overflow-x-auto scrollbar-hide snap-x">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex-shrink-0 snap-start flex items-center justify-center gap-1.5 py-3 px-4 text-sm font-bold transition-all duration-300 relative ${
              activeTab === 'home' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Home className={`w-4 h-4 ${activeTab === 'home' ? 'fill-rose-100' : ''}`} /> 
            হোম
            {activeTab === 'home' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-t-full shadow-[0_-2px_8px_rgba(225,29,72,0.4)]" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('notice')} 
            className={`flex-shrink-0 snap-start flex items-center justify-center gap-1.5 py-3 px-4 text-sm font-bold transition-all duration-300 relative ${
              activeTab === 'notice' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Megaphone className={`w-4 h-4 ${activeTab === 'notice' ? 'fill-rose-100' : ''}`} /> 
            জরুরি নোটিশ
            {activeTab === 'notice' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-t-full shadow-[0_-2px_8px_rgba(225,29,72,0.4)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('register')} 
            className={`flex-shrink-0 snap-start flex items-center justify-center gap-1.5 py-3 px-4 text-sm font-bold transition-all duration-300 relative ${
              activeTab === 'register' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <UserPlus className={`w-4 h-4 ${activeTab === 'register' ? 'fill-rose-100' : ''}`} /> 
            নিবন্ধন
            {activeTab === 'register' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-t-full shadow-[0_-2px_8px_rgba(225,29,72,0.4)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('search')} 
            className={`flex-shrink-0 snap-start flex items-center justify-center gap-1.5 py-3 px-4 text-sm font-bold transition-all duration-300 relative ${
              activeTab === 'search' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Search className={`w-4 h-4 ${activeTab === 'search' ? 'fill-rose-100' : ''}`} /> 
            খুঁজুন
            {activeTab === 'search' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-t-full shadow-[0_-2px_8px_rgba(225,29,72,0.4)]" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('volunteer')} 
            className={`flex-shrink-0 snap-start flex items-center justify-center gap-1.5 py-3 px-4 text-sm font-bold transition-all duration-300 relative ${
              activeTab === 'volunteer' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'volunteer' ? 'fill-rose-100' : ''}`} /> 
            ভলান্টিয়ার
            {activeTab === 'volunteer' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-t-full shadow-[0_-2px_8px_rgba(225,29,72,0.4)]" />}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        
        {/* Modals */}
        {showPassModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setShowPassModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1 rounded-full"><X className="w-5 h-5"/></button>
              <h3 className="font-black text-slate-800 text-base mb-1 flex items-center gap-2"><Lock className="w-5 h-5 text-rose-500"/> পাসওয়ার্ড সেটআপ</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">ভলান্টিয়ারের জন্য একটি নতুন পাসওয়ার্ড সেট করুন।</p>
              <form onSubmit={handleSetPassword} className="space-y-3.5">
                <input type="password" placeholder="অ্যাডমিনের মাষ্টার সিকিউরিটি কোড" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold" required />
                <input type="password" placeholder="নতুন ভলান্টিয়ার পাসওয়ার্ড সেট করুন" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold" required />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm shadow shadow-rose-600/20 leading-normal flex items-center justify-center gap-1">
                    <RefreshCw className="w-4 h-4" /> আপডেট করুন
                  </button>
                  <button type="button" onClick={() => { setShowPassModal(false); setMasterCode(''); }} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-200 flex items-center justify-center gap-1">
                    <X className="w-4 h-4" /> বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showLogModal && selectedDonorForLog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10">
                 <div>
                   <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                     <History className="w-5 h-5 text-indigo-500"/> রক্তদানের ইতিহাস
                   </h3>
                   <p className="text-xs text-slate-500 font-bold mt-0.5">ডোনার: {selectedDonorForLog.name} ({selectedDonorForLog.bloodGroup})</p>
                 </div>
                 <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-200 p-1.5 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <form onSubmit={handleAddLog} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-6 space-y-3">
                   <h4 className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> নতুন রেকর্ড যোগ করুন</h4>
                   <input type="text" placeholder="রোগীর নাম" value={logFormData.patient_name} onChange={(e) => setLogFormData({...logFormData, patient_name: e.target.value})} className="w-full border border-indigo-100 p-2.5 rounded-xl text-xs" required />
                   <input type="text" placeholder="হাসপাতালের নাম ও স্থান" value={logFormData.hospital} onChange={(e) => setLogFormData({...logFormData, hospital: e.target.value})} className="w-full border border-indigo-100 p-2.5 rounded-xl text-xs" required />
                   <div className="flex gap-2">
                     <input type="date" value={logFormData.date} onChange={(e) => setLogFormData({...logFormData, date: e.target.value})} className="flex-1 border border-indigo-100 p-2.5 rounded-xl text-xs" required />
                     <button type="submit" className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 whitespace-nowrap">সংরক্ষণ</button>
                   </div>
                </form>

                <div className="space-y-3">
                   <h4 className="text-sm font-bold text-slate-700 border-b pb-2">পূর্বের রেকর্ডসমূহ</h4>
                   {donorLogs.length === 0 ? (
                     <p className="text-center text-slate-500 text-xs py-4">কোনো রেকর্ড পাওয়া যায়নি।</p>
                   ) : (
                      donorLogs.map(log => (
                         <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                           <div className="flex justify-between items-start mb-1.5">
                             <span className="font-bold text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> {log.patient_name}</span>
                             <span className="text-slate-500 text-xs font-medium bg-white px-2 py-1 rounded border shadow-sm">{new Date(log.date).toLocaleDateString('bn-BD')}</span>
                           </div>
                           <p className="text-slate-600 text-xs flex items-center gap-1.5 mt-2"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {log.hospital}</p>
                           {isAdmin && (
                             <button onClick={() => handleDeleteLog(log.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors mt-2 flex items-center gap-1 text-[11px] font-bold">
                               <Trash2 className="w-3 h-3"/> মুছুন
                             </button>
                           )}
                         </div>
                      ))
                   )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Routing */}
        <div className="pb-10">
          {activeTab === 'home' && renderHomeSection()}
          {activeTab === 'notice' && renderNoticeSection()}
          {activeTab === 'search' && renderSearchSection()}
          {activeTab === 'register' && renderRegisterSection()}
          {activeTab === 'volunteer' && renderVolunteerSection()}
        </div>
      </main>

      {/* ফুটার ডিজাইন ও লেখা (ডেভেলপার অংশ আপডেট করা হয়েছে) */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed pb-8">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto whitespace-nowrap">
          <span className="text-xs font-medium text-slate-400 leading-normal">কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-6 h-6 rounded-full object-cover border shadow-xs" onError={(e) => {e.target.style.display='none'}} />
          <span className="text-sm font-bold text-slate-700 tracking-tight leading-normal">
            অ্যাপ ডেভেলপার: গিয়াস উদ্দিন
          </span>
        </div>
      </footer>

    </div>
  );
}
