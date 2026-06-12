import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // অ্যাপ স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('search'); // search, notice, register, volunteer
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10); // লোড মোর লিমিট
  
  // ফর্ম স্টেটসমূহ
  const [newDonor, setNewDonor] = useState({ 
    id: null,
    name: '', 
    blood_group: 'A+', 
    phone: '', 
    address: '', 
    last_donation_date: '',
    gender: 'পুরুষ',
    weight: '',
    age: '',
    activity_count: ''
  });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [editRequestId, setEditRequestId] = useState(null);
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '' });
  const [editVolunteerId, setEditVolunteerId] = useState(null);

  // সিকিউরিটি ও অথেনটিকেশন স্টেট
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // পাসওয়ার্ড পরিবর্তনের স্টেট
  const [showPassModal, setShowPassModal] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // অ্যাপ লোড হওয়ার সাথে সাথে ডাটাবেজ থেকে ডাটা আনা
  useEffect(() => {
    fetchDonors();
    fetchRequests();
    const savedPhone = localStorage.getItem('v_phone');
    if (savedPhone) {
      checkVolunteerAccess(savedPhone);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchVolunteers();
    }
  }, [isAdmin]);

  const fetchDonors = async () => {
    const { data } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
    if (data) setDonors(data);
  };

  const fetchRequests = async () => {
    const { data } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
    if (data) setEmergencyRequests(data);
  };

  const fetchVolunteers = async () => {
    const { data } = await supabase.from('volunteers').select('*').order('id', { ascending: false });
    if (data) setVolunteers(data);
  };

  // রক্তদানের সংখ্যা অনুযায়ী আসল ব্যাজ নির্ধারণকারী ফাংশন
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'New Donor', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: 'Helper', classes: 'bg-green-100 text-green-700 border-green-200' };
    if (num <= 5) return { text: 'Silver Donor', classes: 'bg-gray-200 text-gray-700 border-gray-300' };
    if (num <= 10) return { text: 'Gold Donor', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: 'Platinum Donor', classes: 'bg-blue-100 text-blue-700 border-blue-200 font-bold' };
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    await checkVolunteerAccess(volunteerPhone);
  };

  const checkVolunteerAccess = async (phone) => {
    const { data } = await supabase
      .from('volunteers')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();

    if (data) {
      setIsUnlocked(true);
      localStorage.setItem('v_phone', phone);
      setVolunteerPhone(phone);
    } else {
      alert('দুঃখিত! এই মোবাইল নম্বরটি ভলান্টিয়ার তালিকায় নেই অথবা ব্লক করা আছে।');
      setIsUnlocked(false);
      localStorage.removeItem('v_phone');
    }
  };

  const handleLockData = () => {
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    setVolunteerPhone('');
  };

  // রক্তদাতার যোগ্যতা যাচাইয়ের নিখুঁত লজিক (পুরুষ ৯০ দিন, মহিলা ১২০ দিন)
  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)' };
    
    const today = new Date('2026-06-12'); 
    const donationDate = new Date(lastDate);
    const diffTime = Math.abs(today - donationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const requiredDays = gender === 'মহিলা' ? 120 : 90;
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)' };
    } else {
      const remainingDays = requiredDays - diffDays;
      return { isEligible: false, statusText: `${remainingDays} দিন পর রক্ত দিতে পারবেন` };
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.address) return alert('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন');
    
    const donorPayload = {
      name: newDonor.name,
      blood_group: newDonor.blood_group,
      phone: newDonor.phone,
      location: newDonor.address, 
      gender: newDonor.gender,
      weight: newDonor.weight ? String(newDonor.weight) : '', 
      last_donation_date: newDonor.last_donation_date || null,
      activity_count: Number(newDonor.activity_count) || 0
    };

    if (newDonor.id) {
      const { error } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id);
      if (error) {
        alert('তথ্য সংশোধন করার সময় সমস্যা হয়েছে: ' + error.message);
      } else {
        alert('রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); // সংশোধন শেষে সার্চ ট্যাবে ফেরত যাবে
      }
    } else {
      const { error } = await supabase.from('donors').insert([donorPayload]);
      if (error) {
        if (error.code === '23505') {
          alert('এই নম্বরটি দিয়ে অলরেডি রেজিস্ট্রেশন করা আছে!');
        } else {
          alert('রেজিস্ট্রেশন ব্যর্থ হয়েছে: ' + error.message);
        }
      } else {
        alert('রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); // সফল নিবন্ধনের পর সার্চ ট্যাবে ডিরেক্ট করবে
      }
    }
  };

  const resetDonorForm = () => {
    setNewDonor({ 
      id: null, name: '', blood_group: 'A+', phone: '', address: '',
      last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: ''
    });
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (editRequestId) {
      const { error } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId);
      if (!error) {
        alert('জরুরি রক্তের নোটিশ সফলভাবে সংশোধন হয়েছে!');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null);
        fetchRequests();
      }
    } else {
      const { error } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!error) {
        alert('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      }
    }
  };

  const handleEditRequest = (req) => {
    setNewRequest({
      patient_name: req.patient_name,
      blood_group: req.blood_group,
      hospital: req.hospital,
      phone: req.phone,
      needed_time: req.needed_time
    });
    setEditRequestId(req.id);
    document.getElementById('emergency-board-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteRequest = async (id) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই জরুরি নোটিশটি মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('emergency_requests').delete().eq('id', id);
      if (!error) {
        alert('নোটিশটি সফলভাবে মুছে ফেলা হয়েছে।');
        fetchRequests();
      }
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    if (!isAdmin) return;
    await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id);
    fetchDonors();
  };

  const handleEditDonor = (donor) => {
    if (!isAdmin && !isUnlocked) return alert('অনুগ্রহ করে ভলান্টিয়ার নম্বর দিয়ে ডাটা আনলক করুন');
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
    setActiveTab('register'); // রেজিস্ট্রেশন ফরমে নিয়ে যাবে
    setTimeout(() => {
      document.getElementById('register-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteDonor = async (id) => {
    if (!isAdmin) return alert('শুধুমাত্র মূল অ্যাডমিন প্যানেল থেকে তথ্য ডিলিট করা সম্ভব।');
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড ডিলিট করতে চান?')) {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (!error) {
        alert('রক্তদাতার তথ্য সফলভাবে মুছে ফেলা হয়েছে।');
        fetchDonors();
      }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: ${donor.location || ''}`;
    navigator.clipboard.writeText(infoText);
    alert('রক্তদাতার সমস্ত তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    if (editVolunteerId) {
      const { error } = await supabase.from('volunteers').update(newVolunteer).eq('id', editVolunteerId);
      if (!error) {
        alert('ভলান্টিয়ারের তথ্য সফলভাবে সংশোধন করা হয়েছে!');
        setNewVolunteer({ name: '', phone: '' });
        setEditVolunteerId(null);
        fetchVolunteers();
      }
    } else {
      const { error } = await supabase.from('volunteers').insert([newVolunteer]);
      if (error) {
        alert('এই ভলান্টিয়ার নম্বরটি অলরেডি ডাটাবেজে অনুমোদিত আছে!');
      } else {
        alert('নতুন ভলান্টিয়ার সফলভাবে যোগ করা হয়েছে!');
        setNewVolunteer({ name: '', phone: '' });
        fetchVolunteers();
      }
    }
  };

  const handleEditVolunteer = (v) => {
    setNewVolunteer({ name: v.name, phone: v.phone });
    setEditVolunteerId(v.id);
  };

  const handleDeleteVolunteer = async (id) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই ভলান্টিয়ারকে ডিলিট করতে চান?')) {
      const { error } = await supabase.from('volunteers').delete().eq('id', id);
      if (!error) {
        alert('ভলান্টিয়ার সফলভাবে মুছে ফেলা হয়েছে।');
        fetchVolunteers();
      }
    }
  };

  const toggleVolunteerStatus = async (id, currentStatus) => {
    await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id);
    fetchVolunteers();
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single();
    if (data) {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert('ভুল ইউজার আইডি অথবা পাসওয়ার্ড!');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (masterCode !== 'BCNN2013') {
      return alert('ভুল মাস্টার কোড! আপনি পাসওয়ার্ড পরিবর্তন করার অনুমতি পাননি।');
    }
    const { error } = await supabase.from('app_auth').update({ password: newPassword }).eq('user_id', 'BloodCenterNN');
    if (!error) {
      alert('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
      setShowPassModal(false);
      setMasterCode('');
      setNewPassword('');
    }
  };

  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
    const locationString = `${donor.location || ''}`.toLowerCase();
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          locationString.includes(searchTerm.toLowerCase());
    
    const eligibility = checkEligibility(donor.last_donation_date, donor.gender);
    let matchesEligibility = true;
    if (eligibilityFilter === 'Eligible') matchesEligibility = eligibility.isEligible;
    if (eligibilityFilter === 'Ineligible') matchesEligibility = !eligibility.isEligible;

    return matchesGroup && matchesSearch && matchesEligibility;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 leading-normal">
      {/* হেডার ডিজাইন */}
      <header className="bg-red-600 text-white text-center py-6 shadow-lg px-4 relative">
        <div className="flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-md" />
          <h1 className="text-xl sm:text-2xl font-black flex flex-wrap items-center gap-2 justify-center max-w-full leading-relaxed">
            🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸
          </h1>
          <p className="text-xs text-red-100 font-medium flex items-center gap-1 justify-center bg-red-700/50 px-2.5 py-1 rounded-full leading-normal">
             📍 নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী 🇧🇩
          </p>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          {!isAdmin ? (
            <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="bg-red-700 hover:bg-red-800 text-xs font-bold px-3 py-1.5 rounded-xl text-white flex items-center gap-1 shadow">
              ⚙️ অ্যাডমিন
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => setShowPassModal(true)} className="bg-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-xl text-white shadow">🔑 পাসওয়ার্ড</button>
              <button onClick={() => setIsAdmin(false)} className="bg-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-xl text-white shadow">🚪 লগআউট</button>
            </div>
          )}
        </div>
      </header>

      {/* প্রিমিয়াম ট্যাপ বার (মোবাইল ও ডেক্সটপ ফ্রেন্ডলি স্ক্রল রোধী) */}
      <nav className="bg-white border-b sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto grid grid-cols-4 text-center font-bold text-sm">
          <button 
            onClick={() => setActiveTab('search')} 
            className={`py-3.5 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'search' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}
          >
            <span className="text-lg">🔍</span>
            <span className="text-xs">দাতা খুঁজুন</span>
          </button>
          <button 
            onClick={() => setActiveTab('notice')} 
            className={`py-3.5 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'notice' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}
          >
            <span className="text-lg">📢</span>
            <span className="text-xs">জরুরি নোটিশ</span>
          </button>
          <button 
            onClick={() => setActiveTab('register')} 
            className={`py-3.5 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'register' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}
          >
            <span className="text-lg">✍️</span>
            <span className="text-xs">নিবন্ধন ফরম</span>
          </button>
          <button 
            onClick={() => setActiveTab('volunteer')} 
            className={`py-3.5 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'volunteer' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}
          >
            <span className="text-lg">👥</span>
            <span className="text-xs">ভলান্টিয়ার</span>
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">

        {/* অ্যাডমিন লগইন ফর্ম */}
        {showAdminLogin && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100">
            <h3 className="text-xl font-bold text-red-600 mb-4 text-center flex items-center justify-center gap-2 leading-relaxed">🔐 অ্যাডমিন লগইন ভেরিফিকেশন</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">👤</span>
                <input type="text" placeholder="ইউজার আইডি দিন" value={userId} onChange={e => setUserId(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-xl text-base focus:outline-red-500 leading-normal" required />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">🔒</span>
                <input type={showPassword ? "text" : "password"} placeholder="গোপন পাসওয়ার্ড দিন" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 pl-10 pr-10 p-3 rounded-xl text-base focus:outline-red-500 leading-normal" required />
                <button type="button" onClick={() => { setShowPassword(!showPassword); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-lg text-slate-500 focus:outline-none">
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md leading-normal">⚡ লগইন ভেরিফাই করুন</button>
            </form>
          </div>
        )}

        {/* ==================== TAB 1: রক্তদাতা খুঁজুন (SEARCH) ==================== */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h2 className="text-xl font-black flex items-center gap-2 text-slate-700">🔍 রক্তদাতা অনুসন্ধান প্যানেল</h2>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">🔎</span>
                  <input 
                    type="text" 
                    placeholder="নাম বা ঠিকানা দিয়ে খুঁজুন" 
                    value={searchTerm} 
                    onChange={e => { setSearchTerm(e.target.value); setVisibleDonorsCount(10); }} // সার্চ চেঞ্জে কাউন্ট রিসেট
                    className="w-full border-2 pl-10 p-3 rounded-2xl shadow-xs text-base focus:outline-red-500 leading-normal" 
                  />
                </div>
                <select 
                  value={eligibilityFilter} 
                  onChange={e => { setEligibilityFilter(e.target.value); setVisibleDonorsCount(10); }} 
                  className="w-full border-2 p-3 rounded-2xl shadow-xs text-base bg-white font-bold text-slate-700 focus:outline-red-500 leading-normal"
                >
                  <option value="All">🚻 সকল দাতা (ডাটাবেজে থাকা সবাই)</option>
                  <option value="Eligible">🟢 যোগ্য দাতা (যারা এই মুহূর্তে রক্তদানে প্রস্তুত)</option>
                  <option value="Ineligible">🟡 সাময়িক অযোগ্য দাতা (যাদের নির্দিষ্ট সময় পার হয়নি)</option>
                </select>
              </div>
              
              {/* ব্লাড গ্রুপ সিলেকশন পিলস */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 max-w-full">
                {bloodGroups.map(group => (
                  <button 
                    key={group} 
                    onClick={() => { setSelectedGroup(group); setVisibleDonorsCount(10); }} 
                    className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap shadow-xs transition-all ${selectedGroup === group ? 'bg-red-600 text-white' : 'bg-white border-2 text-slate-600 hover:bg-slate-100'}`}
                  >
                    🩸 {group === 'All' ? 'সব গ্রুপ' : group}
                  </button>
                ))}
              </div>
            </div>

            {/* রক্তদাতা কার্ডের তালিকা */}
            <div className="space-y-4">
              {filteredDonors.length === 0 ? (
                <p className="text-center text-base text-slate-400 py-10 bg-white rounded-2xl shadow-xs leading-normal">📭 এই ফিল্টারিংয়ে কোনো রক্তদাতা পাওয়া যায়নি।</p>
              ) : (
                <>
                  {filteredDonors.slice(0, visibleDonorsCount).map(donor => {
                    const elg = checkEligibility(donor.last_donation_date, donor.gender);
                    const badge = getDonorBadge(donor.activity_count || 0);
                    
                    return (
                      <div key={donor.id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-4 relative">
                        
                        {/* CARD HEADER */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center shadow-inner">{donor.blood_group}</span>
                            <div>
                              <h4 className="font-bold text-lg text-slate-800 flex items-center gap-1.5 leading-relaxed">👤 {donor.name}</h4>
                              <p className="text-sm text-slate-500 font-medium leading-normal">📍 {donor.location || 'ঠিকানা দেওয়া হয়নি'}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border leading-normal transition-all ${badge.classes}`}>
                            {badge.text}
                          </span>
                        </div>

                        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border leading-relaxed ${elg.isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          ⚖️ স্ট্যাটাস: {elg.statusText}
                        </div>

                        <div className="bg-slate-100 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-bold text-slate-700 flex items-center gap-1 leading-normal">
                            📱 {isUnlocked || isAdmin ? donor.phone : 'XXXXXXXXXXX'}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditDonor(donor)} title="তথ্য সংশোধন" className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                              🖊️
                            </button>
                            {isAdmin && (
                              <button onClick={() => handleDeleteDonor(donor.id)} title="তথ্য ডিলিট" className="p-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                                🗑️
                              </button>
                            )}
                            <button onClick={() => handleCopyDonorInfo(donor)} title="তথ্য কপি" className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                              📄
                            </button>
                            {(isUnlocked || isAdmin) ? (
                              <a href={`tel:${donor.phone}`} title="সরাসরি কল করুন" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                                📞
                              </a>
                            ) : (
                              <button onClick={() => alert('মোবাইল নম্বর দেখতে ও কল করতে ভলান্টিয়ার নম্বর দিয়ে ডাটা আনলক করুন।')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed">
                                🔒
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed leading-normal">
                          <span className="font-bold text-red-600">📊 মোট দান: {donor.activity_count || 0} বার</span>
                          <span className="text-slate-500 font-medium">📅 সর্বশেষ দান: {donor.last_donation_date || 'কখনো দেওয়া হয়নি'}</span>
                        </div>

                        {isAdmin && (
                          <button onClick={() => handleIncrementActivity(donor.id, donor.activity_count || 0)} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-xl font-bold text-xs shadow mt-2 leading-normal">
                            ➕ রক্তদানের সংখ্যা ১ বার বৃদ্ধি করুন (+1)
                          </button>
                        )}

                      </div>
                    );
                  })}

                  {/* স্মার্ট প্রগতিশীল লোড মোর বাটন (১০০০ ডোনার থাকলেও স্ক্রলিং রক্ষা করে) */}
                  {filteredDonors.length > visibleDonorsCount && (
                    <button 
                      onClick={() => setVisibleDonorsCount(prev => prev + 10)} 
                      className="w-full bg-slate-800 hover:bg-slate-950 text-white p-3 rounded-2xl font-black text-sm tracking-wide shadow transition-colors flex items-center justify-center gap-1"
                    >
                      🔄 আরো রক্তদাতা দেখুন (Load More)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: জরুরি নোটিশ (NOTICE & STATS) ==================== */}
        {activeTab === 'notice' && (
          <div className="space-y-6">
            
            {/* ডাইনামিক কাউন্টার অর্জন প্যানেল */}
            <div className="bg-white p-6 rounded-2xl shadow border border-slate-100 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-800 tracking-wide border-b-2 border-red-500 inline-block pb-1">📊 আমাদের ডাইনামিক অর্জন</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border text-center shadow-xs">
                  <span className="block text-2xl font-black text-red-600">{totalDonorsCount}</span>
                  <span className="text-xs font-bold text-slate-500 mt-1 block">নিবন্ধিত রক্তদাতা</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border text-center shadow-xs">
                  <span className="block text-2xl font-black text-red-600">{totalDonationsCount}</span>
                  <span className="text-xs font-bold text-slate-500 mt-1 block">রক্তদান সম্পন্ন</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 text-center shadow-xs">
                  <span className="block text-2xl font-black text-green-600">{readyTodayCount}</span>
                  <span className="text-xs font-bold text-red-700 mt-1 block">আজকে প্রস্তুত</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border text-center shadow-xs">
                  <span className="block text-2xl font-black text-red-600">{emergencyRequests.length}</span>
                  <span className="text-xs font-bold text-slate-500 mt-1 block">জরুরি অনুরোধ</span>
                </div>
              </div>
            </div>

            {/* জরুরি লাইভ নোটিশ বোর্ড */}
            <div id="emergency-board-section" className="bg-white p-5 rounded-2xl shadow border-t-4 border-red-500 space-y-4">
              <h2 className="text-lg font-black text-red-600 flex items-center gap-2 animate-pulse leading-relaxed">📢 জরুরি রক্তের লাইভ নোটিশ বোর্ড</h2>
              {isAdmin && (
                <form onSubmit={handleAddRequest} className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
                  <p className="text-xs font-bold text-red-600">{editRequestId ? '📝 নোটিশ সংশোধন করুন:' : '📝 নতুন জরুরি নোটিশ পোস্ট করুন:'}</p>
                  <input type="text" placeholder="রোগীর নাম" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white">
                      {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input type="tel" placeholder="যোগাযোগের নম্বর" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
                  </div>
                  <input type="text" placeholder="হাসপাতালের নাম ও ঠিকানা" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
                  <input type="text" placeholder="কখন রক্ত লাগবে" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
                  <div className="flex gap-1.5">
                    <button type="submit" className="flex-1 bg-red-600 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm">
                      {editRequestId ? '💾 নোটিশ আপডেট' : '🚀 নোটিশ পোস্ট'}
                    </button>
                    {editRequestId && (
                      <button type="button" onClick={() => { setEditRequestId(null); setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); }} className="bg-slate-200 text-slate-700 px-3 rounded-xl font-bold text-xs">বাতিল</button>
                    )}
                  </div>
                </form>
              )}

              {/* নোটিশ সমূহের স্ক্রলরোধী কম্প্যাক্ট ধারক (Max Height Scrollable) */}
              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                {emergencyRequests.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6 leading-normal">ℹ️ বর্তমানে কোনো জরুরি রক্তের রিকোয়েস্ট নেই।</p>
                ) : (
                  emergencyRequests.map(req => (
                    <div key={req.id} className="border border-red-100 bg-red-50/20 p-4 rounded-xl relative shadow-xs space-y-1">
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">🩸 {req.blood_group}</span>
                      <h4 className="font-bold text-sm text-slate-800 leading-normal">👤 রোগী: {req.patient_name}</h4>
                      <p className="text-xs text-slate-600 leading-normal">🏥 স্থান: {req.hospital}</p>
                      <p className="text-xs text-red-600 font-bold leading-normal">⏰ সময়: {req.needed_time}</p>
                      
                      {isAdmin && (
                        <div className="mt-2.5 flex gap-1.5 border-t pt-2 border-dashed border-red-200">
                          <button onClick={() => handleEditRequest(req)} className="flex-1 bg-blue-50 text-blue-600 font-bold text-[11px] py-1 rounded-lg border border-blue-200">🖊️ সংশোধন</button>
                          <button onClick={() => handleDeleteRequest(req.id)} className="flex-1 bg-red-50 text-red-600 font-bold text-[11px] py-1 rounded-lg border border-red-200">🗑️ ডিলিট</button>
                        </div>
                      )}
                      <a href={`tel:${req.phone}`} className="mt-2 text-xs block w-full text-center bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg font-bold leading-normal shadow-xs">📞 সরাসরি কল দিন</a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* রক্তদানের সুফল ও শর্তাবলীর বড় কার্ড */}
            <div className="space-y-4">
              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100 flex gap-3 shadow-xs">
                <span className="text-2xl bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">🎗️</span>
                <div>
                  <h4 className="font-black text-sm text-slate-800 mb-0.5 leading-relaxed">রক্তদানের সুবিধা</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside font-semibold leading-relaxed">
                    <li>হৃদরোগ ও স্ট্রোকের ঝুঁকি কমাতে সাহায্য করে।</li>
                    <li>শরীরে সম্পূর্ণ নতুন রক্তকণিকা তৈরি বৃদ্ধি পায়।</li>
                    <li>বিনামূল্যে মৌলিক স্বাস্থ্য পরীক্ষার সুযোগ হয়।</li>
                    <li>মানসিক প্রশান্তি ও পরম তৃপ্তি লাভ করা যায়।</li>
                  </ul>
                </div>
              </div>
              <div className="bg-green-50/40 p-4 rounded-2xl border border-green-100 flex gap-3 shadow-xs">
                <span className="text-2xl bg-green-100 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">📅</span>
                <div>
                  <h4 className="font-black text-sm text-slate-800 mb-0.5 leading-relaxed">কখন রক্ত দিতে পারবেন?</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside font-semibold leading-relaxed">
                    <li>পুরুষরা প্রতি ৩ মাস অন্তর রক্ত দিতে পারবেন।</li>
                    <li>নারীরা প্রতি ৪ মাস অন্তর রক্ত দিতে পারবেন।</li>
                    <li>শারীরিকভাবে সম্পূর্ণ সুস্থ ও নিরোগ শরীর থাকলে।</li>
                    <li>রক্তদাতার ওজন কমপক্ষে ৪৫ কেজি বা তার বেশি হতে হবে।</li>
                    <li>রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬০ বছরের মধ্যে হতে হবে।</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: রক্তদাতা নিবন্ধন (REGISTER) ==================== */}
        {activeTab === 'register' && (
          <div id="register-section" className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500 space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-black text-green-600 flex items-center justify-center gap-1.5 leading-relaxed">🩸 রক্তদাতা নিবন্ধন ফরম</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal">{newDonor.id ? 'আপনার তথ্য সংশোধন করে ডাটাবেজ আপডেট করুন' : 'আপনার সঠিক তথ্য দিয়ে মানবসেবায় এগিয়ে আসুন'}</p>
            </div>
            
            <form onSubmit={handleRegisterDonor} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">✍️ রক্তদাতার সম্পূর্ণ নাম *</label>
                <input type="text" placeholder="রক্তদাতার সম্পূর্ণ নাম লিখুন" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">☎️ মোবাইল নাম্বার *</label>
                <input type="tel" placeholder="সক্রিয় মোবাইল নাম্বার দিন" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">🩸 রক্তের গ্রুপ *</label>
                  <select value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-green-500 leading-normal">
                    {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">⚧️ লিঙ্গ *</label>
                  <select value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-green-500 leading-normal">
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="মহিলা">মহিলা</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">⚖️ ওজন (কেজি) *</label>
                  <input type="number" placeholder="ওজন লিখুন" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">🎂 বয়স (বছর) *</label>
                  <input type="number" placeholder="বয়স দিন" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">🏡 রক্তদাতার সম্পূর্ণ ঠিকানা *</label>
                <input type="text" placeholder="গ্রাম, ইউনিয়ন, উপজেলা উল্লেখ করে ঠিকানা লিখুন" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">📊 পূর্বে কতবার রক্ত দিয়েছেন? (ঐচ্ছিক)</label>
                <input type="number" placeholder="রক্তদানের মোট সংখ্যা" value={newDonor.activity_count} onChange={e => setNewDonor({...newDonor, activity_count: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">📅 সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)</label>
                <input type="date" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">নোট: পূর্বে কখনো রক্ত না দিয়ে থাকলে এই ঘরটি ফাঁকা রাখুন।</p>
              </div>

              {newDonor.weight && (
                <div className={`p-3.5 rounded-xl border font-bold text-sm flex items-center gap-2 leading-relaxed ${Number(newDonor.weight) >= 45 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {Number(newDonor.weight) >= 45 ? '✅ আপনি রক্তদানের জন্য উপযুক্ত (যোগ্য)' : '❌ রক্তদানের জন্য ন্যূনতম ৪৫ কেজি ওজন প্রয়োজন'}
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-black text-base shadow-sm transition-colors flex items-center justify-center gap-2 leading-normal">
                  💾 {newDonor.id ? 'সংশোধন নিরাপদ করুন' : 'তথ্য ডাটাবেজে নিরাপদ করুন'}
                </button>
                {newDonor.id && (
                  <button type="button" onClick={resetDonorForm} className="bg-slate-200 text-slate-700 px-4 rounded-xl font-bold text-base">বাতিল</button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ==================== TAB 4: ভলান্টিয়ার ও লক ম্যানেজমেন্ট (VOLUNTEER) ==================== */}
        {activeTab === 'volunteer' && (
          <div className="space-y-6">
            
            {/* ভলান্টিয়ার মোবাইল নম্বর ডাটা আনলক প্যানেল */}
            {!isAdmin && (
              <div className="bg-white p-4 rounded-2xl shadow border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-700">🔒 ভলান্টিয়ার আনলক প্যানেল</h3>
                {isUnlocked ? (
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200">
                    <span className="text-xs font-bold text-green-700 flex items-center gap-1.5 leading-normal">🟢 ডাটা সফলভাবে আনলক আছে ({volunteerPhone})</span>
                    <button onClick={handleLockData} className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1">🔒 লক করুন</button>
                  </div>
                ) : (
                  <form onSubmit={handleVolunteerUnlock} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-base">📱</span>
                      <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নম্বর দিন" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} className="w-full border-2 pl-8 p-2 rounded-xl text-xs sm:text-sm focus:outline-red-500 leading-normal" required />
                    </div>
                    <button type="submit" className="bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-900 flex items-center gap-1 shadow-sm whitespace-nowrap">🔓 আনলক</button>
                  </form>
                )}
              </div>
            )}

            {/* ভলান্টিয়ার কন্ট্রোল প্যানেল (অ্যাডমিন) */}
            {isAdmin && (
              <div className="bg-white p-5 rounded-2xl shadow border-t-4 border-blue-600 space-y-4">
                <h3 className="text-lg font-black text-blue-600 flex items-center gap-2 leading-relaxed">👥 ভলান্টিয়ার কন্ট্রোল প্যানেল</h3>
                <form onSubmit={handleAddVolunteer} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1">➕ {editVolunteerId ? 'ভলান্টিয়ার তথ্য সংশোধন করুন:' : 'নতুন ভলান্টিয়ার অনুমোদন দিন:'}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <input type="text" placeholder="ভলান্টিয়ারের নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
                    <input type="tel" placeholder="মোবাইল নম্বর" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
                  </div>
                  <div className="flex gap-1.5">
                    <button type="submit" className="flex-1 bg-blue-600 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm">
                      {editVolunteerId ? '💾 তথ্য আপডেট' : '✍️ ভলান্টিয়ার অনুমোদন'}
                    </button>
                    {editVolunteerId && (
                      <button type="button" onClick={() => { setEditVolunteerId(null); setNewVolunteer({ name: '', phone: '' }); }} className="bg-slate-200 text-slate-700 px-3 rounded-xl font-bold text-xs">বাতিল</button>
                    )}
                  </div>
                </form>

                {/* ভলান্টিয়ার সমূহের স্ক্রলরোধী কম্প্যাক্ট ধারক (Max Height Scrollable) */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {volunteers.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-normal">
                      <div>
                        <p className="font-bold text-slate-800">🛡️ {v.name}</p>
                        <p className="text-xs text-slate-500">📞 {v.phone} {v.is_active ? '' : '(🚫 ব্লকড)'}</p>
                      </div>
                      <div className="flex gap-1 items-center">
                        <button onClick={() => handleEditVolunteer(v)} title="সংশোধন" className="p-1.5 bg-white border rounded text-xs hover:bg-slate-100">🖊️</button>
                        <button onClick={() => handleDeleteVolunteer(v.id)} title="মুছে ফেলুন" className="p-1.5 bg-white border rounded text-xs hover:bg-slate-100">🗑️</button>
                        <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-white ${v.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                          {v.is_active ? '🚫 ব্লক' : '🔓 আনব্লক'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isAdmin && !isUnlocked && (
              <p className="text-center text-xs text-slate-400 py-10 leading-normal bg-white p-4 rounded-xl border">
                🔒 ভলান্টিয়ার বা অ্যাডমিন প্যানেল পরিচালনার জন্য উপযুক্ত কোড বা অথেনটিকেশন ব্যবহার করুন।
              </p>
            )}

          </div>
        )}

      </main>

      {/* সিকিউর পাসওয়ার্ড পরিবর্তন পপআপ */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 leading-relaxed">🔑 সিকিউর পাসওয়ার্ড পরিবর্তন</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" placeholder="মাস্টার কোড (Master Code) দিন" value={masterCode} onChange={e => setMasterCode(e.target.value)} className="w-full border-2 p-3 rounded-xl text-base leading-normal" required />
              <input type="password" placeholder="নতুন শক্তিশালী পাসওয়ার্ড লিখুন" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl text-base leading-normal" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow leading-normal">🔄 আপডেট করুন</button>
                <button type="button" onClick={() => { setShowPassModal(false); setMasterCode(''); }} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm border">❌ বাতিল</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ফুটার ও ক্রেডিট */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত।
          স্থাপিত - ২৭ মার্চ ২০১৩ ইং।</p>
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full leading-normal">🤝 সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto whitespace-nowrap">
          <span className="text-xs font-medium text-slate-400 leading-normal">⚙️ কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-6 h-6 rounded-full object-cover border shadow-xs" />
          <span className="font-black text-slate-600 text-sm tracking-normal">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
