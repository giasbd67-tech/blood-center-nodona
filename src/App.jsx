import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// আধুনিক আউটলাইন ও মিনিমালিস্ট আইকন প্যাক ইমপোর্ট
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
  History
} from 'lucide-react';

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
  // নতুন মোডাল এরর স্টেট
  const [error, setError] = useState(null);
  
  // Form স্টেটসমূহ
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
  
  // নতুন পাসওয়ার্ড ফিল্ড সহ ভলান্টিয়ার স্টেট (শুরুর মান খালি স্ট্রিং "" ব্যবহার করা হয়েছে)
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '', points: '' });
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
  
  // নতুন অ্যাডভান্সড ফিচারের স্টেটসমূহ
  const [selectedDonorForCard, setSelectedDonorForCard] = useState(null);
  const [selectedVolunteerForCard, setSelectedVolunteerForCard] = useState(null);
  const [donorLogs, setDonorLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]); // গ্লোবাল দাতার রক্তদানের ইতিহাস স্টেট
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogDonor, setActiveLogDonor] = useState(null);
  const [newLog, setNewLog] = useState({ patient_name: '', hospital: '', date: '' });

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']; //

  // কাস্টম নোটিফিকেশন প্রদর্শনকারী হেল্পার
  const showToast = (message, type = 'info') => {
    console.log(`[Toast] Type: ${type} | Message: ${message}`);
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // অ্যাপ লোড হওয়ার সাথে সাথে ডাটাবেজ থেকে ডাটা আনা
  useEffect(() => {
    console.log("[App Lifecycle] Application mounted. Initializing data fetching...");
    fetchDonors();
    fetchRequests();
    fetchAllLogs();
    
    // অফলাইন ক্যাশ সাপোর্ট লোড
    const cachedDonors = localStorage.getItem('cached_donors');
    const cachedRequests = localStorage.getItem('cached_requests');
    
    if (cachedDonors) {
      console.log("[Offline Cache] Loaded donors from localStorage.");
      setDonors(JSON.parse(cachedDonors));
    }
    if (cachedRequests) {
      console.log("[Offline Cache] Loaded emergency requests from localStorage.");
      setEmergencyRequests(JSON.parse(cachedRequests));
    }

    const savedPhone = localStorage.getItem('v_phone');
    const savedPass = localStorage.getItem('v_pass');
    if (savedPhone && savedPass) {
      console.log(`[Session Lock] Found stored volunteer credentials for ${savedPhone}. Re-authenticating...`);
      checkVolunteerAccess(savedPhone, savedPass);
    }
  }, []);

  useEffect(() => {
    console.log(`[App Lifecycle] Triggering fetchVolunteers. Admin Mode Active: ${isAdmin}`);
    fetchVolunteers(); // লিডারবোর্ডের জন্য ভলান্টিয়ার ডাটা সবসময় রিড করা প্রয়োজন
  }, [isAdmin]);

  const fetchDonors = async () => {
    console.log("[API Call] Requesting donors list from Supabase...");
    try {
      const { data, error: fetchErr } = await supabase.from('donors').select('*').order('activity_count', { ascending: false }); //
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`[API Success] Fetched ${data.length} donors successfully.`);
        setDonors(data);
        localStorage.setItem('cached_donors', JSON.stringify(data)); // অফলাইন ক্যাশিং
      }
    } catch (e) {
      console.error("[API Error] Failed to fetch donors, loading from cache mode.", e);
    }
  };

  const fetchRequests = async () => {
    console.log("[API Call] Requesting emergency requests from Supabase...");
    try {
      const { data, error: fetchErr } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false }); //
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`[API Success] Fetched ${data.length} emergency requests successfully.`);
        setEmergencyRequests(data);
        localStorage.setItem('cached_requests', JSON.stringify(data)); // অফলাইন নোটিশ ক্যাশিং
      }
    } catch (e) {
      console.error("[API Error] Failed to fetch emergency requests.", e);
    }
  };

  const fetchVolunteers = async () => {
    console.log("[API Call] Requesting volunteers data from Supabase...");
    try {
      const { data, error: fetchErr } = await supabase.from('volunteers').select('*').order('points', { ascending: false }); //
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`[API Success] Fetched ${data.length} volunteers successfully.`);
        setVolunteers(data);
      }
    } catch (e) {
      console.error("[API Error] Failed to fetch volunteers list.", e);
    }
  };

  // সামগ্রিক রক্তদানের ইতিহাস নিয়ে আসার ফাংশন
  const fetchAllLogs = async () => {
    console.log("[API Call] Requesting global donation logs from Supabase...");
    try {
      const { data, error: fetchErr } = await supabase.from('donation_logs').select('*').order('date', { ascending: false }); //
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`[API Success] Fetched ${data.length} total global donation logs.`);
        setAllLogs(data);
      }
    } catch (e) {
      console.error("[API Error] Error fetching all donation logs.", e);
    }
  };

  // আপডেট করা ডাইনামিক ৬-স্তর বিশিষ্ট ডোনার ব্যাজ নির্ধারণকারী লজিক
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' }; //
    if (num <= 2) return { text: 'উদীয়মান দাতা', classes: 'bg-amber-100 text-amber-700 border-amber-200' }; //
    if (num <= 5) return { text: 'নিয়মিত দাতা', classes: 'bg-blue-100 text-blue-700 border-blue-200' }; //
    if (num <= 9) return { text: 'স্টার দাতা', classes: 'bg-green-100 text-green-700 border-green-200' }; //
    if (num <= 14) return { text: 'সুপার হিরো', classes: 'bg-yellow-100 text-yellow-700 border-yellow-300 font-black animate-pulse shadow-xs' }; //
    return { text: 'লাইভ সেভার লিজেন্ড', classes: 'bg-purple-100 text-purple-700 border-purple-300 font-black tracking-wide shadow animate-bounce' }; //
  };

  // ভলান্টিয়ারদের সফল কাজের ওপর ভিত্তি করে রিয়েলটাইম মেডেল নির্ধারণ
  const getVolunteerBadge = (points) => {
    const pts = Number(points) || 0;
    if (pts >= 15) return { text: 'প্লাটিনাম লিডার', classes: 'bg-purple-600 text-white' }; //
    if (pts >= 8) return { text: 'গোল্ডেন স্টার', classes: 'bg-yellow-500 text-white' }; //
    return { text: 'সক্রিয় সদস্য', classes: 'bg-blue-500 text-white' }; //
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    console.log(`[Auth Action] Volunteer data unlock submitted via Form. Phone: ${volunteerPhone}`);
    await checkVolunteerAccess(volunteerPhone, volunteerPassword);
  };

  const checkVolunteerAccess = async (phone, pass) => {
    console.log(`[Auth Verify] Requesting Supabase volunteer lookup for phone: ${phone}`);
    const { data, error: dbError } = await supabase
      .from('volunteers')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single(); //

    if (data) {
      const dbPass = data.password || data.code || '';
      console.log(`[Auth Verify] Volunteer found. Password Comparison. Matches: ${dbPass === pass}`);
      if (dbPass === pass || !dbPass) {
        setIsUnlocked(true);
        localStorage.setItem('v_phone', phone);
        localStorage.setItem('v_pass', pass);
        setVolunteerPhone(phone);
        setVolunteerPassword(pass);
        showToast('ডাটা সফলভাবে আনলক হয়েছে!', 'success'); //
      } else {
        console.warn("[Auth Failed] Password mismatch for volunteer entry.");
        showToast('দুঃখিত! ভলান্টিয়ার সিকিউরিটি কোড বা পাসওয়ার্ডটি সঠিক নয়।', 'error'); //
        setIsUnlocked(false);
      }
    } else {
      if (dbError && dbError.code === 'PGRST116') {
        console.warn(`[Auth Failed] Code PGRST116: Phone ${phone} not found in volunteers table or marked inactive.`);
        showToast('দুঃখিত! এই মোবাইল নম্বরটি ভলান্টিয়ার তালিকায় নেই অথবা ব্লক করা আছে।', 'error'); //
        setIsUnlocked(false);
        localStorage.removeItem('v_phone');
        localStorage.removeItem('v_pass');
      } else if (dbError) {
        console.error("[Auth Error] Technical failure during database lookup.", dbError);
        showToast('নেটওয়ার্ক সমস্যা! অনুগ্রহ করে আবার চেষ্টা করুন।', 'error'); //
      } else {
        console.warn("[Auth Void] Catch-all branch for volunteer login failure.");
        setIsUnlocked(false);
        localStorage.removeItem('v_phone');
        localStorage.removeItem('v_pass');
      }
    }
  };

  const handleLockData = () => {
    console.log("[Auth Action] Data manually locked. Purging session from localStorage.");
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    localStorage.removeItem('v_pass');
    setVolunteerPhone('');
    setVolunteerPassword('');
    showToast('ডাটা পুনরায় লক করা হয়েছে।', 'info'); //
  };

  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100, remainingDays: 0 }; //
    const today = new Date(); 
    const donationDate = new Date(lastDate);
    if (donationDate > today) {
      return { isEligible: false, statusText: 'সাময়িক অযোগ্য (ভবিষ্যতের তারিখ দেওয়া হয়েছে)', percent: 0, remainingDays: 0 }; //
    }
    
    const diffTime = today - donationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); //
    
    const requiredDays = gender === 'মহিলা' ? 180 : 120; //
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100, remainingDays: 0 }; //
    } else {
      const remainingDays = requiredDays - diffDays;
      const remainingMonths = Math.ceil(remainingDays / 30);
      const percent = Math.min(100, Math.max(0, Math.round((diffDays / requiredDays) * 100))); //
      return { 
        isEligible: false, 
        statusText: `সাময়িক অযোগ্য (${remainingDays} দিন বা প্রায় ${remainingMonths} মাস পর দিতে পারবেন)`,
        percent,
        remainingDays
      };
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    console.log("[Form Submission] handleRegisterDonor triggered.", newDonor);
    if (!newDonor.name || !newDonor.phone || !newDonor.address) {
      console.warn("[Validation Failed] Required text fields are missing parameters.");
      return showToast('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন', 'error'); //
    }
    
    if (newDonor.age && (Number(newDonor.age) < 18 || Number(newDonor.age) > 65)) {
      console.warn(`[Validation Failed] Age out of bounds: ${newDonor.age}`);
      return showToast('দুঃখিত, রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে।', 'error'); //
    }
    if (newDonor.weight && Number(newDonor.weight) < 45) {
      console.warn(`[Validation Failed] Weight below minimal constraint: ${newDonor.weight}`);
      return showToast('দুঃখিত, রক্তদানের জন্য ন্যূনতম ওজন অন্তত ৪৫ থেকে ৫০ কেজি হওয়া আবশ্যক।', 'error'); //
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
      console.log(`[Database Update] Modifying existing donor record with ID: ${newDonor.id}`);
      const { error: submitError } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id); //
      if (submitError) {
        console.error("[Database Error] Donor edit operation failed.", submitError);
        showToast('তথ্য সংশোধন ব্যর্থ: ' + submitError.message, 'error'); //
      } else {
        console.log("[Database Success] Donor updated successfully.");
        if (isUnlocked && !isAdmin) {
          console.log(`[RPC Trigger] Incrementing volunteer scores for: ${volunteerPhone}`);
          await supabase.rpc('increment_volunteer_points', { v_phone: volunteerPhone }); //
          fetchVolunteers();
        }
        showToast('রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', 'success'); //
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); 
      }
    } else {
      console.log("[Database Insert] Inserting brand new donor record into table.");
      const { error: submitError } = await supabase.from('donors').insert([donorPayload]); //
      if (submitError) {
        console.error("[Database Error] Insertion operation failed.", submitError);
        if (submitError.code === '23505') {
          showToast('এই নম্বরটি দিয়ে অলরেডি রেজিস্ট্রেশন করা আছে!', 'error'); //
        } else {
          showToast('নিবন্ধন ব্যর্থ হয়েছে: ' + submitError.message, 'error'); //
        }
      } else {
        console.log("[Database Success] New donor registration created in Supabase.");
        if (isUnlocked && !isAdmin) {
          console.log(`[RPC Trigger] Incrementing volunteer scores for: ${volunteerPhone}`);
          await supabase.rpc('increment_volunteer_points', { v_phone: volunteerPhone }); //
          fetchVolunteers();
        }
        showToast('রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!', 'success'); //
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); 
      }
    }
  };

  const resetDonorForm = () => {
    console.log("[Form Cleanup] Resetting newDonor state data back to original defaults.");
    setNewDonor({ 
      id: null, name: '', blood_group: 'A+', phone: '', address: '',
      last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: ''
    });
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    console.log("[Form Submission] handleAddRequest called. Targeted ID context:", editRequestId);
    if (editRequestId) {
      console.log(`[Database Update] Updating request item ID: ${editRequestId}`);
      const { error: reqError } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId); //
      if (!reqError) {
        console.log("[Database Success] Emergency board notification edited successfully.");
        showToast('জরুরি রক্তের নোটিশ সফলভাবে সংশোধন হয়েছে!', 'success'); //
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null);
        fetchRequests();
      } else {
        console.error("[Database Error] Emergency notice update failed.", reqError);
        showToast('নোটিশ সংশোধন করতে ব্যর্থ: ' + reqError.message, 'error'); //
      }
    } else {
      console.log("[Database Insert] Injecting new notice message into live board dataset.");
      const { error: reqError } = await supabase.from('emergency_requests').insert([newRequest]); //
      if (!reqError) {
        console.log("[Database Success] Created fresh emergency notice post.");
        showToast('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!', 'success'); //
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      } else {
        console.error("[Database Error] Live notice insert sequence failed.", reqError);
        showToast('নোটিশ পোস্ট করতে ব্যর্থ: ' + reqError.message, 'error'); //
      }
    }
  };

  const handleEditRequest = (req) => {
    console.log("[UI Intercept] Loading specific item schema details into live input states.", req);
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
    console.log(`[UI Intercept] Action requested to delete notice log index: ${id}`);
    if (confirm('আপনি কি নিশ্চিতভাবে এই জরুরি নোটিশটি মুছে ফেলতে চান?')) {
      const { error: reqError } = await supabase.from('emergency_requests').delete().eq('id', id); //
      if (!reqError) {
        console.log(`[Database Destroy] Successfully cleaned request tracking ID: ${id}`);
        showToast('নোটিশটি সফলভাবে মুছে ফেলা হয়েছে।', 'success'); //
        fetchRequests();
      } else {
        console.error("[Database Error] Failure inside clean action.", reqError);
        showToast('নোটিশ ডিলিট করতে ব্যর্থ: ' + reqError.message, 'error'); //
      }
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    if (!isAdmin) return;
    console.log(`[Admin Action] Increasing donor record count tracker. ID: ${id} | Previous Count: ${currentCount}`);
    const { error: actError } = await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id); //
    if (!actError) {
      console.log(`[Database Success] Activity tally for donor ${id} set to value: ${currentCount + 1}`);
      showToast('রক্তদানের সংখ্যা বৃদ্ধি করা হয়েছে!', 'success'); //
      fetchDonors();
    } else {
      console.error("[Database Error] Increment step logic execution failed.", actError);
      showToast('আপডেট ব্যর্থ হয়েছে: ' + actError.message, 'error'); //
    }
  };

  const handleEditDonor = (donor) => {
    console.log("[UI Intercept] Mapping chosen donor dataset profile to layout register form fields.", donor);
    if (!isAdmin && !isUnlocked) {
      console.warn("[Auth Gate] Attempted modification while system parameters are completely locked.");
      return showToast('অনুগ্রহ করে ভলান্টিয়ার কোড বা নম্বর দিয়ে ডাটা আনলক করুন', 'error'); //
    }
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
    if (!isAdmin) return showToast('শুধুমাত্র মূল অ্যাডমিন প্যানেল থেকে তথ্য ডিলিট করা সম্ভব।', 'error'); //
    console.log(`[Admin Wipe Task] Destruction request processing for donor item: ${id}`);
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড ডিলিট করতে চান?')) {
      const { error: delError } = await supabase.from('donors').delete().eq('id', id); //
      if (!delError) {
        console.log(`[Database Destroy] Flushed donor row ID ${id} entirely.`);
        showToast('রক্তদাতার তথ্য সফলভাবে মুছে ফেলা হয়েছে।', 'success'); //
        fetchDonors();
      } else {
        console.error("[Database Error] Drop profile query failure.", delError);
        showToast('ডিলিট ব্যর্থ হয়েছে: ' + delError.message, 'error'); //
      }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    console.log(`[Clipboard Task] Constructing information card text block payload for donor: ${donor.name}`);
    if (!isUnlocked && !isAdmin) {
      showToast('রক্তদাতার তথ্য কপি করতে ভলান্টিয়ার নম্বর ও পাসওয়ার্ড দিয়ে ডাটা আনলক করুন।', 'error'); //
      return;
    }
    const infoText = `🩸 ব্লাডセンター নদোনা নোয়াখালী 🩸\nরক্তদাতা: ${donor.name}\nগ্রুপ: ${donor.blood_group}\nমোবাইল: ${donor.phone}\nঠিকানা: ${donor.location || donor.village || ''}`; //
    
    try {
      const el = document.createElement('textarea');
      el.value = infoText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      console.log("[Clipboard Success] Text content safely dumped to clipboard runtime buffer.");
      showToast('রক্তদাতার সমস্ত তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!', 'success'); //
    } catch (e) {
      console.error("[Clipboard Error] Failed execution during browser copy sequence.", e);
      showToast('কপি করতে ব্যর্থ হয়েছে, অনুগ্রহ করে ম্যানুয়ালি কপি করুন।', 'error'); //
    }
  };

  const handleShareRequest = (req) => {
    console.log(`[Clipboard Task] Generating dynamic text share template string for request ID: ${req.id}`);
    const shareText = `🚨 জরুরি রক্তের প্রয়োজন 🚨\n\n🩸 রক্তের গ্রুপ: ${req.blood_group}\n👤 রোগী: ${req.patient_name}\n🏥 স্থান: ${req.hospital}\n⏰ কখন লাগবে: ${req.needed_time}\n📞 যোগাযোগের নম্বর: ${req.phone}\n\n🙏 অনুগ্রহ করে নোটিশটি সবাই শেয়ার করে রক্তদাতার সন্ধান দিতে সাহায্য করুন।\n📌 সৌজন্যে: ব্লাড সেন্টার নদোনা নোয়াখালী`; //
    try {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      console.log("[Clipboard Success] Share format string copied to system clipboard wrapper.");
      showToast('শেয়ারিং টেক্সট কপি হয়েছে! এখন ফেসবুক বা মেসেঞ্জারে পোস্ট করুন।', 'success'); //
    } catch (e) {
      console.error("[Clipboard Error] Shared block output compilation failed.", e);
      showToast('কপি করতে ব্যর্থ হয়েছে।', 'error'); //
    }
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    console.log("[Form Submission] Volunteer adjustment operation requested.", newVolunteer);
    
    const volunteerPayload = { 
      name: newVolunteer.name, 
      phone: newVolunteer.phone, 
      password: newVolunteer.password,
      code: newVolunteer.password,
      points: Number(newVolunteer.points) || 0
    };

    if (editVolunteerId) {
      console.log(`[Database Update] Processing data modification row layout update for Volunteer ID: ${editVolunteerId}`);
      const { error: volError } = await supabase.from('volunteers').update(volunteerPayload).eq('id', editVolunteerId); //
      if (!volError) {
        console.log("[Database Success] Edited target volunteer credential metrics inside table storage mapping.");
        showToast('ভলান্টিয়ারের তথ্য ও সিকিউরিটি পাসওয়ার্ড সফলভাবে সংশোধন করা হয়েছে!', 'success'); //
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        setEditVolunteerId(null);
        fetchVolunteers();
      } else {
        console.error("[Database Error] Volunteer profile configuration revision failure.", volError);
        showToast('সংশোধন ব্যর্থ: ' + volError.message, 'error'); //
      }
    } else {
      console.log("[Database Insert] Executing new authorized volunteer team member registration entry.");
      const { error: volError } = await supabase.from('volunteers').insert([volunteerPayload]); //
      if (volError) {
        console.error("[Database Error] Volunteer insert runtime error (possible duplicate constraint code).", volError);
        showToast('এই ভলান্টিয়ার নম্বরটি অলরেডি অনুমোদিত আছে অথবা সমস্যা হয়েছে!', 'error'); //
      } else {
        console.log("[Database Success] Registered new user into volunteer schema profile records index.");
        showToast('নতুন ভলান্টিয়ার কাস্টম সিকিউরিটি পাসওয়ার্ড সহ অনুমোদিত হয়েছে!', 'success'); //
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        fetchVolunteers();
      }
    }
  };

  const handleEditVolunteer = (v) => {
    console.log("[UI Intercept] Preparing volunteer tracking inputs for modification setup process.", v);
    setNewVolunteer({ name: v.name, phone: v.phone, password: v.password || v.code || '', points: v.points === 0 ? '0' : String(v.points || '') }); //
    setEditVolunteerId(v.id);
  };

  const handleDeleteVolunteer = async (id) => {
    console.log(`[Admin Action] Purging selected entry item index row position inside volunteers. ID: ${id}`);
    if (confirm('আপনি কি নিশ্চিতভাবে এই ভলান্টিয়ারকে ডিলিট করতে চান?')) {
      const { error: volError } = await supabase.from('volunteers').delete().eq('id', id); //
      if (!volError) {
        console.log(`[Database Destroy] Erased volunteer node entity safely: ${id}`);
        showToast('ভলান্টিয়ার সফলভাবে মুছে ফেলা হয়েছে।', 'success'); //
        fetchVolunteers();
      } else {
        console.error("[Database Error] Drop query workflow crashed processing index request.", volError);
        showToast('মুছে ফেলতে ব্যর্থ: ' + volError.message, 'error'); //
      }
    }
  };

  const toggleVolunteerStatus = async (id, currentStatus) => {
    console.log(`[Admin Action] Inverting block status flags logic on active configuration nodes. Target ID: ${id} | Future State: ${!currentStatus}`);
    const { error: volError } = await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id); //
    if (!volError) {
      console.log(`[Database Success] Status switched. Row status is now evaluated as Active: ${!currentStatus}`);
      showToast('ভলান্টিয়ারের অবস্থা সফলভাবে পরিবর্তন করা হয়েছে।', 'info'); //
      fetchVolunteers();
    } else {
      console.error("[Database Error] State toggle request failed during table evaluation check.", volError);
      showToast('অবস্থা পরিবর্তন ব্যর্থ: ' + volError.message, 'error'); //
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    console.log(`[Admin Auth] Validating administrative credential keys in auth matrix for key string: ${userId}`);
    const { data, error: authError } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single(); //
    if (data) {
      console.log("[Admin Auth] Root entry validation matched. System authorization granted successfully.");
      setIsAdmin(true);
      setShowAdminLogin(false);
      showToast('অ্যাডমিন ভেরিফিকেশন সফল হয়েছে!', 'success'); //
    } else {
      console.warn("[Admin Auth Failed] Query returned void results or mismatched passphrase validation keys.", authError);
      showToast('ভুল ইউজার আইডি অথবা পাসওয়ার্ড!', 'error'); //
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    console.log("[Admin Action] Security passphrase modification procedure requested.");
    if (masterCode !== 'BCNN2013') { //
      console.warn(`[Security Alert] Master authentication passphrase input key token was rejected. Key: ${masterCode}`);
      return showToast('ভুল মাস্টার কোড! আপনি পাসওয়ার্ড পরিবর্তন করার অনুমতি পাননি।', 'error'); //
    }
    const { error: authError } = await supabase.from('app_auth').update({ password: newPassword }).eq('user_id', 'BloodCenterNN'); //
    if (!authError) {
      console.log("[Security Success] System access passcode set and modified globally across authorization schemas.");
      showToast('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'success'); //
      setShowPassModal(false);
      setMasterCode('');
      setNewPassword('');
    } else {
      console.error("[Security Error] Supabase write operation failed for authentication credentials updating logic.", authError);
      showToast('পাসওয়ার্ড পরিবর্তন ব্যর্থ: ' + authError.message, 'error'); //
    }
  };

  // ==================== ক্যানভাস ভিত্তিক ডিজিটাল প্রিমিয়াম কার্ড এবং সার্টিফিকেট জেনারেটর ====================
  const downloadDonorCard = (donor) => {
    console.log(`[Canvas Studio] Building luxury donor identification badge layout vector matrix for: ${donor.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 638;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // ব্যাকগ্রাউন্ড লাক্সারি গ্রেডিয়েন্ট এবং জ্যামিতিক টেক্সচার
    const mainGrad = ctx.createLinearGradient(0, 0, 638, 400);
    mainGrad.addColorStop(0, '#ffffff');
    mainGrad.addColorStop(0.7, '#fff5f5');
    mainGrad.addColorStop(1, '#ffe3e3');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, 638, 400);
    
    // মডার্ন রেড জ্যামিতিক সাইড শেপ কার্ভ
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(440, 0);
    ctx.lineTo(638, 0);
    ctx.lineTo(638, 400);
    ctx.lineTo(500, 400);
    ctx.bezierCurveTo(470, 260, 410, 140, 440, 0);
    ctx.fill();
    
    // কার্ড মেটাল ফ্রেম বর্ডার অলংকার
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#b91c1c';
    ctx.strokeRect(3, 3, 632, 394);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(10, 10, 618, 380);
    
    // হেডার ব্র্যান্ডিং লোগো টেক্সট
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 32, 48); //
    
    ctx.fillStyle = '#dc2626';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillText('★ ESTD: 2013 | রক্তের বন্ধনে আবদ্ধ আমরা ★', 32, 70);
    
    // থিম সেপারেটর লাইন
    ctx.strokeStyle = '#fee2e2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, 85);
    ctx.lineTo(380, 85);
    ctx.stroke();
    
    // মেটাডাটা রো রেন্ডারিং হেল্পার
    const renderMetaRow = (label, value, yPos) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(label, 32, yPos);
      
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(value, 150, yPos); //
      
      // ডটেড সেপারেটর লাইন
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, yPos + 8);
      ctx.lineTo(380, yPos + 8); //
      ctx.stroke();
    };
    
    renderMetaRow('রক্তদাতার নাম:', donor.name, 155); //
    renderMetaRow('ঠিকানা এলাকা:', donor.location || donor.village || 'নদোনা', 190); //
    renderMetaRow('সর্বশেষ দান:', donor.last_donation_date || 'কখনো না', 225); //
    renderMetaRow('মোট রক্তদান:', `${donor.activity_count || 0} বার`, 260); //
    
    // মেডেল অর্জন স্ট্যাটাস
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`স্থায়ী র্যাংক: ${getDonorBadge(donor.activity_count).text}`, 32, 305); //
    
    // ডানপাশের প্রিমিয়াম ব্লাড ড্রপ রাউন্ড সিল
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 12; //
    ctx.beginPath();
    ctx.arc(540, 175, 55, 0, Math.PI * 2); //
    ctx.fill();
    ctx.shadowBlur = 0; // Reset Shadow
    
    // গোল্ডেন রিং সিল বর্ডার
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(540, 175, 49, 0, Math.PI * 2);
    ctx.stroke();
    
    // সিল টেক্সট মেইন ব্লাড গ্রুপ
    ctx.fillStyle = '#dc2626';
    ctx.font = '900 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(donor.blood_group, 540, 188);
    
    // ফুটার সিকিউরিটি অথরিটি টেক্সট
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('স্মার্ট আইডি কার্ড', 540, 360);
    
    // ক্লায়েন্ট ব্রাউজারে ফাইল ডাউনলোড ট্রিগার করা
    const link = document.createElement('a');
    link.download = `Donor_Card_${donor.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('ডিজিটাল আইডি কার্ড সফলভাবে ডাউনলোড হয়েছে!', 'success');
  };

  const downloadCertificate = (donor) => {
    console.log(`[Canvas Studio] Generating luxury certificate of appreciation for layout rendering vector: ${donor.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 1120;
    canvas.height = 792; // স্ট্যান্ডার্ড ল্যান্ডস্কেপ সার্টিফিকেট রেজোলিউশন অনুপাত
    const ctx = canvas.getContext('2d');
    
    // লাক্সারি মার্বেল ক্রিম-হোয়াইট ডাবল ভেক্টর গ্রাডিয়েন্ট
    const mainGrad = ctx.createLinearGradient(0, 0, 1120, 792);
    mainGrad.addColorStop(0, '#ffffff');
    mainGrad.addColorStop(0.5, '#fffbf2');
    mainGrad.addColorStop(1, '#fff5e6');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, 1120, 792);
    
    // অলংকারিক রয়্যাল গোল্ডেন মেটালিক ডাবল বর্ডার ফ্রেম
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#7f1d1d';
    ctx.strokeRect(15, 15, 1090, 762);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(35, 35, 1050, 722);
    
    // চার কোণায় অলংকারিক জ্যামিতিক আর্টওয়ার্ক সিল
    const drawCornerOrnament = (x, y) => {
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(x, y, 25, 25);
    };
    drawCornerOrnament(38, 38);
    drawCornerOrnament(1057, 38);
    drawCornerOrnament(38, 729);
    drawCornerOrnament(1057, 729);
    
    // ব্যাকগ্রাউন্ডে বিশাল জলছাপ এফেক্ট (ব্লাড ড্রপলেট এফেক্ট)
    ctx.fillStyle = 'rgba(185, 28, 28, 0.025)'; //
    ctx.beginPath();
    ctx.arc(560, 420, 160, 0, Math.PI * 2); //
    ctx.fill();
    
    // হেডার টেক্সট টাইপোগ্রাফি
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif'; //
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 560, 110); //
    
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 16px system-ui, sans-serif'; //
    ctx.fillText('★ ESTD: 2013 | মানবতার সেবায় উৎসর্গীকৃত একটি সামাজিক প্রতিষ্ঠান ★', 560, 145); //
    
    // সার্টিফিকেট নাম ও উদ্দেশ্য
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 28px system-ui, sans-serif'; //
    ctx.fillText('সম্মাননা ও স্বীকৃতি স্মারক গৌরবপত্র', 560, 225); //
    
    // আন্ডারলাইন অলংকার লাইন
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 245);
    ctx.lineTo(700, 245); //
    ctx.stroke();
    
    ctx.fillStyle = '#475569';
    ctx.font = '600 18px system-ui, sans-serif'; //
    ctx.fillText('এই গৌরবপত্র অত্যন্ত আনন্দের সাথে কৃতজ্ঞচিত্তে প্রদান করা যাচ্ছে যে,', 560, 310); //
    
    // রক্তদাতার মেইন নাম হাইলাইট করা
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(donor.name, 560, 375);
    
    // প্রশংসাপত্র মূল বর্ণনা
    ctx.fillStyle = '#334155';
    ctx.font = 'medium 16px system-ui, sans-serif';
    const msg1 = `তিনি মুমূর্ষু রোগীর জীবন রক্ষার্থে স্বেচ্ছায় ও সাগ্রহে " ${donor.blood_group} " গ্রুপে সর্বমোট ${donor.activity_count || 0} বার রক্তদান করেছেন।`;
    const msg2 = `মানবতার কল্যাণে উনার এই নিঃস্বার্থ মহৎ আত্মত্যাগ ও অবদানকে ব্লাড সেন্টার নদোনা নোয়াখালী পরিবার গভীর শ্রদ্ধার সাথে`;
    const msg3 = `স্বীকৃতি ও সম্মাননা জানাচ্ছে। আমরা উনার সুস্বাস্থ্য, দীর্ঘায়ু ও সর্বাঙ্গীণ সাফল্য কামনা করি।`;
    
    ctx.fillText(msg1, 560, 435);
    ctx.fillText(msg2, 560, 470);
    ctx.fillText(msg3, 560, 505);
    
    // গোল্ডেন লাক্সারি রয়্যাল মেডেল সিল মোটিফ আর্টওয়ার্ক
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(560, 600, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.fillText('OFFICIAL SEAL', 560, 604);
    
    // সিগনেচার অথরিটি ব্লক পজিশনিং লাইন
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath(); ctx.moveTo(150, 650); ctx.lineTo(330, 650); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(790, 650); ctx.lineTo(970, 650); ctx.stroke();
    
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('পরিচালক / প্রতিষ্ঠাতা', 240, 672);
    ctx.fillText('সার্বিক সহযোগী ট্রাস্টি', 880, 672);
    
    const link = document.createElement('a');
    link.download = `Honor_Certificate_${donor.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('অফিসিয়াল সম্মাননা সার্টিফিকেট ডাউনলোড সম্পন্ন হয়েছে!', 'success');
  };

  const downloadVolunteerCard = (v) => {
    console.log(`[Canvas Studio] Generating luxury identity card layout vector for volunteer node: ${v.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 638;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // লাক্সারি রয়্যাল ব্লু থিম জ্যামিতিক গ্রাডিয়েন্ট
    const mainGrad = ctx.createLinearGradient(0, 0, 638, 400);
    mainGrad.addColorStop(0, '#ffffff');
    mainGrad.addColorStop(0.7, '#f8fafc');
    mainGrad.addColorStop(1, '#eff6ff'); //
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, 638, 400);
    
    // ডার্ড ব্লু স্টাইলিস্ট সাইড কার্ভ শেপ
    ctx.fillStyle = '#1e3a8a'; //
    ctx.beginPath();
    ctx.moveTo(440, 0); ctx.lineTo(638, 0); ctx.lineTo(638, 400); ctx.lineTo(510, 400); //
    ctx.bezierCurveTo(480, 270, 420, 130, 440, 0); //
    ctx.fill();
    
    // ফ্রেম ডাবল বর্ডার
    ctx.lineWidth = 8; ctx.strokeStyle = '#1e3a8a'; ctx.strokeRect(4, 4, 630, 392); //
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#3b82f6'; ctx.strokeRect(12, 12, 614, 376); //
    
    // হেডার ব্র্যান্ডিং
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 32, 50);
    
    ctx.fillStyle = '#2563eb';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillText('★ ভলান্টিয়ার ও সহযোগী কো-অর্ডিনেটর উইং ★', 32, 72);
    
    ctx.strokeStyle = '#dbeafe'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(32, 88); ctx.lineTo(380, 88); ctx.stroke();
    
    const renderRow = (lbl, val, y) => {
      ctx.fillStyle = '#64748b'; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.fillText(lbl, 32, y);
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 14px system-ui, sans-serif'; ctx.fillText(val, 150, y);
      ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(32, y + 8); ctx.lineTo(380, y + 8); ctx.stroke();
    };
    
    renderRow('সদস্যের নাম:', v.name, 160);
    renderRow('মোবাইল নম্বর:', v.phone, 200);
    renderRow('অর্জিত পয়েন্ট:', `${v.points || 0} স্কোর`, 240);
    renderRow('র‍্যাঙ্কিং স্ট্যাটাস:', getVolunteerBadge(v.points).text, 280);
    
    // প্রিমিয়াম রাউন্ড সিল ব্যাজ ব্যাকগ্রাউন্ড
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(540, 175, 52, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    
    ctx.lineWidth = 3; ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(540, 175, 46, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#1e3a8a'; ctx.font = '900 13px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ভলান্টিয়ার', 540, 170);
    ctx.fillStyle = '#d97706'; ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`Rank: #${getVolunteerBadge(v.points).text.split(' ')[0]}`, 540, 190);
    
    ctx.fillStyle = '#ffffff'; ctx.font = '900 12px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('VOLUNTEER', 540, 360);
    
    const link = document.createElement('a');
    link.download = `Volunteer_Card_${v.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('ভলান্টিয়ার স্মার্ট আইডি কার্ড ডাউনলোড হয়েছে!', 'success');
  };

  // ==================== ইন্ডিভিজুয়াল ডোনারের রক্তদানের ক্ষুদ্র ইতিহাস ট্র্যাকিং মোডাল ও লজিক ====================
  const openLogModal = async (donor) => {
    console.log(`[UI Action] Loading log trace modal for target donor node item: ${donor.name}`);
    setActiveLogDonor(donor);
    setShowLogModal(true);
    console.log(`[API Call] Fetching specific donation logs data subset for donor ID: ${donor.id}`);
    try {
      const { data, error: logFetchErr } = await supabase.from('donation_logs').select('*').eq('donor_id', donor.id).order('date', { ascending: false }); //
      if (logFetchErr) throw logFetchErr;
      if (data) {
        console.log(`[API Success] Found ${data.length} micro history logs linked to donor ID ${donor.id}`);
        setDonorLogs(data);
      }
    } catch (err) {
      console.error("[API Error] Failed fetching individual history metrics.", err);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    console.log("[Form Submission] handleAddLog processing runtime parameters:", newLog);
    if (!newLog.patient_name || !newLog.hospital || !newLog.date) {
      console.warn("[Validation Failed] Incomplete field sets inside nested log prompt data.");
      return showToast('সব তথ্য পূরণ করুন', 'error'); //
    }
    const payload = { 
      donor_id: activeLogDonor.id, 
      patient_name: newLog.patient_name, 
      hospital: newLog.hospital, 
      date: newLog.date 
    };
    console.log("[Database Insert] Injecting node historical logging event metrics row item.");
    const { error: logErr } = await supabase.from('donation_logs').insert([payload]); //
    if (!logErr) {
      showToast('রক্তদানের নতুন ইতিহাস যুক্ত করা হয়েছে!', 'success');
      setNewLog({ patient_name: '', hospital: '', date: '' });
      
      // দাতার টোটাল অ্যাক্টিভিটি অটোমেটিক ১ বাড়িয়ে দেওয়া লজিক
      const nextCount = (activeLogDonor.activity_count || 0) + 1;
      await supabase.from('donors').update({ activity_count: nextCount, last_donation_date: payload.date }).eq('id', activeLogDonor.id); //
      
      // উইন্ডো রিফ্রেশ ও ডাটা রি-লোডিং সিঙ্ক
      fetchDonors();
      fetchAllLogs();
      
      // রিয়েলটাইম মোডাল লোকাল এরি স্টেট ক্লোজার
      const { data: updatedLogs } = await supabase.from('donation_logs').select('*').eq('donor_id', activeLogDonor.id).order('date', { ascending: false }); //
      if (updatedLogs) setDonorLogs(updatedLogs);
    } else {
      showToast('ইতিহাস যোগ করা ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই রক্তদানের ট্র্যাকিং রেকর্ডটি ডিলিট করতে চান?')) return; //
    console.log(`[Database Destroy] Flashing history entry indexing ID: ${logId}`);
    const { error: logErr } = await supabase.from('donation_logs').delete().eq('id', logId); //
    if (!logErr) {
      showToast('রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      
      // দাতার অ্যাক্টিভিটি ট্র্যাকিং ১ কমিয়ে আপডেট সিঙ্ক
      const nextCount = Math.max(0, (activeLogDonor.activity_count || 1) - 1);
      await supabase.from('donors').update({ activity_count: nextCount }).eq('id', activeLogDonor.id); //
      
      fetchDonors();
      fetchAllLogs();
      
      // মোডাল ভিউ রি-লোডিং স্টেট সিঙ্ক আপ
      const { data: updatedLogs } = await supabase.from('donation_logs').select('*').eq('donor_id', activeLogDonor.id).order('date', { ascending: false }); //
      if (updatedLogs) setDonorLogs(updatedLogs);
    } else {
      showToast('রেকর্ডটি মুছতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  // ফিল্টারিং ও সার্চিং প্রসেসিং মেকানিজম
  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup; //
    const locationString = `${donor.location || donor.village || ''}`.toLowerCase(); //
    const matchesSearch = (donor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || locationString.includes(searchTerm.toLowerCase()); //
    const eligibility = checkEligibility(donor.last_donation_date, donor.gender); //
    let matchesEligibility = true;
    if (eligibilityFilter === 'Eligible') matchesEligibility = eligibility.isEligible; //
    if (eligibilityFilter === 'Ineligible') matchesEligibility = !eligibility.isEligible; //
    return matchesGroup && matchesSearch && matchesEligibility;
  });

  const totalDonorsCount = donors.length; //
  const totalDonationsCount = donors.reduce((acc, d) => acc + (d.activity_count || 0), 0); //
  const readyTodayCount = donors.filter(d => checkEligibility(d.last_donation_date, d.gender).isEligible).length; //

  // ==================== REUSABLE RENDERING SECTIONS ====================
  const renderNoticeSection = () => (
    <div className="space-y-6">
      <div id="emergency-board-section" className="bg-white p-5 rounded-2xl shadow border-t-4 border-red-500 space-y-4"> {/* */}
        <h2 className="text-lg font-black text-red-600 flex items-center gap-2 animate-pulse leading-relaxed">
          <Megaphone className="w-5 h-5" /> জরুরি রক্তের লাইভ নোটিশ বোর্ড {/* */}
        </h2>
        
        {isAdmin && (
          <form onSubmit={handleAddRequest} className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3"> {/* */}
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {editRequestId ? 'নোটিশ সংশোধন মোড সচল' : 'নতুন জরুরি রক্তের রিকুয়েস্ট পোস্ট করুন'} {/* */}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="রোগীর নাম বা বিবরণ" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} className="border p-2 bg-white rounded-lg text-xs" required />
              <select value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})} className="border p-2 bg-white rounded-lg text-xs font-bold">
                {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="হাসপাতালের নাম ও এলাকা" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="border p-2 bg-white rounded-lg text-xs" required />
              <input type="tel" placeholder="যোগাযোগের মোবাইল নম্বর" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="border p-2 bg-white rounded-lg text-xs" required />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <input type="text" placeholder="কখন রক্ত লাগবে? (উদাঃ আজ রাত ৮ টায়, জরুরি)" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} className="border p-2 bg-white rounded-lg text-xs" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow"><Save className="w-3.5 h-3.5" /> {editRequestId ? 'আপডেট নোটিশ' : 'লাইভ বোর্ডে পোস্ট করুন'}</button>
              {editRequestId && <button type="button" onClick={() => { setEditRequestId(null); setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); }} className="bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold">বাতিল</button>}
            </div>
          </form>
        )}

        <div className="space-y-3">
          {emergencyRequests.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6 border border-dashed rounded-xl">
              কোনো জরুরি রক্তের অনুরোধ নেই। {/* */}
            </p>
          ) : (
            emergencyRequests.map(req => {
              const formattedPhone = req.phone.replace(/[^0-9]/g, ''); //
              const waNoticeText = encodeURIComponent(`আসসালামু আলাইকুম, ব্লাড সেন্টার নদোনা নোয়াখালী থেকে আপনার জরুরি রক্তের নোটিশটির (গ্রুপ: ${req.blood_group}) পরিপ্রেক্ষিতে যোগাযোগ করছি।`); //
              const waNoticeUrl = `https://wa.me/${formattedPhone}?text=${waNoticeText}`; //
              return (
                <div key={req.id} className="border-2 border-red-100 bg-red-50/20 p-4 rounded-xl relative shadow-xs space-y-1"> {/* */}
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Droplet className="w-3 h-3 fill-white" /> {req.blood_group} {/* */}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">👤 রোগী: {req.patient_name}</h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1 font-medium"><MapPin className="w-3.5 h-3.5 text-red-400" /> স্থান: {req.hospital}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5 text-amber-500" /> সময়: {req.needed_time}</p>
                  <p className="text-xs text-slate-700 flex items-center gap-1 font-black pt-1"><Phone className="w-3.5 h-3.5 text-green-600" /> যোগাযোগ: {req.phone}</p>
                  
                  <div className="flex gap-2 pt-3 border-t border-red-100/60 mt-2">
                    <button onClick={() => handleShareRequest(req)} className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs"><Send className="w-3.5 h-3.5" /> শেয়ার টেক্সট কপি</button>
                    <a href={`tel:${req.phone}`} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center"><Phone className="w-3.5 h-3.5" /> কল</a>
                    <a href={waNoticeUrl} target="_blank" rel="noopener noreferrer" className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center"><MessageSquare className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ</a>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => handleEditRequest(req)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border shadow-xs"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteRequest(req.id)} className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-200 shadow-xs"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* স্থায়ী পরিচালনা পর্ষদ ও ট্রাস্টি মেম্বার প্যানেল */}
      <div className="bg-white p-5 rounded-2xl shadow border space-y-4">
        <h3 className="text-sm font-black text-slate-700 border-b pb-2 flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" /> স্থায়ী পরিচালনা পর্ষদ ও দাতা উপদেষ্টা উইং</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-bold text-slate-600">
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> প্রতিষ্ঠাতা সদস্য ১</div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> প্রতিষ্ঠাতা সদস্য ২</div> {/* */}
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> প্রতিষ্ঠাতা সদস্য ৩</div> {/* */}
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> প্রতিষ্ঠাতা সদস্য ৪</div> {/* */}
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> প্রতিষ্ঠাতা সদস্য ৫</div> {/* */}
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> প্রতিষ্ঠাতা সদস্য ৬</div> {/* */}
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-700">
          <Search className="w-5 h-5" /> রক্তদাতা অনুসন্ধান প্যানেল {/* */}
        </h2>
        
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" /> {/* */}
            <input type="text" placeholder="নাম বা ঠিকানা দিয়ে খুঁজুন" value={searchTerm} onChange={e => { console.log(`[Search Input] Query string mutated: ${e.target.value}`); setSearchTerm(e.target.value); setVisibleDonorsCount(10); }} className="w-full pl-10 border-2 p-3 rounded-xl text-base focus:outline-green-500 font-medium bg-white shadow-inner" /> {/* */}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-0.5 uppercase tracking-wider">রক্তের গ্রুপ ফিল্টার</label>
              <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setVisibleDonorsCount(10); }} className="w-full border-2 p-2 rounded-xl text-xs font-bold bg-white focus:outline-green-500">
                {bloodGroups.map(g => <option key={g} value={g}>{g === 'All' ? 'সব রক্তের গ্রুপ' : g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-0.5 uppercase tracking-wider">যোগ্যতা ফিল্টার</label>
              <select value={eligibilityFilter} onChange={e => { setEligibilityFilter(e.target.value); setVisibleDonorsCount(10); }} className="w-full border-2 p-2 rounded-xl text-xs font-bold bg-white focus:outline-green-500">
                <option value="All">সব রক্তদাতা</option>
                <option value="Eligible">রক্তদানে উপযুক্ত (যোগ্য)</option>
                <option value="Ineligible">সাময়িক অযোগ্য রক্তদাতা</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-400 pt-1">অনুসন্ধান ফলাফল: {filteredDonors.length} জন রক্তদাতা পাওয়া গেছে</p>

      <div className="space-y-4">
        {filteredDonors.slice(0, visibleDonorsCount).map(donor => {
          const badge = getDonorBadge(donor.activity_count);
          const elg = checkEligibility(donor.last_donation_date, donor.gender); //
          const formattedPhone = (donor.phone || '').replace(/[^0-9]/g, '');
          const waDonorText = encodeURIComponent(`আসসালামু আলাইকুম, ব্লাড সেন্টার নদোনা নোয়াখালী থেকে আপনার সাথে রক্তদানের অনুরোধের ব্যাপারে যোগাযোগ করছি।`);
          const waDonorUrl = `https://wa.me/${formattedPhone}?text=${waDonorText}`;

          return (
            <div key={donor.id} className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 space-y-4 relative"> {/* */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center shadow-inner">
                    {donor.blood_group}
                  </span>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 flex items-center gap-1.5 leading-relaxed"> {/* */}
                      <User className="w-4 h-4 text-slate-400" /> {donor.name}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium leading-normal flex items-center gap-0.5"> {/* */}
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {donor.location || donor.village || 'ঠিকানা দেওয়া হয়নি'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border leading-normal transition-all ${badge.classes}`}> {/* */}
                  {badge.text}
                </span>
              </div>

              <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border leading-relaxed ${elg.isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}> {/* */}
                <div className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> স্ট্যাটাস: {elg.statusText}</div> {/* */}
                {!elg.isEligible && elg.remainingDays > 0 && (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${elg.percent}%` }}></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold border-b pb-3">
                <div>🧬 লিঙ্গ: <span className="text-slate-700">{donor.gender || 'पुरुष'}</span></div>
                <div>⚖️ ওজন: <span className="text-slate-700">{donor.weight ? `${donor.weight} কেজি` : 'দেওয়া হয়নি'}</span></div>
                <div>🎂 বয়স: <span className="text-slate-700">{donor.age ? `${donor.age} বছর` : 'দেওয়া হয়নি'}</span></div>
                <div>🔄 মোট রক্তদান: <span className="text-red-600 font-bold">{donor.activity_count || 0} বার</span></div>
                <div className="col-span-2 pt-0.5 flex items-center gap-1">📅 সর্বশেষ রক্তদানের তারিখ: <span className="text-slate-800 font-bold">{donor.last_donation_date || 'কখনো দেওয়া হয়নি'}</span></div>
              </div>

              <div className="flex gap-2">
                {(isUnlocked || isAdmin) ? (
                  <button type="button" onClick={() => handleCopyDonorInfo(donor)} title="তথ্য কপি করুন" className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center"> {/* */}
                    <Copy className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={() => showToast('রক্তদাতার তথ্য কপি করতে ভলান্টিয়ার কোড বা মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-200 text-slate-400 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center cursor-not-allowed"> {/* */}
                    <Lock className="w-4 h-4" />
                  </button>
                )}

                {(isUnlocked || isAdmin) ? (
                  <>
                    <a href={`tel:${donor.phone}`} title="সরাসরি কল করুন" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-xs font-bold text-sm flex items-center justify-center"> {/* */}
                      <Phone className="w-4 h-4" />
                    </a>
                    <a href={waDonorUrl} target="_blank" rel="noopener noreferrer" title="হোয়াটসঅ্যাপ মেসেজ দিন" className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs font-bold text-sm flex items-center justify-center"> {/* */}
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => showToast('মোবাইল নম্বর দেখতে ও কল করতে ভলান্টিয়ার কোড বা মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed"> {/* */}
                      <Lock className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => showToast('হোয়াটসঅ্যাপ মেসেজ দিতে ডাটা আনলক করা প্রয়োজন।', 'error')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed">
                      <Lock className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button type="button" onClick={() => openLogModal(donor)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs shadow-xs border flex items-center justify-center gap-1">
                  <History className="w-3.5 h-3.5" /> ইতিহাস ট্র্যাকার
                </button>
                
                <button type="button" onClick={() => downloadDonorCard(donor)} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg shadow-xs font-bold text-xs flex items-center justify-center" title="ডিজিটাল স্মার্ট কার্ড ডাউনলোড">
                  <Download className="w-4 h-4" />
                </button>
                
                {Number(donor.activity_count) >= 1 && (
                  <button type="button" onClick={() => downloadCertificate(donor)} className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg shadow-xs font-bold text-xs flex items-center justify-center" title="সম্মাননা গৌরবপত্র ডাউনলোড">
                    <Award className="w-4 h-4" />
                  </button>
                )}

                {(isUnlocked || isAdmin) && (
                  <button type="button" onClick={() => handleEditDonor(donor)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-lg shadow-xs"><Pencil className="w-3.5 h-3.5" /></button>
                )}
                {isAdmin && (
                  <>
                    <button type="button" onClick={() => handleIncrementActivity(donor.id, donor.activity_count)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg shadow-xs font-black text-xs" title="রক্তদানের সংখ্যা +১ বৃদ্ধি">+১</button>
                    <button type="button" onClick={() => handleDeleteDonor(donor.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg shadow-xs"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredDonors.length > visibleDonorsCount && (
          <button type="button" onClick={() => setVisibleDonorsCount(prev => prev + 15)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 shadow-xs transition-all">
            আরো রক্তদাতা লোড করুন (Load More)
          </button>
        )}
      </div>
    </div>
  );

  const renderRegisterSection = () => (
    <div id="register-section" className="bg-white p-5 rounded-2xl shadow border space-y-4"> {/* */}
      <div>
        <h2 className="text-xl font-black text-slate-700 flex items-center gap-1.5 leading-none">
          <UserPlus className="w-5 h-5 text-green-500" /> {newDonor.id ? 'রক্তদাতার তথ্য সংশোধন ফরম' : 'নতুন রক্তদাতা নিবন্ধন ফরম'}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal"> {/* */}
          {newDonor.id ? 'আপনার তথ্য সংশোধন করে ডাটাবেজ আপডেট করুন' : 'আপনার সঠিক তথ্য দিয়ে মানবসেবায় এগিয়ে আসুন'} {/* */}
        </p>
      </div>

      <form onSubmit={handleRegisterDonor} className="space-y-4"> {/* */}
        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তদাতার সম্পূর্ণ নাম *</label> {/* */}
          <input type="text" placeholder="বীরশ্রেষ্ঠ মোহাম্মদ রুহুল আমিন" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required /> {/* */}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">মোবাইল নাম্বার *</label> {/* */}
          <input type="tel" placeholder="কান্ট্রি কোড সহ মোবাইল নাম্বার দিন" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required /> {/* */}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তের গ্রুপ *</label> {/* */}
            <select value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-green-500 leading-normal"> {/* */}
              {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">লিঙ্গ *</label> {/* */}
            <select value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-green-500 leading-normal">
              <option value="পুরুষ">পুরুষ</option>
              <option value="মহিলা">মহিলা</option>
              <option value="অন্যান্য">অন্যান্য</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">শারীরিক ওজন (ঐচ্ছিক)</label>
            <input type="number" placeholder="ওজন কেজি লিখুন (উদাঃ ৬৫)" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: e.target.value})} className="w-full border-2 p-3 rounded-xl text-sm focus:outline-green-500 leading-normal" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তদাতার বয়স (ঐচ্ছিক)</label>
            <input type="number" placeholder="বয়স লিখুন (উদাঃ ২৫)" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border-2 p-3 rounded-xl text-sm focus:outline-green-500 leading-normal" />
          </div>
        </div>

        {newDonor.age && (
          <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold leading-normal">
            {(Number(newDonor.age) >= 18 && Number(newDonor.age) <= 65) ? (
              <span className="text-green-600 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> বয়স: {newDonor.age} বছর (১৮ থেকে ৬৫ বছরের নির্ধারিত সীমার মধ্যে রয়েছে)।</span> {/* */}
            ) : (
              <span className="text-red-600 flex items-center gap-0.5"><X className="w-3.5 h-3.5" /> বয়স: {newDonor.age} বছর (রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে)।</span> {/* */}
            )}
            <p className="text-[10px] text-slate-400 font-medium pt-1"> 💡 শারীরিক ও মানসিকভাবে সুস্থ পুরুষরা ৪ মাস পর পর এবং মহিলারা সাধারণত ৪ থেকে ৬ মাস পর পর নিরাপদভাবে রক্তদান করতে পারেন। </p> {/* */}
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তদাতার সম্পূর্ণ ঠিকানা *</label> {/* */}
          <input type="text" placeholder="বাঘপাঁচড়া, সোনাইমুড়ী, নোয়াখালী" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required /> {/* */}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">পূর্বে কতবার রক্ত দিয়েছেন? (ঐচ্ছিক)</label> {/* */}
          <input type="number" placeholder="রক্তদানের মোট সংখ্যা লিখুন" value={newDonor.activity_count} onChange={e => setNewDonor({...newDonor, activity_count: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" /> {/* */}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)</label>
          <input type="date" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 bg-white leading-normal" />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-1.5 leading-none">
            <Save className="w-5 h-5" /> {newDonor.id ? 'তথ্য সংশোধন সম্পন্ন করুন' : 'রক্তদাতা হিসেবে ডাটাবেজে যুক্ত হোন'}
          </button>
          {newDonor.id && (
            <button type="button" onClick={() => { resetDonorForm(); setActiveTab('search'); }} className="bg-slate-200 text-slate-700 px-4 rounded-xl font-bold text-sm border">
              বাতিল
            </button>
          )}
        </div>
      </form>
    </div>
  );

  const renderVolunteerSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow border space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> ভলান্টিয়ার ও কার্যনির্বাহী জোন
          </h2>
          <p className="text-xs text-slate-400 font-semibold">ভলান্টিয়ার এক্সেস কন্ট্রোল ও ডেডিকেটেড কাজের হিসাব ট্র্যাকিং প্যানেল।</p>
        </div>

        {isUnlocked ? (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center"><Check className="w-5 h-5" /></div>
              <div>
                <h4 className="text-xs font-black text-slate-800">ভলান্টিয়ার ডাটা আনলকড আছে</h4>
                <p className="text-[10px] text-slate-400 font-bold">মোবাইল নম্বর: {volunteerPhone}</p>
              </div>
            </div>
            <button onClick={handleLockData} className="text-xs font-bold bg-white text-red-600 px-3 py-1.5 rounded-lg border border-red-200 shadow-xs flex items-center gap-0.5"><Ban className="w-3.5 h-3.5" /> পুনরায় লক করুন</button>
          </div>
        ) : (
          <form onSubmit={handleVolunteerUnlock} className="space-y-3 bg-slate-50 p-4 rounded-xl border">
            <p className="text-xs font-black text-slate-600">🔐 ভলান্টিয়ার সিকিউরিটি ও ডাটা আনলক ফর্ম</p>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input type="tel" placeholder="আপনার অনুমোদিত মোবাইল নম্বর দিন" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} className="w-full border-2 pl-9 p-2.5 rounded-xl text-sm focus:outline-red-500 leading-normal" required /> {/* */}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /> {/* */}
              <input type="password" placeholder="অ্যাডমিনের দেওয়া সিকিউরিটি কোড বা পাসওয়ার্ড দিন" value={volunteerPassword} onChange={e => setVolunteerPassword(e.target.value)} className="w-full border-2 pl-9 p-2.5 rounded-xl text-sm focus:outline-red-500 leading-normal" required /> {/* */}
            </div>
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1"> {/* */}
              <Unlock className="w-4 h-4" /> ভলান্টিয়ার ডাটা আনলক করুন {/* */}
            </button>
          </form>
        )}
      </div>

      {/* ভলান্টিয়ার লিডারবোর্ড মডিউল */}
      <div className="bg-white p-5 rounded-2xl shadow border border-blue-100 space-y-3"> {/* */}
        <h3 className="text-base font-black text-blue-600 flex items-center gap-1.5"> {/* */}
          <Award className="w-5 h-5 text-amber-500 fill-amber-500" /> ভলান্টিয়ার লিডারবোর্ড (সক্রিয়তা তালিকা) {/* */}
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold leading-none">ডোনার রেজিস্ট্রেশন ও ম্যানেজ করার উপর ভিত্তি করে তৈরি রিয়েলটাইম র‍্যাংকিং।</p> {/* */}
        <div className="space-y-2 max-h-48 overflow-y-auto pt-1"> {/* */}
          {volunteers.map((v, idx) => {
            const vBadge = getVolunteerBadge(v.points); //
            return (
              <div key={v.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50"> {/* */}
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">#{idx + 1}</span>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{v.name}</h5>
                    <p className="text-[9px] text-slate-400 font-bold">{v.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${vBadge.classes}`}>{vBadge.text}</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{v.points || 0}★</span>
                  <button type="button" onClick={() => downloadVolunteerCard(v)} className="p-1 bg-white hover:bg-slate-100 border text-slate-600 rounded-md shadow-xs" title="ভলান্টিয়ার আইডি ডাউনলোড"><Download className="w-3.5 h-3.5" /></button>
                  {isAdmin && (
                    <div className="flex items-center gap-0.5 border-l pl-1">
                      <button onClick={() => handleEditVolunteer(v)} className="text-slate-500 p-1 hover:bg-slate-100 rounded"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`p-1 rounded ${v.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`} title={v.is_active ? "ব্লক করুন" : "আনব্লক করুন"}>
                        {v.is_active ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      </button>
                      <button onClick={() => handleDeleteVolunteer(v.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* অ্যাডমিন প্যানেল দ্বারা নতুন ভলান্টিয়ার অনুমোদন ফরম */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-2xl shadow border-2 border-dashed space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">⚙️ {editVolunteerId ? 'ভলান্টিয়ার অ্যাকাউন্ট সংশোধন ফরম' : 'নতুন ভলান্টিয়ার অ্যাকাউন্ট অনুমোদন ফরম'}</h3>
          <form onSubmit={handleAddVolunteer} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="ভলান্টিয়ারের নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} className="border p-2 rounded-lg text-xs" required />
              <input type="tel" placeholder="মোবাইল নম্বর" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} className="border p-2 rounded-lg text-xs" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="কাস্টম সিকিউরিটি পাসওয়ার্ড" value={newVolunteer.password} onChange={e => setNewVolunteer({...newVolunteer, password: e.target.value})} className="border p-2 rounded-lg text-xs" required />
              <input type="number" placeholder="শুরুর পয়েন্ট স্কোর (ঐচ্ছিক)" value={newVolunteer.points} onChange={e => setNewVolunteer({...newVolunteer, points: e.target.value})} className="border p-2 rounded-lg text-xs" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow"><UserPlus className="w-3.5 h-3.5" /> {editVolunteerId ? 'আপডেট তথ্য' : 'নতুন ভলান্টিয়ার অনুমোদন করুন'}</button>
              {editVolunteerId && <button type="button" onClick={() => { setEditVolunteerId(null); setNewVolunteer({ name: '', phone: '', password: '', points: '' }); }} className="bg-slate-200 text-slate-700 px-3 text-xs font-bold rounded-lg">বাতিল</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased font-sans pb-12">
      {/* গ্লোবাল কাস্টম অ্যাপ নোটিফিকেশন বার */}
      {notification.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 border animate-bounce text-white transition-all ${notification.type === 'success' ? 'bg-green-600 border-green-500' : notification.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* মেইন প্রিমিয়াম হেডার ব্যানার */}
      <header className="bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white text-center pt-8 pb-14 px-4 relative shadow-md">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {isAdmin ? (
            <button onClick={() => { setIsAdmin(false); showToast('অ্যাডমিন মোড থেকে সফলভাবে লগআউট করা হয়েছে।', 'info'); }} className="bg-black/40 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1 shadow backdrop-blur-xs transition-all"><LogOut className="w-3 h-3" /> অ্যাডমিন এক্সিট</button>
          ) : (
            <button onClick={() => setShowAdminLogin(true)} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1 shadow backdrop-blur-xs transition-all"><Shield className="w-3 h-3" /> অ্যাডমিন লগইন</button>
          )}
          {isAdmin && (
            <button onClick={() => setShowPassModal(true)} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/10 shadow backdrop-blur-xs" title="পাসওয়ার্ড পরিবর্তন"><Lock className="w-3.5 h-3.5" /></button>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow flex items-center justify-center gap-2">
          <Droplet className="w-7 h-7 fill-white text-white animate-pulse" /> ব্লাড সেন্টার নদোনা নোয়াখালী
        </h1>
        <p className="text-xs font-bold text-red-100 opacity-90 mt-1 uppercase tracking-wide">★ মানবতার সেবায় উৎসর্গীকৃত একটি সামাজিক প্রতিষ্ঠান ★</p>

        {/* মেইন স্ট্যাটিস্টিকস ড্যাশবোর্ড কাউন্টার মডিউল */}
        <div className="absolute -bottom-10 left-4 right-4 max-w-lg mx-auto bg-white rounded-2xl shadow-xl border p-3.5 grid grid-cols-3 gap-2 text-center text-slate-700 divide-x divide-slate-100">
          <div>
            <span className="block text-lg font-black text-slate-800 leading-none">{totalDonorsCount}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">মোট নিবন্ধিত ডোনার</span>
          </div>
          <div>
            <span className="block text-lg font-black text-red-600 leading-none">{totalDonationsCount}+</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">টোটাল রক্তদান সংখ্যা</span>
          </div>
          <div>
            <span className="block text-lg font-black text-green-600 leading-none">{readyTodayCount}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">আজ রক্তদানে প্রস্তুত</span>
          </div>
        </div>
      </header>

      {/* অ্যাডমিন অথেনটিকেশন ফর্ম মোডাল */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1"><Shield className="w-5 h-5 text-red-600" /> কেন্দ্রীয় অ্যাডমিন লগইন ভেরিফিকেশন</h3>
              <p className="text-[11px] text-slate-400 font-semibold">শুধুমাত্র ব্লাড সেন্টার নদোনার মূল প্যানেল পরিচালকদের জন্য সংরক্ষিত।</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input type="text" placeholder="ইউজার আইডি (User ID)" value={userId} onChange={e => setUserId(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-xl text-base focus:outline-red-500 leading-normal" required /> {/* */}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /> {/* */}
                <input type={showPassword ? "text" : "password"} placeholder="গোপন পাসওয়ার্ড দিন" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 pl-10 pr-10 p-3 rounded-xl text-base focus:outline-red-500 leading-normal" required /> {/* */}
                <button type="button" onClick={() => { console.log(`[UI Action] Password obfuscation state toggled. Now visible: ${!showPassword}`); setShowPassword(!showPassword); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 focus:outline-none">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} {/* */}
                </button>
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md leading-normal"> {/* */}
                <Zap className="w-4 h-4" /> লগইন ভেরিফাই করুন {/* */}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* মেইন বডি লেআউট এবং ট্যাব সিলেকশন মেনু */}
      <main className="max-w-lg mx-auto px-4 mt-14 space-y-6">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-300"> {/* */}
            {/* স্বাগতম বার্তা ও শর্টকাট নেভিগেশন কার্ড */}
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 p-5 rounded-2xl border border-red-100 shadow-xs space-y-3">
              <h3 className="text-base font-black text-red-800 flex items-center gap-1 leading-none"><Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" /> আসসালামু আলাইকুম !</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">ব্লাড সেন্টার নদোনা নোয়াখালী অ্যাপে আপনাকে স্বাগতম। ২০১৩ সাল থেকে আমাদের এই সামাজিক স্বেচ্ছাসেবী প্ল্যাটফর্মটি নোয়াখালী সোনাইমুড়ী সহ দেশজুড়ে মুমূর্ষু রোগীদের জরুরি রক্তের সুব্যবস্থা করতে কাজ করে যাচ্ছে।</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => setActiveTab('search')} className="bg-red-600 text-white py-2 rounded-xl text-xs font-black shadow flex items-center justify-center gap-1"><Search className="w-4 h-4" /> রক্তদাতা খুঁজুন</button>
                <button onClick={() => setActiveTab('register')} className="bg-white text-slate-700 border hover:bg-slate-50 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1"><UserPlus className="w-4 h-4 text-green-500" /> ডোনার রেজিস্ট্রেশন</button>
              </div>
            </div>
            {/* হোম ট্যাবে ডিফল্টভাবে নোটিশ বোর্ড লোড করে রাখা */}
            {renderNoticeSection()}
          </div>
        )}

        {activeTab === 'notice' && renderNoticeSection()}
        {activeTab === 'search' && renderSearchSection()}
        {activeTab === 'register' && renderRegisterSection()}
        {activeTab === 'volunteer' && renderVolunteerSection()}
      </main>

      {/* ইন্ডিভিজুয়াল ডোনার রক্তদান ইতিহাস ট্র্যাকিং মোডাল উইন্ডো */}
      {showLogModal && activeLogDonor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl relative border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => { setShowLogModal(false); setActiveLogDonor(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1"><History className="w-4 h-4 text-red-600" /> রক্তদানের ইতিহাস ট্র্যাকার প্যানেল</h3>
              <p className="text-[10px] text-slate-400 font-bold">রক্তদাতা: {activeLogDonor.name} ({activeLogDonor.blood_group})</p>
            </div>

            {/* অ্যাডমিন বা ভলান্টিয়ার আনলকড থাকলে ইতিহাস যুক্ত করার ফর্ম */}
            {(isAdmin || isUnlocked) && (
              <form onSubmit={handleAddLog} className="bg-slate-50 p-3 rounded-xl border space-y-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">➕ রক্তদানের নতুন রেকর্ড যুক্ত করুন</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="রোগীর নাম" value={newLog.patient_name} onChange={e => setNewLog({...newLog, patient_name: e.target.value})} className="border bg-white p-2 rounded-lg text-xs" required />
                  <input type="text" placeholder="হাসপাতাল / স্থান" value={newLog.hospital} onChange={e => setNewLog({...newLog, hospital: e.target.value})} className="border bg-white p-2 rounded-lg text-xs" required />
                </div>
                <div className="grid grid-cols-1">
                  <input type="date" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="border bg-white p-2 rounded-lg text-xs" required />
                </div>
                <button type="submit" className="w-full bg-slate-800 text-white text-xs font-black py-1.5 rounded-lg shadow flex items-center justify-center gap-0.5"><Plus className="w-3.5 h-3.5" /> সাবমিট রেকর্ড</button>
              </form>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">ঐতিহাসিক রেকর্ড তালিকা ({donorLogs.length})</p>
              {donorLogs.length === 0 ? (
                <p className="text-center text-[11px] text-slate-400 py-4 border border-dashed rounded-lg">কোনো রক্তদানের পূর্বের ইতিহাস ডাটাবেজে পাওয়া যায়নি।</p>
              ) : (
                donorLogs.map(log => (
                  <div key={log.id} className="p-2.5 border rounded-xl bg-slate-50/40 flex items-center justify-between text-xs font-medium text-slate-600">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>🏥 হাসপাতাল: <span className="text-slate-800 font-bold">{log.hospital}</span></div>
                      <p className="text-[11px] text-slate-500">রোগী: {log.patient_name} | তারিখ: {log.date}</p> {/* */}
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 p-1 hover:bg-red-50 rounded-lg"> {/* */}
                        <Trash2 className="w-3.5 h-3.5" /> {/* */}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* মাস্টার সিকিউরিটি কোড দ্বারা এডমিন পাসওয়ার্ড পরিবর্তন মোডাল */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs"> {/* */}
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl relative border space-y-4">
            <button onClick={() => { setShowPassModal(false); setMasterCode(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1">🔒 অ্যাডমিন সিকিউরিটি পাসওয়ার্ড পরিবর্তন</h3>
              <p className="text-[10px] text-slate-400 font-bold">মাস্টার অথেন্টিকেশন কি-এর মাধ্যমে পাসওয়ার্ড পরিবর্তন কোড সেশন।</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">মাস্টার ভেরিফিকেশন কোড (Master Code) *</label>
                <input type="password" placeholder="মাস্টার অথেন্টিকেশন কোড লিখুন" value={masterCode} onChange={e => setMasterCode(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm focus:outline-red-500" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">নতুন গোপন অ্যাডমিন পাসওয়ার্ড (New Password) *</label>
                <input type="text" placeholder="নতুন শক্তিশালী পাসওয়ার্ড সেট করুন" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm focus:outline-red-500" required />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow leading-normal flex items-center justify-center gap-1"> {/* */}
                  <RefreshCw className="w-4 h-4" /> আপডেট করুন {/* */}
                </button>
                <button type="button" onClick={() => { console.log("[UI Action] Password change model cancelled."); setShowPassModal(false); setMasterCode(''); }} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-1"> {/* */}
                  <X className="w-4 h-4" /> বাতিল {/* */}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* প্রিমিয়াম বটম ফিক্সড বাটন নেভিগেশন বার */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-40 max-w-lg mx-auto rounded-t-2xl px-2 py-2 flex items-center justify-around text-slate-400 select-none">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${activeTab === 'home' ? 'text-red-600 font-black scale-110' : 'font-bold text-[11px]'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px]">হোম</span>
        </button>
        <button onClick={() => setActiveTab('notice')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all relative ${activeTab === 'notice' ? 'text-red-600 font-black scale-110' : 'font-bold text-[11px]'}`}>
          <Megaphone className="w-5 h-5" />
          {emergencyRequests.length > 0 && <span className="absolute top-1 right-5 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">{emergencyRequests.length}</span>}
          <span className="text-[10px]">নোটিশ বোর্ড</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${activeTab === 'search' ? 'text-red-600 font-black scale-110' : 'font-bold text-[11px]'}`}>
          <Search className="w-5 h-5" />
          <span className="text-[10px]">খুঁজুন</span>
        </button>
        <button onClick={() => setActiveTab('register')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${activeTab === 'register' ? 'text-red-600 font-black scale-110' : 'font-bold text-[11px]'}`}>
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px]">নিবন্ধন</span>
        </button>
        <button onClick={() => setActiveTab('volunteer')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${activeTab === 'volunteer' ? 'text-blue-600 font-black scale-110' : 'font-bold text-[11px]'}`}>
          <Shield className="w-5 h-5" />
          <span className="text-[10px]">ভলান্টিয়ার</span>
        </button>
      </nav>

      {/* অফিসিয়াল মডার্ন ফুটার সেকশন */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed pb-16"> {/* */}
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p> {/* */}
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p> {/* */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto whitespace-nowrap"> {/* */}
          <span className="text-xs font-medium text-slate-400 leading-normal">কারিগরি সহযোগিতায়:</span> {/* */}
          <span className="text-xs font-black text-slate-600 bg-slate-200/60 px-3 py-1 rounded-full border">
            অ্যাপ ডেভেলপার: গিয়াস উদ্দিন {/* */}
          </span>
        </div>
      </footer>
    </div>
  );
}
