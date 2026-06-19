import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
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
  // অ্যাপ মূল স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [posts, setPosts] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [activeTab, setActiveTab] = useState('home'); 
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10);
  
  // কাস্টম নোটিফিকেশন ও এরর স্টেট
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  // Form স্টেটসমূহ
  const [newDonor, setNewDonor] = useState({ 
    id: null, name: '', blood_group: 'A+', phone: '', address: '', 
    last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: ''
  });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [editRequestId, setEditRequestId] = useState(null);
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '', points: '' });
  const [editVolunteerId, setEditVolunteerId] = useState(null);

  // নতুন পোস্ট ও মিডিয়া স্টেটসমূহ
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostMediaFile, setNewPostMediaFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // সিকিউরিটি ও অথেনটিকেশন স্টেট
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerPassword, setVolunteerPassword] = useState(''); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // পাসওয়ার্ড পরিবর্তনের স্টেট
  const [showPassModal, setShowPassModal] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [allLogs, setAllLogs] = useState([]);

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // টোস্ট নোটিফিকেশন হেল্পার
  const showToast = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // লাইফসাইকেল ডাটা সিঙ্ক ও ক্যাশিং
  useEffect(() => {
    fetchDonors();
    fetchRequests();
    fetchVolunteers();
    fetchPosts();
    
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

  // ==================== সুপাবেস ডাটা ফেচিং লজিক ====================
  const fetchDonors = async () => {
    try {
      const { data, error } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
      if (error) throw error;
      if (data) {
        setDonors(data);
        localStorage.setItem('cached_donors', JSON.stringify(data));
      }
    } catch (e) {
      console.error(e);
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
      console.error(e);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase.from('volunteers').select('*').order('points', { ascending: false });
      if (error) throw error;
      if (data) setVolunteers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data) setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  // ==================== নতুন মিডিয়া ও পোস্ট লজিক (STORAGE + DB) ====================
  const handleMediaUpload = async (file) => {
    if (!file) return null;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('posts_media')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('posts_media')
        .getPublicUrl(filePath);

      return { publicUrl: urlData.publicUrl, filePath: filePath };
    } catch (err) {
      showToast('মিডিয়া আপলোড ব্যর্থ হয়েছে!', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostCaption.trim() && !newPostMediaFile) {
      return showToast('অনুগ্রহ করে ক্যাপশন লিখুন অথবা মিডিয়া ফাইল সিলেক্ট করুন।', 'error');
    }

    try {
      let mediaUrl = '';
      let filePath = '';

      if (newPostMediaFile) {
        const uploadResult = await handleMediaUpload(newPostMediaFile);
        if (uploadResult) {
          mediaUrl = uploadResult.publicUrl;
          filePath = uploadResult.filePath;
        } else {
          return;
        }
      }

      const author = isAdmin ? 'প্রধান অ্যাডমিন' : 'অনুমোদিত ভলান্টিয়ার';
      const { error } = await supabase.from('posts').insert([
        { caption: newPostCaption, media_url: mediaUrl, file_path: filePath, author_name: author }
      ]);

      if (error) throw error;

      showToast('পোস্টটি সফলভাবে পাবলিশ হয়েছে!', 'success');
      setNewPostCaption('');
      setNewPostMediaFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPosts();
    } catch (err) {
      showToast('পোস্ট তৈরি করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  const handleDeletePost = async (id, filePath) => {
    if (!isAdmin) return showToast('শুধুমাত্র অ্যাডমিন পোস্ট ডিলিট করতে পারবেন।', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই পোস্টটি মুছে ফেলতে চান?')) {
      try {
        const { error: dbErr } = await supabase.from('posts').delete().eq('id', id);
        if (dbErr) throw dbErr;

        if (filePath) {
          const { error: storageErr } = await supabase.storage.from('posts_media').remove([filePath]);
          if (storageErr) console.error("Storage cleanup error:", storageErr);
        }

        showToast('পোস্ট এবং মিডিয়া ফাইল সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchPosts();
      } catch (err) {
        showToast('পোস্ট ডিলিট ব্যর্থ: ' + err.message, 'error');
      }
    }
  };

  // ==================== অথেনটিকেশন ও অ্যাক্সেস কন্ট্রোল ====================
  const checkVolunteerAccess = async (phone, pass) => {
    const { data } = await supabase.from('volunteers').select('*').eq('phone', phone).eq('is_active', true).single();
    if (data) {
      if (data.password === pass) {
        setIsUnlocked(true);
        localStorage.setItem('v_phone', phone);
        localStorage.setItem('v_pass', pass);
        setVolunteerPhone(phone);
        setVolunteerPassword(pass);
        showToast('ভলান্টিয়ার মোড সফলভাবে আনলক হয়েছে!', 'success');
      } else {
        showToast('দুঃখিত! সিকিউরিটি পাসওয়ার্ডটি সঠিক নয়।', 'error');
      }
    } else {
      showToast('ভলান্টিয়ার অ্যাকাউন্টটি সক্রিয় নয় বা খুঁজে পাওয়া যায়নি।', 'error');
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
    showToast('নিরাপত্তার স্বার্থে ডাটা লক করা হয়েছে।', 'info');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single();
    if (data) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      showToast('মাস্টার অ্যাডমিন প্যানেল ভেরিফাইড!', 'success');
    } else {
      showToast('ভুল অ্যাডমিন আইডি অথবা পাসওয়ার্ড!', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!masterCode || !newPassword) return showToast('সবগুলো ফিল্ড পূরণ করুন', 'error');
    try {
      const { data: authCheck } = await supabase.from('app_auth').select('*').eq('password', masterCode).single();
      if (authCheck) {
        const { error } = await supabase.from('app_auth').update({ password: newPassword }).eq('user_id', authCheck.user_id);
        if (error) throw error;
        showToast('অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'success');
        setShowPassModal(false);
        setMasterCode('');
        setNewPassword('');
      } else {
        showToast('মাস্টার কোডটি সঠিক নয়!', 'error');
      }
    } catch (err) {
      showToast('পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে।', 'error');
    }
  };

  // ==================== ডাইনামিক সিক্স-লেভেল ব্যাজ লজিক ====================
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: 'উদীয়মান দাতা', classes: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (num <= 5) return { text: 'নিয়মিত দাতা', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (num <= 9) return { text: 'স্টার দাতা', classes: 'bg-green-100 text-green-700 border-green-200' };
    if (num <= 14) return { text: 'সুপার হিরো', classes: 'bg-yellow-100 text-yellow-700 border-yellow-300 font-black animate-pulse' };
    return { text: 'লাইভ সেভার লিজেন্ড', classes: 'bg-purple-100 text-purple-700 border-purple-300 font-black animate-bounce' };
  };

  const getVolunteerBadge = (points) => {
    const pts = Number(points) || 0;
    if (pts >= 15) return { text: 'প্লাটিনাম লিডার', classes: 'bg-purple-600 text-white' };
    if (pts >= 8) return { text: 'গোল্ডেন স্টার', classes: 'bg-yellow-500 text-white' };
    return { text: 'সক্রিয় সদস্য', classes: 'bg-blue-500 text-white' };
  };

  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100 };
    const today = new Date(); 
    const donationDate = new Date(lastDate);
    const diffDays = Math.floor((today - donationDate) / (1000 * 60 * 60 * 24));
    const requiredDays = gender === 'মহিলা' ? 180 : 120;
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100 };
    } else {
      const remainingDays = requiredDays - diffDays;
      return { 
        isEligible: false, 
        statusText: `সাময়িক অযোগ্য (${remainingDays} দিন পর দিতে পারবেন)`,
        percent: Math.min(100, Math.max(0, Math.round((diffDays / requiredDays) * 100)))
      };
    }
  };

  // ==================== রক্তদাতা ব্যবস্থাপনা লজিক ====================
  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.address) return showToast('সব তথ্য সঠিকভাবে দিন', 'error');

    const donorPayload = {
      name: newDonor.name, blood_group: newDonor.blood_group, phone: newDonor.phone,
      location: newDonor.address, gender: newDonor.gender, weight: String(newDonor.weight), 
      age: String(newDonor.age), last_donation_date: newDonor.last_donation_date || null,
      activity_count: Number(newDonor.activity_count) || 0
    };

    if (newDonor.id) {
      const { error } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id);
      if (!error) {
        showToast('রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', 'success');
        resetDonorForm(); fetchDonors(); setActiveTab('search');
      }
    } else {
      const { error } = await supabase.from('donors').insert([donorPayload]);
      if (!error) {
        showToast('নতুন রক্তদাতা সফলভাবে নিবন্ধিত হয়েছেন!', 'success');
        resetDonorForm(); fetchDonors(); setActiveTab('search');
      } else {
        showToast('এই নম্বরটি দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা আছে!', 'error');
      }
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    try {
      const { error } = await supabase.from('donors').update({ activity_count: (Number(currentCount) || 0) + 1 }).eq('id', id);
      if (error) throw error;
      showToast('রক্তদানের সংখ্যা সফলভাবে ১ বৃদ্ধি করা হয়েছে!', 'success');
      fetchDonors();
    } catch (err) {
      showToast('আপডেট করতে ব্যর্থ।', 'error');
    }
  };

  const resetDonorForm = () => {
    setNewDonor({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  };

  const handleEditDonor = (donor) => {
    setNewDonor({
      id: donor.id, name: donor.name, blood_group: donor.blood_group, phone: donor.phone,
      address: donor.location || '', last_donation_date: donor.last_donation_date || '',
      gender: donor.gender, weight: donor.weight || '', age: donor.age || '', activity_count: donor.activity_count || ''
    });
    setActiveTab('register');
  };

  const handleDeleteDonor = async (id) => {
    if (!isAdmin) return showToast('শুধুমাত্র অ্যাডমিন রেকর্ড ডিলিট করতে পারবেন।', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড ডিলিট করতে চান?')) {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (!error) { showToast('রেকর্ড মুছে ফেলা হয়েছে।', 'success'); fetchDonors(); }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: ${donor.location || 'নদোনা'}`;
    navigator.clipboard.writeText(infoText);
    showToast('রক্তদাতার তথ্য কপি করা হয়েছে!', 'success');
  };

  // ==================== নোটিশ বোর্ড লজিক ====================
  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (editRequestId) {
      const { error } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId);
      if (!error) {
        showToast('নোটিশ সফলভাবে সংশোধন হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null); fetchRequests();
      }
    } else {
      const { error } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!error) {
        showToast('জরুরি রক্তের নোটিশ পোস্ট হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      }
    }
  };

  const handleEditRequest = (req) => {
    setNewRequest({ patient_name: req.patient_name, blood_group: req.blood_group, hospital: req.hospital, phone: req.phone, needed_time: req.needed_time });
    setEditRequestId(req.id);
  };

  const handleDeleteRequest = async (id) => {
    if (confirm('এই নোটিশটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('emergency_requests').delete().eq('id', id);
      if (!error) { showToast('নোটিশ মুছে ফেলা হয়েছে।', 'success'); fetchRequests(); }
    }
  };

  const handleShareRequest = (req) => {
    const shareText = `🚨 জরুরি রক্তের প্রয়োজন 🚨\n\n🩸 রক্তের গ্রুপ: ${req.blood_group}\n👤 রোগী: ${req.patient_name}\n🏥 স্থান: ${req.hospital}\n⏰ কখন লাগবে: ${req.needed_time}\n📞 যোগাযোগ: ${req.phone}\n\n📌 সৌজন্যে: ব্লাড সেন্টার নদোনা নোয়াখালী`;
    navigator.clipboard.writeText(shareText);
    showToast('শেয়ার টেক্সট কপি হয়েছে!', 'success');
  };

  // ==================== ভলান্টিয়ার লজিক ====================
  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const payload = { name: newVolunteer.name, phone: newVolunteer.phone, password: newVolunteer.password, points: Number(newVolunteer.points) || 0 };

    if (editVolunteerId) {
      const { error } = await supabase.from('volunteers').update(payload).eq('id', editVolunteerId);
      if (!error) {
        showToast('ভলান্টিয়ারের তথ্য আপডেট হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        setEditVolunteerId(null); fetchVolunteers();
      }
    } else {
      const { error } = await supabase.from('volunteers').insert([{ ...payload, is_active: true }]);
      if (!error) {
        showToast('নতুন ভলান্টিয়ার অনুমোদিত হয়েছে!', 'success');
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
    if (confirm('এই ভলান্টিয়ারকে রিমুভ করতে চান?')) {
      const { error } = await supabase.from('volunteers').delete().eq('id', id);
      if (!error) { showToast('ভলান্টিয়ার রিমুভ করা হয়েছে।', 'success'); fetchVolunteers(); }
    }
  };

  const toggleVolunteerStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) { showToast('ভলান্টিয়ার স্ট্যাটাস আপডেট হয়েছে!', 'success'); fetchVolunteers(); }
  };

  const downloadDonorCard = (donor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 360;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 600, 360);
    ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(600, 0); ctx.lineTo(600, 360); ctx.lineTo(460, 360); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#991b1b'; ctx.strokeRect(3, 3, 594, 354);
    ctx.fillStyle = '#991b1b'; ctx.font = 'bold 22px system-ui'; ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 25, 45);
    ctx.fillStyle = '#1e293b'; ctx.font = '16px system-ui'; ctx.fillText('অফিসিয়াল রক্তদাতা পরিচয়পত্র', 25, 80);
    ctx.fillStyle = '#475569'; ctx.font = '14px system-ui';
    ctx.fillText(`নাম: ${donor.name}`, 25, 130);
    ctx.fillText(`মোবাইল: ${donor.phone}`, 25, 165);
    ctx.fillText(`ঠিকানা: ${donor.location || 'নদোনা'}`, 25, 200);
    ctx.fillText(`মোট দান: ${donor.activity_count || 0} বার`, 25, 235);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(500, 180, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center'; ctx.fillText(donor.blood_group, 500, 192);
    const link = document.createElement('a'); link.download = `${donor.name}_Card.png`; link.href = canvas.toDataURL(); link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans pb-12">
      {notification.show && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold border text-sm ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <Droplet className="w-5 h-5 text-red-500 animate-pulse" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* হেডার */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-lg shadow-rose-600/30">
              <Heart className="w-7 h-7 fill-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">ব্লাড সেন্টার নদোনা <span className="text-rose-600">নোয়াখালী</span></h1>
              <p className="text-xs text-slate-400 font-medium mt-1">স্থাপিত: ২৭ মার্চ ২০১৩ ইং</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
            <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'home' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}><Home className="w-4 h-4" /> হোম</button>
            <button onClick={() => setActiveTab('notice')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'notice' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}><Megaphone className="w-4 h-4" /> নোটিশ</button>
            <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'posts' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}><Sparkles className="w-4 h-4" /> পোস্ট ও মিডিয়া</button>
            <button onClick={() => setActiveTab('search')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'search' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}><Search className="w-4 h-4" /> খুঁজুন</button>
            <button onClick={() => setActiveTab('register')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'register' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}><UserPlus className="w-4 h-4" /> নাম নিবন্ধন</button>
            <button onClick={() => setActiveTab('volunteer')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'volunteer' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}><Users className="w-4 h-4" /> ভলান্টিয়ার</button>
          </nav>

          <div className="flex items-center gap-2">
            {(isUnlocked || isAdmin) ? (
              <button onClick={handleLockData} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> লক করুন</button>
            ) : (
              <button onClick={() => document.getElementById('volunteer-auth-gate')?.scrollIntoView({ behavior: 'smooth' })} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Unlock className="w-3.5 h-3.5" /> আনলক</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* ট্যাব ১: হোম */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white rounded-3xl p-6 md:p-10 shadow-xl">
              <h2 className="text-3xl md:text-5xl font-black leading-tight">আপনার এক ব্যাগ রক্ত, বাঁচিয়ে দিতে পারে একটি তাজা প্রাণ!</h2>
              <p className="text-sm md:text-base text-rose-50 mt-4 max-w-xl">নদোনা নোয়াখালীর অন্যতম ডিজিটাল ব্লাড নেটওয়ার্ক। রক্তদাতা খুঁজুন, জরুরি নোটিশ দিন এবং মানবতার সেবায় শামিল হোন।</p>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setActiveTab('search')} className="bg-white text-rose-600 font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5"><Search className="w-4 h-4" /> রক্তদাতা খুঁজুন</button>
                <button onClick={() => setActiveTab('register')} className="bg-rose-700 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> ডোনার রেজিস্ট্রেশন</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
                <div className="bg-rose-50 p-3 rounded-xl text-rose-600"><Users className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{donors.length}</p><p className="text-xs font-medium text-slate-400">মোট নিবন্ধিত দাতা</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Megaphone className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{emergencyRequests.length}</p><p className="text-xs font-medium text-slate-400">জরুরি নোটিশ</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Award className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{volunteers.length}</p><p className="text-xs font-medium text-slate-400">সক্রিয় ভলান্টিয়ার</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><Activity className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{posts.length}</p><p className="text-xs font-medium text-slate-400">মোট গ্যালারি পোস্ট</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ট্যাব ২: পোস্ট ও মিডিয়া */}
        {activeTab === 'posts' && (
          <div className="space-y-8 animate-fadeIn">
            {(isAdmin || isUnlocked) && (
              <div className="bg-white border rounded-2xl p-6 shadow-sm max-w-xl mx-auto">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-rose-600" /> নতুন মিডিয়া পোস্ট তৈরি করুন</h3>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <textarea value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} rows="3" placeholder="ক্যাম্পেইন বা ব্লাড সেন্টারের আপডেট লিখুন..." className="w-full text-sm border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 resize-none"></textarea>
                  <input type="file" ref={fileInputRef} accept="image/*,video/*" onChange={(e) => setNewPostMediaFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-rose-50 file:text-rose-700 cursor-pointer" />
                  <button type="submit" disabled={isUploading} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isUploading ? 'আপলোড হচ্ছে...' : 'পাবলিশ করুন'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 text-sm">কোনো মিডিয়া পোস্ট পাওয়া যায়নি।</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                    {post.media_url && (
                      <div className="w-full h-52 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                        {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <video src={post.media_url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.media_url} alt="Media" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.caption}</p>
                      <div className="pt-3 border-t flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">✍️ {post.author_name}</span>
                        {isAdmin && (
                          <button onClick={() => handleDeletePost(post.id, post.file_path)} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ট্যাব ৩: নোটিশ বোর্ড */}
        {activeTab === 'notice' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {(isAdmin || isUnlocked) && (
              <div className="bg-white border rounded-2xl p-5 shadow-sm border-rose-100">
                <h3 className="text-sm font-bold text-rose-600 mb-4 flex items-center gap-1.5"><Megaphone className="w-4 h-4" /> জরুরি রক্তের নোটিশ দিন</h3>
                <form onSubmit={handleAddRequest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <input type="text" value={newRequest.patient_name} onChange={(e) => setNewRequest({...newRequest, patient_name: e.target.value})} placeholder="রোগীর নাম" className="border p-2.5 rounded-xl text-xs" required />
                  <select value={newRequest.blood_group} onChange={(e) => setNewRequest({...newRequest, blood_group: e.target.value})} className="border p-2.5 rounded-xl text-xs font-bold">
                    {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input type="text" value={newRequest.hospital} onChange={(e) => setNewRequest({...newRequest, hospital: e.target.value})} placeholder="হাসপাতাল / স্থান" className="border p-2.5 rounded-xl text-xs" required />
                  <input type="tel" value={newRequest.phone} onChange={(e) => setNewRequest({...newRequest, phone: e.target.value})} placeholder="যোগাযোগের নম্বর" className="border p-2.5 rounded-xl text-xs" required />
                  <input type="text" value={newRequest.needed_time} onChange={(e) => setNewRequest({...newRequest, needed_time: e.target.value})} placeholder="কখন লাগবে" className="border p-2.5 rounded-xl text-xs" required />
                  <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-2">
                    <button type="submit" className="bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1"><Save className="w-3.5 h-3.5" /> পোস্ট করুন</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyRequests.length === 0 ? (
                <div className="col-span-full bg-white text-center py-12 rounded-2xl border text-slate-400">বর্তমানে কোনো জরুরি রক্তের রিকোয়েস্ট নোটিশ বোর্ডে নেই।</div>
              ) : (
                emergencyRequests.map((req) => (
                  <div key={req.id} className="bg-white border-2 border-rose-100 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between space-y-4">
                    <div className="absolute right-0 top-0 bg-rose-600 text-white font-black text-xl px-5 py-3 rounded-bl-2xl">{req.blood_group}</div>
                    <div className="space-y-1.5 max-w-[80%]">
                      <h4 className="font-black text-base text-slate-900">👤 রোগী: {req.patient_name}</h4>
                      <p className="text-xs text-slate-600">🏥 स्थान: {req.hospital}</p>
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> কখন: {req.needed_time}</p>
                      <p className="text-xs text-slate-600 font-bold">📞 মোবাইল: {req.phone}</p>
                    </div>
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <button onClick={() => handleShareRequest(req)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-xl flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-blue-600" /> শেয়ার টেক্সট কপি</button>
                      <div className="flex gap-1.5">
                        {(isAdmin || isUnlocked) && <button onClick={() => handleEditRequest(req)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-xl border"><Pencil className="w-3.5 h-3.5" /></button>}
                        {isAdmin && <button onClick={() => handleDeleteRequest(req.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl border border-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ট্যাব ৪: রক্তদাতা অনুসন্ধান */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input type="text" placeholder="রক্তদাতার নাম, ফোন বা এলাকা লিখে সার্চ করুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50" />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {bloodGroups.map((group) => (
                  <button key={group} onClick={() => setSelectedGroup(group)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap ${selectedGroup === group ? 'bg-rose-600 text-white' : 'bg-white text-slate-600'}`}>{group === 'All' ? 'সব গ্রুপ' : group}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {donors
                .filter(donor => {
                  const matchSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || donor.phone.includes(searchTerm) || (donor.location && donor.location.toLowerCase().includes(searchTerm.toLowerCase()));
                  const matchGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
                  return matchSearch && matchGroup;
                })
                .slice(0, visibleDonorsCount)
                .map((donor) => {
                  const elg = checkEligibility(donor.last_donation_date, donor.gender);
                  const badge = getDonorBadge(donor.activity_count);
                  return (
                    <div key={donor.id} className="bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-base">{donor.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>{badge.text}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">📍 এলাকা: {donor.location || 'নদোনা নোয়াখালী'}</p>
                          <p className="text-xs text-slate-400 font-bold">🩸 রক্তদান: <span className="text-slate-900 font-black">{donor.activity_count || 0} বার</span></p>
                          <p className="text-xs font-bold text-slate-500">📞 মোবাইল: <span className="text-slate-900">{isUnlocked || isAdmin ? donor.phone : '01XXXXXXXXX (লকড)'}</span></p>
                        </div>
                        <span className="bg-rose-50 text-rose-600 font-black text-lg px-4 py-2 rounded-xl border border-rose-100">{donor.blood_group}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={elg.isEligible ? 'text-emerald-600' : 'text-amber-600'}>👉 {elg.statusText}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${elg.isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${elg.percent}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-xs">
                        <div className="flex gap-1">
                          <button onClick={() => handleCopyDonorInfo(donor)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-xl border"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => downloadDonorCard(donor)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl border border-blue-100 font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" /> কার্ড</button>
                        </div>
                        <div className="flex gap-1.5">
                          {(isAdmin || isUnlocked) && <button onClick={() => handleEditDonor(donor)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-xl border"><Pencil className="w-3.5 h-3.5" /></button>}
                          {isAdmin && (
                            <>
                              <button onClick={() => handleIncrementActivity(donor.id, donor.activity_count)} className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-1.5 rounded-xl border border-emerald-200">+১ দান</button>
                              <button onClick={() => handleDeleteDonor(donor.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl border border-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {/* ট্যাব ৫: নিবন্ধন ফরম */}
        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border p-6 md:p-8 shadow-sm animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2 border-b pb-4 text-rose-600"><UserPlus className="w-5 h-5" /> ডোনার নিবন্ধন ফরম</h3>
            <form onSubmit={handleRegisterDonor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={newDonor.name} onChange={(e) => setNewDonor({...newDonor, name: e.target.value})} placeholder="রক্তদাতার নাম" className="border p-3 rounded-xl text-xs bg-slate-50" required />
                <input type="tel" value={newDonor.phone} onChange={(e) => setNewDonor({...newDonor, phone: e.target.value})} placeholder="মোবাইল নম্বর" className="border p-3 rounded-xl text-xs bg-slate-50" required />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <select value={newDonor.blood_group} onChange={(e) => setNewDonor({...newDonor, blood_group: e.target.value})} className="border p-3 rounded-xl text-xs font-bold bg-slate-50">
                  {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={newDonor.gender} onChange={(e) => setNewDonor({...newDonor, gender: e.target.value})} className="border p-3 rounded-xl text-xs font-bold bg-slate-50">
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="মহিলা">মহিলা</option>
                </select>
                <input type="date" value={newDonor.last_donation_date} onChange={(e) => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="border p-2.5 rounded-xl text-xs bg-slate-50" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input type="number" value={newDonor.age} onChange={(e) => setNewDonor({...newDonor, age: e.target.value})} placeholder="বয়স" className="border p-3 rounded-xl text-xs bg-slate-50" />
                <input type="number" value={newDonor.weight} onChange={(e) => setNewDonor({...newDonor, weight: e.target.value})} placeholder="ওজন (কেজি)" className="border p-3 rounded-xl text-xs bg-slate-50" />
                <input type="number" value={newDonor.activity_count} onChange={(e) => setNewDonor({...newDonor, activity_count: e.target.value})} placeholder="মোট দান সংখ্যা" className="border p-3 rounded-xl text-xs bg-slate-50" />
              </div>
              <input type="text" value={newDonor.address} onChange={(e) => setNewDonor({...newDonor, address: e.target.value})} placeholder="বর্তমান ঠিকানা বা এলাকা" className="w-full border p-3 rounded-xl text-xs bg-slate-50" required />
              <button type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1"><Save className="w-4 h-4" /> ডাটা সেভ করুন</button>
            </form>
          </div>
        )}

        {/* ট্যাব ৬: ভলান্টিয়ার ও লিডারবোর্ড */}
        {activeTab === 'volunteer' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            {isAdmin && (
              <div className="bg-white border rounded-2xl p-5 shadow-xs border-purple-100">
                <h3 className="text-sm font-bold text-purple-700 mb-4 flex items-center gap-1.5"><Shield className="w-4 h-4" /> ভলান্টিয়ার কন্ট্রোল প্যানেল (মাস্টার অ্যাডমিন)</h3>
                <form onSubmit={handleAddVolunteer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <input type="text" value={newVolunteer.name} onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})} placeholder="নাম" className="border p-2.5 rounded-xl text-xs" required />
                  <input type="tel" value={newVolunteer.phone} onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})} placeholder="মোবাইল নম্বর" className="border p-2.5 rounded-xl text-xs" required />
                  <input type="text" value={newVolunteer.password} onChange={(e) => setNewVolunteer({...newVolunteer, password: e.target.value})} placeholder="লগইন পাসওয়ার্ড কোড" className="border p-2.5 rounded-xl text-xs" required />
                  <input type="number" value={newVolunteer.points} onChange={(e) => setNewVolunteer({...newVolunteer, points: e.target.value})} placeholder="পয়েন্ট স্কোর" className="border p-2.5 rounded-xl text-xs" />
                  <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2">
                    <button type="submit" className="bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1"><Save className="w-3.5 h-3.5" /> ভলান্টিয়ার অনুমোদন করুন</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2 text-purple-700"><Award className="w-5 h-5" /> ভলান্টিয়ার লিডারবোর্ড</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-xs border-b">
                      <th className="p-3.5 text-center">র‍্যাংক</th>
                      <th className="p-3.5">নাম</th>
                      <th className="p-3.5">মোবাইল</th>
                      <th className="p-3.5 text-center">মেডেল</th>
                      <th className="p-3.5 text-center">পয়েন্ট</th>
                      {isAdmin && <th className="p-3.5 text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {volunteers.map((v, idx) => {
                      const badge = getVolunteerBadge(v.points);
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3.5 text-center font-black text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 text-slate-900 font-bold">{v.name}</td>
                          <td className="p-3.5 text-xs text-slate-500">{isAdmin || isUnlocked ? v.phone : '01XXXXXXXXX'}</td>
                          <td className="p-3.5 text-center"><span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${badge.classes}`}>{badge.text}</span></td>
                          <td className="p-3.5 text-center font-black text-rose-600 text-base">{v.points || 0}</td>
                          {isAdmin && (
                            <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                              <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`text-xs font-bold px-2 py-1 rounded-lg border ${v.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{v.is_active ? 'একটিভ' : 'ব্লকড'}</button>
                              <button onClick={() => handleEditVolunteer(v)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg border"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteVolunteer(v.id)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {/* গ্লোবাল গেটওয়ে: সিকিউরিটি প্যানেল */}
        {!isUnlocked && !isAdmin && (
          <div id="volunteer-auth-gate" className="mt-12 max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-purple-600"></div>
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-1.5"><Lock className="w-4 h-4 text-rose-600" /> ভলান্টিয়ার ও অ্যাডমিন গেটওয়ে</h3>
            <form onSubmit={handleVolunteerUnlock} className="space-y-3">
              <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নম্বর" value={volunteerPhone} onChange={(e) => setVolunteerPhone(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50" required />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="সিকিউরিটি কোড" value={volunteerPassword} onChange={(e) => setVolunteerPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs">🧬 আনলক করুন</button>
            </form>
            <div className="pt-4 border-t mt-4 flex justify-between items-center text-[11px] font-bold">
              <button onClick={() => setShowAdminLogin(true)} className="text-purple-600 hover:underline">👑 আপনি কি মাস্টার অ্যাডমিন?</button>
              <button onClick={() => setShowPassModal(true)} className="text-slate-400 hover:underline">⚙️ পাসওয়ার্ড রিসেট</button>
            </div>
          </div>
        )}
      </main>

      {/* মোডাল: অ্যাডমিন লগইন */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-black text-slate-900 text-sm text-purple-700">👑 মাস্টার অ্যাডমিন ভেরিফিকেশন</h3>
              <button onClick={() => setShowAdminLogin(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input type="text" placeholder="অ্যাডমিন আইডি" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs" required />
              <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs" required />
              <button type="submit" className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-bold text-xs">লগইন</button>
            </form>
          </div>
        </div>
      )}

      {/* মোডাল: পাসওয়ার্ড চেঞ্জার */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-bold text-slate-900 text-sm">⚙️ অ্যাডমিন পাসওয়ার্ড রিসেট</h3>
              <button onClick={() => setShowPassModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" placeholder="বর্তমান মাস্টার পাসওয়ার্ড" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs" required />
              <input type="password" placeholder="নতুন পাসওয়ার্ড" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs" required />
              <button type="submit" className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs">আপডেট করুন</button>
            </form>
          </div>
        </div>
      )}

      {/* ফুটার */}
      <footer className="text-center text-xs text-slate-400 mt-20 space-y-3 px-4 border-t pt-6 max-w-6xl mx-auto">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold bg-slate-200/60 inline-block px-4 py-1.5 rounded-full">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-1.5 pt-2 font-bold text-slate-500">
          <span className="text-slate-400 font-medium">কারিগরি সহযোগিতায়:</span>
          <span className="text-rose-600">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
