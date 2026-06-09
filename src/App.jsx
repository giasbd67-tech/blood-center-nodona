import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('home'); 
  const [donors, setDonors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('All');

  // সেশন স্টেট
  const [activeVolunteer, setActiveVolunteer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ফর্ম স্টেট
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  const [donorForm, setDonorForm] = useState({ name: '', blood_group: 'A+', phone: '', location: '', email: '', password: '' });
  const [emergencyForm, setEmergencyForm] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  useEffect(() => {
    fetchDonors();
    fetchEmergencies();
  }, []);

  const fetchDonors = async () => {
    const { data } = await supabase.from('donors').select('*').order('id', { ascending: false });
    if (data) setDonors(data);
  };

  const fetchEmergencies = async () => {
    const { data } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
    if (data) setEmergencies(data);
  };

  // ভলান্টিয়ার লগইন
  const handleVolunteerLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('donors').select('*').eq('email', loginEmail).eq('password', loginPassword).single();
    if (data) {
      setActiveVolunteer(data);
      setView('dashboard');
    } else {
      alert('ভুল ইমেইল বা পাসওয়ার্ড!');
    }
  };

  // অ্যাডমিন লগইন (সম্পূর্ণ আলাদা)
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('admin_users').select('*').eq('username', adminUser).eq('password', adminPass).single();
    if (data) {
      setIsAdmin(true);
      setView('dashboard');
    } else {
      alert('ভুল অ্যাডমিন আইডি বা পাসওয়ার্ড!');
    }
  };

  const handleLogout = () => {
    setActiveVolunteer(null);
    setIsAdmin(false);
    setView('home');
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('donors').insert([donorForm]);
    if (!error) {
      alert('নিবন্ধন সফল হয়েছে!');
      setDonorForm({ name: '', blood_group: 'A+', phone: '', location: '', email: '', password: '' });
      fetchDonors();
      if(!isAdmin && !activeVolunteer) setView('home');
    } else {
      alert('এই মোবাইল বা ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে।');
    }
  };

  const handleAddEmergency = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('emergency_requests').insert([emergencyForm]);
    if (!error) {
      alert('জরুরি রক্তের রিকোয়েস্ট পোস্ট হয়েছে!');
      setEmergencyForm({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
      fetchEmergencies();
    }
  };

  // সাধারণ সংখ্যা ভিত্তিক ট্র্যাকিং (১, ২, ৩...)
  const incrementActivity = async (id, currentCount) => {
    await supabase.from('donors').update({ activity_count: (currentCount || 0) + 1 }).eq('id', id);
    fetchDonors();
  };

  const filteredDonors = selectedGroup === 'All' ? donors : donors.filter(d => d.blood_group === selectedGroup);

  return (
    <div className="min-h-screen font-bengali text-slate-800 flex flex-col justify-between">
      <div>
        <header className="bg-gradient-to-r from-red-800 to-red-700 text-white text-center py-5 px-4 shadow-md flex flex-col items-center">
          <img src="/logo.png" alt="ব্লাড সেন্টার নদোনা" className="w-16 h-16 rounded-full border-2 border-white mb-2 shadow-sm object-cover bg-white" />
          <h1 className="text-2xl font-bold tracking-wide">ব্লাড সেন্টার নদোনা</h1>
          <p className="text-xs mt-1 opacity-90">সোনাইমুড়ী, নোয়াখালী — স্থাপিত: ২০১৩ ইং</p>
        </header>

        {/* নেভিগেশন মেনু */}
        <nav className="bg-white border-b border-slate-200 overflow-x-auto flex justify-center p-2 space-x-1 shadow-sm">
          <button onClick={() => setView('home')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'home' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>হোম ও তালিকা</button>
          {(!activeVolunteer && !isAdmin) && (
            <>
              <button onClick={() => setView('register')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'register' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>নতুন নিবন্ধন</button>
              <button onClick={() => setView('login')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 hover:bg-slate-100">লগইন</button>
            </>
          )}
          {(activeVolunteer || isAdmin) && (
            <>
              <button onClick={() => setView('dashboard')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'dashboard' ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>ড্যাশবোর্ড</button>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300">লগআউট</button>
            </>
          )}
        </nav>

        <main className="p-4 max-w-4xl mx-auto w-full">
          
          {view === 'home' && (
            <div className="space-y-6">
              {/* ইমার্জেন্সি বোর্ড */}
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h2 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">📢 লাইভ জরুরি রক্তের নোটিশ</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {emergencies.length === 0 ? (
                    <p className="text-xs text-red-600">বর্তমানে কোনো জরুরি রক্তের নোটিশ নেই।</p>
                  ) : (
                    emergencies.map(e => (
                      <div key={e.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-red-700 text-white font-bold text-xs px-2 py-0.5 rounded">{e.blood_group}</span>
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">{e.needed_time}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">রোগী: {e.patient_name}</p>
                        <p className="text-[11px] text-slate-600 mt-1">🏥 স্থান: {e.hospital}</p>
                        <a href={`tel:${e.phone}`} className="mt-2 text-center text-[11px] bg-red-600 text-white py-1.5 rounded font-bold block">📞 কল দিন</a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ডোনার তালিকা */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button onClick={() => setSelectedGroup('All')} className={`px-2.5 py-1 text-xs font-bold rounded ${selectedGroup === 'All' ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600'}`}>সবাই</button>
                  {bloodGroups.map(group => (
                    <button key={group} onClick={() => setSelectedGroup(group)} className={`px-2.5 py-1 text-xs font-bold rounded ${selectedGroup === group ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{group}</button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDonors.map(donor => (
                    <div key={donor.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">{donor.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {donor.location}</p>
                        <p className="text-[10px] text-emerald-700 font-bold mt-1">সহায়তা করেছেন: {donor.activity_count || 0} বার</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-1 rounded">{donor.blood_group}</span>
                        <a href={`tel:${donor.phone}`} className="text-[11px] border border-slate-300 text-slate-700 font-bold px-2 py-1 rounded bg-white">📞 কল</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">🩸 নতুন রক্তদাতা নিবন্ধন</h2>
              <form onSubmit={handleAddDonor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">পূর্ণ নাম</label>
                  <input type="text" required value={donorForm.name} onChange={e => setDonorForm({...donorForm, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="আপনার নাম লিখুন" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">রক্তের গ্রুপ</label>
                    <select value={donorForm.blood_group} onChange={e => setDonorForm({...donorForm, blood_group: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white">
                      {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">মোবাইল নম্বর</label>
                    <input type="tel" required value={donorForm.phone} onChange={e => setDonorForm({...donorForm, phone: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="১১ ডিজিটের নম্বর" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">ঠিকানা / এলাকা</label>
                  <input type="text" required value={donorForm.location} onChange={e => setDonorForm({...donorForm, location: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="গ্রাম বা ইউনিয়নের নাম" />
                </div>
                <div className="pt-3 border-t mt-3">
                  <p className="text-[11px] text-red-600 font-bold mb-2">ভলান্টিয়ার হিসেবে লগইন করতে চাইলে পূরণ করুন (ঐচ্ছিক):</p>
                  <div className="space-y-3">
                    <input type="email" value={donorForm.email} onChange={e => setDonorForm({...donorForm, email: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="ইমেইল অ্যাড্রেস" />
                    <input type="password" value={donorForm.password} onChange={e => setDonorForm({...donorForm, password: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="নতুন পাসওয়ার্ড দিন" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm">নিবন্ধন সম্পন্ন করুন</button>
              </form>
            </div>
          )}

          {view === 'login' && (
            <div className="max-w-sm mx-auto space-y-6 mt-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-center mb-4"><img src="/logo.png" alt="লোগো" className="w-12 h-12 rounded-full border border-slate-200" /></div>
                <h2 className="text-base font-bold text-red-700 text-center mb-4">🤝 ভলান্টিয়ার লগইন</h2>
                <form onSubmit={handleVolunteerLogin} className="space-y-3">
                  <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" placeholder="নিবন্ধিত ইমেইল" />
                  <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" placeholder="পাসওয়ার্ড" />
                  <button type="submit" className="w-full bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm">প্রবেশ করুন</button>
                </form>
              </div>

              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                <h2 className="text-base font-bold text-slate-800 text-center mb-4">🔐 অ্যাডমিন প্যানেল</h2>
                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <input type="text" required value={adminUser} onChange={e => setAdminUser(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="অ্যাডমিন ইউজারনেম" />
                  <input type="password" required value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="পাসওয়ার্ড" />
                  <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm">অ্যাডমিন লগইন</button>
                </form>
              </div>
            </div>
          )}

          {view === 'dashboard' && (activeVolunteer || isAdmin) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-200">
                <h2 className="text-base font-bold text-amber-800 mb-4 border-b pb-2">📢 জরুরি রিকোয়েস্ট তৈরি করুন</h2>
                <form onSubmit={handleAddEmergency} className="space-y-3">
                  <input type="text" required value={emergencyForm.patient_name} onChange={e => setEmergencyForm({...emergencyForm, patient_name: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="রোগীর নাম ও বিবরণ" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={emergencyForm.blood_group} onChange={e => setEmergencyForm({...emergencyForm, blood_group: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-white">
                      {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input type="tel" required value={emergencyForm.phone} onChange={e => setEmergencyForm({...emergencyForm, phone: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="যোগাযোগের নম্বর" />
                  </div>
                  <input type="text" required value={emergencyForm.hospital} onChange={e => setEmergencyForm({...emergencyForm, hospital: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="হাসপাতাল বা স্থানের নাম" />
                  <input type="text" required value={emergencyForm.needed_time} onChange={e => setEmergencyForm({...emergencyForm, needed_time: e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="কখন রক্ত লাগবে (সময়)" />
                  <button type="submit" className="w-full bg-amber-600 text-white text-xs font-bold py-2.5 rounded-lg">বোর্ডে পাবলিশ করুন</button>
                </form>
              </div>

              {isAdmin && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">⚙️ অ্যাডমিন কন্ট্রোল (কার্যক্রম ট্র্যাকিং)</h2>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {donors.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-2 bg-slate-50 border rounded text-xs">
                        <div>
                          <span className="font-bold">{d.name}</span> <span className="text-red-600">({d.blood_group})</span>
                          <p className="text-[10px] text-slate-500">কার্যক্রম: {d.activity_count || 0}</p>
                        </div>
                        <button onClick={() => incrementActivity(d.id, d.activity_count)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">+ কাজ যোগ করুন</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      <footer className="bg-slate-900 text-slate-400 text-center py-4 border-t border-slate-800 text-xs mt-8">
        <p className="font-bold text-slate-300">সার্বিক সহযোগিতায়ঃ মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <p className="text-[11px] text-slate-500 mt-1 font-semibold">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</p>
      </footer>
    </div>
  );
}
