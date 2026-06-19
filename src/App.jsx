import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
// আধুনিক আউটলাইন ও মিনিমালিস্ট আইকন প্যাক ইমপোর্ট
import { 
  Megaphone, 
  FileText, \n  Save, 
  Send, 
  Droplet, 
  User, 
  MapPin, \n  Clock, 
  Pencil, 
  Trash2, 
  Phone, \n  MessageSquare, 
  Activity, 
  Award, 
  Calendar, 
  Sparkles, 
  Search, 
  Users, 
  Scale, 
  Copy, \n  Lock, 
  Plus, 
  RefreshCw, 
  UserPlus, 
  Shield, 
  Ban, \n  Unlock, \n  LogOut, 
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('home'); // ৫টি টগল ট্যাব
  
  // কাস্টম নোটিফিকেশন সিস্টেম
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  // ফর্ম ডাটা ম্যানেজমেন্ট অবজেক্টস
  const [newDonor, setNewDonor] = useState({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [editRequestId, setEditRequestId] = useState(null);
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '', points: '' });
  const [editVolunteerId, setEditVolunteerId] = useState(null);

  // 🔴 'নোয়াখালী পোস্ট' ফিচারের জন্য নতুন স্টেটসমূহ
  const [posts, setPosts] = useState([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostMediaFile, setNewPostMediaFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const postFileInputRef = useRef(null);

  // সিকিউরিটি ও গ্লোবাল গেটওয়ে লক স্টেটসমূহ
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerPassword, setVolunteerPassword] = useState(''); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // অ্যাডমিন পাসওয়ার্ড পরিবর্তনের স্টেট
  const [showPassModal, setShowPassModal] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // আধুনিক টোস্ট নোটিফিকেশন ফিডব্যাক মেকানিজম
  const showToast = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // লাইফসাইকেল ডাটা সিঙ্ক এবং অফলাইন ক্যাশিং ইঞ্জিন
  useEffect(() => {
    fetchDonors();
    fetchRequests();
    fetchVolunteers();
    fetchPosts(); // নোয়াখালী পোস্ট লোড হবে
    
    const cachedDonors = localStorage.getItem('cached_donors');
    const cachedRequests = localStorage.getItem('cached_requests');
    if (cachedDonors) setDonors(JSON.parse(cachedDonors));
    if (cachedRequests) setEmergencyRequests(JSON.parse(cachedRequests));

    const savedPhone = localStorage.getItem('v_phone');
    const savedPass = localStorage.getItem('v_pass');
    if (savedPhone && savedPass) {
      checkVolunteerAccess(savedPhone, savedPass);
    }
  }, []);

  // ডাটাবেজ ইন্টিগ্রেশন রিডার্স (Supabase REST Engine)
  const fetchDonors = async () => {
    try {
      const { data, error } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
      if (error) throw error;
      if (data) {
        setDonors(data);
        localStorage.setItem('cached_donors', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Donor fetch fail safely handled:", e);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data) {
        setEmergencyRequests(data);
        localStorage.setItem('cached_requests', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Notice fetch fail safely handled:", e);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase.from('volunteers').select('*').order('points', { ascending: false });
      if (error) throw error;
      if (data) setVolunteers(data);
    } catch (e) {
      console.error("Volunteer leaderboard engine error:", e);
    }
  };

  // 🔴 'নোয়াখালী পোস্ট' ডাটা লোড করার ফাংশন
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*').order('id', { ascending: false });
      if (!error && data) setPosts(data);
    } catch (e) {
      console.error("Posts fetch engine error:", e);
    }
  };

  // 🔴 'নোয়াখালী পোস্ট' তৈরি ও আপডেট লজিক (সর্বোচ্চ ২টি পোস্টের নিয়মসহ)
  const handleCreateOrUpdatePost = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToast('শুধুমাত্র অ্যাডমিন প্যানেল থেকে পোস্ট করা সম্ভব!', 'error');
    
    // নতুন পোস্ট করার সময় সর্বোচ্চ ২টির সীমাবদ্ধতা চেক
    if (!editPostId && posts.length >= 2) {
      showToast('⛔ সর্বোচ্চ ২টি পোস্ট করা যাবে! ৩ নম্বর পোস্ট করতে হলে আগের ১টি পোস্ট ডিলিট করুন।', 'error');
      return;
    }

    if (!newPostCaption.trim() && !newPostMediaFile) {
      return showToast('অনুগ্রহ করে ক্যাপশন লিখুন অথবা একটি মিডিয়া ফাইল সিলেক্ট করুন।', 'error');
    }

    try {
      setIsUploading(true);
      let mediaUrl = '';
      let filePath = '';

      // মিডিয়া ফাইল আপলোড প্রসেস (Supabase Storage)
      if (newPostMediaFile) {
        const fileExt = newPostMediaFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        filePath = `uploads/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('posts_media')
          .upload(filePath, newPostMediaFile);

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('posts_media')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
      }

      if (editPostId) {
        // পোস্ট এডিট বা সংশোধন লজিক
        const updateData = { caption: newPostCaption };
        if (mediaUrl) {
          updateData.media_url = mediaUrl;
          updateData.file_path = filePath;
        }
        const { error } = await supabase.from('posts').update(updateData).eq('id', editPostId);
        if (error) throw error;
        showToast('পোস্টটি সফলভাবে সংশোধন করা হয়েছে!', 'success');
      } else {
        // নতুন পোস্ট ইনসার্ট লजিক
        const { error } = await supabase.from('posts').insert([
          { caption: newPostCaption, media_url: mediaUrl, file_path: filePath, author_name: 'প্রধান অ্যাডমিন' }
        ]);
        if (error) throw error;
        showToast('নোয়াখালী পোস্ট সফলভাবে পাবলিশ হয়েছে!', 'success');
      }

      // ফর্ম রিসেট
      setNewPostCaption('');
      setNewPostMediaFile(null);
      setEditPostId(null);
      if (postFileInputRef.current) postFileInputRef.current.value = '';
      fetchPosts();
    } catch (err) {
      showToast('পোস্ট প্রসেস ব্যর্থ হয়েছে: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // 🔴 পোস্ট এডিট সেটআপ ফাংশন
  const handleEditPost = (post) => {
    setEditPostId(post.id);
    setNewPostCaption(post.caption);
    showToast('পোস্টটি সংশোধনের জন্য ফর্মে লোড হয়েছে।', 'info');
  };

  // 🔴 পোস্ট ও সুপাবেস স্টোরেজ ফাইল অটো-ডিলিট লজিক
  const handleDeletePost = async (id, filePath) => {
    if (!isAdmin) return showToast('শুধুমাত্র অ্যাডমিন পোস্ট ডিলিট করতে পারবেন।', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই পোস্টটি মুছে ফেলতে চান?')) {
      try {
        // ১. ডাটাবেজ থেকে ডিলিট
        const { error: dbErr } = await supabase.from('posts').delete().eq('id', id);
        if (dbErr) throw dbErr;

        // ২. সুপাবেস স্টোরেজ বাকেট থেকে ফাইল অটো-ডিলিট
        if (filePath) {
          const { error: storageErr } = await supabase.storage.from('posts_media').remove([filePath]);
          if (storageErr) console.error("Storage cleanup error:", storageErr);
        }

        showToast('পোস্ট এবং মিডিয়া ফাইল সফলভাবে অটো-ডিলিট হয়েছে।', 'success');
        fetchPosts();
      } catch (err) {
        showToast('ডিলিট করতে সমস্যা হয়েছে: ' + err.message, 'error');
      }
    }
  };

  // ভলান্টিয়ার মেম্বারশিপ এক্সেস যাচাইকরণ লজিক
  const checkVolunteerAccess = async (phone, pass) => {
    const { data, error } = await supabase.from('volunteers').select('*').eq('phone', phone).eq('is_active', true).single();
    if (data) {
      if (data.password === pass) {
        setIsUnlocked(true);
        localStorage.setItem('v_phone', phone);
        localStorage.setItem('v_pass', pass);
        setVolunteerPhone(phone);
        setVolunteerPassword(pass);
        showToast('ভলান্টিয়ার কোর ডাটাবেজ অ্যাক্সেস আনলকড!', 'success');
      } else {
        showToast('ভুল সিকিউরিটি পাসওয়ার্ড! পুনরায় চেষ্টা করুন।', 'error');
      }
    } else {
      showToast('এই নম্বরটি ভলান্টিয়ার প্যানেলে অ্যাক্টিভ নেই।', 'error');
    }
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    await checkVolunteerAccess(volunteerPhone, volunteerPassword);
  };

  const handleLockData = () => {
    setIsUnlocked(false);
    setIsAdmin(false);
    localStorage.removeItem('v_phone');
    localStorage.removeItem('v_pass');
    setVolunteerPhone('');
    setVolunteerPassword('');
    showToast('নিরাপত্তার স্বার্থে ড্যাশবোর্ড লক করা হয়েছে।', 'info');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single();
    if (data) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      showToast('মাস্টার অ্যাডমিন অথেনটিকেশন সফল!', 'success');
    } else {
      showToast('ভুল অ্যাডমিন আইডি অথবা সিকিউরিটি কী!', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!masterCode || !newPassword) return showToast('সবগুলো ইনপুট ফিল্ড পূরণ করুন', 'error');
    try {
      const { data: authCheck } = await supabase.from('app_auth').select('*').eq('password', masterCode).single();
      if (authCheck) {
        const { error } = await supabase.from('app_auth').update({ password: newPassword }).eq('user_id', authCheck.user_id);
        if (error) throw error;
        showToast('মাস্টার পাসওয়ার্ড সফলভাবে পরিবর্তিত!', 'success');
        setShowPassModal(false);
        setMasterCode('');
        setNewPassword('');
      } else {
        showToast('ভুল পুরাতন মাস্টার কোড!', 'error');
      }
    } catch (err) {
      showToast('পাসওয়ার্ড ডাটাবেজ আপডেট ব্যর্থ।', 'error');
    }
  };

  // ৬-লেভেল ডাইনামিক মেডেল ও পদবী ক্যালকুলেটর ইঞ্জিন 
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'جدید নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: 'উদীয়মান দাতা 🌟', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (num <= 5) return { text: 'নিয়মিত দাতা 🩸', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (num <= 9) return { text: 'স্টার দাতা 👑', classes: 'bg-green-50 text-green-700 border-green-200' };
    if (num <= 14) return { text: 'সুপার হিরো 🦸‍♂️', classes: 'bg-yellow-100 text-yellow-800 border-yellow-400 font-bold animate-pulse' };
    return { text: 'লাইভ সেভার লিজেন্ড 🏆', classes: 'bg-rose-600 text-white border-rose-700 font-black tracking-wide animate-bounce' };
  };

  const getVolunteerBadge = (points) => {
    const pts = Number(points) || 0;
    if (pts >= 15) return { text: '💎 প্লাটিনাম লিডার', classes: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none' };
    if (pts >= 8) return { text: '🥇 গোল্ডেন স্টার', classes: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-none' };
    return { text: '🤝 সক্রিয় সদস্য', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
  };

  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100 };
    const today = new Date();
    const donationDate = new Date(lastDate);
    const diffTime = Math.abs(today - donationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const requiredDays = gender === 'মহিলা' ? 180 : 120;
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100 };
    } else {
      const remaining = requiredDays - diffDays;
      const progressPercent = Math.round((diffDays / requiredDays) * 100);
      return { 
        isEligible: false, 
        statusText: `সাময়িক অযোগ্য (${remaining} দিন পর দিতে পারবেন)`, 
        percent: Math.min(100, Math.max(0, progressPercent))
      };
    }
  };

  // রক্তদাতা ফাইল ডাটাবেজ প্রসেসিং ফাংশনস
  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.address) {
      showToast('অনুগ্রহ করে নাম, ফোন এবং ঠিকানা অবশ্যই পূরণ করুন!', 'error');
      return;
    }

    const payload = {
      name: newDonor.name,
      blood_group: newDonor.blood_group,
      phone: newDonor.phone,
      location: newDonor.address,
      gender: newDonor.gender,
      weight: String(newDonor.weight),
      age: String(newDonor.age),
      last_donation_date: newDonor.last_donation_date || null,
      activity_count: Number(newDonor.activity_count) || 0
    };

    if (newDonor.id) {
      const { error } = await supabase.from('donors').update(payload).eq('id', newDonor.id);
      if (!error) {
        showToast('রক্তদাতার ডাটা সফলভাবে সংশোধন করা হয়েছে!', 'success');
        resetDonorForm(); fetchDonors(); setActiveTab('search');
      } else {
        showToast('আপডেট ব্যর্থ হয়েছে, নম্বর চেক করুন।', 'error');
      }
    } else {
      const { error } = await supabase.from('donors').insert([payload]);
      if (!error) {
        showToast('অভিনন্দন! নতুন রক্তদাতা ডাটাবেজে নিবন্ধিত হয়েছেন।', 'success');
        resetDonorForm(); fetchDonors(); setActiveTab('search');
      } else {
        showToast('এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে ডাটাবেজে অ্যাকাউন্ট রয়েছে!', 'error');
      }
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    const { error } = await supabase.from('donors').update({ activity_count: (Number(currentCount) || 0) + 1 }).eq('id', id);
    if (!error) {
      showToast('রক্তদানের সংখ্যা সফলভাবে ১ বৃদ্ধি করা হয়েছে! 🩸', 'success');
      fetchDonors();
    } else {
      showToast('কাউন্টার আপডেট করা সম্ভব হয়নি।', 'error');
    }
  };

  const resetDonorForm = () => {
    setNewDonor({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  };

  const handleEditDonor = (donor) => {
    setNewDonor({
      id: donor.id,
      name: donor.name,
      blood_group: donor.blood_group,
      phone: donor.phone,
      address: donor.location || '',
      last_donation_date: donor.last_donation_date || '',
      gender: donor.gender,
      weight: donor.weight || '',
      age: donor.age || '',
      activity_count: donor.activity_count || ''
    });
    setActiveTab('register');
    showToast('রক্তদাতার প্রোফাইল রেজিস্ট্রেশন ফর্মে লোড হয়েছে।', 'info');
  };

  const handleDeleteDonor = async (id) => {
    if (!isAdmin) return showToast('শুধুমাত্র মাস্টার অ্যাডমিন রেকর্ড ডিলিট করতে পারবেন!', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড আজীবনের জন্য মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (!error) {
        showToast('রক্তদাতার প্রোফাইল সম্পূর্ণ ডিলিট করা হয়েছে।', 'success');
        fetchDonors();
      }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\n\n❤️ রক্তদাতা: ${donor.name}\n🩸 রক্তের গ্রুপ: ${donor.blood_group}\n📞 মোবাইল: ${donor.phone}\n📍 এলাকা: ${donor.location || 'নদোনা নোয়াখালী'}\n📊 মোট রক্তদান: ${donor.activity_count || 0} বার`;
    navigator.clipboard.writeText(infoText);
    showToast('রক্তদাতার তথ্য সফলভাবে কপি করা হয়েছে!', 'success');
  };

  // লাইভ নোটিশ বোর্ড রিকোয়েস্ট লজিক
  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (editRequestId) {
      const { error } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId);
      if (!error) {
        showToast('জরুরি রক্তের নোটিশ সফলভাবে এডিট করা হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null); fetchRequests();
      }
    } else {
      const { error } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!error) {
        showToast('নতুন জরুরি রক্তের রিকোয়েস্ট নোটিশ বোর্ডে যুক্ত হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      }
    }
  };

  const handleEditRequest = (req) => {
    setNewRequest({ patient_name: req.patient_name, blood_group: req.blood_group, hospital: req.hospital, phone: req.phone, needed_time: req.needed_time });
    setEditRequestId(req.id);
    showToast('নোটিশটি সম্পাদনার জন্য ফর্মে যুক্ত হয়েছে।', 'info');
  };

  const handleDeleteRequest = async (id) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তের নোটিশটি বোর্ড থেকে মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('emergency_requests').delete().eq('id', id);
      if (!error) {
        showToast('নোটিশ বোর্ড থেকে তথ্য মুছে ফেলা হয়েছে।', 'success');
        fetchRequests();
      }
    }
  };

  const handleShareRequest = (req) => {
    const shareText = `🚨 জরুরি রক্তের প্রয়োজন 🚨\n\n🩸 রক্তের গ্রুপ: ${req.blood_group}\n👤 রোগী: ${req.patient_name}\n🏥 স্থান: ${req.hospital}\n⏰ কখন লাগবে: ${req.needed_time}\n📞 যোগাযোগ: ${req.phone}\n\n📌 সৌজন্যে: ব্লাড সেন্টার নদোনা নোয়াখালী`;
    navigator.clipboard.writeText(shareText);
    showToast('সোশ্যাল মিডিয়া শেয়ার টেক্সট কপি হয়েছে!', 'success');
  };

  // কোর ভলান্টিয়ার টীম প্রোফাইল লজিক 
  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const payload = { name: newVolunteer.name, phone: newVolunteer.phone, password: newVolunteer.password, points: Number(newVolunteer.points) || 0 };

    if (editVolunteerId) {
      const { error } = await supabase.from('volunteers').update(payload).eq('id', editVolunteerId);
      if (!error) {
        showToast('ভলান্টিয়ার প্রোফাইল সফলভাবে আপডেট হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        setEditVolunteerId(null); fetchVolunteers();
      }
    } else {
      const { error } = await supabase.from('volunteers').insert([{ ...payload, is_active: true }]);
      if (!error) {
        showToast('নতুন অফিশিয়াল ভলান্টিয়ার সফলভাবে নিয়োগ দেওয়া হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        fetchVolunteers();
      }
    }
  };

  const handleEditVolunteer = (v) => {
    setNewVolunteer({ name: v.name, phone: v.phone, password: v.password || '', points: v.points || 0 });
    setEditVolunteerId(v.id);
  };

  const handleDeleteVolunteer = async (id) => {
    if (confirm('আপনি কি এই মেম্বারকে ভলান্টিয়ার লিস্ট থেকে স্থায়ীভাবে বরখাস্ত করতে চান?')) {
      const { error } = await supabase.from('volunteers').delete().eq('id', id);
      if (!error) {
        showToast('মেম্বারকে প্যানেল থেকে মুছে ফেলা হয়েছে।', 'success');
        fetchVolunteers();
      }
    }
  };

  const toggleVolunteerStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      showToast('ভলান্টিয়ার মেম্বারশিপ অ্যাক্টিভেশন স্ট্যাটাস পরিবর্তিত!', 'success');
      fetchVolunteers();
    }
  };

  // ডাইনামিক পিএনজি স্মার্ট পরিচয়পত্র জেনারেটর ইঞ্জিন
  const downloadDonorCard = (donor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');

    // ব্যাকগ্রাউন্ড ডিজাইন
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 640, 380);

    // জ্যামিতিক আর্ট ও বর্ডার লাক্সারি শেপ
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(420, 0);
    ctx.lineTo(640, 0);
    ctx.lineTo(640, 380);
    ctx.lineTo(490, 380);
    ctx.fill();

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#991b1b';
    ctx.strokeRect(4, 4, 632, 372);

    // টেক্সট ও কন্টেন্ট ব্র্যান্ডিং
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 24px system-ui, -apple-system';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 30, 50);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px system-ui';
    ctx.fillText('ডিজিটাল রক্তদাতা পরিচয়পত্র (Official)', 30, 85);

    ctx.fillStyle = '#1e293b';
    ctx.font = '16px system-ui';
    ctx.fillText(`রক্তদাতার নাম : ${donor.name}`, 30, 140);
    ctx.fillText(`মোবাইল নম্বর : ${donor.phone}`, 30, 180);
    ctx.fillText(`এলাকা/ঠিকানা : ${donor.location || 'নদোনা, নোয়াখালী'}`, 30, 220);
    ctx.fillText(`মোট রক্তদান : ${donor.activity_count || 0} বার`, 30, 260);
    
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '12px system-ui';
    ctx.fillText('রক্তদান মহৎ দান। রক্ত দিন, জীবন বাঁচান।', 30, 330);

    // ব্লাড গ্রুপ ব্যাজ সার্কেল আর্ট
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(540, 190, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(donor.blood_group, 540, 202);

    // ইমেজ ফাইল মেমোরি লিঙ্ক কনভার্সন ডাউনলোড
    const link = document.createElement('a');
    link.download = `${donor.name}_Blood_Card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('স্মার্ট ডোনার আইডি কার্ড ডাউনলোড সম্পন্ন!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans pb-12">
      
      {/* গ্লোবাল ফ্লোটিং নোটিফিকেশন সিস্টেম */}
      {notification.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold border max-w-md w-11/12 text-sm transition-all animate-bounce ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Droplet className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* আল্ট্রা-মডার্ন সুপার রেসপনসিভ ন্যাপবার */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-2.5 rounded-2xl text-white shadow-md shadow-rose-500/20">
              <Heart className="w-7 h-7 fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">ব্লাড সেন্টার নদোনা নোয়াখালী <span className="text-rose-600">নোয়াখালী</span></h1>
              <p className="text-[11px] text-slate-400 font-bold mt-1 tracking-wider uppercase">স্থাপিত: ২৭ মার্চ ২০১৩ ইং</p>
            </div>
          </div>

          {/* ট্যাব বাটন মেনু */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
            <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${activeTab === 'home' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Home className="w-4 h-4" /> হোম</button>
            <button onClick={() => setActiveTab('notice')} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${activeTab === 'notice' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Megaphone className="w-4 h-4" /> জরুরি নোটিশ</button>
            <button onClick={() => setActiveTab('search')} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${activeTab === 'search' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Search className="w-4 h-4" /> রক্তদাতা খুঁজুন</button>
            <button onClick={() => setActiveTab('register')} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${activeTab === 'register' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><UserPlus className="w-4 h-4" /> নাম নিবন্ধন</button>
            <button onClick={() => setActiveTab('volunteer')} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${activeTab === 'volunteer' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Users className="w-4 h-4" /> ভলান্টিয়ার টীম</button>
          </nav>

          {/* সেফটি লক ইন্ডিকেটর */}
          <div className="flex items-center gap-2">
            {(isUnlocked || isAdmin) ? (
              <button onClick={handleLockData} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all"><Lock className="w-3.5 h-3.5" /> লক ডাটা</button>
            ) : (
              <button onClick={() => document.getElementById('security-gate-anchor')?.scrollIntoView({ behavior: 'smooth' })} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all"><Unlock className="w-3.5 h-3.5" /> আনলক</button>
            )}
          </div>

        </div>
      </header>

      {/* ডাইনামিক বডি কন্টেন্ট সেকশন */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* ট্যাব ১: হোম ড্যাশবোর্ড স্ক্রিন */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white rounded-3xl p-6 md:p-12 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 text-rose-500/20 pointer-events-none"><Heart className="w-64 h-64 fill-current" /></div>
              <h2 className="text-2xl md:text-5xl font-black leading-tight max-w-2xl">আপনার এক ব্যাগ রক্ত, বাঁচিয়ে দিতে পারে একটি তাজা জীবন!</h2>
              <p className="text-xs md:text-sm text-rose-100 mt-4 max-w-xl font-medium leading-relaxed">ব্লাড সেন্টার নদোনা নোয়াখালী-র অফিসিয়াল ডিজিটাল ব্লাড ব্যাংক নেটওয়ার্ক। এখানে মুহূর্তের মধ্যে নোয়াখালীর রক্তদাতাদের সাথে যোগাযোগ করা সম্ভব।</p>
              <div className="flex flex-wrap gap-3 pt-8">
                <button onClick={() => setActiveTab('search')} className="bg-white text-rose-600 hover:bg-rose-50 font-black px-6 py-3 rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all"><Search className="w-4 h-4" /> রক্তদাতা খুঁজুন</button>
                <button onClick={() => setActiveTab('register')} className="bg-rose-800/50 text-white hover:bg-rose-900/40 font-black px-6 py-3 rounded-xl text-xs border border-rose-400/30 flex items-center gap-2 transition-all"><UserPlus className="w-4 h-4" /> রক্তদাতা হিসেবে নাম নিবন্ধন</button>
              </div>
            </div>

            {/* ৪-মেট্রিক কাউন্টার গ্রিড */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="bg-rose-50 p-3 rounded-xl text-rose-600 shrink-0"><Users className="w-6 h-6" /></div>
                <div><p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{donors.length}</p><p className="text-[11px] font-bold text-slate-400 mt-1.5">নিবন্ধিত রক্তদাতা</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 shrink-0"><Megaphone className="w-6 h-6" /></div>
                <div><p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{emergencyRequests.length}</p><p className="text-[11px] font-bold text-slate-400 mt-1.5">জরুরি রক্তের আবেদন</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-xl text-purple-600 shrink-0"><Award className="w-6 h-6" /></div>
                <div><p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{volunteers.length}</p><p className="text-[11px] font-bold text-slate-400 mt-1.5">সক্রিয় ভলান্টিয়ার মেম্বার</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 shrink-0"><Activity className="w-6 h-6" /></div>
                <div><p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{donors.reduce((acc, d) => acc + (Number(d.activity_count) || 0), 0)}</p><p className="text-[11px] font-bold text-slate-400 mt-1.5">সর্বমোট সফল রক্তদান</p></div>
              </div>
            </div>

            {/* ইমার্জেন্সি ফ্লাশ ব্যানার */}
            {emergencyRequests.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">Live Alert</span>
                  <p className="text-xs font-bold text-rose-900">বর্তমানে নোটিশ বোর্ডে {emergencyRequests.length}টি মুমূর্ষু রোগীর জন্য জরুরি রক্তের রিকোয়েস্ট সক্রিয় আছে!</p>
                </div>
                <button onClick={() => setActiveTab('notice')} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm transition-all whitespace-nowrap">নোটিশ বোর্ড দেখুন →</button>
              </div>
            )}

          </div>
        )}

        {/* 🔴 ট্যাব ২: জরুরি নোটিশ ও নোয়াখালী পোস্ট স্ক্রিন */}
        {activeTab === 'notice' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            {/* ==================== নোয়াখালী পোস্ট ফিচার সেকশন ==================== */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs relative">
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-100 text-rose-600 p-2 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">নোয়াখালী পোস্ট</h3>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">ব্লাড সেন্টার নদোনা নোয়াখালী-র অফিশিয়াল আপডেট</p>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                  পোস্ট কাউন্ট: {posts.length}/২
                </span>
              </div>

              {/* অ্যাডমিন পোস্ট ক্রিয়েশন ফর্ম (শুধুমাত্র অ্যাডমিন প্যানেলে দৃশ্যমান) */}
              {isAdmin && (
                <form onSubmit={handleCreateOrUpdatePost} className="bg-slate-50 border p-4 rounded-2xl space-y-3 mb-6">
                  <p className="text-xs font-black text-purple-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> {editPostId ? 'পোস্ট সংশোধন করুন' : 'নতুন নোয়াখালী পোস্ট করুন (সর্বোচ্চ ২টি)'}
                  </p>
                  <textarea 
                    value={newPostCaption} 
                    onChange={(e) => setNewPostCaption(e.target.value)} 
                    rows="3" 
                    placeholder="ফেসবুকের মতো ক্যাপশন লিখুন..." 
                    className="w-full text-xs border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white resize-none"
                  ></textarea>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <input 
                      type="file" 
                      ref={postFileInputRef} 
                      accept="image/*,video/*" 
                      onChange={(e) => setNewPostMediaFile(e.target.files[0])} 
                      className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:bg-rose-50 file:text-rose-700 cursor-pointer w-full sm:w-auto" 
                    />
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {editPostId && (
                        <button type="button" onClick={() => { setEditPostId(null); setNewPostCaption(''); }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">বাতিল</button>
                      )}
                      <button type="submit" disabled={isUploading} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isUploading ? 'আপলোড হচ্ছে...' : editPostId ? 'আপডেট করুন' : 'পাবলিশ পোস্ট'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ফেসবুক স্টাইল নোয়াখালী পোস্ট ডিসপ্লে গ্রিড */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {posts.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed">
                    বর্তমানে কোনো নোয়াখালী পোস্ট পাবলিশ করা নেই।
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-all">
                      {/* ফেসবুক স্টাইল হেডার */}
                      <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xs">🩸</div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{post.author_name || 'ব্লাড সেন্টার'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">অফিশিয়াল নোটিশ</p>
                          </div>
                        </div>
                        
                        {/* অ্যাডমিন অ্যাকশন বাটন */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditPost(post)} className="text-slate-500 hover:bg-white p-1.5 rounded-lg border shadow-2xs"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeletePost(post.id, post.file_path)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100 shadow-2xs"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>

                      {/* ক্যাপশন বডি */}
                      <div className="p-4 flex-1">
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">{post.caption}</p>
                      </div>

                      {/* ফেসবুক স্টাইল মিডিয়া প্লেয়ার (ছবি/ভিডিও) */}
                      {post.media_url && (
                        <div className="w-full h-48 bg-black flex items-center justify-center overflow-hidden border-t">
                          {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video src={post.media_url} controls className="w-full h-full object-contain" />
                          ) : (
                            <img src={post.media_url} alt="Noakhali Post Media" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* ==================== নোয়াখালী পোস্ট এন্ডস ==================== */}


            {/* ভলান্টিয়ার/অ্যাডমিন নোটিশ ইনপুট এরিয়া */}
            {(isAdmin || isUnlocked) && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs border-rose-100/70">
                <h3 className="text-xs font-black text-rose-600 mb-4 flex items-center gap-1.5 uppercase tracking-wide"><Megaphone className="w-4 h-4 animate-bounce" /> মুমূর্ষু রোগীর জন্য নতুন ইমার্জেন্সি নোটিশ দিন</h3>
                
                <form onSubmit={handleAddRequest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">রোগীর নাম (Patient)</label>
                    <input type="text" value={newRequest.patient_name} onChange={(e) => setNewRequest({...newRequest, patient_name: e.target.value})} placeholder="রোগীর নাম লিখুন" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 font-bold" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">রক্তের গ্রুপ (Blood Group)</label>
                    <select value={newRequest.blood_group} onChange={(e) => setNewRequest({...newRequest, blood_group: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50">
                      {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">হাসপাতাল / স্থান (Location)</label>
                    <input type="text" value={newRequest.hospital} onChange={(e) => setNewRequest({...newRequest, hospital: e.target.value})} placeholder="যেমন: সোনাইমুড়ী হাসপাতাল" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 font-bold" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">যোগাযোগের মোবাইল নম্বর</label>
                    <input type="tel" value={newRequest.phone} onChange={(e) => setNewRequest({...newRequest, phone: e.target.value})} placeholder="01XXXXXXXXX" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 font-bold" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">রক্তদানের সময়কাল / কখন লাগবে</label>
                    <input type="text" value={newRequest.needed_time} onChange={(e) => setNewRequest({...newRequest, needed_time: e.target.value})} placeholder="যেমন: আগামীকাল সকাল ১০টা" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 font-bold" required />
                  </div>
                  
                  <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/10 transition-all w-full h-[38px]"><Save className="w-4 h-4" /> {editRequestId ? 'সংশোধন করুন' : 'লাইভ পাবলিশ করুন'}</button>
                </form>
              </div>
            )}

            {/* লাইভ নোটিশ বোর্ড হেডার */}
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">🩸 জরুরি রক্তের লাইভ নোটিশ বোর্ড</h3>
              <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">সর্বমোট রিকোয়েস্ট: {emergencyRequests.length}টি</span>
            </div>

            {/* রিকোয়েস্ট কার্ডস কন্টেইনার */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyRequests.length === 0 ? (
                <div className="col-span-full bg-white text-center py-16 rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wide">বর্তমানে নোটিশ বোর্ডে কোনো লাইভ ব্লাড রিকোয়েস্ট নেই।</div>
              ) : (
                emergencyRequests.map((req) => (
                  <div key={req.id} className="bg-white border-2 border-rose-100/70 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[170px] hover:border-rose-300/80 transition-all">
                    
                    <div className="absolute right-0 top-0 bg-rose-600 text-white font-black text-xl px-5 py-3 rounded-bl-2xl shadow-sm tracking-wide">{req.blood_group}</div>
                    
                    <div className="space-y-1.5 max-w-[78%]">
                      <h4 className="font-black text-base text-slate-900 flex items-center gap-1">👤 রোগী: {req.patient_name}</h4>
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-1">🏥 স্থান: <span className="text-slate-700">{req.hospital}</span></p>
                      <p className="text-xs text-rose-600 font-black flex items-center gap-1 bg-rose-50/60 px-2 py-1 rounded-lg w-fit mt-1"><Clock className="w-3.5 h-3.5" /> সময়: {req.needed_time}</p>
                      <p className="text-xs text-slate-400 font-bold pt-1">📞 যোগাযোগ: <span className="text-slate-800 font-black">{req.phone}</span></p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                      <button onClick={() => handleShareRequest(req)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-200/60 transition-all"><Share2 className="w-3.5 h-3.5 text-blue-500" /> শেয়ার টেক্সট কপি</button>
                      <div className="flex gap-1">
                        {(isAdmin || isUnlocked) && (
                          <button onClick={() => handleEditRequest(req)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/60 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDeleteRequest(req.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl border border-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* 🗺️ ট্যাব ৩: রক্তদাতা সার্চইঞ্জিন ও ফিল্টারিং স্ক্রিন */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* সার্চ কন্ট্রোল মডিউল */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center gap-4">
              <div className="w-full lg:flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input type="text" placeholder="রক্তদাতার নাম, ফোন নাম্বার অথবা নোয়াখালীর সুনির্দিষ্ট এলাকা লিখে সার্চ করুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              
              {/* ব্লাড গ্রুপ ফিল্টার চিপস */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto no-scrollbar py-0.5">
                {bloodGroups.map((group) => (
                  <button key={group} onClick={() => setSelectedGroup(group)} className={`px-3.5 py-1.5 rounded-xl text-xs font-black border whitespace-nowrap transition-all ${selectedGroup === group ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{group === 'All' ? 'সব রক্তের গ্রুপ' : group}</button>
                ))}
              </div>
            </div>

            {/* রক্তদাতা রেজাল্ট গ্রিড */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors
                .filter(donor => {
                  const matchSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      donor.phone.includes(searchTerm) || 
                                      (donor.location && donor.location.toLowerCase().includes(searchTerm.toLowerCase()));
                  const matchGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
                  return matchSearch && matchGroup;
                })
                .map((donor) => {
                  const eligibility = checkEligibility(donor.last_donation_date, donor.gender);
                  const badge = getDonorBadge(donor.activity_count);
                  
                  return (
                    <div key={donor.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[230px]">
                      
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-black text-slate-900 text-base leading-tight">{donor.name}</h4>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border leading-normal whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200">{donor.gender || 'পুরুষ'}</span>
                          </div>
                          <p className={`text-[10px] font-black border w-fit px-2 py-0.5 rounded-md leading-normal ${badge.classes}`}>{badge.text}</p>
                          <p className="text-xs text-slate-500 font-bold pt-1 flex items-center gap-1">📍 এলাকা: <span className="text-slate-800 font-black">{donor.location || 'নদোনা নোয়াখালী'}</span></p>
                          <p className="text-xs text-slate-400 font-bold">📊 রক্তদান কাউন্টার: <span className="text-rose-600 font-black text-sm">{donor.activity_count || 0} বার</span></p>
                        </div>
                        <span className="bg-rose-50 text-rose-600 font-black text-xl px-4 py-2 rounded-2xl border border-rose-100 shadow-2xs shrink-0">{donor.blood_group}</span>
                      </div>

                      {/* রেডিনেস স্ট্যাটাস ইন্ডিকেটর বার */}
                      <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 border border-slate-100 mt-3">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className={eligibility.isEligible ? 'text-emerald-600' : 'text-amber-600'}>{eligibility.statusText}</span>
                          <span className="text-slate-400">{eligibility.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${eligibility.isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${eligibility.percent}%` }}></div>
                        </div>
                      </div>

                      {/* ডাটাবেজ কন্ট্যাক্ট ও কার্ড ডাউনলোড মডিউল */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs mt-4">
                        <p className="font-bold text-slate-400">📞 ফোন: <span className="text-slate-900 font-black tracking-wide">{(isUnlocked || isAdmin) ? donor.phone : '01XXXXXXXXX (🔒)'}</span></p>
                        
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCopyDonorInfo(donor)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 transition-all shadow-2xs" title="তথ্য কপি করুন"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => downloadDonorCard(donor)} className="text-blue-600 hover:bg-blue-50 bg-blue-50/40 px-2.5 py-2 rounded-xl border border-blue-100 font-black flex items-center gap-1 transition-all shadow-2xs"><Download className="w-3.5 h-3.5" /> কার্ড</button>
                          
                          {/* অ্যাডমিন কাস্টম অ্যাকশন কন্ট্রোলস */}
                          {(isAdmin || isUnlocked) && (
                            <button onClick={() => handleEditDonor(donor)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 transition-all shadow-2xs"><Pencil className="w-3.5 h-3.5" /></button>
                          )}
                          {isAdmin && (
                            <>
                              <button onClick={() => handleIncrementActivity(donor.id, donor.activity_count)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 py-2 rounded-xl transition-all shadow-xs" title="রক্তদান ১ বৃদ্ধি করুন">+১ দান</button>
                              <button onClick={() => handleDeleteDonor(donor.id)} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-100 transition-all shadow-2xs"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* 📝সিঙ্গেল পেজ ৪: রক্তদাতা রেজিস্ট্রেশন বা ডাটা সেভ মডিউল */}
        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs animate-fadeIn">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
              <UserPlus className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-black text-slate-900">{newDonor.id ? 'রক্তদাতার ডাটা সংশোধন প্যানেল' : 'নতুন রক্তদাতা অন্তর্ভুক্তি ফরম'}</h3>
            </div>

            <form onSubmit={handleRegisterDonor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">রক্তদাতার পুরো নাম</label>
                  <input type="text" value={newDonor.name} onChange={(e) => setNewDonor({...newDonor, name: e.target.value})} placeholder="যেমন: গিয়াস উদ্দিন" className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">সক্রিয় মোবাইল নম্বর</label>
                  <input type="tel" value={newDonor.phone} onChange={(e) => setNewDonor({...newDonor, phone: e.target.value})} placeholder="01XXXXXXXXX" className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">রক্তের গ্রুপ</label>
                  <select value={newDonor.blood_group} onChange={(e) => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs font-black bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                    {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">লিঙ্গ (Gender)</label>
                  <select value={newDonor.gender} onChange={(e) => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs font-black bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="মহিলা">মহিলা</option>
                  </select>
                </div>
                <div className="space-y-1 className-custom-date col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">শেষ রক্তদানের তারিখ</label>
                  <input type="date" value={newDonor.last_donation_date} onChange={(e) => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">বয়স (Age)</label>
                  <input type="number" value={newDonor.age} onChange={(e) => setNewDonor({...newDonor, age: e.target.value})} placeholder="যেমন: ২৫" className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">ওজন (কেজি)</label>
                  <input type="number" value={newDonor.weight} onChange={(e) => setNewDonor({...newDonor, weight: e.target.value})} placeholder="যেমন: ৬৫" className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">মোট রক্তদান সংখ্যা</label>
                  <input type="number" value={newDonor.activity_count} onChange={(e) => setNewDonor({...newDonor, activity_count: e.target.value})} placeholder="যেমন: ৪" className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">বর্তমান ঠিকানা বা নোয়াখালীর এলাকা</label>
                <input type="text" value={newDonor.address} onChange={(e) => setNewDonor({...newDonor, address: e.target.value})} placeholder="যেমন: নদোনা, সোনাইমুড়ী, নোয়াখালী" className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50/50 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" required />
              </div>

              <div className="flex gap-2 pt-2">
                {newDonor.id && (
                  <button type="button" onClick={resetDonorForm} className="bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs font-black transition-all">নতুন ফরম</button>
                )}
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-black text-xs shadow-sm shadow-rose-600/10 flex items-center justify-center gap-1.5 transition-all"><Save className="w-4 h-4" /> {newDonor.id ? 'ডাটাবেজ রেকর্ড আপডেট করুন' : 'নিরাপদ ক্লাউডে ডাটা সেভ করুন'}</button>
              </div>
            </form>

          </div>
        )}

        {/* 🏆 ট্যাব ৫: ভলান্টিয়ার মেম্বারশিপ এবং লিডারবোর্ড মডিউল */}
        {activeTab === 'volunteer' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            {/* মাস্টার অ্যাডমিন ভলান্টিয়ার রিক্রুটমেন্ট মডিউল */}
            {isAdmin && (
              <div className="bg-white border border-purple-100 rounded-3xl p-5 md:p-6 shadow-xs relative">
                <h3 className="text-xs font-black text-purple-700 mb-4 flex items-center gap-1.5 uppercase tracking-wide"><Shield className="w-4 h-4" /> অফিশিয়াল ভলান্টিয়ার কন্ট্রোল প্যানেল (মাস্টার অ্যাডমিন মোড)</h3>
                
                <form onSubmit={handleAddVolunteer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">ভলান্টিয়ারের নাম</label>
                    <input type="text" value={newVolunteer.name} onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})} placeholder="নাম লিখুন" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">মোবাইল নম্বর</label>
                    <input type="tel" value={newVolunteer.phone} onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">সিকিউরিটি লগইন পাসওয়ার্ড কোড</label>
                    <input type="text" value={newVolunteer.password} onChange={(e) => setNewVolunteer({...newVolunteer, password: e.target.value})} placeholder="কোড সেট করুন" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">পয়েন্ট স্কোর (অনুপাত)</label>
                    <input type="number" value={newVolunteer.points} onChange={(e) => setNewVolunteer({...newVolunteer, points: e.target.value})} placeholder="যেমন: ৫" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  
                  <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2">
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all h-[38px]"><Save className="w-3.5 h-3.5" /> {editVolunteerId ? 'তথ্য আপডেট করুন' : 'নতুন ভলান্টিয়ার অনুমোদন করুন'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* ভলান্টিয়ার মেডেল ও মেধা তালিকা টেবিল */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 md:p-6">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2"><Award className="w-5 h-5 text-purple-600" /> সক্রিয় ভলান্টিয়ার লিডারবোর্ড ও মেধা তালিকা</h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black tracking-wider uppercase border-b border-slate-100 text-[10px]">
                      <th className="p-3.5 text-center w-16">র‍্যাংক</th>
                      <th className="p-3.5">নাম</th>
                      <th className="p-3.5">মোবাইল নম্বর</th>
                      <th className="p-3.5 text-center">সম্মাননা ব্যাজ</th>
                      <th className="p-3.5 text-center w-24">পয়েন্ট স্কোর</th>
                      {isAdmin && <th className="p-3.5 text-center w-40">অ্যাডমিন অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 text-xs">
                    {volunteers.map((v, index) => {
                      const badge = getVolunteerBadge(v.points);
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60 transition-all">
                          <td className="p-3.5 text-center font-black text-slate-400 text-sm">{index + 1}</td>
                          <td className="p-3.5 text-slate-900 font-black text-sm">{v.name}</td>
                          <td className="p-3.5 text-slate-500 font-mono">{(isAdmin || isUnlocked) ? v.phone : '01XXXXXXXXX'}</td>
                          <td className="p-3.5 text-center"><span className={`text-[10px] font-black px-3 py-1 rounded-full border leading-normal inline-block ${badge.classes}`}>{badge.text}</span></td>
                          <td className="p-3.5 text-center font-black text-rose-600 text-sm">{v.points || 0}</td>
                          
                          {isAdmin && (
                            <td className="p-3.5 text-center flex items-center justify-center gap-1">
                              <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-all ${v.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{v.is_active ? 'অ্যাক্টিভ' : 'ব্লকড'}</button>
                              <button onClick={() => handleEditVolunteer(v)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 transition-all shadow-2xs"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteVolunteer(v.id)} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-100 transition-all shadow-2xs"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 🔒 গ্লোবাল গেটওয়ে: সিকিউরিটি অথেনটিকেশন প্যানেল কার্ড */}
        {!isUnlocked && !isAdmin && (
          <div id="security-gate-anchor" className="mt-16 max-w-sm mx-auto bg-white rounded-3xl border border-slate-200 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-purple-600"></div>
            <h3 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-1.5 uppercase tracking-wide"><Lock className="w-4 h-4 text-rose-600" /> ভলান্টিয়ার ও অ্যাডমিন মেম্বারশিপ গেটওয়ে</h3>
            
            <form onSubmit={handleVolunteerUnlock} className="space-y-3">
              <input type="tel" placeholder="নিবন্ধিত মোবাইল নম্বর" value={volunteerPhone} onChange={(e) => setVolunteerPhone(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/40" required />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="ব্যক্তিগত সিকিউরিটি এক্সেস পাসকোড" value={volunteerPassword} onChange={(e) => setVolunteerPassword(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/40 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-all">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-black text-xs shadow-sm transition-all">🧬 সিকিউরিটি প্যানেল আনলক করুন</button>
            </form>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center text-[10px] font-black tracking-wide">
              <button onClick={() => setShowAdminLogin(true)} className="text-purple-600 hover:underline flex items-center gap-0.5">👑 সেন্ট্রাল মাস্টার অ্যাডমিন লগইন</button>
              <button onClick={() => setShowPassModal(true)} className="text-slate-400 hover:underline">পাসওয়ার্ড পরিবর্তন</button>
            </div>
          </div>
        )}

      </main>

      {/* 👑 মোডাল ১: সেন্ট্রাল মাস্টার অ্যাডমিন লগইন ভেরিফিকেশন */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-xs text-purple-700 flex items-center gap-1">👑 অ্যাডমিন রুট ক্লাউড কোড</h3>
              <button onClick={() => setShowAdminLogin(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input type="text" placeholder="মাস্টার অ্যাডমিন আইডি" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold" required />
              <input type="password" placeholder="গোপন রুট পাসওয়ার্ড কী" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold" required />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-black text-xs shadow-md transition-all">মাস্টার লগইন ভেরিফাই</button>
            </form>
          </div>
        </div>
      )}

      {/* ⚙️ মোডাল ২: মাস্টার পাসওয়ার্ড চেঞ্জার ইন্টারফেস */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-xs text-rose-600">⚙️ রুট পাসওয়ার্ড কনফিগারেশন</h3>
              <button onClick={() => setShowPassModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" placeholder="বিদ্যমান মাষ্টার সিকিউরিটি কোড" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold" required />
              <input type="password" placeholder="নতুন অ্যাডমিন পাসওয়ার্ড সেট করুন" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-black text-xs shadow-md transition-all">আপডেট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ফাস্ট-класс লাক্সারি ফুটার (১০০% অপরিবর্তিত) */}
      <footer className="text-center text-xs text-slate-400 mt-20 space-y-3 px-4 leading-relaxed border-t border-slate-200/60 pt-6 max-w-6xl mx-auto">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold text-[11px] bg-slate-200/60 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 max-w-sm mx-auto whitespace-nowrap">
          <span className="text-[11px] font-bold text-slate-400 leading-normal">কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-4 h-4 object-contain shrink-0" onError={(e)=>{e.target.style.display='none'}} />
          <span className="text-rose-600 font-black tracking-wide text-[11px]">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>

    </div>
  );
}
