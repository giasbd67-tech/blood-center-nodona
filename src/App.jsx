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
  const [activeTab, setActiveTab] = useState('home'); // ৫টি টগল ট্যাব: home, notice, search, register, volunteer
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10); // লোড মোর লিমিট
  
  // কাস্টম নোটিফিকেশন স্টেট
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

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
  
  // নতুন পাসওয়ার্ড ফিল্ড সহ ভলান্টিয়ার স্টেট
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '' });
  const [editVolunteerId, setEditVolunteerId] = useState(null);

  // সিকিউরিটি ও অথেনটিকেশন স্টেট
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerPassword, setVolunteerPassword] = useState(''); // ভলান্টিয়ার পাসওয়ার্ড স্টেট
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

  // কাস্টম নোটিফিকেশন প্রদর্শনকারী হেল্পার
  const showToast = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // অ্যাপ লোড হওয়ার সাথে সাথে ডাটাবেজ থেকে ডাটা আনা
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

  // রক্তদানের সংখ্যা অনুযায়ী মেডেল নির্ধারণকারী ফাংশন
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: '🌱 নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: '🤝 সহযোগী রক্তদাতা', classes: 'bg-green-100 text-green-700 border-green-200' };
    if (num <= 5) return { text: '🥈 সিলভার ডোনার', classes: 'bg-gray-200 text-gray-700 border-gray-300' };
    if (num <= 10) return { text: '🥇 গোল্ড ডোনার', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: '💎 প্লাটিনাম ডোনার', classes: 'bg-blue-100 text-blue-700 border-blue-200 font-bold shadow-sm' };
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    await checkVolunteerAccess(volunteerPhone, volunteerPassword);
  };

  // সিকিউর আলফানিউমেরিক কোড ভিত্তিক ভলান্টিয়ার অ্যাক্সেস ভেরিফিকেশন (ফিক্সড)
  const checkVolunteerAccess = async (phone, pass) => {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();

    if (data) {
      const dbPass = data.password || data.code || '';
      if (dbPass === pass || !dbPass) {
        setIsUnlocked(true);
        localStorage.setItem('v_phone', phone);
        localStorage.setItem('v_pass', pass);
        setVolunteerPhone(phone);
        setVolunteerPassword(pass);
        showToast('ডাটা সফলভাবে আনলক হয়েছে!', 'success');
      } else {
        showToast('দুঃখিত! ভলান্টিয়ার সিকিউরিটি কোড বা পাসওয়ার্ডটি সঠিক নয়।', 'error');
        setIsUnlocked(false);
      }
    } else {
      // নেটওয়ার্ক ফেইলর এবং ইউজার নট ফাউন্ড আলাদা করা হলো যেন অটো-লগআউট না হয়
      if (error && error.code === 'PGRST116') {
        showToast('দুঃখিত! এই মোবাইল নম্বরটি ভলান্টিয়ার তালিকায় নেই অথবা ব্লক করা আছে।', 'error');
        setIsUnlocked(false);
        localStorage.removeItem('v_phone');
        localStorage.removeItem('v_pass');
      } else if (error) {
        showToast('নেটওয়ার্ক সমস্যা! অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
      } else {
        setIsUnlocked(false);
        localStorage.removeItem('v_phone');
        localStorage.removeItem('v_pass');
      }
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

  // রক্তদানের যোগ্যতা যাচাইয়ের মেডিকেল লজিক (ফিক্সড)
  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)' };
    
    const today = new Date('2026-06-13'); 
    const donationDate = new Date(lastDate);

    // ভবিষ্যতের ভুল তারিখ হ্যান্ডলিং
    if (donationDate > today) {
      return { isEligible: false, statusText: 'সাময়িক অযোগ্য (ভবিষ্যতের তারিখ দেওয়া হয়েছে)' };
    }
    
    const diffTime = today - donationDate; 
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const requiredDays = gender === 'মহিলা' ? 180 : 120;
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)' };
    } else {
      const remainingDays = requiredDays - diffDays;
      const remainingMonths = Math.ceil(remainingDays / 30);
      return { isEligible: false, statusText: `সাময়িক অযোগ্য (${remainingDays} দিন বা প্রায় ${remainingMonths} মাস পর দিতে পারবেন)` };
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone || !newDonor.address) return showToast('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন', 'error');
    
    if (newDonor.age && (Number(newDonor.age) < 18 || Number(newDonor.age) > 65)) {
      return showToast('দুঃখিত, রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে।', 'error');
    }
    if (newDonor.weight && Number(newDonor.weight) < 45) {
      return showToast('দুঃখিত, রক্তদানের জন্য ন্যূনতম ওজন অন্তত ৪৫ থেকে ৫০ কেজি হওয়া আবশ্যক।', 'error');
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
      const { error } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id);
      if (error) {
        showToast('정보 সংশোধন করার সময় সমস্যা হয়েছে: ' + error.message, 'error');
      } else {
        showToast('রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', 'success');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); 
      }
    } else {
      const { error } = await supabase.from('donors').insert([donorPayload]);
      if (error) {
        if (error.code === '23505') {
          showToast('এই নম্বরটি দিয়ে অলরেডি রেজিস্ট্রেশন করা আছে!', 'error');
        } else {
          showToast('নিবন্ধন ব্যর্থ হয়েছে: ' + error.message, 'error');
        }
      } else {
        showToast('রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!', 'success');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); 
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
        showToast('জরুরি রক্তের নোটিশ সফলভাবে সংশোধন হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null);
        fetchRequests();
      } else {
        showToast('নোটিশ সংশোধন করতে ব্যর্থ: ' + error.message, 'error');
      }
    } else {
      const { error } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!error) {
        showToast('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      } else {
        showToast('নোটিশ পোস্ট করতে ব্যর্থ: ' + error.message, 'error');
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
    document.getElementById('emergency-board-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteRequest = async (id) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই জরুরি নোটিশটি মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('emergency_requests').delete().eq('id', id);
      if (!error) {
        showToast('নোটিশটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchRequests();
      } else {
        showToast('নোটিশ ডিলিট করতে ব্যর্থ: ' + error.message, 'error');
      }
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id);
    if (!error) {
      showToast('রক্তদানের সংখ্যা বৃদ্ধি করা হয়েছে!', 'success');
      fetchDonors();
    } else {
      showToast('আপডেট ব্যর্থ হয়েছে: ' + error.message, 'error');
    }
  };

  const handleEditDonor = (donor) => {
    if (!isAdmin && !isUnlocked) return showToast('অনুগ্রহ করে ভলান্টিয়ার কোড বা নাম্বার দিয়ে ডাটা আনলক করুন', 'error');
    setNewDonor({
      id: donor.id,
      name: donor.name,
      blood_group: donor.blood_group,
      phone: donor.phone,
      address: donor.location || donor.village || '',
      last_donation_date: donor.last_donation_date || '',
      gender: donor.gender,
      weight: donor.weight || '',
      age: donor.age || '',
      activity_count: donor.activity_count || ''
    });
    setActiveTab('register'); 
    setTimeout(() => {
      document.getElementById('register-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteDonor = async (id) => {
    if (!isAdmin) return showToast('শুধুমাত্র মূল অ্যাডমিন প্যানেল থেকে তথ্য ডিলিট করা সম্ভব।', 'error');
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড ডিলিট করতে চান?')) {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (!error) {
        showToast('রক্তদাতার তথ্য সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchDonors();
      } else {
        showToast('ডিলিট ব্যর্থ হয়েছে: ' + error.message, 'error');
      }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    if (!isUnlocked && !isAdmin) {
      showToast('রক্তদাতার তথ্য কপি করতে ভলান্টিয়ার নম্বর ও পাসওয়ার্ড দিয়ে ডাটা আনলক করুন।', 'error');
      return;
    }
    const infoText = `🩸 ব্লাড সেন্টার নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: ${donor.location || donor.village || ''}`;
    
    try {
      const el = document.createElement('textarea');
      el.value = infoText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('রক্তদাতার সমস্ত তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    } catch (e) {
      showToast('কপি করতে ব্যর্থ হয়েছে, অনুগ্রহ করে ম্যানুয়ালি কপি করুন।', 'error');
    }
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const volunteerPayload = { 
      name: newVolunteer.name, 
      phone: newVolunteer.phone, 
      password: newVolunteer.password,
      code: newVolunteer.password 
    };

    if (editVolunteerId) {
      const { error } = await supabase.from('volunteers').update(volunteerPayload).eq('id', editVolunteerId);
      if (!error) {
        showToast('ভলান্টিয়ারের তথ্য ও সিকিউরিটি পাসওয়ার্ড সফলভাবে সংশোধন করা হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '' });
        setEditVolunteerId(null);
        fetchVolunteers();
      } else {
        showToast('সংশোধন ব্যর্থ: ' + error.message, 'error');
      }
    } else {
      const { error } = await supabase.from('volunteers').insert([volunteerPayload]);
      if (error) {
        showToast('এই ভলান্টিয়ার নম্বরটি অলরেডি অনুমোদিত আছে অথবা সমস্যা হয়েছে!', 'error');
      } else {
        showToast('নতুন ভলান্টিয়ার কাস্টম সিকিউরিটি পাসওয়ার্ড সহ অনুমোদিত হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '' });
        fetchVolunteers();
      }
    }
  };

  const handleEditVolunteer = (v) => {
    setNewVolunteer({ name: v.name, phone: v.phone, password: v.password || v.code || '' });
    setEditVolunteerId(v.id);
  };

  const handleDeleteVolunteer = async (id) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই ভলান্টিয়ারকে ডিলিট করতে চান?')) {
      const { error } = await supabase.from('volunteers').delete().eq('id', id);
      if (!error) {
        showToast('ভলান্টিয়ার সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchVolunteers();
      } else {
        showToast('মুছে ফেলতে ব্যর্থ: ' + error.message, 'error');
      }
    }
  };

  const toggleVolunteerStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      showToast('ভলান্টিয়ারের অবস্থা সফলভাবে পরিবর্তন করা হয়েছে।', 'info');
      fetchVolunteers();
    } else {
      showToast('অবস্থা পরিবর্তন ব্যর্থ: ' + error.message, 'error');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single();
    if (data) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      showToast('অ্যাডমিন ভেরিফিকেশন সফল হয়েছে!', 'success');
    } else {
      showToast('ভুল ইউজার আইডি অথবা পাসওয়ার্ড!', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (masterCode !== 'BCNN2013') {
      return showToast('ভুল মাস্টার কোড! আপনি পাসওয়ার্ড পরিবর্তন করার অনুমতি পাননি।', 'error');
    }
    const { error } = await supabase.from('app_auth').update({ password: newPassword }).eq('user_id', 'BloodCenterNN');
    if (!error) {
      showToast('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'success');
      setShowPassModal(false);
      setMasterCode('');
      setNewPassword('');
    } else {
      showToast('পাসওয়ার্ড পরিবর্তন ব্যর্থ: ' + error.message, 'error');
    }
  };

  // ফিল্টারিং প্যানেল (ফিক্সড - Optional Chaining যুক্ত করা হয়েছে যেন ক্র্যাশ না করে)
  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
    const locationString = `${donor.location || donor.village || ''}`.toLowerCase();
    
    // donor.name নাল বা আনডিফাইনড হলেও অ্যাপ ক্র্যাশ করবে না
    const matchesSearch = (donor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          locationString.includes(searchTerm.toLowerCase());
    
    const eligibility = checkEligibility(donor.last_donation_date, donor.gender);
    let matchesEligibility = true;
    if (eligibilityFilter === 'Eligible') matchesEligibility = eligibility.isEligible;
    if (eligibilityFilter === 'Ineligible') matchesEligibility = !eligibility.isEligible;

    return matchesGroup && matchesSearch && matchesEligibility;
  });

  const totalDonorsCount = donors.length;
  const totalDonationsCount = donors.reduce((acc, d) => acc + (d.activity_count || 0), 0);
  const readyTodayCount = donors.filter(d => checkEligibility(d.last_donation_date, d.gender).isEligible).length;

  // ==================== REUSABLE RENDERING SECTIONS ====================

  const renderNoticeSection = () => (
    <div className="space-y-6">
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
              <input type="tel" placeholder="যোগাযোগের নাম্বার" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
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

        <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
          {emergencyRequests.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6 leading-normal">ℹ️ বর্তমানে কোনো জরুরি রক্তের অনুরোধ নেই।</p>
          ) : (
            emergencyRequests.map(req => (
              <div key={req.id} className="border-2 border-red-100 bg-red-50/20 p-4 rounded-xl relative shadow-xs space-y-1">
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
              <li>সুস্থ পুরুষরা প্রতি ৪ মাস অন্তর (বছরে ৩ বার) রক্ত দিতে পারবেন।</li>
              <li>সুস্থ নারীরা প্রতি ৪ থেকে ৬ মাস অন্তর রক্ত দিতে পারবেন (৬ মাস বেশি নিরাপদ)।</li>
              <li>রক্তদানের জন্য ন্যূনতম ওজন অবশ্যই ৫০ কেজি (বিশেষ ক্ষেত্রে ৪৫ কেজি) হতে হবে।</li>
              <li>রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬০ বা ৬৫ বছরের মধ্যে হতে হবে।</li>
              <li>রক্তচাপ, শরীরের তাপমাত্রা এবং হিমোগ্লোবিনের মাত্রা সঠিক থাকা আবশ্যক।</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 flex gap-3 shadow-sm">
          <span className="text-2xl bg-white text-slate-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs">🏛️</span>
          <div className="space-y-2 w-full">
            <h4 className="font-black text-sm text-slate-800 mb-1 leading-relaxed border-b pb-1 flex items-center justify-between">
              <span>✨ সংগঠনের গৌরবময় ইতিহাস ও উদ্যোক্তাগণ</span>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">প্রতিষ্ঠা: ২০১৩ ইং</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              মানবতার সেবায় রক্তদানের মহান ব্রত নিয়ে **২৭ মার্চ ২০১৩ ইং** তারিখে ব্লাড সেন্টার নদোনা নোয়াখালী সংগঠনের গৌরবময় পথচলা শুরু হয়। মুমূর্ষু রোগীদের পাশে দাঁড়ানো ও গ্রামীণ জনপদে রক্তদানে সচেতনতা সৃষ্টি করাই ছিল এর মূল লক্ষ্য।
            </p>
            <div className="pt-1">
              <p className="text-xs font-bold text-slate-700 mb-1.5">🌟 দূরदर्शी ৬ জন প্রতিষ্ঠাতা উদ্যোক্তা:</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1">👤 প্রতিষ্ঠাতা সদস্য ১</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1">👤 প্রতিষ্ঠাতা সদস্য ২</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1">👤 প্রতিষ্ঠাতা সদস্য ৩</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1">👤 প্রতিষ্ঠাতা সদস্য ৪</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1">👤 প্রতিষ্ঠাতা সদস্য ৫</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1">👤 প্রতিষ্ঠাতা সদস্য ৬</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
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
              onChange={e => { setSearchTerm(e.target.value); setVisibleDonorsCount(10); }}
              className="w-full border-2 pl-10 p-3 rounded-2xl shadow-xs text-base focus:outline-red-500 leading-normal" 
            />
          </div>
          <select 
            value={eligibilityFilter} 
            onChange={e => { setEligibilityFilter(e.target.value); setVisibleDonorsCount(10); }} 
            className="w-full border-2 p-3 rounded-2xl shadow-xs text-base bg-white font-bold text-slate-700 focus:outline-red-500 leading-normal"
          >
            <option value="All">🚻 সকল রক্তদাতা (ডাটাবেজে থাকা সবাই)</option>
            <option value="Eligible">🟢 যোগ্য রক্তদাতা (যারা এই মুহূর্তে রক্তদানে প্রস্তুত)</option>
            <option value="Ineligible">🟡 সাময়িক অযোগ্য রক্তদাতা (যাদের নির্দিষ্ট সময় পার হয়নি)</option>
          </select>
        </div>
        
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

      <div className="space-y-4">
        {filteredDonors.length === 0 ? (
          <p className="text-center text-base text-slate-400 py-10 bg-white rounded-2xl shadow-xs leading-normal">📭 এই ফিল্টারিংয়ে কোনো রক্তদাতা পাওয়া যায়নি।</p>
        ) : (
          <>
            {filteredDonors.slice(0, visibleDonorsCount).map(donor => {
              const elg = checkEligibility(donor.last_donation_date, donor.gender);
              const badge = getDonorBadge(donor.activity_count || 0);
              
              return (
                <div key={donor.id} className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 space-y-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center shadow-inner">{donor.blood_group}</span>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-1.5 leading-relaxed">👤 {donor.name}</h4>
                        <p className="text-sm text-slate-500 font-medium leading-normal">📍 {donor.location || donor.village || 'ঠিকানা দেওয়া হয়নি'}</p>
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
                      
                      {(isUnlocked || isAdmin) ? (
                        <button onClick={() => handleCopyDonorInfo(donor)} title="তথ্য কপি" className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                          📄
                        </button>
                      ) : (
                        <button type="button" onClick={() => showToast('রক্তদাতার তথ্য কপি করতে ভলান্টিয়ার কোড বা মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-200 text-slate-400 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center cursor-not-allowed">
                          🔒
                        </button>
                      )}

                      {(isUnlocked || isAdmin) ? (
                        <a href={`tel:${donor.phone}`} title="সরাসরি কল করুন" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                          📞
                        </a>
                      ) : (
                        <button type="button" onClick={() => showToast('মোবাইল নাম্বার দেখতে ও কল করতে ভলান্টিয়ার কোড বা মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed">
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
  );

  const renderRegisterSection = () => (
    <div id="register-section" className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-black text-green-600 flex items-center justify-center gap-1.5 leading-relaxed">🩸 রক্তদাতা নিবন্ধন ফরম</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal">{newDonor.id ? 'আপনার তথ্য সংশোধন করে ডাটাবেজ আপডেট করুন' : 'আপনার সঠিক তথ্য দিয়ে মানবসেবায় এগিয়ে আসুন'}</p>
      </div>
      
      <form onSubmit={handleRegisterDonor} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">✍️ রক্তদাতার সম্পূর্ণ নাম *</label>
          <input type="text" placeholder="বীরশ্রেষ্ঠ মোহাম্মদ রুহুল আমিন" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">☎️ মোবাইল নাম্বার *</label>
          <input type="tel" placeholder="কান্ট্রি কোড সহ মোবাইল নাম্বার দিন" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
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
            <input type="number" placeholder="বয়স লিখুন" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
          </div>
        </div>

        {(newDonor.weight || newDonor.age) && (
          <div className="p-4 rounded-xl border space-y-2 bg-slate-50 border-slate-200 text-xs shadow-xs">
            <h5 className="font-bold text-slate-700 border-b pb-1 flex items-center gap-1">🩺 স্বাস্থ্যগত যোগ্যতা পর্যালোচনা:</h5>
            {newDonor.weight && (
              <div className="flex items-center gap-1.5 font-semibold">
                {Number(newDonor.weight) >= 50 ? (
                  <span className="text-green-600">✅ ওজন: {newDonor.weight} কেজি (রক্তদানের জন্য সম্পূর্ণ উপযুক্ত)।</span>
                ) : Number(newDonor.weight) >= 45 ? (
                  <span className="text-amber-600">⚠️ ওজন: {newDonor.weight} কেজি (ন্যূনতম ৪৫ কেজি অনুযায়ী বিশেষ ক্ষেত্রে রক্তদান সম্ভব, তবে ৫০ কেজি আদেশ)।</span>
                ) : (
                  <span className="text-red-600">❌ ওজন: {newDonor.weight} কেজি (রক্তদানের জন্য ন্যূনতম ৪৫-৫০ কেজি ওজন আবশ্যক)।</span>
                )}
              </div>
            )}
            {newDonor.age && (
              <div className="flex items-center gap-1.5 font-semibold">
                {Number(newDonor.age) >= 18 && Number(newDonor.age) <= 65 ? (
                  <span className="text-green-600">✅ বয়স: {newDonor.age} বছর (১৮ থেকে ৬৫ বছরের নির্ধারিত সীমার মধ্যে রয়েছে)।</span>
                ) : (
                  <span className="text-red-600">❌ বয়স: {newDonor.age} বছর (রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে)।</span>
                )}
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-medium pt-1">
              💡 শারীরিক ও মানসিকভাবে সুস্থ পুরুষরা ৪ মাস পর পর এবং মহিলারা সাধারণত ৪ থেকে ৬ মাস পর পর নিরাপদভাবে রক্তদান করতে পারেন।
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">🏡 রক্তদাতার সম্পূর্ণ ঠিকানা *</label>
          <input type="text" placeholder="বাঘপাঁচড়া, সোনাইমুড়ী, নোয়াখালী 🇧🇩🇨🇦" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">📊 পূর্বে কতবার রক্ত দিয়েছেন? (ঐচ্ছিক)</label>
          <input type="number" placeholder="রক্তদানের মোট সংখ্যা লিখুন" value={newDonor.activity_count} onChange={e => setNewDonor({...newDonor, activity_count: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">🗓️ সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)</label>
          <input type="date" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" />
          <p className="text-[10px] text-slate-400 mt-1 leading-normal">নোট: যদি পূর্বে কখনো রক্ত না দিয়ে থাকেন, তবে এই ঘরটি ফাঁকা রাখুন।</p>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-black text-lg shadow-md transition-colors flex items-center justify-center gap-2 leading-normal">
            💾 {newDonor.id ? 'সংশোধন নিরাপদ করুন' : 'তথ্য ডাটাবেজে সংরক্ষণ করুন'}
          </button>
          {newDonor.id && (
            <button type="button" onClick={resetDonorForm} className="bg-slate-200 text-slate-700 px-4 rounded-xl font-bold text-base">বাতিল</button>
          )}
        </div>
      </form>
    </div>
  );

  const renderVolunteerSection = () => (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="bg-white p-5 rounded-2xl shadow border border-slate-200 space-y-3">
          <h3 className="text-sm font-black text-slate-700 flex items-center gap-1">🔒 ভলান্টিয়ার আনলক প্যানেল</h3>
          {isUnlocked ? (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200">
              <span className="text-xs font-bold text-green-700 flex items-center gap-1.5 leading-normal">🟢 ডাটা সফলভাবে আনলক আছে ({volunteerPhone})</span>
              <button onClick={handleLockData} className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1">🔒 লক করুন</button>
            </div>
          ) : (
            <form onSubmit={handleVolunteerUnlock} className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base">📱</span>
                <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নাম্বার দিন" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} className="w-full border-2 pl-9 p-2.5 rounded-xl text-sm focus:outline-red-500 leading-normal" required />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base">🔑</span>
                <input type="password" placeholder="অ্যাডমিনের দেওয়া সিকিউরিটি কোড বা পাসওয়ার্ড দিন" value={volunteerPassword} onChange={e => setVolunteerPassword(e.target.value)} className="w-full border-2 pl-9 p-2.5 rounded-xl text-sm focus:outline-red-500 leading-normal" required />
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all">
                🔓 ভলান্টিয়ার ডাটা আনলক করুন
              </button>
            </form>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="bg-white p-5 rounded-2xl shadow border-t-4 border-blue-600 space-y-4">
          <h3 className="text-lg font-black text-blue-600 flex items-center gap-2 leading-relaxed">👥 ভলান্টিয়ার কন্ট্রোল প্যানেল</h3>
          <form onSubmit={handleAddVolunteer} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1">➕ {editVolunteerId ? 'ভলান্টিয়ার তথ্য ও পাসওয়ার্ড সংশোধন:' : 'নতুন ভলান্টিয়ার ও কাস্টম পাসওয়ার্ড অনুমোদন:'}</p>
            <div className="grid grid-cols-1 gap-2">
              <input type="text" placeholder="ভলান্টিয়ারের নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
              <input type="tel" placeholder="মোবাইল নাম্বার" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
              <input type="text" placeholder="সিকিউরিটি কোড বা পাসওয়ার্ড (আলফানিউমেরিক যেকোনো দৈর্ঘ্য)" value={newVolunteer.password} onChange={e => setNewVolunteer({...newVolunteer, password: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
            </div>
            <div className="flex gap-1.5">
              <button type="submit" className="flex-1 bg-blue-600 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm">
                {editVolunteerId ? '💾 তথ্য আপডেট' : '✍️ ভলান্টিয়ার অনুমোদন'}
              </button>
              {editVolunteerId && (
                <button type="button" onClick={() => { setEditVolunteerId(null); setNewVolunteer({ name: '', phone: '', password: '' }); }} className="bg-slate-200 text-slate-700 px-3 rounded-xl font-bold text-xs">বাতিল</button>
              )}
            </div>
          </form>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {volunteers.map(v => (
              <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-normal">
                <div>
                  <p className="font-bold text-slate-800">🛡️ {v.name}</p>
                  <p className="text-xs text-slate-500">📞 {v.phone} | 🔑 কোড: <span className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{v.password || v.code || 'ডিফল্ট'}</span> {v.is_active ? '' : '(🚫 ব্লকড)'}</p>
                </div>
                <div className="flex gap-1 items-center">
                  <button onClick={() => handleEditVolunteer(v)} title="সংশোধন" className="p-1.5 bg-white border rounded text-xs hover:bg-slate-100">🖊️</button>
                  <button onClick={() => handleDeleteVolunteer(v.id)} title="মুছে ফেলুন" className="p-1.5 bg-white border rounded text-xs hover:bg-slate-100">🗑️</button>
                  <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-white ${v.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                    {v.is_active ? '🚫। ব্লক' : '🔓 আনব্লক'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isAdmin && !isUnlocked && (
        <p className="text-center text-xs text-slate-400 py-10 leading-normal bg-white p-4 rounded-xl border">
          🔒 ভলান্টিয়ার প্যানেল পরিচালনার জন্য আপনার রেজিস্টার্ড মোবাইল নম্বর ও অ্যাডমিনের দেওয়া কাস্টম পাসওয়ার্ড দিয়ে ডাটা আনলক করুন।
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 leading-normal">
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-11/12 mx-auto animate-bounce">
          <div className={`p-4 rounded-2xl shadow-2xl border text-center font-bold text-sm ${
            notification.type === 'success' ? 'bg-green-600 text-white border-green-700' : 
            notification.type === 'error' ? 'bg-red-600 text-white border-red-700' : 
            'bg-slate-800 text-white border-slate-900'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      <header className="bg-red-600 text-white text-center py-8 shadow-lg px-4 relative">
        <div className="flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-md" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-center text-white tracking-wide drop-shadow-md leading-tight">
            🩸ব্লাড সেন্টার নদোনা নোয়াখালী🩸
          </h1>
          <div className="text-xs text-red-100 font-bold flex flex-col items-center gap-1 mt-1">
            <span className="bg-red-700/50 px-3 py-0.5 rounded-full">🏡 স্থাপিত: ২০১৩ ইং</span>
            <span className="bg-red-700/50 px-3 py-0.5 rounded-full mt-1">📍 নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী 🇧🇩</span>
          </div>
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

      <div className="bg-amber-500 text-white font-black text-xs sm:text-sm py-2.5 px-4 text-center flex flex-wrap items-center justify-center gap-1 sm:gap-2 shadow-inner sticky top-0 z-40">
        <span>🚨 জরুরি রক্ত প্রয়োজনে সরাসরি যোগাযোগ করুন:</span>
        <a href="tel:+8801813132013" className="bg-white text-red-600 px-3 py-0.5 rounded-full font-black shadow-xs hover:bg-slate-100 transition-all flex items-center gap-0.5">
          📞 +880 1813-132013
        </a>
      </div>

      <nav className="bg-white border-b sticky top-[38px] z-30 shadow-xs">
        <div className="max-w-md mx-auto grid grid-cols-5 text-center font-bold text-[10px] sm:text-xs">
          <button onClick={() => setActiveTab('home')} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'home' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <span className="text-base sm:text-lg">🏠</span><span>হোম</span>
          </button>
          <button onClick={() => setActiveTab('notice')} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'notice' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <span className="text-base sm:text-lg">📢</span><span>জরুরি নোটিশ</span>
          </button>
          <button onClick={() => setActiveTab('search')} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'search' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <span className="text-base sm:text-lg">🔍</span><span>খুঁজুন</span>
          </button>
          <button onClick={() => setActiveTab('register')} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'register' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <span className="text-base sm:text-lg">✍️</span><span>নিবন্ধন</span>
          </button>
          <button onClick={() => setActiveTab('volunteer')} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'volunteer' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <span className="text-base sm:text-lg">👥</span><span>ভলান্টিয়ার</span>
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
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

        {activeTab === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            {renderNoticeSection()}
            {renderRegisterSection()}
            {renderSearchSection()}
          </div>
        )}

        {activeTab === 'notice' && renderNoticeSection()}
        {activeTab === 'search' && renderSearchSection()}
        {activeTab === 'register' && renderRegisterSection()}
        {activeTab === 'volunteer' && renderVolunteerSection()}
      </main>

      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 leading-relaxed">🔑 পাসওয়ার্ড পরিবর্তন</h3>
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

      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
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
