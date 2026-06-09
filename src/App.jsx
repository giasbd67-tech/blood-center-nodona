import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('home'); // home, register, login, dashboard, change_password
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ডাটা স্টেট
  const [donors, setDonors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('All');

  // ফরম ইনপুট স্টেট
  const [inputPassword, setInputPassword] = useState('');
  const [donorForm, setDonorForm] = useState({ name: '', blood_group: 'A+', phone: '', location: '', activity_count: 0 });
  const [emergencyForm, setEmergencyForm] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [passwordForm, setPasswordForm] = useState({ master_code: '', new_password: '' });

  // নির্দিষ্ট সিক্রেট কোডসমূহ
  const FIXED_USER_ID = "BloodCenterNN";
  const MASTER_CODE = "BCNN2013";
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  useEffect(() => {
    fetchDonors();
    fetchEmergencies();
    const savedSession = localStorage.getItem('bcnn_logged_in');
    if (savedSession === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const fetchDonors = async () => {
    const { data } = await supabase.from('donors').select('*').order('created_at', { ascending: false });
    if (data) setDonors(data);
  };

  const fetchEmergencies = async () => {
    const { data } = await supabase.from('emergency_requests').select('*').order('created_at', { ascending: false });
    if (data) setEmergencies(data);
  };

  // লগইন প্রসেস
  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase
      .from('app_auth')
      .select('*')
      .eq('user_id', FIXED_USER_ID)
      .eq('password', inputPassword.trim())
      .single();

    if (data) {
      setIsLoggedIn(true);
      localStorage.setItem('bcnn_logged_in', 'true');
      setView('dashboard');
      setInputPassword('');
    } else {
      alert('❌ ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
    }
  };

  // পাসওয়ার্ড পরিবর্তন
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.master_code !== MASTER_CODE) {
      alert('❌ ভুল মাস্টার কোড! পাসওয়ার্ড পরিবর্তন করার অনুমতি নেই।');
      return;
    }

    const { data } = await supabase
      .from('app_auth')
      .update({ password: passwordForm.new_password.trim() })
      .eq('user_id', FIXED_USER_ID)
      .select();

    if (data && data.length > 0) {
      alert('✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
      setIsLoggedIn(false);
      localStorage.removeItem('bcnn_logged_in');
      setView('login');
      setPasswordForm({ master_code: '', new_password: '' });
    } else {
      alert('❌ সমস্যা হয়েছে। ডাটাবেজ চেক করুন।');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('bcnn_logged_in');
    setView('home');
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('donors').insert([donorForm]);
    if (!error) {
      alert('✅ রক্তদাতা সফলভাবে নিবন্ধিত হয়েছেন!');
      setDonorForm({ name: '', blood_group: 'A+', phone: '', location: '', activity_count: 0 });
      fetchDonors();
      if (!isLoggedIn) setView('home');
    } else {
      alert('❌ এই নম্বরটি ইতিমধ্যে ডাটাবেজে রয়েছে।');
    }
  };

  const handleAddEmergency = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('emergency_requests').insert([emergencyForm]);
    if (!error) {
      alert('🚀 জরুরি রক্তের রিকোয়েস্টটি বোর্ডে পোস্ট হয়েছে!');
      setEmergencyForm({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
      fetchEmergencies();
    }
  };

  const incrementActivity = async (id, currentCount) => {
    const { error } = await supabase
      .from('donors')
      .update({ activity_count: (currentCount || 0) + 1 })
      .eq('id', id);
    if (!error) fetchDonors();
  };

  const filteredDonors = selectedGroup === 'All' ? donors : donors.filter(d => d.blood_group === selectedGroup);

  return (
    <div className="min-h-screen bg-slate-50 font-bengali text-slate-800 flex flex-col justify-between">
      <div>
        {/* নতুন হেডার সেকশন (আপনার দেওয়া নতুন হেডলাইন ও ঠিকানা সহ) */}
        <header className="bg-gradient-to-r from-red-800 to-red-700 text-white text-center py-6 px-4 shadow-md flex flex-col items-center">
          <img src="/logo.png" alt="ব্লাড সেন্টার নদোনা নোয়াখালী" className="w-16 h-16 rounded-full border-2 border-white mb-2 shadow-md object-cover bg-white" />
          <h1 className="text-2xl font-bold tracking-wide flex items-center gap-1">🩸 ব্লাড সেন্টার নদোনা নোয়াখালী</h1>
          <p className="text-xs mt-1 opacity-95 flex items-center gap-1 font-medium">📍 ঠিকানা: নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী।</p>
          <span className="text-[10px] mt-1 bg-red-900/50 px-2 py-0.5 rounded-full border border-red-600/30">📅 স্থাপিত: ২০১৩ ইং</span>
        </header>

        {/* ডিজিটাল আইকনযুক্ত নেভিগেশন মেনু */}
        <nav className="bg-white border-b border-slate-200 flex justify-center p-2 space-x-2 shadow-xs overflow-x-auto">
          <button onClick={() => setView('home')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${view === 'home' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            🏠 হোম ও তালিকা
          </button>
          <button onClick={() => setView('register')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${view === 'register' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            📝 নতুন রক্তদাতা নিবন্ধন
          </button>
          {isLoggedIn ? (
            <>
              <button onClick={() => setView('dashboard')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${view === 'dashboard' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                📊 ড্যাশবোর্ড প্যানেল
              </button>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center gap-1">
                🚪 লগআউট
              </button>
            </>
          ) : (
            <button onClick={() => setView('login')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${view === 'login' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              🔐 লগইন
            </button>
          )}
        </nav>

        {/* মূল কনটেন্ট এরিয়া */}
        <main className="p-4 max-w-5xl mx-auto w-full">
          
          {/* ১. হোম ভিউ */}
          {view === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* লাইভ নোটিশ বোর্ড */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-2xl border border-red-200 shadow-xs">
                  <h2 className="text-sm font-bold text-red-800 flex items-center gap-1.5 mb-3">📢 লাইভ জরুরি রক্তের নোটিশ</h2>
                  <div className="space-y-3">
                    {emergencies.length === 0 ? (
                      <p className="text-xs text-red-700 flex items-center gap-1">ℹ️ বর্তমানে কোনো জরুরি রক্তের নোটিশ নেই।</p>
                    ) : (
                      emergencies.map(e => (
                        <div key={e.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-3xs">
                          <div className="flex justify-between items-start">
                            <span className="bg-red-700 text-white font-bold text-xs px-2 py-0.5 rounded shadow-3xs">🩸 {e.blood_group}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">⏱️ {e.needed_time}</span>
                          </div>
                          <p className="text-xs font-bold mt-2 text-slate-800 flex items-center gap-1">👤 রোগী: {e.patient_name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">🏥 স্থান: {e.hospital}</p>
                          <a href={`tel:${e.phone}`} className="mt-3 text-center text-[11px] bg-red-600 hover:bg-red-700 text-white py-1.5 rounded font-bold block transition shadow-3xs flex items-center justify-center gap-1">
                            📞 সরাসরি কল দিন
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* রক্তদাতা ডিরেক্টরি */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">🔍 গ্রুপ ফিল্টার করে রক্তদাতা খুঁজুন:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setSelectedGroup('All')} className={`px-2.5 py-1 text-xs font-bold rounded transition flex items-center gap-1 ${selectedGroup === 'All' ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      👥 সবাই ({donors.length})
                    </button>
                    {bloodGroups.map(group => {
                      const count = donors.filter(d => d.blood_group === group).length;
                      return (
                        <button key={group} onClick={() => setSelectedGroup(group)} className={`px-2.5 py-1 text-xs font-bold rounded transition ${selectedGroup === group ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          🩸 {group} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-base font-bold mb-4 flex justify-between items-center border-b pb-2">
                    <span className="flex items-center gap-1">📋 রক্তদাতাদের কেন্দ্রীয় তালিকা</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal flex items-center gap-1">🔢 ফিল্টার্ড: {filteredDonors.length} জন</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredDonors.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 col-span-2 text-center flex items-center justify-center gap-1">⚠️ এই গ্রুপের কোনো রক্তদাতা এখনো নিবন্ধিত হয়নি।</p>
                    ) : (
                      filteredDonors.map(donor => (
                        <div key={donor.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center hover:border-slate-300 transition">
                          <div>
                            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1">👤 {donor.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">📍 {donor.location}</p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">❤️ রক্ত দিয়েছেন: {donor.activity_count || 0} বার</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="w-7 h-7 flex items-center justify-center bg-red-100 text-red-700 font-bold text-xs rounded-full shadow-3xs">{donor.blood_group}</span>
                            <a href={`tel:${donor.phone}`} className="text-[11px] bg-white border border-slate-200 hover:border-red-500 text-slate-700 font-bold px-2 py-0.5 rounded shadow-3xs transition flex items-center gap-0.5">
                              📞 কল দিন
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ২. নতুন নিবন্ধন ভিউ */}
          {view === 'register' && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-red-700 mb-4 text-center flex items-center justify-center gap-1">📝 নতুন রক্তদাতা ফরম</h2>
              <form onSubmit={handleAddDonor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 flex items-center gap-1">👤 রক্তদাতার নাম</label>
                  <input type="text" required value={donorForm.name} onChange={e => setDonorForm({...donorForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="পূর্ণ নাম লিখুন" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 flex items-center gap-1">🩸 রক্তের গ্রুপ</label>
                    <select value={donorForm.blood_group} onChange={e => setDonorForm({...donorForm, blood_group: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                      {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 flex items-center gap-1">📱 মোবাইল নম্বর</label>
                    <input type="tel" required value={donorForm.phone} onChange={e => setDonorForm({...donorForm, phone: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="০১৭XXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 flex items-center gap-1">📍 ঠিকানা (ইউনিয়ন/গ্রাম)</label>
                  <input type="text" required value={donorForm.location} onChange={e => setDonorForm({...donorForm, location: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="নদোনা, সোনাইমুড়ী" />
                </div>
                <button type="submit" className="w-full bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition hover:bg-red-800 shadow flex items-center justify-center gap-1">
                  💾 নিবন্ধন সম্পন্ন করুন
                </button>
              </form>
            </div>
          )}

          {/* ৩. লগইন প্যানেল */}
          {view === 'login' && (
            <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-red-700 text-center mb-6 flex items-center justify-center gap-1">🔐 ম্যানেজমেন্ট প্যানেল লগইন</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 flex items-center gap-1">🆔 ইউজার আইডি</label>
                  <input type="text" value={FIXED_USER_ID} disabled className="w-full p-2.5 border rounded-lg text-sm bg-slate-100 font-mono text-slate-600 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 flex items-center gap-1">🔑 পাসওয়ার্ড দিন</label>
                  <input type="password" required value={inputPassword} onChange={e => setInputPassword(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 font-mono" placeholder="******" />
                </div>
                <button type="submit" className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg shadow transition flex items-center justify-center gap-1">
                  🔓 লগইন করুন
                </button>
              </form>
              <div className="mt-6 pt-4 border-t text-center text-xs">
                <button onClick={() => setView('change_password')} className="text-amber-700 font-bold underline flex items-center justify-center gap-1 mx-auto">
                  🔄 পাসওয়ার্ড পরিবর্তন করতে চান?
                </button>
              </div>
            </div>
          )}

          {/* ৪. পাসওয়ার্ড পরিবর্তন প্যানেল */}
          {view === 'change_password' && (
            <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-amber-700 text-center mb-2 flex items-center justify-center gap-1">🔑 পাসওয়ার্ড রিসেট প্যানেল</h2>
              <p className="text-[11px] text-center text-slate-400 mb-6 font-mono">🆔 User ID: {FIXED_USER_ID}</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 flex items-center gap-1">⚙️ মাস্টার ভেরিফিকেশন কোড (Master Code)</label>
                  <input type="password" required value={passwordForm.master_code} onChange={e => setPasswordForm({...passwordForm, master_code: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm border-amber-300 focus:ring-2 focus:ring-amber-500 font-mono" placeholder="সিক্রেট মাস্টার কোড দিন" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 flex items-center gap-1">🔒 নতুন পাসওয়ার্ড (New Password)</label>
                  <input type="password" required value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm font-mono" placeholder="নতুন পাসওয়ার্ড লিখুন" />
                </div>
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg shadow transition flex items-center justify-center gap-1">
                  💾 পাসওয়ার্ড আপডেট করুন
                </button>
              </form>
              <button onClick={() => setView('login')} className="w-full mt-4 text-center text-xs text-slate-500 underline flex items-center justify-center gap-1">
                ⬅️ লগইন পেজে ফিরে যান
              </button>
            </div>
          )}

          {/* ৫. ড্যাশবোর্ড ভিউ */}
          {isLoggedIn && view === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {/* নোটিশ ইনপুট ফর্ম */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-sm font-bold text-amber-800 mb-3 border-b pb-1.5 flex items-center gap-1">📢 জরুরি রক্তের নোটিশ দিন</h2>
                  <form onSubmit={handleAddEmergency} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5 flex items-center gap-0.5">👤 রোগীর নাম ও বিবরণ</label>
                      <input type="text" required value={emergencyForm.patient_name} onChange={e => setEmergencyForm({...emergencyForm, patient_name: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="যেমন: রহিমা বেগম, সিজারিয়ান অপারেশন" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 flex items-center gap-0.5">🩸 রক্ত গ্রুপ</label>
                        <select value={emergencyForm.blood_group} onChange={e => setEmergencyForm({...emergencyForm, blood_group: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-white">
                          {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 flex items-center gap-0.5">📱 মোবাইল</label>
                        <input type="tel" required value={emergencyForm.phone} onChange={e => setEmergencyForm({...emergencyForm, phone: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="যোগাযোগের নম্বর" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5 flex items-center gap-0.5">🏥 হাসপাতাল বা স্থান</label>
                      <input type="text" required value={emergencyForm.hospital} onChange={e => setEmergencyForm({...emergencyForm, hospital: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="যেমন: সোনাইমুড়ী জেনারেল হাসপাতাল" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5 flex items-center gap-0.5">⏱️ কখন লাগবে (সময়)</label>
                      <input type="text" required value={emergencyForm.needed_time} onChange={e => setEmergencyForm({...emergencyForm, needed_time: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="যেমন: আজ বিকেল ৪টায়" />
                    </div>
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg shadow transition flex items-center justify-center gap-1">
                      🚀 বোর্ডে পাবলিশ করুন
                    </button>
                  </form>
                </div>
              </div>

              {/* ট্র্যাকিং ও কন্ট্রোল */}
              <div className="md:col-span-2">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-base font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-1">⚙️ কেন্দ্রীয় রক্তদাতা কন্ট্রোল ও কার্যক্রম ট্র্যাকিং</h2>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {donors.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 flex items-center justify-center gap-1">ℹ️ কোনো রক্তদাতা নিবন্ধিত নেই।</p>
                    ) : (
                      donors.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs hover:border-slate-300 transition">
                          <div>
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1">👤 {d.name} <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded text-[10px]">{d.blood_group}</span></span>
                            <p className="text-[11px] text-slate-500 mt-0.5">📱 {d.phone} | 📍 {d.location}</p>
                            <p className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">❤️ রক্তদানের মোট সংখ্যা: {d.activity_count || 0} বার</p>
                          </div>
                          <button onClick={() => incrementActivity(d.id, d.activity_count)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-3xs transition flex items-center gap-0.5">
                            ➕ কাজ যোগ করুন
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ব্র্যান্ডিং ও ছবির ফুটার সেকশন */}
      <footer className="bg-slate-900 text-slate-400 text-center py-5 border-t border-slate-800 text-xs mt-12">
        <p className="font-bold text-slate-300 text-sm flex items-center justify-center gap-1">🤝 সার্বিক সহযোগিতায়ঃ মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <p className="mt-2 text-[11px] flex items-center justify-center">
          <span className="text-slate-500 mr-2">কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="গিয়াস উদ্দিন" className="w-5 h-5 rounded-full mr-1.5 object-cover border border-slate-700 shadow-sm" />
          <span className="font-bold text-red-500">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </p>
      </footer>
    </div>
  );
}
