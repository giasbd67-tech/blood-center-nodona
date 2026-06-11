import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // অ্যাপ স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); // সব, যোগ্য, সাময়িক অযোগ্য
  
  // ফর্ম স্টেটসমূহ (১০টি পূর্ণাঙ্গ ফিল্ড সমৃদ্ধ)
  const [newDonor, setNewDonor] = useState({ 
    name: '', 
    blood_group: 'A+', 
    phone: '', 
    upazila: 'সোনাইমুড়ী', 
    union: '', 
    village: '',
    last_donation_date: '',
    gender: 'পুরুষ',
    weight: '',
    age: ''
  });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '' });

  // @ts-ignore সিকিউরিটি ও অথেনটিকেশন স্টেট
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // পাসওয়ার্ড পরিবর্তনের স্টেট
  const [showPassModal, setShowPassModal] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // গ্রুপ লিস্ট
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
    
    const today = new Date('2026-06-11'); // বর্তমান সময় ২০২৬ অনুযায়ী চালিত
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
    if (!newDonor.name || !newDonor.phone || !newDonor.village) return alert('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন');
    
    const { error } = await supabase.from('donors').insert([newDonor]);
    if (error) {
      alert('এই নম্বরটি দিয়ে অলরেডি রেজিস্ট্রেশন করা আছে!');
    } else {
      alert('রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!');
      setNewDonor({ 
        name: '', blood_group: 'A+', phone: '', upazila: 'সোনাইমুড়ী', union: '', village: '',
        last_donation_date: '', gender: 'পুরুষ', weight: '', age: ''
      });
      fetchDonors();
    }
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('emergency_requests').insert([newRequest]);
    if (!error) {
      alert('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!');
      setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
      fetchRequests();
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    if (!isAdmin) return;
    await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id);
    fetchDonors();
  };

  // ডেটা সংশোধন বাটন অ্যাকশন
  const handleEditDonor = (donor) => {
    if (!isAdmin && !isUnlocked) return alert('অনুগ্রহ করে ভলান্টিয়ার নম্বর দিয়ে ডাটা আনলক করুন');
    setNewDonor(donor);
    document.getElementById('register-section').scrollIntoView({ behavior: 'smooth' });
    alert('রক্তদাতার তথ্য নিচে নিবন্ধন ফরমে লোড হয়েছে, সংশোধন করে আবার সাবমিট করুন।');
  };

  // ডেটা ডিলিট বাটন অ্যাকশন
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

  // তথ্য কপি করার মডার্ন বাটন অ্যাকশন
  const handleCopyDonorInfo = (donor) => {
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: গ্রাম: ${donor.village}, ইউনিয়ন: ${donor.union}, উপজেলা: ${donor.upazila}`;
    navigator.clipboard.writeText(infoText);
    alert('রক্তদাতার সমস্ত তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('volunteers').insert([newVolunteer]);
    if (error) {
      alert('এই ভলান্টিয়ার নম্বরটি অলরেডি ডাটাবেজে অনুমোদিত আছে!');
    } else {
      alert('নতুন ভলান্টিয়ার সফলভাবে যোগ করা হয়েছে!');
      setNewVolunteer({ name: '', phone: '' });
      fetchVolunteers();
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

  // সার্চ, ব্লাড গ্রুপ এবং যোগ্যতা ফিল্টারিং ইন্টিগ্রেশন
  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
    
    const locationString = `${donor.village} ${donor.union} ${donor.upazila}`.toLowerCase();
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          locationString.includes(searchTerm.toLowerCase());
    
    const eligibility = checkEligibility(donor.last_donation_date, donor.gender);
    let matchesEligibility = true;
    if (eligibilityFilter === 'Eligible') matchesEligibility = eligibility.isEligible;
    if (eligibilityFilter === 'Ineligible') matchesEligibility = !eligibility.isEligible;

    return matchesGroup && matchesSearch && matchesEligibility;
  });

  // ডাইনামিক কাউন্টার স্ট্যাটস ক্যালকুলেশন
  const totalDonorsCount = donors.length;
  const totalDonationsCount = donors.reduce((acc, d) => acc + (d.activity_count || 0), 0);
  const readyTodayCount = donors.filter(d => checkEligibility(d.last_donation_date, d.gender).isEligible).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* হেডার ডিজাইন */}
      <header className="bg-red-600 text-white text-center py-8 shadow-lg px-4 relative">
        <div className="flex flex-col items-center justify-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain rounded-full bg-white p-1 shadow-md" />
          <h1 className="text-3xl font-black tracking-wide flex items-center gap-2 justify-center">🩸 ব্লাড সেন্টার নদোনা নোয়াখালী</h1>
          <p className="text-sm text-red-100 font-medium flex items-center gap-1 justify-center bg-red-700/50 px-3 py-1 rounded-full">📍 ঠিকানা: নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী</p>
        </div>
        
        <div className="absolute top-4 right-4">
          {!isAdmin ? (
            <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="bg-red-700 hover:bg-red-800 text-sm font-bold px-4 py-2 rounded-xl text-white flex items-center gap-1 shadow">
              ⚙️ অ্যাডমিন প্যানেল
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowPassModal(true)} className="bg-blue-700 text-sm font-bold px-4 py-2 rounded-xl text-white flex items-center gap-1 shadow">🔑 পাসওয়ার্ড পরিবর্তন</button>
              <button onClick={() => setIsAdmin(false)} className="bg-slate-800 text-sm font-bold px-4 py-2 rounded-xl text-white flex items-center gap-1 shadow">🚪 লগআউট</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">

        {/* অ্যাডমিন লগইন ফর্ম */}
        {showAdminLogin && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100">
            <h3 className="text-xl font-bold text-red-600 mb-4 text-center flex items-center justify-center gap-2">🔐 অ্যাডমিন লগইন ভেরিফিকেশন</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">👤</span>
                <input type="text" placeholder="ইউজার আইডি দিন" value={userId} onChange={e => setUserId(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-xl text-base focus:outline-red-500" required />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">🔒</span>
                <input type="password" placeholder="গোপন পাসওয়ার্ড দিন" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-xl text-base focus:outline-red-500" required />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md">⚡ লগইন ভেরিফাই করুন</button>
            </form>
          </div>
        )}

        {/* ভলান্টিয়ার মোবাইল নম্বর ডাটা আনলক প্যানেল */}
        {!isAdmin && (
          <div className="bg-white p-5 rounded-2xl shadow border border-slate-200">
            {isUnlocked ? (
              <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200">
                <span className="text-base font-bold text-green-700 flex items-center gap-1.5">🟢 ডাটা সফলভাবে আনলক আছে ({volunteerPhone})</span>
                <button onClick={handleLockData} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1">🔒 লক করুন</button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerUnlock} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">📱</span>
                  <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নম্বর দিন" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-xl text-base focus:outline-red-500" required />
                </div>
                <button type="submit" className="bg-slate-800 text-white px-5 rounded-xl font-bold text-sm hover:bg-slate-900 flex items-center gap-1 shadow">🔓 আনলক</button>
              </form>
            )}
          </div>
        )}

        {/* ভলান্টিয়ার কন্ট্রোল প্যানেল (অ্যাডমিন) */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-blue-600 space-y-4">
            <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">👥 ভলান্টিয়ার কন্ট্রোল প্যানেল</h3>
            <form onSubmit={handleAddVolunteer} className="space-y-3 bg-slate-50 p-4 rounded-xl border">
              <p className="text-sm font-bold text-slate-600 flex items-center gap-1">➕ নতুন ভলান্টিয়ার অনুমোদন দিন:</p>
              <div className="grid grid-cols-1 gap-2">
                <input type="text" placeholder="ভলান্টিয়ারের নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base" required />
                <input type="tel" placeholder="সক্রিয় মোবাইল নম্বর" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold text-base flex items-center justify-center gap-1 shadow">💾 ভলান্টিয়ার লিস্টে যুক্ত করুন</button>
            </form>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {volunteers.map(v => (
                <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border text-base">
                  <div>
                    <p className="font-bold text-slate-800">🛡️ {v.name}</p>
                    <p className="text-sm text-slate-500">📞 {v.phone} {v.is_active ? '' : '(🚫 ব্লকড)'}</p>
                  </div>
                  <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`px-3 py-2 rounded-xl font-bold text-sm text-white ${v.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                    {v.is_active ? '🚫 ব্লক' : '🔓 আনব্লক'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* জরুরি রক্তের লাইভ নোটিশ বোর্ড */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-500 space-y-4">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 animate-pulse">📢 জরুরি রক্তের লাইভ নোটিশ বোর্ড</h2>
          {isAdmin && (
            <form onSubmit={handleAddRequest} className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
              <p className="text-sm font-bold text-red-600">📝 নতুন জরুরি নোটিশ পোস্ট করুন:</p>
              <input type="text" placeholder="রোগীর নাম" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base" required />
              <div className="grid grid-cols-2 gap-2">
                <select value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base bg-white">
                  {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input type="tel" placeholder="যোগাযোগের নম্বর" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base" required />
              </div>
              <input type="text" placeholder="হাসপাতালের নাম ও সম্পূর্ণ ঠিকানা" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base" required />
              <input type="text" placeholder="কখন রক্ত লাগবে" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base" required />
              <button type="submit" className="w-full bg-red-600 text-white p-3 rounded-xl font-bold text-base flex items-center justify-center shadow">🚀 লাইভ বোর্ড আপডেট করুন</button>
            </form>
          )}
          <div className="space-y-3">
            {emergencyRequests.length === 0 ? (
              <p className="text-center text-base text-slate-400 py-4">ℹ️ বর্তমানে কোনো জরুরি রক্তের রিকোয়েস্ট নেই।</p>
            ) : (
              emergencyRequests.map(req => (
                <div key={req.id} className="border-2 border-red-200 bg-red-50/40 p-5 rounded-2xl relative shadow-sm">
                  <span className="absolute top-4 right-4 bg-red-600 text-white text-base font-black px-3 py-1 rounded-full">🩸 {req.blood_group}</span>
                  <h4 className="font-bold text-lg text-slate-800">👤 রোগী: {req.patient_name}</h4>
                  <p className="text-base text-slate-600 mt-1">🏥 স্থান: {req.hospital}</p>
                  <p className="text-base text-red-600 font-bold mt-1">⏰ সময়: {req.needed_time}</p>
                  <a href={`tel:${req.phone}`} className="mt-4 block w-full text-center bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-base shadow">📞 সরাসরি কল দিন</a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* মডার্ন অনুসন্ধান ও যোগ্যতা ফিল্টারিং প্যানেল */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">🔍 রক্তদাতা অনুসন্ধান প্যানেল</h2>
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">🔎</span>
              <input type="text" placeholder="নাম, গ্রাম বা ইউনিয়ন দিয়ে খুঁজুন" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-2xl shadow-sm text-base focus:outline-red-500" />
            </div>
            {/* যোগ্যতা নির্ণয়কারী ফিল্টার ড্রপডাউন */}
            <select value={eligibilityFilter} onChange={e => setEligibilityFilter(e.target.value)} className="w-full border-2 p-3 rounded-2xl shadow-sm text-base bg-white font-bold text-slate-700 focus:outline-red-500">
              <option value="All">📊 সকল দাতা (ডাটাবেজে থাকা সবাই)</option>
              <option value="Eligible">🟢 যোগ্য দাতা (যারা এই মুহূর্তে রক্তদানে প্রস্তুত)</option>
              <option value="Ineligible">🟡 সাময়িক অযোগ্য দাতা (যাদের নির্দিষ্ট সময় পার হয়নি)</option>
            </select>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-2 max-w-full">
            {bloodGroups.map(group => (
              <button key={group} onClick={() => setSelectedGroup(group)} className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap shadow-sm transition-all ${selectedGroup === group ? 'bg-red-600 text-white' : 'bg-white border-2 text-slate-600 hover:bg-slate-100'}`}>
                🅰️ {group === 'All' ? 'সব গ্রুপ' : group}
              </button>
            ))}
          </div>
        </div>

        {/* মডার্ন রক্তদাতা কার্ড ডিরেক্টরি তালিকা */}
        <div className="space-y-4">
          {filteredDonors.length === 0 ? (
            <p className="text-center text-base text-slate-400 py-10 bg-white rounded-2xl shadow">📭 এই ফিল্টারিংয়ে কোনো রক্তদাতা পাওয়া যায়নি।</p>
          ) : (
            filteredDonors.map(donor => {
              const elg = checkEligibility(donor.last_donation_date, donor.gender);
              return (
                <div key={donor.id} className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 space-y-4 relative">
                  
                  {/* CARD HEADER */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center shadow-inner">{donor.blood_group}</span>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">👤 {donor.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">📍 {donor.village}, {donor.union}, {donor.upazila}</p>
                      </div>
                    </div>
                    {/* লিজেন্ড/হিরো ব্যাজ লজিক */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${donor.activity_count >= 10 ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {donor.activity_count >= 10 ? '👑 লিজেন্ড' : '⭐ হিরো'}
                    </span>
                  </div>

                  {/* রক্তদাতার লাইভ যোগ্যতা স্ট্যাটাস স্ট্রিপ */}
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${elg.isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    ⚖️ স্ট্যাটাস: {elg.statusText}
                  </div>

                  {/* গ্রে কালারের মডার্ন অ্যাকশন বাটন প্যানেল */}
                  <div className="bg-slate-100 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      📱 {isUnlocked || isAdmin ? donor.phone : 'XXXXXXXXXXX'}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* সংশোধন বাটন */}
                      <button onClick={() => handleEditDonor(donor)} title="তথ্য সংশোধন" className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg shadow-sm font-bold text-sm flex items-center justify-center">
                        🖊️
                      </button>
                      {/* ডিলিট বাটন (শুধু অ্যাডমিন) */}
                      {isAdmin && (
                        <button onClick={() => handleDeleteDonor(donor.id)} title="তথ্য ডিলিট" className="p-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg shadow-sm font-bold text-sm flex items-center justify-center">
                          🗑️
                        </button>
                      )}
                      {/* কপি বাটন */}
                      <button onClick={() => handleCopyDonorInfo(donor)} title="তথ্য কপি" className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm font-bold text-sm flex items-center justify-center">
                        📄
                      </button>
                      {/* সরাসরি কল বাটন */}
                      {(isUnlocked || isAdmin) ? (
                        <a href={`tel:${donor.phone}`} title="সরাসরি কল করুন" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm font-bold text-sm flex items-center justify-center">
                          📞
                        </a>
                      ) : (
                        <button onClick={() => alert('মোবাইল নম্বর দেখতে ও কল করতে ভলান্টিয়ার নম্বর দিয়ে ডাটা আনলক করুন।')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed">
                          🔒
                        </button>
                      )}
                    </div>
                  </div>

                  {/*カードের ফুটারে পরিসংখ্যান */}
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed">
                    <span className="font-bold text-red-600">📊 মোট দান: {donor.activity_count || 0} বার</span>
                    <span className="text-slate-500 font-medium">📅 সর্বশেষ দান: {donor.last_donation_date || 'কখনো দেওয়া হয়নি'}</span>
                  </div>

                  {/* অ্যাডমিনের ডোনেশন প্লাস ওয়ান বাটন */}
                  {isAdmin && (
                    <button onClick={() => handleIncrementActivity(donor.id, donor.activity_count || 0)} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-xl font-bold text-xs shadow mt-2">
                      ➕ রক্তদানের সংখ্যা ১ বার বৃদ্ধি করুন (+1)
                    </button>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* ১০টি ডাইনামিক ফিল্ড সমৃদ্ধ আধুনিক রক্তদাতা নিবন্ধন ফরম */}
        <div id="register-section" className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-green-500 space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-black text-green-600 flex items-center justify-center gap-1.5">🩸 রক্তদাতা নিবন্ধন ফরম</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">আপনার সঠিক তথ্য দিয়ে মানবসেবায় এগিয়ে আসুন</p>
          </div>
          
          <form onSubmit={handleRegisterDonor} className="space-y-4">
            
            {/* ১. সম্পূর্ণ নাম */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-1">✍️ রক্তদাতার সম্পূর্ণ নাম *</label>
              <input type="text" placeholder="রক্তদাতার নাম লিখুন" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500" required />
            </div>

            {/* ২. মোবাইল নম্বর */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-1">📱 একটি সক্রিয় মোবাইল নম্বর *</label>
              <input type="tel" placeholder="মোবাইল নম্বর লিখুন" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* ৩. ব্লাড গ্রুপ */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-1">🅰️ রক্তের গ্রুপ সিলেক্ট করুন *</label>
                <select value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base bg-white focus:outline-green-500">
                  {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {/* ৮. লিঙ্গ */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-1">⚧️ লিঙ্গ সিলেক্ট করুন *</label>
                <select value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base bg-white focus:outline-green-500">
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="মহিলা">মহিলা</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* ৯. ওজন */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-1">⚖️ আপনার ওজন (কেজি) *</label>
                <input type="number" placeholder="ওজন কেজি" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500" required />
              </div>
              {/* ১০. বয়স */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-1">🎂 আপনার বয়স (বছর) *</label>
                <input type="number" placeholder="বয়স বছর" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500" required />
              </div>
            </div>

            {/* ৪, ৫, ৬. ঠিকানা প্যানেল (ম্যানুয়াল টাইপ করার টেক্সট বক্স এবং আইকন) */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-600">🏡 বর্তমান ঠিকানার বিবরণ:</p>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-0.5">📍 উপজেলা *</label>
                <input type="text" placeholder="উপজেলার নাম লিখুন" value={newDonor.upazila} onChange={e => setNewDonor({...newDonor, upazila: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-0.5">🗺️ ইউনিয়ন *</label>
                  <input type="text" placeholder="ইউনিয়নের নাম" value={newDonor.union} onChange={e => setNewDonor({...newDonor, union: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-0.5">🏡 গ্রাম / এলাকা *</label>
                  <input type="text" placeholder="গ্রামের নাম" value={newDonor.village} onChange={e => setNewDonor({...newDonor, village: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
                </div>
              </div>
            </div>

            {/* ৭. সর্বশেষ রক্তদানের তারিখ */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-1">📅 সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)</label>
              <input type="date" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500" />
              <p className="text-xs text-slate-400 mt-1">নোট: যদি পূর্বে কখনো রক্ত না দিয়ে থাকেন, তবে এই ঘরটি ফাঁকা রাখুন।</p>
            </div>

            {/* রিয়াল-টাইম যোগ্যতা অ্যালার্ট স্ট্রিপ */}
            {newDonor.weight && (
              <div className={`p-4 rounded-xl border font-bold text-base flex items-center gap-2 ${Number(newDonor.weight) >= 45 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {Number(newDonor.weight) >= 45 ? '✅ আপনি রক্তদানের জন্য উপযুক্ত (যোগ্য)' : '❌ রক্তদানের জন্য ন্যূনতম ৪৫ কেজি ওজন প্রয়োজন'}
              </div>
            )}

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-black text-lg shadow-md transition-colors flex items-center justify-center gap-2">
              💾 তথ্য ডাটাবেজে নিরাপদ করুন
            </button>
          </form>
        </div>

        {/* হোম পেজের নিচের ডাইনামিক অর্জন এবং তথ্য বোর্ড */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-800 tracking-wide border-b-2 border-red-500 inline-block pb-1">📊 আমাদের অর্জন</h3>
          </div>
          
          {/* ৪টি মডার্ন ডাইনামিক কাউন্টার গ্রিড */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border text-center shadow-sm">
              <span className="block text-3xl font-black text-red-600">{totalDonorsCount}</span>
              <span className="text-sm font-bold text-slate-500 mt-1 block">নিবন্ধিত রক্তদাতা</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border text-center shadow-sm">
              <span className="block text-3xl font-black text-red-600">{totalDonationsCount}</span>
              <span className="text-sm font-bold text-slate-500 mt-1 block">রক্তদান সম্পন্ন</span>
            </div>
            {/* ডাইনামিক কাউন্টার */}
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-center shadow-sm">
              <span className="block text-3xl font-black text-green-600">{readyTodayCount}</span>
              <span className="text-sm font-bold text-red-700 mt-1 block">আজকে প্রস্তুত</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border text-center shadow-sm">
              <span className="block text-3xl font-black text-red-600">{emergencyRequests.length}</span>
              <span className="text-sm font-bold text-slate-500 mt-1 block">জরুরি অনুরোধ</span>
            </div>
          </div>

          {/* রক্তদানের সুফলের তথ্য কার্ড */}
          <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 flex gap-4">
            <span className="text-3xl bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0">🎗️</span>
            <div>
              <h4 className="font-bold text-lg text-slate-800 mb-1">রক্তদানের সুবিধা</h4>
              <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside font-medium">
                <li>হৃদরোগ ও স্ট্রোকের ঝুঁকি কমাতে সাহায্য করে।</li>
                <li>শরীরে সম্পূর্ণ নতুন রক্তকণিকা তৈরি বৃদ্ধি পায়।</li>
                <li>বিনামূল্যে মৌলিক স্বাস্থ্য পরীক্ষার সুযোগ হয়।</li>
                <li>মানসিক প্রশান্তি ও পরম তৃপ্তি লাভ করা যায়।</li>
              </ul>
            </div>
          </div>

          {/* রক্তদানের শর্তের তথ্য কার্ড */}
          <div className="bg-green-50/40 p-5 rounded-2xl border border-green-100 flex gap-4">
            <span className="text-3xl bg-green-100 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0">📅</span>
            <div>
              <h4 className="font-bold text-lg text-slate-800 mb-1">কখন রক্ত দিতে পারবেন?</h4>
              <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside font-medium">
                <li>পুরুষরা প্রতি ৩ মাস অন্তর রক্ত দিতে পারবেন।</li>
                <li>নারীরা প্রতি ৪ মাস অন্তর রক্ত দিতে পারবেন।</li>
                <li>শারীরিকভাবে সম্পূর্ণ সুস্থ ও নিরোগ শরীর থাকলে।</li>
                <li>রক্তদাতার ওজন কমপক্ষে ৪৫ কেজি বা তার বেশি হলে।</li>
              </ul>
            </div>
          </div>
        </div>

      </main>

      {/* মাস্টার পাসওয়ার্ড পপআপ */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">🔑 সিকিউর পাসওয়ার্ড পরিবর্তন</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" placeholder="মাস্টার কোড (Master Code) দিন" value={masterCode} onChange={e => setMasterCode(e.target.value)} className="w-full border-2 p-3 rounded-xl text-base" required />
              <input type="password" placeholder="নতুন শক্তিশালী পাসওয়ার্ড লিখুন" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl text-base" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-base shadow">🔄 পাসওয়ার্ড আপডেট করুন</button>
                <button type="button" onClick={() => { setShowPassModal(false); setMasterCode(''); }} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-base border">❌ বাতিল করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* প্রফেশনাল ফুটার ও ক্রেডিট */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full">🤝 সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto">
          <span className="text-xs font-medium text-slate-400">⚙️ কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-6 h-6 rounded-full object-cover border shadow-xs" />
          <span className="font-black text-slate-600 text-sm tracking-wide">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
