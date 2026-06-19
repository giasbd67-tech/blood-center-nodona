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
  const [posts, setPosts] = useState([]); // নতুন পোস্ট সিস্টেম স্টেট
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('home'); // ট্যাবসমূহ: home, notice, posts, search, register, volunteer
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10);
  
  // কাস্টম নোটিফিকেশন ও এরর স্টেট
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [error, setError] = useState(null);
  
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

  // অ্যাডভান্সড ফিচারের স্টেটসমূহ (কার্ড, হিস্ট্রি লগ)
  const [selectedDonorForCard, setSelectedDonorForCard] = useState(null);
  const [selectedVolunteerForCard, setSelectedVolunteerForCard] = useState(null);
  const [donorLogs, setDonorLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogDonor, setActiveLogDonor] = useState(null);
  const [newLog, setNewLog] = useState({ patient_name: '', hospital: '', date: '' });

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // টোস্ট নোটিফিকেশন হেল্পার
  const showToast = (message, type = 'info') => {
    console.log(`Toast Notification [${type}]: ${message}`);
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // লাইফসাইকেল ডাটা সিঙ্ক ও ক্যাশিং
  useEffect(() => {
    console.log("Application initialized. Fetching data layers...");
    fetchDonors();
    fetchRequests();
    fetchVolunteers();
    fetchAllLogs();
    fetchPosts(); // পোস্ট ডাটা লোড
    
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

  useEffect(() => {
    fetchVolunteers(); 
  }, [isAdmin]);

  // ==================== সুপাবেস ডাটা ফেচিং লজিক ====================
  const fetchDonors = async () => {
    try {
      const { data, error: fetchErr } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setDonors(data);
        localStorage.setItem('cached_donors', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Donor fetch fallback triggered.", e);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error: fetchErr } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setEmergencyRequests(data);
        localStorage.setItem('cached_requests', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Notice fetch error.", e);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data, error: fetchErr } = await supabase.from('volunteers').select('*').order('points', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) setVolunteers(data);
    } catch (e) {
      console.error("Volunteer fetch error.", e);
    }
  };

  const fetchAllLogs = async () => {
    try {
      const { data, error: fetchErr } = await supabase.from('donation_logs').select('*').order('date', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) setAllLogs(data);
    } catch (e) {
      console.error("Logs fetch error.", e);
    }
  };

  // নতুন পোস্ট রিড ফাংশন
  const fetchPosts = async () => {
    try {
      const { data, error: fetchErr } = await supabase.from('posts').select('*').order('id', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) setPosts(data);
    } catch (e) {
      console.error("Posts loading sequence failed.", e);
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

      const { data, error: uploadErr } = await supabase.storage
        .from('posts_media')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('posts_media')
        .getPublicUrl(filePath);

      return {
        publicUrl: urlData.publicUrl,
        filePath: filePath
      };
    } catch (err) {
      console.error("Media storage upload crashed.", err);
      showToast('মিডিয়া আপলোড ব্যর্থ হয়েছে!', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostCaption.trim() && !newPostMediaFile) {
      return showToast('অনুগ্রহ করে পোস্টের ক্যাপশন লিখুন অথবা মিডিয়া ফাইল সিলেক্ট করুন।', 'error');
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
      const { error: insertErr } = await supabase.from('posts').insert([
        {
          caption: newPostCaption,
          media_url: mediaUrl,
          file_path: filePath,
          author_name: author
        }
      ]);

      if (insertErr) throw insertErr;

      showToast('ইন্টারেক্টিভ পোস্টটি সফলভাবে পাবলিশ হয়েছে!', 'success');
      setNewPostCaption('');
      setNewPostMediaFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPosts();
    } catch (err) {
      showToast('পোস্ট তৈরি করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  // অটো-ডিলিট লজিকসহ পোস্ট ডিলিট অপশন
  const handleDeletePost = async (id, filePath) => {
    if (!isAdmin) return showToast('শুধুমাত্র অ্যাডমিন প্যানেল থেকে পোস্ট ডিলিট করা সম্ভব।', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই ইন্টারেক্টিভ কার্ড পোস্টটি চিরতরে মুছে ফেলতে চান?')) {
      try {
        // ১. ডাটাবেজ রেকর্ড ডিলিট
        const { error: dbErr } = await supabase.from('posts').delete().eq('id', id);
        if (dbErr) throw dbErr;

        // ২. সুপাবেস স্টোরেজ থেকে অটোমেটেড ফাইল পার্মানেন্ট ডিলিট লজিক
        if (filePath) {
          const { error: storageErr } = await supabase.storage.from('posts_media').remove([filePath]);
          if (storageErr) console.error("Storage clean up failed:", storageErr);
        }

        showToast('পোস্ট এবং এর সাথে সংযুক্ত মিডিয়া ফাইল স্থায়ীভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchPosts();
      } catch (err) {
        showToast('পোস্ট ডিলিট ব্যর্থ: ' + err.message, 'error');
      }
    }
  };

  // ==================== ডাইনামিক সিক্স-লেভেল ব্যাজ লজিক ====================
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: 'উদীয়মান দাতা', classes: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (num <= 5) return { text: 'নিয়মিত দাতা', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (num <= 9) return { text: 'স্টার দাতা', classes: 'bg-green-100 text-green-700 border-green-200' };
    if (num <= 14) return { text: 'সুপার হিরো', classes: 'bg-yellow-100 text-yellow-700 border-yellow-300 font-black animate-pulse shadow-xs' };
    return { text: 'লাইভ সেভার লিজেন্ড', classes: 'bg-purple-100 text-purple-700 border-purple-300 font-black tracking-wide shadow animate-bounce' };
  };

  const getVolunteerBadge = (points) => {
    const pts = Number(points) || 0;
    if (pts >= 15) return { text: 'প্লাটিনাম লিডার', classes: 'bg-purple-600 text-white' };
    if (pts >= 8) return { text: 'গোল্ডেন স্টার', classes: 'bg-yellow-500 text-white' };
    return { text: 'সক্রিয় সদস্য', classes: 'bg-blue-500 text-white' };
  };

  // ==================== অথেনটিকেশন ও অ্যাক্সেস কন্ট্রোল ====================
  const checkVolunteerAccess = async (phone, pass) => {
    const { data, error: dbError } = await supabase.from('volunteers').select('*').eq('phone', phone).eq('is_active', true).single();
    if (data) {
      const dbPass = data.password || data.code || '';
      if (dbPass === pass || !dbPass) {
        setIsUnlocked(true);
        localStorage.setItem('v_phone', phone);
        localStorage.setItem('v_pass', pass);
        setVolunteerPhone(phone);
        setVolunteerPassword(pass);
        showToast('ভলান্টিয়ার মোড সফলভাবে আনলক হয়েছে!', 'success');
      } else {
        showToast('দুঃখিত! সিকিউরিটি পাসওয়ার্ডটি সঠিক নয়।', 'error');
        setIsUnlocked(false);
      }
    } else {
      showToast('ভলান্টিয়ার অ্যাকাউন্টটি খুঁজে পাওয়া যায়নি বা ব্লক রয়েছে।', 'error');
    }
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    await checkVolunteerAccess(volunteerPhone, volunteerPassword);
  };

  const handleLockData = () => {
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    localStorage.removeItem('v_pass');
    setVolunteerPhone('');
    setVolunteerPassword('');
    showToast('নিরাপত্তার স্বার্থে ডাটা পুনরায় লক করা হয়েছে।', 'info');
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

  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100, remainingDays: 0 };
    const today = new Date(); 
    const donationDate = new Date(lastDate);
    if (donationDate > today) return { isEligible: false, statusText: 'সাময়িক অযোগ্য (ভবিষ্যতের তারিখ)', percent: 0, remainingDays: 0 };
    
    const diffDays = Math.floor((today - donationDate) / (1000 * 60 * 60 * 24));
    const requiredDays = gender === 'মহিলা' ? 180 : 120;
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100, remainingDays: 0 };
    } else {
      const remainingDays = requiredDays - diffDays;
      return { 
        isEligible: false, 
        statusText: `সাময়িক অযোগ্য (${remainingDays} দিন পর দিতে পারবেন)`,
        percent: Math.min(100, Math.max(0, Math.round((diffDays / requiredDays) * 100))),
        remainingDays
      };
    }
  };

  // ==================== রক্তদাতা ও নোটিশ বোর্ড হ্যান্ডলিং ====================
  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.address) {
      return showToast('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন', 'error');
    }

    const donorPayload = {
      name: newDonor.name,
      blood_group: newDonor.blood_group,
      phone: newDonor.phone,
      location: newDonor.address, 
      gender: newDonor.gender,
      weight: newDonor.weight ? String(newDonor.weight) : '', 
      age: newDonor.age ? String(newDonor.age) : '',
      last_donation_date: newDonor.last_donation_date || null,
      activity_count: Number(newDonor.activity_count) || 0
    };

    if (newDonor.id) {
      const { error: submitError } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id);
      if (!submitError) {
        if (isUnlocked && !isAdmin) await supabase.rpc('increment_volunteer_points', { v_phone: volunteerPhone });
        showToast('রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', 'success');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search');
      }
    } else {
      const { error: submitError } = await supabase.from('donors').insert([donorPayload]);
      if (!submitError) {
        if (isUnlocked && !isAdmin) await supabase.rpc('increment_volunteer_points', { v_phone: volunteerPhone });
        showToast('নতুন রক্তদাতা সফলভাবে নিবন্ধিত হয়েছেন!', 'success');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search');
      } else {
        showToast('এই নম্বরটি দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা আছে!', 'error');
      }
    }
  };

  const resetDonorForm = () => {
    setNewDonor({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (editRequestId) {
      const { error: reqError } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId);
      if (!reqError) {
        showToast('জরুরি রক্তের নোটিশ সফলভাবে সংশোধন হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null);
        fetchRequests();
      }
    } else {
      const { error: reqError } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!reqError) {
        showToast('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      }
    }
  };

  const handleEditDonor = (donor) => {
    if (!isAdmin && !isUnlocked) return showToast('ভলান্টিয়ার বা অ্যাডমিন মোড আনলক করুন', 'error');
    setNewDonor({
      id: donor.id, name: donor.name, blood_group: donor.blood_group, phone: donor.phone,
      address: donor.location || '', last_donation_date: donor.last_donation_date || '',
      gender: donor.gender, weight: donor.weight || '', age: donor.age || '', activity_count: donor.activity_count || ''
    });
    setActiveTab('register');
  };

  const handleDeleteDonor = async (id) => {
    if (!isAdmin) return showToast('শুধুমাত্র মূল অ্যাডমিন প্যানেল থেকে তথ্য ডিলিট করা সম্ভব।', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড ডিলিট করতে চান?')) {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (!error) { showToast('রেকর্ড মুছে ফেলা হয়েছে।', 'success'); fetchDonors(); }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    if (!isUnlocked && !isAdmin) return showToast('তথ্য কপি করতে ভলান্টিয়ার প্যানেল আনলক করুন।', 'error');
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: ${donor.location || 'নদোনা'}`;
    navigator.clipboard.writeText(infoText);
    showToast('রক্তদাতার তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
  };

  const handleShareRequest = (req) => {
    const shareText = `🚨 জরুরি রক্তের প্রয়োজন 🚨\n\n🩸 রক্তের গ্রুপ: ${req.blood_group}\n👤 রোগী: ${req.patient_name}\n🏥 স্থান: ${req.hospital}\n⏰ কখন লাগবে: ${req.needed_time}\n📞 যোগাযোগের নম্বর: ${req.phone}\n\n📌 সৌজন্যে: ব্লাড সেন্টার নদোনা নোয়াখালী`;
    navigator.clipboard.writeText(shareText);
    showToast('শেয়ারিং টেক্সট কপি হয়েছে! এখন সোশ্যাল মিডিয়ায় পোস্ট করুন।', 'success');
  };

  // ==================== ভলান্টিয়ার ও লিডারবোর্ড সিস্টেম ====================
  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const volunteerPayload = { 
      name: newVolunteer.name, phone: newVolunteer.phone, password: newVolunteer.password,
      code: newVolunteer.password, points: Number(newVolunteer.points) || 0 
    };

    if (editVolunteerId) {
      const { error } = await supabase.from('volunteers').update(volunteerPayload).eq('id', editVolunteerId);
      if (!error) {
        showToast('ভলান্টিয়ারের তথ্য ও পাসওয়ার্ড আপডেট হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        setEditVolunteerId(null);
        fetchVolunteers();
      }
    } else {
      const { error } = await supabase.from('volunteers').insert([volunteerPayload]);
      if (!error) {
        showToast('নতুন ভলান্টিয়ার সফলভাবে অনুমোদিত হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        fetchVolunteers();
      }
    }
  };

  // ==================== ক্যানভাস প্রিমিয়াম আইডি ও সার্টিফিকেট কার্ড জেনারেটর ====================
  const downloadDonorCard = (donor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 360;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 600, 360);
    // রাইট সাইড রেড ডিজাইন শেপ
    ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(600, 0); ctx.lineTo(600, 360); ctx.lineTo(460, 360); ctx.fill();

    ctx.lineWidth = 6; ctx.strokeStyle = '#991b1b'; ctx.strokeRect(3, 3, 594, 354);
    ctx.fillStyle = '#991b1b'; ctx.font = 'bold 22px system-ui'; ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 25, 45);
    ctx.fillStyle = '#1e293b'; ctx.font = '16px system-ui'; ctx.fillText('অফিসিয়াল রক্তদাতা পরিচয়পত্র', 25, 80);

    ctx.fillStyle = '#475569'; ctx.font = '14px system-ui';
    ctx.fillText(`নাম: ${donor.name}`, 25, 130);
    ctx.fillText(`মোবাইল: ${donor.phone}`, 25, 165);
    ctx.fillText(`ঠিকানা: ${donor.location || 'নদোনা'}`, 25, 200);
    ctx.fillText(`সর্বশেষ রক্তদান: ${donor.last_donation_date || 'কখনো না'}`, 25, 235);

    // রক্তের গ্রুপ হাইলাইট গোল বক্স
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(500, 180, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center'; ctx.fillText(donor.blood_group, 500, 192);

    const link = document.createElement('a'); link.download = `${donor.name}_ID_Card.png`; link.href = canvas.toDataURL(); link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans pb-12">
      {/* গ্লোবাল কাস্টম টোস্ট নোটিফিকেশন */}
      {notification.show && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold transition-all animate-bounce text-sm max-w-md text-center border ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Droplet className="w-5 h-5 text-red-500 animate-pulse" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* ব্র্যান্ড হেডার এবং নভিগেশন বার */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-lg shadow-rose-600/30 animate-pulse">
              <Heart className="w-7 h-7 fill-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                ব্লাড সেন্টার নদোনা <span className="text-rose-600">নোয়াখালী</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">স্থাপিত: ২৭ মার্চ ২০১৩ ইং | মানবতা ও সামাজিক রক্তসেবা</p>
            </div>
          </div>

          {/* মেনু ট্যাব বাটন কন্ট্রোলসমূহ */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
            <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${activeTab === 'home' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:bg-white/50'}`}>
              <Home className="w-4 h-4" /> হোম
            </button>
            <button onClick={() => setActiveTab('notice')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap relative ${activeTab === 'notice' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:bg-white/50'}`}>
              <Megaphone className="w-4 h-4" /> নোটিশ বোর্ড
              {emergencyRequests.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold animate-ping">{emergencyRequests.length}</span>}
            </button>
            <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${activeTab === 'posts' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:bg-white/50'}`}>
              <Sparkles className="w-4 h-4" /> পোস্ট ও মিডিয়া
            </button>
            <button onClick={() => setActiveTab('search')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${activeTab === 'search' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:bg-white/50'}`}>
              <Search className="w-4 h-4" /> রক্তদাতা খুঁজুন
            </button>
            <button onClick={() => setActiveTab('register')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${activeTab === 'register' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:bg-white/50'}`}>
              <UserPlus className="w-4 h-4" /> নতুন নাম নিবন্ধন
            </button>
            <button onClick={() => setActiveTab('volunteer')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${activeTab === 'volunteer' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:bg-white/50'}`}>
              <Users className="w-4 h-4" /> ভলান্টিয়ার
            </button>
          </nav>

          {/* সিকিউরিটি স্ট্যাটাস লক বাটন */}
          <div className="flex items-center gap-2">
            {(isUnlocked || isAdmin) ? (
              <button onClick={handleLockData} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md transition-all">
                <Lock className="w-3.5 h-3.5" /> লক করুন
              </button>
            ) : (
              <button onClick={() => { document.getElementById('volunteer-auth-gate')?.scrollIntoView({ behavior: 'smooth' }); showToast('ভলান্টিয়ার বা অ্যাডমিন কোড দিন।', 'info'); }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all">
                <Unlock className="w-3.5 h-3.5" /> আনলক ডাটা
              </button>
            )}
            {isAdmin && <span className="bg-purple-600 text-white font-bold text-[10px] px-2 py-1 rounded-md tracking-wider">অ্যাডমিন মোড</span>}
          </div>
        </div>
      </header>

      {/* মূল কন্টেন্ট সেকশন কনটেইনার */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* ==================== ট্যাব ১: হোম ড্যাশবোর্ড ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            {/* হিরো ব্যানার */}
            <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
                <Heart className="w-96 h-96 fill-white" />
              </div>
              <div className="max-w-xl relative z-10 space-y-4">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Blood Center Nodona Noakhali</span>
                <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">আপনার এক ব্যাগ রক্ত, বাঁচিয়ে দিতে পারে একটি তাজা প্রাণ!</h2>
                <p className="text-sm md:text-base text-rose-50 font-normal leading-relaxed">নদোনা নোয়াখালীর অন্যতম ডিজিটাল ব্লাড নেটওয়ার্ক। রক্তদাতা খুঁজুন, জরুরি নোটিশ দিন এবং সমাজ সংস্কারের এই মহৎ ডিজিটাল বিপ্লবে শামিল হোন।</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => setActiveTab('search')} className="bg-white text-rose-600 font-bold px-5 py-3 rounded-xl text-xs hover:bg-slate-100 shadow-md transition-all flex items-center gap-1.5"><Search className="w-4 h-4" /> রক্তদাতা খুঁজুন</button>
                  <button onClick={() => setActiveTab('register')} className="bg-rose-700/50 hover:bg-rose-800 border border-white/30 font-bold px-5 py-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> ডোনার রেজিস্ট্রেশন</button>
                </div>
              </div>
            </div>

            {/* রিয়েল-টাইম পরিসংখ্যান কার্ডসমূহ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-rose-50 p-3 rounded-xl text-rose-600"><Users className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{donors.length}</p><p className="text-xs font-medium text-slate-400">মোট নিবন্ধিত দাতা</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Megaphone className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{emergencyRequests.length}</p><p className="text-xs font-medium text-slate-400">জরুরি নোটিশ</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Award className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{volunteers.length}</p><p className="text-xs font-medium text-slate-400">সক্রিয় ভলান্টিয়ার</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><Activity className="w-6 h-6" /></div>
                <div><p className="text-2xl font-black text-slate-900">{allLogs.length}</p><p className="text-xs font-medium text-slate-400">মোট সফল রক্তদান</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== নতুন ট্যাব ২: ইন্টারেক্টিভ পোস্ট ও মিডিয়া গ্যালারি ==================== */}
        {activeTab === 'posts' && (
          <div className="space-y-8 animate-fadeIn">
            {/* অ্যাডমিন/ভলান্টিয়ার আনলক মোড পোস্ট জেনারেটর প্যানেল */}
            {(isAdmin || isUnlocked) ? (
              <div className="bg-white border rounded-2xl p-6 shadow-sm max-w-xl mx-auto border-slate-200">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">নতুন ইন্টারেক্টিভ কার্ড পোস্ট তৈরি করুন (অ্যাডমিন/ভলান্টিয়ার প্যানেল)</h3>
                </div>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ক্যাপশন / বিবরণ লিখুন:</label>
                    <textarea value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} rows="3" placeholder="রক্তদান ক্যাম্পেইন বা ব্লাড সেন্টারের আপডেট লিখুন..." className="w-full text-sm border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ছবি অথবা ভিডিও আপলোড করুন (Supabase Storage):</label>
                    <input type="file" ref={fileInputRef} accept="image/*,video/*" onChange={(e) => setNewPostMediaFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
                  </div>
                  <button type="submit" disabled={isUploading} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-300">
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isUploading ? 'মিডিয়া আপলোড হচ্ছে...' : 'পাবলিশ করুন'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-4 text-center max-w-md mx-auto text-xs font-semibold text-slate-500">
                💡 নতুন ক্যাপশন ও মিডিয়া পোস্ট করার জন্য নিচে ভলান্টিয়ার নম্বর দিয়ে প্যানেল আনলক করুন।
              </div>
            )}

            {/* গ্যালারি এবং পোস্ট কার্ড গ্রিড ডিসপ্লে */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 text-sm font-medium">কোনো মিডিয়া পোস্ট পাওয়া যায়নি।</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                    {/* মিডিয়া রেন্ডারিং লজিক (ইমেজ বা ভিডিও ডিটেকশন) */}
                    {post.media_url && (
                      <div className="w-full h-52 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                        {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) || post.media_url.includes('storage/v1/object/public') && !post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <video src={post.media_url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.media_url} alt="Post Media" className="w-full h-full object-cover hover:scale-105 transition-all duration-500" />
                        )}
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">✍️ {post.author_name}</span>
                        <span>{new Date(post.created_at).toLocaleDateString('bn-BD')}</span>
                        {isAdmin && (
                          <button onClick={() => handleDeletePost(post.id, post.file_path)} className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-all" title="মুছে ফেলুন">
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

        {/* ==================== ট্যাব ৩: জরুরি নোটিশ বোর্ড ==================== */}
        {activeTab === 'notice' && (
          <div id="emergency-board-section" className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {/* নোটিশ যোগ করার প্যানেল */}
            {(isAdmin || isUnlocked) && (
              <div className="bg-white border rounded-2xl p-5 shadow-sm border-rose-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5 text-rose-600">
                  <Megaphone className="w-4 h-4 animate-pulse" /> {editRequestId ? 'জরুরি রক্তের নোটিশ সংশোধন করুন' : 'নতুন জরুরি রক্তের নোটিশ পোস্ট করুন'}
                </h3>
                <form onSubmit={handleAddRequest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">রোগীর নাম:</label>
                    <input type="text" value={newRequest.patient_name} onChange={(e) => setNewRequest({...newRequest, patient_name: e.target.value})} placeholder="রোগীর নাম" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">রক্তের গ্রুপ:</label>
                    <select value={newRequest.blood_group} onChange={(e) => setNewRequest({...newRequest, blood_group: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs font-bold">
                      {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">হাসপাতাল / স্থান:</label>
                    <input type="text" value={newRequest.hospital} onChange={(e) => setNewRequest({...newRequest, hospital: e.target.value})} placeholder="যেমন: নোয়াখালী সদর হাসপাতাল" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">মোবাইল নম্বর:</label>
                    <input type="tel" value={newRequest.phone} onChange={(e) => setNewRequest({...newRequest, phone: e.target.value})} placeholder="যোগাযোগের নম্বর" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">কখন লাগবে:</label>
                    <input type="text" value={newRequest.needed_time} onChange={(e) => setNewRequest({...newRequest, needed_time: e.target.value})} placeholder="যেমন: আগামীকাল সকাল ১০টা" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-2">
                    {editRequestId && <button type="button" onClick={() => { setEditRequestId(null); setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); }} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs">বাতিল</button>}
                    <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all">
                      <Save className="w-3.5 h-3.5" /> {editRequestId ? 'আপডেট নোটিশ' : 'পোস্ট করুন'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* একটিভ রক্তের নোটিশ কার্ডসমূহ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyRequests.length === 0 ? (
                <div className="col-span-full bg-white text-center py-12 rounded-2xl border text-slate-400 font-medium text-sm">বর্তমানে কোনো জরুরি রক্তের রিকোয়েস্ট নোটিশ বোর্ডে নেই।</div>
              ) : (
                emergencyRequests.map((req) => (
                  <div key={req.id} className="bg-white border-2 border-rose-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-rose-300 transition-all">
                    <div className="absolute right-0 top-0 bg-rose-600 text-white font-black text-xl px-5 py-3 rounded-bl-2xl shadow-md">{req.blood_group}</div>
                    <div className="space-y-1.5 max-w-[80%]">
                      <h4 className="font-black text-base text-slate-900 flex items-center gap-1">👤 রোগী: {req.patient_name}</h4>
                      <p className="text-xs text-slate-600 font-medium">🏥 স্থান: {req.hospital}</p>
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> কখন লাগবে: {req.needed_time}</p>
                      <p className="text-xs text-slate-600 font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-600" /> যোগাযোগ: {req.phone}</p>
                    </div>
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <button onClick={() => handleShareRequest(req)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all">
                        <Share2 className="w-3.5 h-3.5 text-blue-600" /> সোশ্যাল শেয়ার টেক্সট কপি
                      </button>
                      <div className="flex gap-1.5">
                        {(isAdmin || isUnlocked) && <button onClick={() => handleEditRequest(req)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-xl border transition-all"><Pencil className="w-3.5 h-3.5" /></button>}
                        {isAdmin && <button onClick={() => handleDeleteRequest(req.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl border border-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== ট্যাব ৪: রক্তদাতা অনুসন্ধান ইঞ্জিন ==================== */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fadeIn">
            {/* ফিল্টার এবং সার্চ বার কন্ট্রোল */}
            <div className="bg-white p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input type="text" placeholder="রক্তদাতার নাম বা মোবাইল নম্বর বা এলাকা লিখে সার্চ করুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50/50" />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">গ্রুপ ফিল্টার:</span>
                {bloodGroups.map((group) => (
                  <button key={group} onClick={() => setSelectedGroup(group)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedGroup === group ? 'bg-rose-600 border-rose-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{group === 'All' ? 'সব গ্রুপ' : group}</button>
                ))}
              </div>
            </div>

            {/* রক্তদাতার ইনফরমেশন তালিকা */}
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
                    <div key={donor.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-base">{donor.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>{badge.text}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">📍 এলাকা: {donor.location || 'নদোনা নোয়াখালী'}</p>
                          <p className="text-xs text-slate-400 font-bold">🩸 মোট রক্তদান: <span className="text-slate-900 font-black">{donor.activity_count || 0} বার</span></p>
                          <p className="text-xs font-bold text-slate-500">📞 মোবাইল: <span className="text-slate-900">{isUnlocked || isAdmin ? donor.phone : '01XXXXXXXXX (লকড)'}</span></p>
                        </div>
                        <span className="bg-rose-50 text-rose-600 font-black text-lg px-4 py-2 rounded-xl border border-rose-100 shadow-xs">{donor.blood_group}</span>
                      </div>

                      {/* এলিজিবিলিটি বা রক্তদানের যোগ্যতা প্রোগ্রেস বার */}
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={elg.isEligible ? 'text-emerald-600' : 'text-amber-600'}>👉 {elg.statusText}</span>
                          <span className="text-slate-400">{elg.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${elg.isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${elg.percent}%` }}></div>
                        </div>
                      </div>

                      {/* অ্যাকশন বাটন কন্ট্রোলসমূহ */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex gap-1">
                          <button onClick={() => handleCopyDonorInfo(donor)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-xl border transition-all" title="কপি করুন"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => downloadDonorCard(donor)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl border border-blue-100 transition-all text-xs font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" /> আইডি কার্ড</button>
                        </div>
                        <div className="flex gap-1.5">
                          {(isAdmin || isUnlocked) && <button onClick={() => handleEditDonor(donor)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-xl border transition-all"><Pencil className="w-3.5 h-3.5" /></button>}
                          {isAdmin && (
                            <>
                              <button onClick={() => handleIncrementActivity(donor.id, donor.activity_count)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-xs px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-all">+১ দান</button>
                              <button onClick={() => handleDeleteDonor(donor.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl border border-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {donors.length > visibleDonorsCount && (
              <div className="text-center pt-4">
                <button onClick={() => setVisibleDonorsCount(prev => prev + 10)} className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl border shadow-xs transition-all">আরো রক্তদাতা লোড করুন</button>
              </div>
            )}
          </div>
        )}

        {/* ==================== ট্যাব ৫: নতুন রক্তদাতা রেজিস্ট্রেশন ফর্ম ==================== */}
        {activeTab === 'register' && (
          <div id="register-section" className="max-w-xl mx-auto bg-white rounded-3xl border p-6 md:p-8 shadow-sm animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2 border-b pb-4 text-rose-600">
              <UserPlus className="w-5 h-5" /> {newDonor.id ? 'রক্তদাতার প্রোফাইল সংশোধন ফরম' : 'নতুন ডিজিটাল রক্তদাতা নিবন্ধন ফরম'}
            </h3>
            <form onSubmit={handleRegisterDonor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">রক্তদাতার নাম (বাধ্যতামূলক):</label>
                  <input type="text" value={newDonor.name} onChange={(e) => setNewDonor({...newDonor, name: e.target.value})} placeholder="যেমন: গিয়াস উদ্দিন" className="w-full border p-3 rounded-xl text-xs bg-slate-50/50" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">মোবাইল নম্বর (বাধ্যতামূলক):</label>
                  <input type="tel" value={newDonor.phone} onChange={(e) => setNewDonor({...newDonor, phone: e.target.value})} placeholder="যেমন: 017XXXXXXXX" className="w-full border p-3 rounded-xl text-xs bg-slate-50/50" required />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">রক্তের গ্রুপ:</label>
                  <select value={newDonor.blood_group} onChange={(e) => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border p-3 rounded-xl text-xs font-bold bg-slate-50/50">
                    {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">লিঙ্গ:</label>
                  <select value={newDonor.gender} onChange={(e) => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border p-3 rounded-xl text-xs font-bold bg-slate-50/50">
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="মহিলা">মহিলা</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">সর্বশেষ রক্তদানের তারিখ:</label>
                  <input type="date" value={newDonor.last_donation_date} onChange={(e) => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50/50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">বয়স (ঐচ্ছিক):</label>
                  <input type="number" value={newDonor.age} onChange={(e) => setNewDonor({...newDonor, age: e.target.value})} placeholder="বছর" className="w-full border p-3 rounded-xl text-xs bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ওজন (ঐচ্ছিক):</label>
                  <input type="number" value={newDonor.weight} onChange={(e) => setNewDonor({...newDonor, weight: e.target.value})} placeholder="কেজি" className="w-full border p-3 rounded-xl text-xs bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">পূর্বের মোট দান সংখ্যা:</label>
                  <input type="number" value={newDonor.activity_count} onChange={(e) => setNewDonor({...newDonor, activity_count: e.target.value})} placeholder="বার" className="w-full border p-3 rounded-xl text-xs bg-slate-50/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">বর্তমান ঠিকানা / এলাকা (বাধ্যতামূলক):</label>
                <input type="text" value={newDonor.address} onChange={(e) => setNewDonor({...newDonor, address: e.target.value})} placeholder="গ্রাম, ইউনিয়ন, থানা বা এলাকা" className="w-full border p-3 rounded-xl text-xs bg-slate-50/50" required />
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {newDonor.id && <button type="button" onClick={resetDonorForm} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all">সংশোধন মোড বাতিল</button>}
                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1">
                  <Save className="w-4 h-4" /> {newDonor.id ? 'তথ্য আপডেট নিশ্চিত করুন' : 'ডিজিটাল ডাটাবেজে নাম যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== ট্যাব ৬: ভলান্টিয়ার ও লিডারবোর্ড প্যানেল ==================== */}
        {activeTab === 'volunteer' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            {/* অ্যাডমিন প্যানেল থেকে ভলান্টিয়ার যোগ/সম্পাদনা */}
            {isAdmin && (
              <div className="bg-white border rounded-2xl p-5 shadow-xs border-purple-100">
                <h3 className="text-sm font-bold text-purple-700 mb-4 flex items-center gap-1.5"><Shield className="w-4 h-4" /> ভলান্টিয়ার পারমিশন কন্ট্রোল প্যানেল (মাস্টার অ্যাডমিন)</h3>
                <form onSubmit={handleAddVolunteer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ভলান্টিয়ারের নাম:</label>
                    <input type="text" value={newVolunteer.name} onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})} placeholder="ভলান্টিয়ারের নাম" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">মোবাইল নম্বর:</label>
                    <input type="tel" value={newVolunteer.phone} onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})} placeholder="মোবাইল নম্বর" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">সিকিউরিটি পাসওয়ার্ড কোড:</label>
                    <input type="text" value={newVolunteer.password} onChange={(e) => setNewVolunteer({...newVolunteer, password: e.target.value})} placeholder="সিকিউরিটি পাসওয়ার্ড" className="w-full border p-2.5 rounded-xl text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">পয়েন্ট স্কোর:</label>
                    <input type="number" value={newVolunteer.points} onChange={(e) => setNewVolunteer({...newVolunteer, points: e.target.value})} placeholder="পয়েন্ট" className="w-full border p-2.5 rounded-xl text-xs" />
                  </div>
                  <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2">
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all">
                      <Save className="w-3.5 h-3.5" /> {editVolunteerId ? 'তথ্য সংশোধন করুন' : 'ভলান্টিয়ার অনুমোদন করুন'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ভলান্টিয়ার লিডারবোর্ড মেডেলসহ রিয়েল-টাইম ট্র্যাকিং */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2 text-purple-700"><Award className="w-5 h-5" /> ভলান্টিয়ার মেম্বারশিপ এবং রিয়েল-টাইম কন্ট্রিবিউশন লিডারবোর্ড</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-xs border-b">
                      <th className="p-3.5 text-center">র‍্যাংক</th>
                      <th className="p-3.5">ভলান্টিয়ারের নাম</th>
                      <th className="p-3.5">মোবাইল নম্বর</th>
                      <th className="p-3.5 text-center">মেডেল স্ট্যাটাস</th>
                      <th className="p-3.5 text-center">কাজের পয়েন্ট</th>
                      {isAdmin && <th className="p-3.5 text-center">অ্যাকশন</th></tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {volunteers.map((v, idx) => {
                      const badge = getVolunteerBadge(v.points);
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3.5 text-center font-black text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 text-slate-900 font-bold">{v.name}</td>
                          <td className="p-3.5 text-xs text-slate-500">{isAdmin || isUnlocked ? v.phone : '01XXXXXXXXX'}</td>
                          <td className="p-3.5 text-center">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs ${badge.classes}`}>{badge.text}</span>
                          </td>
                          <td className="p-3.5 text-center font-black text-rose-600 text-base">{v.points || 0}</td>
                          {isAdmin && (
                            <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                              <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`text-xs font-bold px-2 py-1 rounded-lg border ${v.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{v.is_active ? 'একটিভ' : 'ব্লকড'}</button>
                              <button onClick={() => handleEditVolunteer(v)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg border transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteVolunteer(v.id)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {/* ==================== গ্লোবাল গেটওয়ে: ভলান্টিয়ার ও অ্যাডমিন সিকিউরিটি গেট ==================== */}
        {!isUnlocked && !isAdmin && (
          <div id="volunteer-auth-gate" className="mt-12 max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-purple-600"></div>
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-1.5"><Lock className="w-4 h-4 text-rose-600" /> ভলান্টিয়ার ও অ্যাডমিন ডাটা প্রটেকশন গেটওয়ে</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">রক্তদাতাদের সম্পূর্ণ ফোন নম্বর দেখতে, কপি করতে, প্রোফাইল এডিট করতে এবং সুপাবেস ক্লাউডে ছবিসহ ইন্টারেক্টিভ পোস্ট করতে অনুগ্রহ করে নিচে লগইন করুন।</p>
            
            <form onSubmit={handleVolunteerUnlock} className="space-y-3">
              <div>
                <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নম্বর" value={volunteerPhone} onChange={(e) => setVolunteerPhone(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50" required />
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="ভলান্টিয়ার সিকিউরিটি কোড / পাসওয়ার্ড" value={volunteerPassword} onChange={(e) => setVolunteerPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-md">🧬 ভলান্টিয়ার ড্যাশবোর্ড আনলক করুন</button>
            </form>
            
            <div className="pt-4 border-t mt-4 flex justify-between items-center text-[11px] font-bold">
              <button onClick={() => setShowAdminLogin(true)} className="text-purple-600 hover:underline">👑 আপনি কি মাস্টার অ্যাডমিন?</button>
              <button onClick={() => setShowPassModal(true)} className="text-slate-400 hover:underline">⚙️ পাসওয়ার্ড রিসেট</button>
            </div>
          </div>
        )}
      </main>

      {/* ==================== মোডাল ১: মাস্টার অ্যাডমিন লগইন গেটওয়ে ==================== */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 text-purple-700">👑 মূল অ্যাডমিন ভেরিফিকেশন</h3>
              <button onClick={() => setShowAdminLogin(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input type="text" placeholder="অ্যাডমিন ইউজার আইডি" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50" required />
              <input type="password" placeholder="অ্যাডমিন সিকিউরিটি পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs bg-slate-50" required />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all">সুপার অ্যাডমিন সিকিউর লগইন</button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== মোডাল ২: পাসওয়ার্ড পরিবর্তনের সিকিউর উইন্ডো ==================== */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1 text-slate-700">⚙️ রিমোট পাসওয়ার্ড চেঞ্জার</h3>
              <button onClick={() => setShowPassModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" placeholder="প্রতিষ্ঠানের মাষ্টার সিকিউরিটি কোড" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs" required />
              <input type="password" placeholder="নতুন অ্যাডমিন পাসওয়ার্ড সেট করুন" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all">আপডেট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ফাস্ট-ক্লাস লাক্সারি ফুটার */}
      <footer className="text-center text-xs text-slate-400 mt-20 space-y-3 px-4 leading-relaxed border-t pt-6 max-w-6xl mx-auto">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold text-[11px] bg-slate-200/60 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-1.5 pt-2 max-w-sm mx-auto font-bold text-slate-500">
          <span className="text-slate-400 font-medium">কারিগরি সহযোগিতায়:</span>
          <span className="text-rose-600 hover:underline cursor-pointer">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
