import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // অ্যাপ স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  
  // ফর্ম স্টেটসমূহ
  const [newDonor, setNewDonor] = useState({ name: '', blood_group: 'A+', phone: '', location: '' });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '' });

  // সিকিউরিটি ও অথেনটিকেশন স্টেট
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
    // পূর্বে ভলান্টিয়ার নম্বর দিয়ে আনলক করা থাকলে অটো-আনলক হবে
    const savedPhone = localStorage.getItem('v_phone');
    if (savedPhone) {
      checkVolunteerAccess(savedPhone);
    }
  }, []);

  // অ্যাডমিন লগইন হলে ভলান্টিয়ারদের তালিকা লোড হবে
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

  // ভলান্টিয়ার মোবাইল নম্বর দিয়ে লক খোলার লজিক
  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    await checkVolunteerAccess(volunteerPhone);
  };

  const checkVolunteerAccess = async (phone) => {
    const { data, error } = await supabase
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

  // ভলান্টিয়ার লগআউট (পুনরায় লক করা)
  const handleLockData = () => {
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    setVolunteerPhone('');
  };

  // নতুন রক্তদাতা নিবন্ধন ফরম সাবমিট
  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.location) return alert('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন');
    
    const { error } = await supabase.from('donors').insert([newDonor]);
    if (error) {
      alert('এই নম্বরটি দিয়ে অলরেডি রেজিস্ট্রেশন করা আছে!');
    } else {
      alert('রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!');
      setNewDonor({ name: '', blood_group: 'A+', phone: '', location: '' });
      fetchDonors();
    }
  };

  // জরুরি রক্ত রিকোয়েস্ট পোস্ট (শুধুমাত্র অ্যাডমিন)
  const handleAddRequest = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('emergency_requests').insert([newRequest]);
    if (!error) {
      alert('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!');
      setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
      fetchRequests();
    }
  };

  // রক্তদানের সংখ্যা বাড়ানো (+1 বাটন)
  const handleIncrementActivity = async (id, currentCount) => {
    if (!isAdmin) return;
    await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id);
    fetchDonors();
  };

  // নতুন ভলান্টিয়ার অনুমোদন দেওয়া (শুধুমাত্র অ্যাডমিন)
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

  // ভলান্টিয়ার ব্লক বা আনব্লক (অ্যাক্টিভ) করার লজিক
  const toggleVolunteerStatus = async (id, currentStatus) => {
    await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id);
    fetchVolunteers();
  };

  // অ্যাডমিন প্যানেল লগইন
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

  // পাসওয়ার্ড পরিবর্তন (মাস্টার কোড BCNN2013 দিয়ে চেক)
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

  // সার্চ ও ব্লাড গ্রুপ ফিল্টারিং সিস্টেম
  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          donor.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* হেডার ডিজাইন */}
      <header className="bg-red-600 text-white text-center py-6 shadow-md px-4 relative">
        <div className="flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow" />
          <h1 className="text-2xl font-bold tracking-wide">ব্লাড সেন্টার নদোনা নোয়াখালী</h1>
          <p className="text-xs text-red-100 font-light flex items-center gap-1 justify-center">📍 ঠিকানা: নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী</p>
        </div>
        
        {/* অ্যাডমিন প্যানেল কন্ট্রোল বাটন */}
        <div className="absolute top-4 right-4">
          {!isAdmin ? (
            <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="bg-red-700 hover:bg-red-800 text-xs px-3 py-1.5 rounded text-white font-medium flex items-center gap-1 shadow">
              ⚙️ অ্যাডমিন প্যানেল
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowPassModal(true)} className="bg-blue-700 text-xs px-3 py-1.5 rounded text-white flex items-center gap-1 shadow">🔑 পাসওয়ার্ড পরিবর্তন</button>
              <button onClick={() => setIsAdmin(false)} className="bg-slate-800 text-xs px-3 py-1.5 rounded text-white flex items-center gap-1 shadow">🚪 লগআউট</button>
            </div>
          )}
        </div>
      </header>

      {/* মোবাইল ফ্রেন্ডলি মেইন লেআউট */}
      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">

        {/* অ্যাডমিন লগইন ফর্ম প্যানেল */}
        {showAdminLogin && (
          <div className="bg-white p-5 rounded-xl shadow border border-red-100">
            <h3 className="text-lg font-bold text-red-600 mb-3 text-center flex items-center justify-center gap-1">🔐 অ্যাডমিন লগইন</h3>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">👤</span>
                <input type="text" placeholder="ইউজার আইডি" value={userId} onChange={e => setUserId(e.target.value)} className="w-full border pl-9 p-2.5 rounded text-sm focus:outline-red-500" />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔒</span>
                <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={e => setPassword(e.target.value)} className="w-full border pl-9 p-2.5 rounded text-sm focus:outline-red-500" />
              </div>
              <button type="submit" className="w-full bg-red-600 text-white p-2.5 rounded font-bold text-sm flex items-center justify-center gap-1 shadow">✅ লগইন করুন</button>
            </form>
          </div>
        )}

        {/* ভলান্টিয়ার মোবাইল নম্বর দিয়ে আনলক বাটন */}
        {!isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
            {isUnlocked ? (
              <div className="flex justify-between items-center bg-green-50 p-2.5 rounded border border-green-200">
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">🟢 ডাটা আনলক আছে ({volunteerPhone})</span>
                <button onClick={handleLockData} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded hover:bg-red-200 flex items-center gap-1">🔒 লক করুন</button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerUnlock} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">📱</span>
                  <input 
                    type="tel" 
                    placeholder="ভলান্টিয়ার মোবাইল নম্বর দিন..." 
                    value={volunteerPhone} 
                    onChange={e => setVolunteerPhone(e.target.value)} 
                    className="w-full border pl-9 p-2 rounded text-sm focus:outline-red-500" 
                    required
                  />
                </div>
                <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded font-bold text-xs hover:bg-slate-900 flex items-center gap-1 shadow">🔓 আনলক</button>
              </form>
            )}
          </div>
        )}

        {/* অ্যাডমিনের ভলান্টিয়ার ম্যানেজমেন্ট কন্ট্রোল (ব্লক/আনব্লক করার সম্পূর্ণ অপশন সহ) */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-600 space-y-4">
            <h3 className="text-lg font-bold text-blue-600 flex items-center gap-1.5">👥 ভলান্টিয়ার কন্ট্রোল প্যানেল</h3>
            
            {/* নতুন ভলান্টিয়ার যোগ করার ফরম */}
            <form onSubmit={handleAddVolunteer} className="space-y-2 bg-slate-50 p-3 rounded border">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">➕ নতুন ভলান্টিয়ার অনুমোদন দিন:</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="ভলান্টিয়ারের নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} className="border p-2 rounded text-xs" required />
                <input type="tel" placeholder="মোবাইল নম্বর" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} className="border p-2 rounded text-xs" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-xs font-bold flex items-center justify-center gap-1 shadow">💾 ভলান্টিয়ার যুক্ত করুন</button>
            </form>

            {/* ভলান্টিয়ারদের তালিকা ও ব্লক/আনব্লক বাটন */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {volunteers.map(v => (
                <div key={v.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-xs">
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <div>
                      <p className="font-bold">{v.name}</p>
                      <p className="text-slate-500">📞 {v.phone} {v.is_active ? '' : '(🚫 ব্লকড)'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleVolunteerStatus(v.id, v.is_active)} 
                    className={`px-3 py-1.5 rounded font-bold text-white shadow-sm flex items-center gap-0.5 transition-colors ${v.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {v.is_active ? '🚫 ব্লক করুন' : '🔓 আনব্লক করুন'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* লাইভ জরুরি রক্তের নোটিশ বোর্ড */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-red-500 space-y-4">
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-1.5 animate-pulse">📢 জরুরি রক্তের লাইভ নোটিশ বোর্ড</h2>
          
          {/* নোটিশ ইনপুট ফরম (শুধু অ্যাডমিন দেখবে) */}
          {isAdmin && (
            <form onSubmit={handleAddRequest} className="bg-red-50 p-3 rounded-lg border border-red-100 space-y-2">
              <p className="text-xs font-bold text-red-500 flex items-center gap-1">📝 নতুন জরুরি নোটিশ লিখুন:</p>
              <input type="text" placeholder="রোগীর নাম" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} className="w-full border p-2 rounded text-xs" required />
              <div className="grid grid-cols-2 gap-2">
                <select value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})} className="border p-2 rounded text-xs bg-white">
                  {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input type="tel" placeholder="যোগাযোগের নম্বর" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="border p-2 rounded text-xs" required />
              </div>
              <input type="text" placeholder="হাসপাতালের নাম ও ঠিকানা" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="w-full border p-2 rounded text-xs" required />
              <input type="text" placeholder="কখন রক্ত লাগবে (উদা: আজ বিকেল ৪টা)" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} className="w-full border p-2 rounded text-xs" required />
              <button type="submit" className="w-full bg-red-600 text-white p-2 rounded text-xs font-bold flex items-center justify-center gap-1 shadow">🚀 পোস্ট করুন</button>
            </form>
          )}

          {/* নোটিশカードের তালিকা */}
          <div className="space-y-3">
            {emergencyRequests.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4 flex items-center justify-center gap-1">ℹ️ বর্তমানে কোনো জরুরি রক্তের রিকোয়েস্ট নেই।</p>
            ) : (
              emergencyRequests.map(req => (
                <div key={req.id} className="border-2 border-red-200 bg-red-50/40 p-4 rounded-xl relative shadow-sm">
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">🩸 {req.blood_group}</span>
                  <h4 className="font-bold text-sm text-slate-800">👤 রোগী: {req.patient_name}</h4>
                  <p className="text-xs text-slate-600 mt-1">🏥 স্থান: {req.hospital}</p>
                  <p className="text-xs text-red-600 font-medium mt-0.5">⏰ সময়: {req.needed_time}</p>
                  <a href={`tel:${req.phone}`} className="mt-3 block w-full text-center bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 flex items-center justify-center gap-1 shadow">📞 সরাসরি কল দিন</a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* সার্চ এবং ব্লাড ফিল্টার সেকশন */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-1.5 text-slate-700">🔍 রক্তদাতা খুঁজুন</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔎</span>
              <input 
                type="text" 
                placeholder="নাম বা ইউনিয়ন/গ্রাম দিয়ে খুঁজুন..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border pl-9 p-2.5 rounded-xl shadow-sm text-sm focus:outline-red-500"
              />
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
            {bloodGroups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-all flex items-center gap-0.5 ${selectedGroup === group ? 'bg-red-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
              >
                🅰️ {group === 'All' ? 'সব গ্রুপ' : group}
              </button>
            ))}
          </div>
        </div>

        {/* রক্তদাতাদের মূল ডাইরেক্টরি তালিকা */}
        <div className="space-y-3">
          {filteredDonors.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8 bg-white rounded-xl shadow flex items-center justify-center gap-1">📭 এই গ্রুপের কোনো রক্তদাতা পাওয়া যায়নি।</p>
          ) : (
            filteredDonors.map(donor => (
              <div key={donor.id} className="bg-white p-4 rounded-xl shadow border border-slate-100 flex justify-between items-center">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center shadow-inner">{donor.blood_group}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{donor.name}</h4>
                      <p className="text-xs text-slate-500">📍 {donor.location}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    {/* সিকিউরিটি কন্ডিশন: ভলান্টিয়ার মোবাইল নম্বর দিয়ে আনলক করলে অথবা মূল অ্যাডমিন থাকলে নম্বর দেখা যাবে */}
                    {isUnlocked || isAdmin ? (
                      <a href={`tel:${donor.phone}`} className="inline-block bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 shadow-sm">
                        📞 কল করুন ({donor.phone})
                      </a>
                    ) : (
                      <span className="inline-block bg-slate-100 text-slate-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed flex items-center gap-1 max-w-fit">
                        🔒 নম্বর দেখতে আনলক করুন
                      </span>
                    )}
                  </div>
                </div>

                {/* ডোনেশন ট্র্যাকিং কাউন্টার */}
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 flex items-center gap-0.5">
                    🩸 ডোনেশন: {donor.activity_count} বার
                  </span>
                  {isAdmin && (
                    <button 
                      onClick={() => handleIncrementActivity(donor.id, donor.activity_count)}
                      className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-slate-900 shadow-sm mt-1 flex items-center gap-0.5"
                    >
                      ➕ কাজ যোগ করুন
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* সাধারণ রক্তদাতাদের জন্য নাম নিবন্ধনের খোলা ফরম */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-green-500 space-y-4">
          <h2 className="text-lg font-bold text-green-600 flex items-center gap-1.5">🩸 নতুন রক্তদাতা হিসেবে নাম লেখান</h2>
          <form onSubmit={handleRegisterDonor} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">📝 আপনার নাম *</label>
              <input type="text" placeholder="উদা: মোহাম্মদ আলী" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:outline-green-500" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">🅰️ ব্লাড গ্রুপ *</label>
                <select value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-green-500">
                  {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">📱 মোবাইল নম্বর *</label>
                <input type="tel" placeholder="০১৭XXXXXXXX" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:outline-green-500" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">🏡 ঠিকানা (গ্রাম এবং ইউনিয়ন) *</label>
              <input type="text" placeholder="উদা: নদোনা, সোনাইমুড়ী" value={newDonor.location} onChange={e => setNewDonor({...newDonor, location: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:outline-green-500" required />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-xl font-bold text-sm shadow hover:bg-green-700 flex items-center justify-center gap-1">🎯 নিবন্ধন সম্পন্ন করুন</button>
          </form>
        </div>

      </main>

      {/* মাস্টার পাসওয়ার্ড পরিবর্তনের হিডেন পপআপ */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-5 rounded-xl max-w-sm w-full space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1">🔑 পাসওয়ার্ড পরিবর্তন করুন</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" placeholder="🛠️ মাস্টার কোড (Master Code) দিন" value={masterCode} onChange={e => setMasterCode(e.target.value)} className="w-full border p-2 rounded text-sm" required />
              <input type="password" placeholder="🔒 নতুন শক্তিশালী পাসওয়ার্ড" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded text-sm" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-0.5 shadow">💾 আপডেট</button>
                <button type="button" onClick={() => { setShowPassModal(false); setMasterCode(''); }} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded text-xs font-bold flex items-center justify-center gap-0.5 border">❌ বাতিল</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ব্র্যান্ডিং ও প্রফেশনাল ফুটার সেকশন */}
      <footer className="text-center text-xs text-slate-400 mt-12 space-y-1">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা। সর্বস্বত্ব সংরক্ষিত।</p>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="text-[10px]">🛠️ কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-5 h-5 rounded-full object-cover border" />
          <span className="font-bold text-slate-500 text-[10px]">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
