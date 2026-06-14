import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Megaphone, FileText, Save, Send, Droplet, User, MapPin, Clock, Pencil, Trash2, 
  Phone, MessageSquare, Activity, Award, Calendar, Sparkles, Search, Users, 
  Scale, Copy, Lock, Plus, RefreshCw, UserPlus, Shield, Ban, Unlock, LogOut, 
  Eye, EyeOff, Zap, Home, Heart, Stethoscope, Check, AlertTriangle, X, Info,
  WifiOff, Download, Trophy, Share2
} from 'lucide-react';

export default function App() {
  // অ্যাপ স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('home');
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // কাস্টম নোটিফিকেশন স্টেট
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [error, setError] = useState(null);

  // ডিজিটাল কার্ড স্টেট
  const [selectedDonorCard, setSelectedDonorCard] = useState(null);

  // Form স্টেটসমূহ
  const [newDonor, setNewDonor] = useState({ 
    id: null, name: '', blood_group: 'A+', phone: '', address: '', 
    last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: ''
  });
  const [newRequest, setNewRequest] = useState({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
  const [editRequestId, setEditRequestId] = useState(null);
  
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '' });
  const [editVolunteerId, setEditVolunteerId] = useState(null);

  // সিকিউরিটি ও অথেনটিকেশন স্টেট
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerPassword, setVolunteerPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const showToast = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // নেটওয়ার্ক স্ট্যাটাস ট্র্যাকিং
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); fetchDonors(); fetchRequests(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchDonors();
    fetchRequests();
    const savedPhone = localStorage.getItem('v_phone');
    const savedPass = localStorage.getItem('v_pass');
    if (savedPhone && savedPass) {
      checkVolunteerAccess(savedPhone, savedPass);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchVolunteers();
  }, [isAdmin]);

  // অফলাইন ক্যাশিং সহ ডাটা ফেচিং
  const fetchDonors = async () => {
    try {
      const { data, error } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
      if (data && !error) {
        setDonors(data);
        localStorage.setItem('cached_donors', JSON.stringify(data));
      } else {
        throw new Error('Fetch failed');
      }
    } catch (err) {
      const cached = localStorage.getItem('cached_donors');
      if (cached) setDonors(JSON.parse(cached));
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
      if (data && !error) {
        setEmergencyRequests(data);
        localStorage.setItem('cached_requests', JSON.stringify(data));
      }
    } catch (err) {
      const cached = localStorage.getItem('cached_requests');
      if (cached) setEmergencyRequests(JSON.parse(cached));
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase.from('volunteers').select('*').order('id', { ascending: false });
      if (data && !error) {
        setVolunteers(data);
        localStorage.setItem('cached_volunteers', JSON.stringify(data));
      }
    } catch (err) {
      const cached = localStorage.getItem('cached_volunteers');
      if (cached) setVolunteers(JSON.parse(cached));
    }
  };

  // গ্যামিফিকেশন - ডাইনামিক ডোনার ব্যাজ সিস্টেম
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: 'উদীয়মান দাতা', classes: 'bg-orange-100 text-orange-700 border-orange-300' };
    if (num <= 5) return { text: 'নিয়মিত দাতা', classes: 'bg-blue-100 text-blue-700 border-blue-300' };
    if (num <= 9) return { text: 'স্টার দাতা', classes: 'bg-green-100 text-green-700 border-green-300 font-bold' };
    if (num <= 14) return { text: 'সুপার হিরো', classes: 'bg-yellow-100 text-yellow-700 border-yellow-400 font-bold shadow-sm' };
    return { text: 'লাইভ সেভার লিজেন্ড', classes: 'bg-purple-600 text-white border-purple-800 font-black shadow-md animate-pulse' };
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    await checkVolunteerAccess(volunteerPhone, volunteerPassword);
  };

  const checkVolunteerAccess = async (phone, pass) => {
    if (isOffline) return showToast('অফলাইনে ভলান্টিয়ার ভেরিফিকেশন সম্ভব নয়।', 'error');
    const { data, error: dbError } = await supabase.from('volunteers').select('*').eq('phone', phone).eq('is_active', true).single();
    if (data && (data.password === pass || data.code === pass || !data.password)) {
      setIsUnlocked(true);
      localStorage.setItem('v_phone', phone);
      localStorage.setItem('v_pass', pass);
      setVolunteerPhone(phone);
      setVolunteerPassword(pass);
      showToast('ডাটা সফলভাবে আনলক হয়েছে!', 'success');
    } else {
      showToast('দুঃখিত! সিকিউরিটি কোড সঠিক নয় অথবা নম্বরটি তালিকাভুক্ত নয়।', 'error');
      setIsUnlocked(false);
      localStorage.removeItem('v_phone');
      localStorage.removeItem('v_pass');
    }
  };

  const handleLockData = () => {
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    localStorage.removeItem('v_pass');
    setVolunteerPhone('');
    setVolunteerPassword('');
    showToast('ডাটা পুনরায় লক করা হয়েছে।', 'info');
  };

  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য প্রস্তুত', percent: 100, remainingDays: 0 };
    const today = new Date(); 
    const donationDate = new Date(lastDate);
    if (donationDate > today) return { isEligible: false, statusText: 'ভবিষ্যতের তারিখ দেওয়া হয়েছে', percent: 0, remainingDays: 0 };
    
    const diffTime = today - donationDate; 
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const requiredDays = gender === 'মহিলা' ? 120 : 120; // Default 4 months for safety calculation
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য প্রস্তুত', percent: 100, remainingDays: 0 };
    } else {
      const remainingDays = requiredDays - diffDays;
      const percent = Math.round((diffDays / requiredDays) * 100);
      return { isEligible: false, statusText: `${remainingDays} দিন পর দিতে পারবেন`, percent, remainingDays };
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (isOffline) return showToast('অফলাইন অবস্থায় রেজিস্ট্রেশন বা আপডেট করা সম্ভব নয়।', 'error');
    if (!newDonor.name || !newDonor.phone || !newDonor.address) return showToast('সব তথ্য সঠিকভাবে দিন', 'error');
    if (newDonor.age && (Number(newDonor.age) < 18 || Number(newDonor.age) > 65)) return showToast('বয়স ১৮-৬৫ হতে হবে।', 'error');
    if (newDonor.weight && Number(newDonor.weight) < 45) return showToast('ন্যূনতম ওজন ৪৫ কেজি আবশ্যক।', 'error');

    const donorPayload = {
      name: newDonor.name, blood_group: newDonor.blood_group, phone: newDonor.phone,
      location: newDonor.address, gender: newDonor.gender, weight: newDonor.weight ? String(newDonor.weight) : '', 
      age: newDonor.age ? String(newDonor.age) : '', last_donation_date: newDonor.last_donation_date || null,
      activity_count: Number(newDonor.activity_count) || 0
    };

    if (newDonor.id) {
      const { error } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id);
      if (error) showToast('সংশোধনে সমস্যা: ' + error.message, 'error');
      else { showToast('সফলভাবে সংশোধন হয়েছে!', 'success'); resetDonorForm(); fetchDonors(); setActiveTab('search'); }
    } else {
      const { error } = await supabase.from('donors').insert([donorPayload]);
      if (error) showToast('নিবন্ধন ব্যর্থ: ' + (error.code === '23505' ? 'নম্বরটি আগে নিবন্ধিত' : error.message), 'error');
      else { showToast('সফলভাবে নিবন্ধিত হয়েছেন!', 'success'); resetDonorForm(); fetchDonors(); setActiveTab('search'); }
    }
  };

  const resetDonorForm = () => setNewDonor({ id: null, name: '', blood_group: 'A+', phone: '', address: '', last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: '' });

  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (isOffline) return showToast('অফলাইনে নোটিশ পোস্ট করা সম্ভব নয়।', 'error');
    if (editRequestId) {
      const { error } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId);
      if (!error) { showToast('সংশোধন হয়েছে!', 'success'); setEditRequestId(null); setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); fetchRequests(); }
    } else {
      const { error } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!error) { showToast('নোটিশ পোস্ট হয়েছে!', 'success'); setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); fetchRequests(); }
    }
  };

  const handleEditRequest = (req) => { setNewRequest({ patient_name: req.patient_name, blood_group: req.blood_group, hospital: req.hospital, phone: req.phone, needed_time: req.needed_time }); setEditRequestId(req.id); };
  const handleDeleteRequest = async (id) => { if (confirm('মুছে ফেলতে চান?')) { await supabase.from('emergency_requests').delete().eq('id', id); fetchRequests(); } };

  const handleIncrementActivity = async (id, currentCount) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id);
    if (!error) { showToast('রক্তদানের সংখ্যা বৃদ্ধি করা হয়েছে!', 'success'); fetchDonors(); }
  };

  const handleEditDonor = (donor) => {
    if (!isAdmin && !isUnlocked) return showToast('ডাটা আনলক করুন', 'error');
    setNewDonor({ ...donor, address: donor.location || donor.village || '' });
    setActiveTab('register');
  };

  const handleDeleteDonor = async (id) => {
    if (!isAdmin) return showToast('শুধুমাত্র অ্যাডমিন ডিলিট করতে পারবেন।', 'error');
    if (confirm('রেকর্ড ডিলিট করতে চান?')) { await supabase.from('donors').delete().eq('id', id); fetchDonors(); }
  };

  const handleCopyDonorInfo = (donor) => {
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: ${donor.location || donor.village || ''}`;
    navigator.clipboard.writeText(infoText).then(() => showToast('কপি করা হয়েছে!', 'success')).catch(() => showToast('কপি করতে ব্যর্থ', 'error'));
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const payload = { name: newVolunteer.name, phone: newVolunteer.phone, password: newVolunteer.password, code: newVolunteer.password };
    if (editVolunteerId) {
      await supabase.from('volunteers').update(payload).eq('id', editVolunteerId);
      setEditVolunteerId(null);
    } else {
      await supabase.from('volunteers').insert([payload]);
    }
    setNewVolunteer({ name: '', phone: '', password: '' });
    fetchVolunteers();
    showToast('ভলান্টিয়ার ডাটা আপডেট হয়েছে!', 'success');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (isOffline) return showToast('অফলাইনে অ্যাডমিন লগইন সম্ভব নয়।', 'error');
    const { data } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single();
    if (data) { setIsAdmin(true); setShowAdminLogin(false); showToast('অ্যাডমিন ভেরিফিকেশন সফল!', 'success'); } 
    else showToast('ভুল ইউজার আইডি বা পাসওয়ার্ড!', 'error');
  };

  const sendCongratulatoryMessage = (donor) => {
    const formattedPhone = donor.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`অভিনন্দন ${donor.name}! ব্লাড সেন্টার নদোনা নোয়াখালীর রেকর্ড অনুযায়ী, আপনি আজ থেকে পুনরায় রক্তদানের জন্য সম্পূর্ণ প্রস্তুত। আপনার এই মহৎ উদ্যোগে আমরা গর্বিত।`);
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const notifyEligibleDonors = (bloodGroup) => {
    const eligible = donors.filter(d => d.blood_group === bloodGroup && checkEligibility(d.last_donation_date, d.gender).isEligible);
    if(eligible.length === 0) return showToast('এই মুহূর্তে উক্ত গ্রুপের কোনো প্রস্তুত ডোনার নেই।', 'error');
    showToast(`${eligible.length} জন যোগ্য ডোনার পাওয়া গেছে। তাদের প্রোফাইল থেকে হোয়াটসঅ্যাপ করুন।`, 'success');
    setSelectedGroup(bloodGroup);
    setEligibilityFilter('Eligible');
    setActiveTab('search');
  };

  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
    const locationString = `${donor.location || donor.village || ''}`.toLowerCase();
    const matchesSearch = (donor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || locationString.includes(searchTerm.toLowerCase());
    const eligibility = checkEligibility(donor.last_donation_date, donor.gender);
    let matchesEligibility = true;
    if (eligibilityFilter === 'Eligible') matchesEligibility = eligibility.isEligible;
    if (eligibilityFilter === 'Ineligible') matchesEligibility = !eligibility.isEligible;
    return matchesGroup && matchesSearch && matchesEligibility;
  });

  // ==================== REUSABLE SECTIONS ====================

  const renderDigitalCard = () => {
    if (!selectedDonorCard) return null;
    const badge = getDonorBadge(selectedDonorCard.activity_count || 0);
    
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative" id="donor-digital-card">
          <button onClick={() => setSelectedDonorCard(null)} className="absolute top-3 right-3 bg-white/20 p-1.5 rounded-full backdrop-blur z-10 hover:bg-white/40">
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="bg-red-600 p-6 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            <h2 className="text-xl font-black tracking-wide relative z-10 drop-shadow-md">ব্লাড সেন্টার নদোনা নোয়াখালী</h2>
            <p className="text-xs font-bold text-red-100 mt-1 relative z-10">গর্বিত রক্তদাতা কার্ড</p>
          </div>

          <div className="p-6 bg-gradient-to-b from-slate-50 to-white relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 bg-white rounded-full p-1 shadow-lg flex items-center justify-center border-4 border-slate-50">
                <span className="text-3xl font-black text-red-600 drop-shadow-sm">{selectedDonorCard.blood_group}</span>
              </div>
            </div>

            <div className="mt-12 text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-800">{selectedDonorCard.name}</h3>
              <p className="text-sm font-bold text-slate-500 flex items-center justify-center gap-1">
                <MapPin className="w-4 h-4" /> {selectedDonorCard.location || selectedDonorCard.village || 'ঠিকানা দেওয়া হয়নি'}
              </p>
              
              <div className="mt-4 inline-block px-4 py-1.5 rounded-full font-bold text-sm shadow-sm border border-opacity-50" style={{
                backgroundColor: badge.classes.split(' ')[0].replace('bg-', 'var(--tw-colors-'), 
                color: badge.classes.split(' ')[1].replace('text-', 'var(--tw-colors-')
              }} className={badge.classes}>
                {badge.text}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-center border-t border-slate-100 pt-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400">মোট রক্তদান</span>
                <span className="block text-xl font-black text-red-600 mt-0.5">{selectedDonorCard.activity_count || 0} বার</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400">সর্বশেষ দান</span>
                <span className="block text-sm font-bold text-slate-700 mt-1">{selectedDonorCard.last_donation_date || 'তথ্য নেই'}</span>
              </div>
            </div>
            
            <div className="mt-6 text-center text-[10px] text-slate-400 font-bold tracking-wider">
              ID: BCNN-{String(selectedDonorCard.id).padStart(4, '0')} | www.bloodcenternn.com
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 flex gap-4">
          <button onClick={() => showToast('এই কার্ডটির একটি স্ক্রিনশট নিয়ে আপনার সোশ্যাল মিডিয়ায় শেয়ার করুন!', 'success')} className="bg-white text-slate-800 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" /> কার্ড শেয়ার করুন
          </button>
        </div>
      </div>
    );
  };

  const renderNoticeSection = () => (
    <div className="space-y-6">
      <div id="emergency-board-section" className="bg-white p-5 rounded-2xl shadow border-t-4 border-red-500 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-red-600 flex items-center gap-2 animate-pulse">
            <Megaphone className="w-5 h-5" /> লাইভ ব্লাড রিকোয়েস্ট
          </h2>
        </div>

        {isAdmin && (
          <form onSubmit={handleAddRequest} className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
             <input type="text" placeholder="রোগীর নাম" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white">
                {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="tel" placeholder="যোগাযোগের নাম্বার" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
            </div>
            <input type="text" placeholder="হাসপাতাল" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
            <input type="text" placeholder="কখন লাগবে" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
            <button type="submit" className="w-full bg-red-600 text-white p-2.5 rounded-xl font-bold text-xs">{editRequestId ? 'আপডেট' : 'পোস্ট'}</button>
          </form>
        )}

        <div className="space-y-3">
          {emergencyRequests.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">বর্তমানে কোনো জরুরি অনুরোধ নেই।</p>
          ) : (
            emergencyRequests.map(req => (
              <div key={req.id} className="border-2 border-red-100 bg-red-50/30 p-4 rounded-xl relative shadow-sm">
                <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{req.blood_group}</span>
                <h4 className="font-bold text-sm text-slate-800">রোগী: {req.patient_name}</h4>
                <p className="text-xs text-slate-600 mt-1">হাসপাতাল: {req.hospital}</p>
                <p className="text-xs text-red-600 font-bold mt-1">সময়: {req.needed_time}</p>
                
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${req.phone}`} className="flex-1 text-xs text-center bg-red-600 text-white py-2 rounded-lg font-bold">কল দিন</a>
                  {(isUnlocked || isAdmin) && (
                    <button onClick={() => notifyEligibleDonors(req.blood_group)} className="flex-1 text-xs text-center bg-teal-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> যোগ্য ডোনার খুঁজুন
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-700">
          <Search className="w-5 h-5" /> রক্তদাতা ফিল্টারিং
        </h2>
        <div className="relative">
          <Search className="absolute inset-y-0 left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="এলাকা, ইউনিয়ন বা গ্রাম দিয়ে খুঁজুন" 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setVisibleDonorsCount(10); }}
            className="w-full border-2 pl-10 p-3 rounded-2xl shadow-xs text-base focus:outline-red-500" 
          />
        </div>
        <select value={eligibilityFilter} onChange={e => { setEligibilityFilter(e.target.value); setVisibleDonorsCount(10); }} className="w-full border-2 p-3 rounded-2xl font-bold text-slate-700">
          <option value="All">সব রক্তদাতা</option>
          <option value="Eligible">যোগ্য রক্তদাতা (প্রস্তুত)</option>
          <option value="Ineligible">অযোগ্য রক্তদাতা (সময় হয়নি)</option>
        </select>
        
        <div className="flex gap-1.5 overflow-x-auto pb-2 max-w-full">
          {bloodGroups.map(group => (
            <button key={group} onClick={() => { setSelectedGroup(group); setVisibleDonorsCount(10); }} className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap shadow-xs transition-all ${selectedGroup === group ? 'bg-red-600 text-white' : 'bg-white border-2 text-slate-600'}`}>
              {group === 'All' ? 'সব গ্রুপ' : group}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredDonors.slice(0, visibleDonorsCount).map(donor => {
          const elg = checkEligibility(donor.last_donation_date, donor.gender);
          const badge = getDonorBadge(donor.activity_count || 0);
          const formattedPhone = donor.phone ? donor.phone.replace(/[^0-9]/g, '') : '';
          const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমাদের জরুরি একটি ${donor.blood_group} রক্তের প্রয়োজন।`)}`;

          return (
            <div key={donor.id} className="bg-white p-5 rounded-2xl shadow border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center cursor-pointer hover:ring-2 ring-red-300" onClick={() => setSelectedDonorCard(donor)}>
                    {donor.blood_group}
                  </span>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{donor.name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {donor.location || donor.village}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border block ${badge.classes}`}>{badge.text}</span>
                  <button onClick={() => setSelectedDonorCard(donor)} className="text-[10px] font-bold text-blue-600 mt-1 flex items-center justify-end gap-0.5 w-full"><Award className="w-3 h-3"/> কার্ড দেখুন</button>
                </div>
              </div>

              <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${elg.isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span>স্ট্যাটাস: {elg.statusText}</span>
                  {elg.isEligible && donor.last_donation_date && (isUnlocked || isAdmin) && (
                    <button onClick={() => sendCongratulatoryMessage(donor)} className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3"/> রিমাইন্ডার
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between gap-2 border">
                <span className="font-bold text-slate-700">{isUnlocked || isAdmin ? donor.phone : 'XXXXXXXXXXX'}</span>
                <div className="flex gap-2">
                  {(isUnlocked || isAdmin) ? (
                    <>
                      <a href={`tel:${donor.phone}`} className="p-2 bg-slate-800 text-white rounded-lg"><Phone className="w-4 h-4" /></a>
                      <a href={waUrl} target="_blank" rel="noreferrer" className="p-2 bg-teal-600 text-white rounded-lg"><MessageSquare className="w-4 h-4" /></a>
                    </>
                  ) : (
                    <button onClick={() => showToast('আনলক করুন', 'error')} className="p-2 bg-slate-200 text-slate-400 rounded-lg"><Lock className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredDonors.length > visibleDonorsCount && (
          <button onClick={() => setVisibleDonorsCount(prev => prev + 10)} className="w-full bg-slate-800 text-white p-3 rounded-2xl font-bold">Load More</button>
        )}
      </div>
      {renderDigitalCard()}
    </div>
  );

  const renderRegisterSection = () => (
    <div id="register-section" className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500 space-y-4">
      <h2 className="text-xl font-black text-green-600 flex items-center justify-center gap-1.5"><UserPlus className="w-5 h-5" /> ডোনার রেজিস্ট্রেশন</h2>
      <form onSubmit={handleRegisterDonor} className="space-y-4">
        <input type="text" placeholder="সম্পূর্ণ নাম" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border-2 p-3 rounded-xl" required />
        <input type="tel" placeholder="মোবাইল নাম্বার" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl" required />
        <div className="grid grid-cols-2 gap-3">
          <select value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border-2 p-3 rounded-xl bg-white">
            {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border-2 p-3 rounded-xl bg-white">
            <option value="পুরুষ">পুরুষ</option><option value="মহিলা">মহিলা</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="ওজন (কেজি)" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: e.target.value})} className="w-full border-2 p-3 rounded-xl" />
          <input type="number" placeholder="বয়স" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border-2 p-3 rounded-xl" />
        </div>
        <input type="text" placeholder="গ্রাম/এলাকার নাম" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} className="w-full border-2 p-3 rounded-xl" required />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">সর্বশেষ রক্তদান</label>
            <input type="date" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border-2 p-3 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">মোট দানকৃত</label>
            <input type="number" placeholder="কতবার" value={newDonor.activity_count} onChange={e => setNewDonor({...newDonor, activity_count: e.target.value})} className="w-full border-2 p-3 rounded-xl text-sm" />
          </div>
        </div>
        <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-xl font-black text-lg shadow-md flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> সংরক্ষণ করুন
        </button>
      </form>
    </div>
  );

  const renderVolunteerSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
        <h3 className="text-lg font-black text-indigo-800 flex items-center justify-center gap-2 mb-4 border-b-2 border-indigo-200 pb-2">
          <Trophy className="w-5 h-5 text-amber-500" /> ভলান্টিয়ার লিডারবোর্ড
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {volunteers.map((v, idx) => (
            <div key={v.id} className="bg-white p-3 rounded-xl flex items-center justify-between border border-slate-100 shadow-xs">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                  {idx + 1}
                </span>
                <span className="font-bold text-sm text-slate-700">{v.name}</span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">সক্রিয় সদস্য</span>
            </div>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-white p-5 rounded-2xl shadow border space-y-3">
          <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5"><Lock className="w-4 h-4" /> ভলান্টিয়ার প্যানেল</h3>
          {isUnlocked ? (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border-green-200 border">
              <span className="text-xs font-bold text-green-700">ডাটা আনলক আছে</span>
              <button onClick={handleLockData} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg">লক করুন</button>
            </div>
          ) : (
            <form onSubmit={handleVolunteerUnlock} className="space-y-3">
              <input type="tel" placeholder="মোবাইল নাম্বার" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} className="w-full border-2 p-3 rounded-xl text-sm" required />
              <input type="password" placeholder="পাসওয়ার্ড" value={volunteerPassword} onChange={e => setVolunteerPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl text-sm" required />
              <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">আনলক করুন</button>
            </form>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 leading-normal font-sans">
      
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1.5">
          <WifiOff className="w-4 h-4" /> আপনি অফলাইনে আছেন। ক্যাশ করা ডাটা দেখানো হচ্ছে।
        </div>
      )}

      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className={`p-4 rounded-2xl shadow-xl font-black text-sm text-center max-w-sm w-full ${
            notification.type === 'success' ? 'bg-green-600 text-white' : notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      <header className="bg-red-600 text-white text-center py-8 shadow-lg px-4 relative rounded-b-3xl">
        <h1 className="text-2xl font-black tracking-wide drop-shadow-md">ব্লাড সেন্টার নদোনা নোয়াখালী</h1>
        <p className="text-xs text-red-100 font-bold mt-2">স্থাপিত: ২০১৩ ইং | 📍 নদোনা বাজার, সোনাইমুড়ী</p>
        
        <div className="absolute top-4 right-4 flex gap-2">
          {!isAdmin ? (
            <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="bg-white/20 hover:bg-white/30 text-xs font-bold px-3 py-1.5 rounded-xl text-white backdrop-blur">অ্যাডমিন</button>
          ) : (
            <button onClick={() => setIsAdmin(false)} className="bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl text-white">লগআউট</button>
          )}
        </div>
      </header>

      <nav className="bg-white border-b sticky top-0 z-30 shadow-sm mt-4 mx-4 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 text-center font-bold text-[10px] sm:text-xs">
          {['home', 'notice', 'search', 'register', 'volunteer'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === tab ? 'bg-red-50 text-red-600 border-b-2 border-red-600' : 'text-slate-500'}`}>
              {tab === 'home' && <Home className="w-4 h-4" />}
              {tab === 'notice' && <Megaphone className="w-4 h-4" />}
              {tab === 'search' && <Search className="w-4 h-4" />}
              {tab === 'register' && <UserPlus className="w-4 h-4" />}
              {tab === 'volunteer' && <Users className="w-4 h-4" />}
              <span className="capitalize">{tab === 'home' ? 'হোম' : tab === 'notice' ? 'নোটিশ' : tab === 'search' ? 'খুঁজুন' : tab === 'register' ? 'নিবন্ধন' : 'টিম'}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {showAdminLogin && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">অ্যাডমিন লগইন</h3>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input type="text" placeholder="ইউজার আইডি" value={userId} onChange={e => setUserId(e.target.value)} className="w-full border-2 p-3 rounded-xl" required />
              <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl" required />
              <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-md">লগইন করুন</button>
            </form>
          </div>
        )}

        {activeTab === 'home' && <div className="space-y-8">{renderNoticeSection()}{renderSearchSection()}</div>}
        {activeTab === 'notice' && renderNoticeSection()}
        {activeTab === 'search' && renderSearchSection()}
        {activeTab === 'register' && renderRegisterSection()}
        {activeTab === 'volunteer' && renderVolunteerSection()}
      </main>

      <footer className="text-center text-sm text-slate-400 mt-12 pb-6 space-y-3 px-4">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী।</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200">
          <span className="font-black text-slate-600 text-sm tracking-normal">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
