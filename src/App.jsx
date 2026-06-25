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
  const [visibleDonorsCount, setVisibleDonorsCount] = useState(10);
  
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
  
  // নতুন পাসওয়ার্ড ফিল্ড সহ ভলান্টিয়ার স্টেট
  const [newVolunteer, setNewVolunteer] = useState({ name: '', phone: '', password: '', points: '' });
  const [editVolunteerId, setEditVolunteerId] = useState(null);

  // নোয়াখালী পোস্ট স্টেট
  const [noakhaliPosts, setNoakhaliPosts] = useState([]);
  const [newNp, setNewNp] = useState({ caption: '', file: null, mediaType: 'image' });
  const [isUploadingNp, setIsUploadingNp] = useState(false);

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

  // নতুন অ্যাডভান্সড ফিচারের স্টেটসমূহ
  const [selectedDonorForCard, setSelectedDonorForCard] = useState(null);
  const [selectedVolunteerForCard, setSelectedVolunteerForCard] = useState(null);
  const [donorLogs, setDonorLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogDonor, setActiveLogDonor] = useState(null);
  const [newLog, setNewLog] = useState({ patient_name: '', hospital: '', date: '' });
  
  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // কাস্টম নোটিফিকেশন প্রদর্শনকারী হেল্পার
  const showToast = (message, type = 'info') => {
    console.log(`Toast Notification [${type}]: ${message}`);
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // অ্যাপ লোড হওয়ার সাথে সাথে ডাটাবেজ থেকে ডাটা আনা
  useEffect(() => {
    console.log("Application initialized. Fetching core data configurations...");
    fetchDonors();
    fetchRequests();
    fetchAllLogs();
    fetchNoakhaliPosts();
    
    // অফলাইন ক্যাশ সাপোর্ট লোড
    const cachedDonors = localStorage.getItem('cached_donors');
    const cachedRequests = localStorage.getItem('cached_requests');
    if (cachedDonors) {
      console.log("Loaded donors data layer from localStorage cache.");
      setDonors(JSON.parse(cachedDonors));
    }
    if (cachedRequests) {
      console.log("Loaded emergency requests layout from localStorage cache.");
      setEmergencyRequests(JSON.parse(cachedRequests));
    }

    const savedPhone = localStorage.getItem('v_phone');
    const savedPass = localStorage.getItem('v_pass');
    if (savedPhone && savedPass) {
      console.log("Found existing volunteer session in cache storage. Attempting auto-login...");
      checkVolunteerAccess(savedPhone, savedPass);
    }
  }, []);

  useEffect(() => {
    console.log(`Admin status changed to: ${isAdmin}. Refreshing volunteer list leaderboard.`);
    fetchVolunteers(); // লিডারবোর্ডের জন্য ভলান্টিয়ার ডাটা সবসময় রিড করা প্রয়োজন
  }, [isAdmin]);

  const fetchNoakhaliPosts = async () => {
    try {
      const { data, error } = await supabase.from('noakhali_posts').select('*').order('created_at', { ascending: false });
      if (data) setNoakhaliPosts(data);
    } catch (e) {
      console.error("Error fetching Noakhali posts:", e);
    }
  };

  const handleNpFileChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setNewNp({...newNp, file, mediaType: type});
    }
  };

  const handleAddNp = async (e) => {
    e.preventDefault();
    if (noakhaliPosts.length >= 2) {
      return showToast('সর্বোচ্চ ২টি পোস্ট করা যাবে। ৩ নাম্বার পোস্ট করতে পূর্বের একটি ডিলিট করুন।', 'error');
    }
    if (!newNp.caption && !newNp.file) return showToast('ক্যাপশন বা ছবি/ভিডিও দিন', 'error');

    setIsUploadingNp(true);
    let media_url = '';
    let media_path = '';

    if (newNp.file) {
      const fileExt = newNp.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      media_path = `posts/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('noakhali_media').upload(media_path, newNp.file);
      
      if (uploadError) {
        setIsUploadingNp(false);
        return showToast('ফাইল আপলোড ব্যর্থ: ' + uploadError.message, 'error');
      }
      const { data: publicData } = supabase.storage.from('noakhali_media').getPublicUrl(media_path);
      media_url = publicData.publicUrl;
    }

    const { error: insertErr } = await supabase.from('noakhali_posts').insert([{
      caption: newNp.caption,
      media_url: media_url,
      media_type: newNp.file ? newNp.mediaType : null,
      media_path: media_path
    }]);
    
    setIsUploadingNp(false);
    if (!insertErr) {
      showToast('নোয়াখালী পোস্ট সফলভাবে যুক্ত হয়েছে!', 'success');
      setNewNp({ caption: '', file: null, mediaType: 'image' });
      fetchNoakhaliPosts();
    } else {
      showToast('পোস্ট করতে ব্যর্থ: ' + insertErr.message, 'error');
    }
  };

  const handleDeleteNp = async (post) => {
    if(confirm('আপনি কি নিশ্চিতভাবে এই পোস্টটি ডিলিট করতে চান?')) {
      if (post.media_path) {
        await supabase.storage.from('noakhali_media').remove([post.media_path]);
      }
      const { error } = await supabase.from('noakhali_posts').delete().eq('id', post.id);
      if(!error) {
        showToast('পোস্ট অটো ডিলিট করা হয়েছে।', 'success');
        fetchNoakhaliPosts();
      } else {
        showToast('ডিলিট করতে ব্যর্থ: ' + error.message, 'error');
      }
    }
  };

  const fetchDonors = async () => {
    console.log("Invoking fetchDonors from Supabase...");
    try {
      const { data, error: fetchErr } = await supabase.from('donors').select('*').order('activity_count', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`Successfully loaded ${data.length} donors records.`);
        setDonors(data);
        localStorage.setItem('cached_donors', JSON.stringify(data)); // অফলাইন ক্যাশিং
      }
    } catch (e) {
      console.error("Offline mode or error tracking donor loading sequence. Falling back to cache.", e);
    }
  };

  const fetchRequests = async () => {
    console.log("Invoking fetchRequests from Supabase notice-board layers...");
    try {
      const { data, error: fetchErr } = await supabase.from('emergency_requests').select('*').order('id', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`Successfully loaded ${data.length} emergency notices.`);
        setEmergencyRequests(data);
        localStorage.setItem('cached_requests', JSON.stringify(data)); // অফলাইন নোটিশ ক্যাশিং
      }
    } catch (e) {
      console.error("Offline mode requests tracking loading sequence failed. Using cache.", e);
    }
  };

  const fetchVolunteers = async () => {
    console.log("Invoking fetchVolunteers data payload for leaderboard systems...");
    try {
      const { data, error: fetchErr } = await supabase.from('volunteers').select('*').order('points', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`Successfully sync completed for ${data.length} volunteer records.`);
        setVolunteers(data);
      }
    } catch (e) {
      console.error("Error executing volunteer records indexing pipelines:", e);
    }
  };

  // সামগ্রিক রক্তদানের ইতিহাস নিয়ে আসার ফাংশন
  const fetchAllLogs = async () => {
    console.log("Invoking global sync for fetchAllLogs historical tracker...");
    try {
      const { data, error: fetchErr } = await supabase.from('donation_logs').select('*').order('date', { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        console.log(`Global sync trace matched: ${data.length} donation records tracked dynamically.`);
        setAllLogs(data);
      }
    } catch (e) {
      console.error("Error capturing system wide global donation history tracking logs:", e);
    }
  };

  // আপডেট করা ডাইনামিক ৬-স্তর বিশিষ্ট ডোনার ব্যাজ নির্ধারণকারী লজিক
  const getDonorBadge = (count) => {
    const num = Number(count) || 0;
    if (num === 0) return { text: 'নতুন রক্তদাতা', classes: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (num <= 2) return { text: 'উদীয়মান দাতা', classes: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (num <= 5) return { text: 'নিয়মিত দাতা', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (num <= 9) return { text: 'স্টার দাতা', classes: 'bg-green-100 text-green-700 border-green-200' };
    if (num <= 14) return { text: 'সুপার হিরো', classes: 'bg-yellow-100 text-yellow-700 border-yellow-300 font-black animate-pulse shadow-xs' };
    return { text: 'রেড ডায়মন্ড', classes: 'bg-purple-100 text-purple-700 border-purple-300 font-black tracking-wide shadow animate-bounce' };
  };

  // ভলান্টিয়ারদের সফল কাজের ওপর ভিত্তি করে রিয়েলটাইম মেডেল নির্ধারণ
  const getVolunteerBadge = (points) => {
    const pts = Number(points) || 0;
    if (pts >= 15) return { text: 'প্লাটিনাম লিডার', classes: 'bg-purple-600 text-white' };
    if (pts >= 8) return { text: 'গোল্ডেন স্টার', classes: 'bg-yellow-500 text-white' };
    return { text: 'সক্রিয় সদস্য', classes: 'bg-blue-500 text-white' };
  };

  const handleVolunteerUnlock = async (e) => {
    e.preventDefault();
    console.log(`Form trigger: Processing volunteer verification request via client layer. Phone: ${volunteerPhone}`);
    await checkVolunteerAccess(volunteerPhone, volunteerPassword);
  };

  const checkVolunteerAccess = async (phone, pass) => {
    console.log(`Executing checkVolunteerAccess verification sequence targeting phone identifier: ${phone}`);
    const { data, error: dbError } = await supabase
      .from('volunteers')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();
      
    if (data) {
      const dbPass = data.password || data.code || '';
      if (dbPass === pass || !dbPass) {
        console.log("Volunteer authentication parameters validated successfully.");
        setIsUnlocked(true);
        localStorage.setItem('v_phone', phone);
        localStorage.setItem('v_pass', pass);
        setVolunteerPhone(phone);
        setVolunteerPassword(pass);
        showToast('ডাটা সফলভাবে আনলক হয়েছে!', 'success');
      } else {
        console.warn("Credential mismatch captured during volunteer security authorization.");
        showToast('দুঃখিত! ভলান্টিয়ার সিকিউরিটি কোড বা পাসওয়ার্ডটি সঠিক নয়।', 'error');
        setIsUnlocked(false);
      }
    } else {
      if (dbError && dbError.code === 'PGRST116') {
        console.warn(`Target phone identity record status is inactive or does not exist inside directory parameters: ${phone}`);
        showToast('দুঃখিত! এই মোবাইল নাম্বারটি ভলান্টিয়ার তালিকায় নেই অথবা ব্লক করা আছে।', 'error');
        setIsUnlocked(false);
        localStorage.removeItem('v_phone');
        localStorage.removeItem('v_pass');
      } else if (dbError) {
        console.error("Database querying pipelines failure during auth checking procedures:", dbError);
        showToast('নেটওয়ার্ক সমস্যা! অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
      } else {
        setIsUnlocked(false);
        localStorage.removeItem('v_phone');
        localStorage.removeItem('v_pass');
      }
    }
  };

  const handleLockData = () => {
    console.log("Revoking application authorization level. Locking modules data components...");
    setIsUnlocked(false);
    localStorage.removeItem('v_phone');
    localStorage.removeItem('v_pass');
    setVolunteerPhone('');
    setVolunteerPassword('');
    showToast('ডাটা পুনরায় লক করা হয়েছে।', 'info');
  };

  const checkEligibility = (lastDate, gender) => {
    if (!lastDate) return { isEligible: true, statusText: 'বর্তমানে রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100, remainingDays: 0 };
    const today = new Date(); 
    const donationDate = new Date(lastDate);
    if (donationDate > today) {
      return { isEligible: false, statusText: 'সাময়িক অযোগ্য (ভবিষ্যতের তারিখ দেওয়া হয়েছে)', percent: 0, remainingDays: 0 };
    }
    
    const diffTime = today - donationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const requiredDays = gender === 'মহিলা' ? 180 : 120;
    
    if (diffDays >= requiredDays) {
      return { isEligible: true, statusText: 'বর্তমানে রক্তদানের জন্য উপযুক্ত (যোগ্য)', percent: 100, remainingDays: 0 };
    } else {
      const remainingDays = requiredDays - diffDays;
      const remainingMonths = Math.ceil(remainingDays / 30);
      const percent = Math.min(100, Math.max(0, Math.round((diffDays / requiredDays) * 100)));
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
    console.log("Initiating handleRegisterDonor event payload submission process...", newDonor);
    if (!newDonor.name || !newDonor.phone || !newDonor.address) {
      console.warn("Validation intercept: Missing required registration properties.");
      return showToast('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন', 'error');
    }
    
    if (newDonor.age && (Number(newDonor.age) < 18 || Number(newDonor.age) > 65)) {
      console.warn(`Age boundaries validation failure detected for registry candidate: ${newDonor.age}`);
      return showToast('দুঃখিত, রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে।', 'error');
    }
    if (newDonor.weight && Number(newDonor.weight) < 45) {
      console.warn(`Weight specifications requirement validation failure: ${newDonor.weight}`);
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
      console.log(`Processing update query execution cycle inside donors matrix target mapping ID: ${newDonor.id}`);
      const { error: submitError } = await supabase.from('donors').update(donorPayload).eq('id', newDonor.id);
      if (submitError) {
        console.error("Supabase engine database update operations rejection captured:", submitError);
        showToast('তথ্য সংশোধন ব্যর্থ: ' + submitError.message, 'error');
      } else {
        console.log("Donor profile modified records persisted successfully.");
        if (isUnlocked && !isAdmin) {
          console.log(`Incrementing loyalty volunteer points configuration targeting system operator tracking phone identifier: ${volunteerPhone}`);
          await supabase.rpc('increment_volunteer_points', { v_phone: volunteerPhone });
          fetchVolunteers();
        }
        showToast('রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', 'success');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); 
      }
    } else {
      console.log("Processing transactional insertion configuration for a new donor registry profile.");
      const { error: submitError } = await supabase.from('donors').insert([donorPayload]);
      if (submitError) {
        console.error("Supabase record insertions exception captured during operations execution:", submitError);
        if (submitError.code === '23505') {
          showToast('এই নাম্বারটি দিয়ে অলরেডি রেজিস্ট্রেশন করা আছে!', 'error');
        } else {
          showToast('নিবন্ধন ব্যর্থ হয়েছে: ' + submitError.message, 'error');
        }
      } else {
        console.log("New donor directory object registered safely inside tracking vectors.");
        if (isUnlocked && !isAdmin) {
          console.log(`Attributing points configuration increments tracking reference key operator via phone parameter: ${volunteerPhone}`);
          await supabase.rpc('increment_volunteer_points', { v_phone: volunteerPhone });
          fetchVolunteers();
        }
        showToast('রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!', 'success');
        resetDonorForm();
        fetchDonors();
        setActiveTab('search'); 
      }
    }
  };

  const resetDonorForm = () => {
    console.log("Resetting structural donor state property attributes back to initial defaults configuration map.");
    setNewDonor({ 
      id: null, name: '', blood_group: 'A+', phone: '', address: '',
      last_donation_date: '', gender: 'পুরুষ', weight: '', age: '', activity_count: ''
    });
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    console.log("Initiating notice management transactional pipeline parameters...", newRequest);
    if (editRequestId) {
      console.log(`Executing target modify parameters routing query for emergency request mapping ID: ${editRequestId}`);
      const { error: reqError } = await supabase.from('emergency_requests').update(newRequest).eq('id', editRequestId);
      if (!reqError) {
        console.log("Target records fields adjusted inside emergency notice registries table layer safely.");
        showToast('জরুরি রক্তের নোটিশ সফলভাবে সংশোধন হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        setEditRequestId(null);
        fetchRequests();
      } else {
        console.error("Supabase query execution error during editing process of target emergency data:", reqError);
        showToast('নোটিশ সংশোধন করতে ব্যর্থ: ' + reqError.message, 'error');
      }
    } else {
      console.log("Inserting new emergency request live notice message onto board schema.");
      const { error: reqError } = await supabase.from('emergency_requests').insert([newRequest]);
      if (!reqError) {
        console.log("Live emergency alert record propagated across application indices.");
        showToast('জরুরি রক্তের নোটিশ বোর্ড আপডেট হয়েছে!', 'success');
        setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' });
        fetchRequests();
      } else {
        console.error("Supabase record insertions exception while publishing emergency notice payload:", reqError);
        showToast('নোটিশ পোস্ট করতে ব্যর্থ: ' + reqError.message, 'error');
      }
    }
  };

  const handleEditRequest = (req) => {
    console.log(`Mapping targeted request properties onto internal editing buffer tracking matrix. ID: ${req.id}`);
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
    console.log(`Executing confirmation evaluations routing layer context for request deletion task mapping target ID: ${id}`);
    if (confirm('আপনি কি নিশ্চিতভাবে এই জরুরি নোটিশটি মুছে ফেলতে চান?')) {
      const { error: reqError } = await supabase.from('emergency_requests').delete().eq('id', id);
      if (!reqError) {
        console.log(`Successfully completed tracking wipe routine on emergency query matching ID context: ${id}`);
        showToast('নোটিশটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchRequests();
      } else {
        console.error(`Deletion routine exception caught on emergency tracker module targeted map key: ${id}`, reqError);
        showToast('নোটিশ ডিলিট করতে ব্যর্থ: ' + reqError.message, 'error');
      }
    }
  };

  const handleIncrementActivity = async (id, currentCount) => {
    console.log(`Admin processing activity tracking adjustments command routine layer sequence for target profile index tracker: ${id}. Initial baseline count: ${currentCount}`);
    if (!isAdmin) {
      console.warn("Authorization intercept: Non-admin trying to fire execution block on restricted incrementer logic context.");
      return;
    }
    const { error: actError } = await supabase.from('donors').update({ activity_count: currentCount + 1 }).eq('id', id);
    if (!actError) {
      console.log(`Target database mutations confirmed for object registry mapping ID index: ${id}. Transmitted value metrics updated.`);
      showToast('রক্তদানের সংখ্যা বৃদ্ধি করা হয়েছে!', 'success');
      fetchDonors();
    } else {
      console.error(`Mutation block runtime failure during metrics calculation execution sequence tracker ID key: ${id}`, actError);
      showToast('আপডেট ব্যর্থ হয়েছে: ' + actError.message, 'error');
    }
  };

  const handleEditDonor = (donor) => {
    console.log(`Triggering modify data state setup context structure interface targeting donor context: ${donor.id}`);
    if (!isAdmin && !isUnlocked) {
      console.warn("Access intercept: Registry editing access verification parameters evaluation failed due to locked client instance.");
      return showToast('অনুগ্রহ করে ভলান্টিয়ার কোড বা নাম্বার দিয়ে ডাটা আনলক করুন', 'error');
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
    console.log(`Processing explicit data record termination mapping matrix array request target profile reference index tracker key ID: ${id}`);
    if (!isAdmin) {
      console.warn("Wipe protocol termination signal canceled: Admin capabilities verified state false.");
      return showToast('শুধুমাত্র মূল অ্যাডমিন প্যানেল থেকে তথ্য ডিলিট করা সম্ভব।', 'error');
    }
    if (confirm('আপনি কি নিশ্চিতভাবে এই রক্তদাতার সম্পূর্ণ রেকর্ড ডিলিট করতে চান?')) {
      const { error: delError } = await supabase.from('donors').delete().eq('id', id);
      if (!delError) {
        console.log(`Wipe routing process sequence successfully evaluated targeting resource object code schema key: ${id}`);
        showToast('রক্তদাতার তথ্য সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchDonors();
      } else {
        console.error(`Data record termination framework failed mapping parameters on unique reference identity key tracking: ${id}`, delError);
        showToast('ডিলিট ব্যর্থ হয়েছে: ' + delError.message, 'error');
      }
    }
  };

  const handleCopyDonorInfo = (donor) => {
    console.log(`Executing target text compilation parsing string buffer mapping for template layout matching item target sequence: ${donor.id}`);
    if (!isUnlocked && !isAdmin) {
      console.warn("Interception: Protected directory copying block activated due to unauthorized identity states validation context.");
      showToast('রক্তদাতার তথ্য কপি করতে ভলান্টিয়ার মোবাইল নাম্বার ও পাসওয়ার্ড দিয়ে ডাটা আনলক করুন।', 'error');
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
      console.log("Clipboard string buffer allocation mapping successfully written by internal script action logic.");
      showToast('রক্তদাতার সমস্ত তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    } catch (e) {
      console.error("Browser text copying capabilities invocation threw unexpected exception layout handling track context:", e);
      showToast('কপি করতে ব্যর্থ হয়েছে, অনুগ্রহ করে ম্যানুয়ালি কপি করুন।', 'error');
    }
  };

  const handleShareRequest = (req) => {
    console.log(`Compiling standard shareable text string sequence formatting schema for emergency notice listing target reference index tracking layout: ${req.id}`);
    const shareText = `🚨 জরুরি রক্তের প্রয়োজন 🚨\n\n🩸 রক্তের গ্রুপ: ${req.blood_group}\n👤 রোগী: ${req.patient_name}\n🏥 স্থান: ${req.hospital}\n⏰ কখন লাগবে: ${req.needed_time}\n📞 যোগাযোগের নাম্বার: ${req.phone}\n\n🙏 অনুগ্রহ করে নোটিশটি সবাই শেয়ার করে রক্তদাতার সন্ধান দিতে সাহায্য করুন।\n🩸🏠 সৌজন্যে: ব্লাড সেন্টার নদোনা নোয়াখালী`;
    try {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      console.log("Social share data mapping object serialized and assigned to system user clipboard state tracking matrix variables.");
      showToast('শেয়ারিং টেক্সট কপি হয়েছে! এখন ফেসবুক বা মেসেঞ্জারে পোস্ট বা ম্যাসেজ করুন।', 'success');
    } catch (e) {
      console.error("Error writing copy layout tracking execution parameters:", e);
      showToast('কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    console.log("Initiating target schema registration sequence routine layout for volunteer creation form systems handler...", newVolunteer);
    const volunteerPayload = { 
      name: newVolunteer.name, 
      phone: newVolunteer.phone, 
      password: newVolunteer.password,
      code: newVolunteer.password,
      points: Number(newVolunteer.points) || 0
    };

    if (editVolunteerId) {
      console.log(`Admin context dispatching volunteer adjustment update matrix properties dataset criteria key tracking target index lookup: ${editVolunteerId}`);
      const { error: volError } = await supabase.from('volunteers').update(volunteerPayload).eq('id', editVolunteerId);
      if (!volError) {
        console.log("Target tracking records mutations adjusted securely inside records infrastructure mapping database.");
        showToast('ভলান্টিয়ারের তথ্য ও সিকিউরিটি পাসওয়ার্ড সফলভাবে সংশোধন করা হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        setEditVolunteerId(null);
        fetchVolunteers();
      } else {
        console.error(`Supabase database mutation pipelines threw standard processing exception targeting unique identifier tracking: ${editVolunteerId}`, volError);
        showToast('সংশোধন ব্যর্থ: ' + volError.message, 'error');
      }
    } else {
      console.log("Inserting completely new structural volunteer user interface permissions context node layout item.");
      const { error: volError } = await supabase.from('volunteers').insert([volunteerPayload]);
     if (volError) {
  console.error("Error Details:", volError);
  alert("ডাটাবেজ এরর: " + volError.message + "\nডিটেইলস: " + (volError.details || 'নেই'));
  showToast('ভুল: ' + volError.message, 'error');
} else {
        console.log("Target operations sequence confirmed. Volunteer database record created securely.");
        showToast('নতুন ভলান্টিয়ার কাস্টম সিকিউরিটি পাসওয়ার্ড সহ অনুমোদিত হয়েছে!', 'success');
        setNewVolunteer({ name: '', phone: '', password: '', points: '' });
        fetchVolunteers();
      }
    }
  };

  const handleEditVolunteer = (v) => {
    console.log(`Buffering targeted volunteer tracking reference attributes data onto control state management nodes. Target ID: ${v.id}`);
    setNewVolunteer({ name: v.name, phone: v.phone, password: v.password || v.code || '', points: v.points === 0 ? '0' : String(v.points || '') });
    setEditVolunteerId(v.id);
  };

  const handleDeleteVolunteer = async (id) => {
    console.log(`Executing target capability validation check routine for deleting volunteer targeting profile registry ID index key map tracking context: ${id}`);
    if (confirm('আপনি কি নিশ্চিতভাবে এই ভলান্টিয়ারকে ডিলিট করতে চান?')) {
      const { error: volError } = await supabase.from('volunteers').delete().eq('id', id);
      if (!volError) {
        console.log(`Resource object securely unlinked and cleared from internal table infrastructure matrix target tracking code trace context reference path: ${id}`);
        showToast('ভলান্টিয়ার সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        fetchVolunteers();
      } else {
        console.error(`Wipe sequencing routines process engine error reported mapping targets configurations on parameter layout index: ${id}`, volError);
        showToast('মুছে ফেলতে ব্যর্থ: ' + volError.message, 'error');
      }
    }
  };

  const toggleVolunteerStatus = async (id, currentStatus) => {
    console.log(`Dispatching target capability mutation process mapping tracker state adjustment for volunteer object map targeting index: ${id}. Mutating active flag from baseline: ${currentStatus}`);
    const { error: volError } = await supabase.from('volunteers').update({ is_active: !currentStatus }).eq('id', id);
    if (!volError) {
      console.log(`Database transaction confirmed for state flag processing toggle parameters context index tracking code ID match routing: ${id}`);
      showToast('ভলান্টিয়ারের অবস্থা সফলভাবে পরিবর্তন করা হয়েছে।', 'info');
      fetchVolunteers();
    } else {
      console.error(`Database operations engine reported failure handling toggle logic adjustments parameters sequencing tracker: ${id}`, volError);
      showToast('অবস্থা পরিবর্তন ব্যর্থ: ' + volError.message, 'error');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    console.log(`Firing internal security subsystem authorization handshake targeting admin login parameter lookup identity user string text mapping: ${userId}`);
    const { data, error: authQueryError } = await supabase.from('app_auth').select('*').eq('user_id', userId).eq('password', password).single();
    if (data) {
      console.log("Admin security credentials match evaluated successfully. Granted elevated privileges tracking context.");
      setIsAdmin(true);
      setShowAdminLogin(false);
      showToast('অ্যাডমিন ভেরিফিকেশন সফল হয়েছে!', 'success');
    } else {
      console.warn("Admin security module verification failed due to unmatched credentials query trace path.", authQueryError);
      showToast('ভুল ইউজার আইডি অথবা পাসওয়ার্ড!', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    console.log("Initiating target master authentication code verification system to rewrite administrative backend password maps...");
    if (masterCode !== 'BCNN2013') {
      console.warn("Rewrite capability denied: Input parameter sequence does not match master safety configuration string values.");
      return showToast('ভুল মাস্টার কোড! আপনি পাসওয়ার্ড পরিবর্তন করার অনুমতি পাননি।', 'error');
    }
    const { error: authError } = await supabase.from('app_auth').update({ password: newPassword }).eq('user_id', 'BloodCenterNN');
    if (!authError) {
      console.log("Master override record database transactions confirmed. Secure backend target application keys rewritten safely.");
      showToast('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'success');
      setShowPassModal(false);
      setMasterCode('');
      setNewPassword('');
    } else {
      console.error("Supabase mutations processing context rejected targeting administrative password reconfiguration parameters query tracking flow:", authError);
      showToast('পাসওয়ার্ড পরিবর্তন ব্যর্থ: ' + authError.message, 'error');
    }
  };

  // ==================== ক্যানভাস ভিত্তিক ডিজিটাল প্রিমিয়াম কার্ড এবং সার্টিফিকেট জেনারেটর ====================
  const downloadDonorCard = (donor) => {
    console.log(`HTML5 Canvas drawing sequence initializing for premium identity generation matching candidate reference tracing target: ${donor.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 638;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // ব্যাকগ্রাউন্ড লাক্সারি গ্রেডিয়েন্ট এবং জ্যামিতিক টেক্সচার
    const mainGrad = ctx.createLinearGradient(0, 0, 638, 400);
    mainGrad.addColorStop(0, '#ffffff');
    mainGrad.addColorStop(0.7, '#fffafb');
    mainGrad.addColorStop(1, '#ffebee');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, 638, 400);
    
    // আধুনিক জ্যামিতিক রাউন্ডেড শেপ মাস্কিং (ডান পাশে লাল অ্যাবস্ট্রাক্ট শেপ)
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(420, 0);
    ctx.lineTo(638, 0);
    ctx.lineTo(638, 400);
    ctx.lineTo(490, 400);
    ctx.bezierCurveTo(460, 280, 400, 150, 420, 0);
    ctx.fill();
    
    // এক্সট্রা শেপ লেয়ার গভীরতার জন্য
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(510, 0);
    ctx.lineTo(638, 0);
    ctx.lineTo(638, 160);
    ctx.fill();
    
    // প্রিমিয়াম গোল্ডেন ফ্রেম ডাবল বর্ডার
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#991b1b';
    ctx.strokeRect(4, 4, 630, 392);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#d4af37'; // Gold
    ctx.strokeRect(12, 12, 614, 376);
    
    // হেডার ব্র্যান্ডিং
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 32, 50);
    
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('★ "রক্ত দিন, জীবন বাঁচান" স্লোগানে মানবতা ও সামাজিক রক্তসেবা প্রতিষ্ঠান ★', 34, 70);
    
    // মেম্বারশিপ মেটা ডাটা ফ্রেম
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('অফিসিয়াল রক্তদাতা পরিচয়পত্র', 32, 115);

    // কন্টেন্ট মডিউল গ্রিড (বাম পাশে তথ্য)
    const renderMetaRow = (label, value, yPos) => {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText(label, 32, yPos);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(value, 150, yPos);
      
      // ডটেড সেপারেটর লাইন
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, yPos + 8); ctx.lineTo(380, yPos + 8); ctx.stroke();
    };

    renderMetaRow('রক্তদাতার নাম:', donor.name, 155);
    renderMetaRow('ঠিকানা:', donor.location || donor.village || 'নদোনা', 190);
    renderMetaRow('সর্বশেষ রক্তদান:', donor.last_donation_date || 'কখনো না', 225);
    renderMetaRow('মোট রক্তদান:', `${donor.activity_count || 0} বার`, 260);

    // মেডেল অর্জন স্ট্যাটাস
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`স্থায়ী অর্জন: ${getDonorBadge(donor.activity_count).text}`, 32, 305);
    
    // ডানপাশের প্রিমিয়াম ব্লাড ড্রপ রাউন্ড সিল
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(540, 175, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset Shadow

    // গোল্ডেন রিং সিল বর্ডার
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(540, 175, 49, 0, Math.PI * 2);
    ctx.stroke();

    // রক্তের গ্রুপ টেক্সট সিলের ভেতর
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(donor.blood_group, 540, 188);
    
    // সিলের নিচে গোল্ডেন মেডেল রিবন ক্যাপশন
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BLOOD GROUP', 540, 255);

    // ফুটার
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট | কারিগরি সহযোগিতায়: অ্যাপ ডেভেলপার: গিয়াস উদ্দিন', 319, 380);
    
    triggerDownload(canvas, `Premium_ID_Card_${donor.name}.png`);
  };

  
const downloadDonorCertificate = (donor) => {
    console.log(`Generating premium certificate for donor: ${donor.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 1120;
    canvas.height = 792; 
    const ctx = canvas.getContext('2d');

    const drawPremiumCertificate = (logoImg, devImg) => {
      // ১. প্রিস্টিন লাইট ব্যাকগ্রাউন্ড
      ctx.fillStyle = '#f8fafc'; 
      ctx.fillRect(0, 0, 1120, 792);

      // ২. বাম পাশের সিগনেচার জ্যামিতিক শেপ (বাংলাদেশের পতাকার সবুজ)
      ctx.fillStyle = '#006a4e'; 
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(45, 0);
      ctx.lineTo(0, 250);
      ctx.fill();

      // বাম পাশের ভেতরের ছোট শেপ (বাংলাদেশের পতাকার লাল)
      ctx.fillStyle = '#f42a41'; 
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(25, 0);
      ctx.lineTo(0, 0);
      ctx.fill();

      // ডানদিকের নিচের কোণার শেপ (বাংলাদেশের পতাকার সবুজ)
      ctx.fillStyle = '#006a4e'; 
      ctx.beginPath();
      ctx.moveTo(1120, 792);
      ctx.lineTo(1040, 792);
      ctx.lineTo(1120, 620);
      ctx.fill();

      // ডানদিকের নিচের ভেতরের ছোট শেপ (বাংলাদেশের পতাকার লাল)
      ctx.fillStyle = '#f42a41'; 
      ctx.beginPath();
      ctx.moveTo(1120, 792);
      ctx.lineTo(1080, 792);
      ctx.lineTo(1120, 710);
      ctx.fill();

      // ৩. এলিগ্যান্ট চিকন বর্ডার ফ্রেম
      ctx.lineWidth = 1.5; 
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)'; 
      ctx.strokeRect(40, 40, 1040, 712);

      // ৪. লোগো সেকশন
      if (logoImg) {
        ctx.drawImage(logoImg, 495, 60, 130, 130); 
      }

      // ৫. হেডার ও টাইটেল
      ctx.textAlign = 'center';
      
      // সংগঠনের নাম
      ctx.fillStyle = '#0f172a'; 
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 560, 230);
      
      // সাব-টাইটেল
      ctx.fillStyle = '#64748b'; 
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('★ "রক্ত দিন, জীবন বাঁচান" স্লোগানে মানবতার সেবায় উৎসর্গীকৃত একটি সামাজিক প্রতিষ্ঠান ★', 560, 260);

      // মেইনসার্টিফিকেট টাইটেল
      ctx.fillStyle = '#e11d48'; 
      ctx.font = '900 42px system-ui, sans-serif';
      ctx.fillText('সম্মাননা ও স্বীকৃতি স্মারক গৌরবপত্র', 560, 330);

      // টাইটেল ডিভাইডার লাইন
      ctx.strokeStyle = '#e11d48'; 
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(420, 350); ctx.lineTo(700, 350); ctx.stroke();

      // ৬. বডি টেক্সট
      ctx.fillStyle = '#334155';
      ctx.font = '500 20px system-ui, sans-serif';
      ctx.fillText('এই গৌরবপত্র অত্যন্ত আনন্দের সাথে কৃতজ্ঞচিত্তে প্রদান করা যাচ্ছে যে', 560, 410);

      // ডোনারের নাম
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 46px system-ui, sans-serif';
      ctx.fillText(donor.name || 'সম্মানিত রক্তদাতা', 560, 475);

      // বর্ণনা লাইনসমূহ
      const line1 = `যিনি "ব্লাড সেন্টার নদোনা নোয়াখালী" এর একজন নিয়মিত মানবতার সেবক।`;
      const line2 = `উনার এই মহান ও মানবিক অবদান সমাজকে এক নতুন আলোর দিশা দেখিয়েছে। আমরা উনার সুস্বাস্থ্য ও দীর্ঘায়ু কামনা করি।`;
      
      ctx.fillStyle = '#475569';
      ctx.font = '500 17px system-ui, sans-serif';
      ctx.fillText(line1, 560, 530);
      ctx.fillText(line2, 560, 560);

      // ==========================================
      // ৭. ডোনারের স্ট্যাটাস ও ব্যাজ সেকশন (ডাইনামিক ডাটা সহ)
      // ==========================================
      const statsY = 595;
      const pillHeight = 36;
      const pillRadius = 18;
      
      ctx.font = 'bold 15px system-ui, sans-serif';
      
      // ডাটাগুলো অ্যাপের ভ্যারিয়েবল থেকে নেওয়া হচ্ছে
      const donCount = donor.activity_count || 0;
      const bgText = `রক্তের গ্রুপ: ${donor.blood_group || 'অজানা'}`;
      const dcText = `মোট রক্তদান: ${donCount} বার`;
      const bdText = `অর্জন: ${getDonorBadge(donCount).text}`;
      
      // টেক্সটের প্রস্থ মাপা হচ্ছে যাতে সুন্দরভাবে সেন্টারে বসে
      const w1 = ctx.measureText(bgText).width + 36;
      const w2 = ctx.measureText(dcText).width + 36;
      const w3 = ctx.measureText(bdText).width + 36;
      
      const totalGap = 24;
      const totalW = w1 + w2 + w3 + (totalGap * 2);
      let currentX = 560 - (totalW / 2);
      
      // ১. রক্তের গ্রুপ (লাল থিম)
      ctx.fillStyle = '#ffe4e6'; // হালকা লাল ব্যাকগ্রাউন্ড
      ctx.beginPath(); ctx.roundRect(currentX, statsY, w1, pillHeight, pillRadius); ctx.fill();
      ctx.fillStyle = '#be123c'; // গাঢ় লাল টেক্সট
      ctx.fillText(bgText, currentX + (w1/2), statsY + 23);
      
      currentX += w1 + totalGap;
      
      // ২. মোট রক্তদান (সিলভার/গ্রে থিম)
      ctx.fillStyle = '#f1f5f9'; // হালকা গ্রে ব্যাকগ্রাউন্ড
      ctx.beginPath(); ctx.roundRect(currentX, statsY, w2, pillHeight, pillRadius); ctx.fill();
      ctx.fillStyle = '#334155'; // গাঢ় গ্রে টেক্সট
      ctx.fillText(dcText, currentX + (w2/2), statsY + 23);
      
      currentX += w2 + totalGap;
      
      // ৩. অর্জন/ব্যাজ (সোনালী থিম)
      ctx.fillStyle = '#fef3c7'; // হালকা সোনালী ব্যাকগ্রাউন্ড
      ctx.beginPath(); ctx.roundRect(currentX, statsY, w3, pillHeight, pillRadius); ctx.fill();
      ctx.fillStyle = '#b45309'; // গাঢ় সোনালী টেক্সট
      ctx.fillText(bdText, currentX + (w3/2), statsY + 23);


      // ৮. সিগনেচার এলাইনমেন্ট
      ctx.strokeStyle = '#cbd5e1'; 
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(180, 670); ctx.lineTo(360, 670); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(760, 670); ctx.lineTo(940, 670); ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('সভাপতি', 270, 690);
      ctx.fillText('সাধারণ সম্পাদক', 850, 690);

      // ==========================================
      // ৯. ফুটার ডিজাইন ও ব্র্যান্ডিং
      // ==========================================
      
      // কপিরাইট
      ctx.fillStyle = '#64748b'; 
      ctx.font = '400 12px system-ui, sans-serif';
      ctx.fillText('© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। স্থাপিত: ২৭ মার্চ ২০১৩ ইং।', 560, 725);
      
      // ট্রাস্ট
      const trustText = 'সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট';
      ctx.font = 'bold 11px system-ui, sans-serif';
      const tWidth = ctx.measureText(trustText).width;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)'; 
      ctx.beginPath();
      ctx.roundRect(560 - (tWidth/2) - 12, 747 - 14, tWidth + 24, 22, 11);
      ctx.fill();
      
      ctx.fillStyle = '#334155'; 
      ctx.fillText(trustText, 560, 751);

      // ডেভেলপার সেকশন
      const devLabel = 'কারিগরি সহযোগিতায়:';
      const devName = 'অ্যাপ ডেভেলপার: গিয়াস উদ্দিন';
      
      ctx.font = '500 11px system-ui, sans-serif';
      const wLabel = ctx.measureText(devLabel).width;
      
      ctx.font = 'bold 11px system-ui, sans-serif';
      const wName = ctx.measureText(devName).width;
      
      const gap = 6;
      const imgSize = 20;
      const footerTotalW = wLabel + gap + imgSize + gap + wName;
      
      let fStartX = 560 - (footerTotalW / 2);
      const devY = 775; 
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText(devLabel, fStartX, devY);
      
      fStartX += wLabel + gap;

      if (devImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(fStartX + (imgSize/2), devY - 4, imgSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(devImg, fStartX, devY - 4 - (imgSize/2), imgSize, imgSize);
        ctx.restore();
      }
      
      fStartX += imgSize + gap;
      
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(devName, fStartX, devY);
    };

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); 
      });
    };

    // ইমেজ লোড
    Promise.all([
      loadImage('/logo.png'), 
      loadImage('/gias.png')      
    ]).then(([logoImg, devImg]) => {
      drawPremiumCertificate(logoImg, devImg);
      triggerDownload(canvas, `Official_Certificate_${donor.name}.png`);
    });
  };


  const downloadVolunteerCard = (v) => {
    console.log(`Canvas rendering pipeline operating for premium team identity compilation structure matching target entity context: ${v.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 638;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // লাক্সারি রয়্যাল ব্লু থিম জ্যামিতিক গ্রাডিয়েন্ট
    const mainGrad = ctx.createLinearGradient(0, 0, 638, 400);
    mainGrad.addColorStop(0, '#ffffff');
    mainGrad.addColorStop(0.7, '#f8fafc');
    mainGrad.addColorStop(1, '#eff6ff');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, 638, 400);
    
    // ডার্ক ব্লু স্টাইলিস্ট সাইড কার্ভ শেপ
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(440, 0);
    ctx.lineTo(638, 0);
    ctx.lineTo(638, 400);
    ctx.lineTo(510, 400);
    ctx.bezierCurveTo(480, 270, 420, 130, 440, 0);
    ctx.fill();

    // ফ্রেম ডাবল বর্ডার
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1e3a8a';
    ctx.strokeRect(4, 4, 630, 392);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(12, 12, 614, 376);
    
    // হেডার ব্র্যান্ডিং
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 32, 50);
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('★ অফিশিয়াল ভলান্টিয়ার টিম মেম্বার কার্ড ★', 34, 70);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('ভলান্টিয়ার পরিচয়পত্র', 32, 120);

    const renderVolRow = (label, value, yPos) => {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText(label, 32, yPos);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(value, 150, yPos);
      
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(32, yPos + 8); ctx.lineTo(390, yPos + 8); ctx.stroke();
    };
    
    renderVolRow('সদস্যের নাম:', v.name, 170);
    renderVolRow('মোবাইল নাম্বার:', v.phone, 210);
    renderVolRow('অ্যাক্টিভিটি স্কোর:', `${v.points || 0} পয়েন্ট`, 250);

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`মেডেল স্ট্যাটাস: ${getVolunteerBadge(v.points).text}`, 32, 300);
    
    // ডানপাশের প্রিমিয়াম সিল কন্টেইনার
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(545, 180, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(545, 180, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TEAM', 545, 175);
    ctx.fillStyle = '#3b82f6';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillText('MEMBER', 545, 195);
    
    // ফুটার
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট | কারিগরি সহযোগিতায়: অ্যাপ ডেভেলপার: গিয়াস উদ্দিন', 319, 380);

    triggerDownload(canvas, `Volunteer_ID_Card_${v.name}.png`);
  };
  
  const triggerDownload = (canvas, filename) => {
    console.log(`Executing triggerDownload payload conversion routine targeting file capture: ${filename}`);
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('ডাউনলোড সফলভাবে সম্পন্ন হয়েছে!', 'success');
  };
  
    const downloadVolunteerCertificate = (v) => {
    console.log(`Generating 10MS style premium certificate for: ${v.name}`);
    const canvas = document.createElement('canvas');
    canvas.width = 1120;
    canvas.height = 792; 
    const ctx = canvas.getContext('2d');

    const drawPremiumCertificate = (logoImg, devImg) => {
      // ১. প্রিস্টিন লাইট ব্যাকগ্রাউন্ড (১০টি মিনিট স্কুল থিম)
      ctx.fillStyle = '#f8fafc'; 
      ctx.fillRect(0, 0, 1120, 792);

      // ২. বাম পাশের সিগনেচার জ্যামিতিক শেপ (Geometric Side Accents)
      // গাঢ় কোরাল/লাল শেপ (ব্লাড সেন্টারের থিমের সাথে মিল রেখে)
      ctx.fillStyle = '#e11d48'; 
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(45, 0);
      ctx.lineTo(0, 250);
      ctx.fill();

      ctx.fillStyle = '#be123c'; 
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(25, 0);
      ctx.lineTo(0, 0);
      ctx.fill();

      // ডানদিকের নিচের কোণার শেপ
      ctx.fillStyle = '#0f172a'; 
      ctx.beginPath();
      ctx.moveTo(1120, 792);
      ctx.lineTo(1040, 792);
      ctx.lineTo(1120, 620);
      ctx.fill();

      ctx.fillStyle = '#eab308'; 
      ctx.beginPath();
      ctx.moveTo(1120, 792);
      ctx.lineTo(1080, 792);
      ctx.lineTo(1120, 710);
      ctx.fill();

      // ৩. এলিগ্যান্ট চিকন বর্ডার ফ্রেম
      ctx.lineWidth = 1.5; 
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)'; 
      ctx.strokeRect(40, 40, 1040, 712);

      // ৪. লোগো সেকশন (একদম উপরে এবং বড় করে)
      if (logoImg) {
        ctx.drawImage(logoImg, 495, 60, 130, 130); 
      }

      // ৫. হেডার ও টাইটেল (১০এমএস স্টাইল ক্লিয়ার টাইপোগ্রাফি)
      ctx.textAlign = 'center';
      
      // সংগঠনের নাম
      ctx.fillStyle = '#0f172a'; 
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 560, 230);
      
      // সাব-টাইটেল
      ctx.fillStyle = '#64748b'; 
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('★ অফিশিয়াল ভলান্টিয়ার রিকগনিশন অ্যাওয়ার্ড ★', 560, 260);

      // মেইন সার্টিফিকেট টাইটেল
      ctx.fillStyle = '#e11d48'; // বোল্ড রেড টোন
      ctx.font = '900 42px system-ui, sans-serif';
      ctx.fillText('CERTIFICATE OF APPRECIATION', 560, 330);

      // টাইটেল ডিভাইডার লাইন
      ctx.strokeStyle = '#e11d48'; 
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(420, 350); ctx.lineTo(700, 350); ctx.stroke();

      // ৬. বডি টেক্সট (অত্যন্ত ক্লিন এবং প্রফেশনাল)
      ctx.fillStyle = '#334155';
      ctx.font = '500 20px system-ui, sans-serif';
      ctx.fillText('এই সম্মাননা স্মারকটি অত্যন্ত কৃতজ্ঞতার সাথে প্রদান করা হচ্ছে যে', 560, 410);

      // ভলান্টিয়ারের নাম (বিশাল ও আকর্ষণীয় গাঢ় কালার)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 46px system-ui, sans-serif';
      ctx.fillText(v.name, 560, 475);

      // বর্ণনা লাইনসমূহ
      const line1 = `যিনি আমাদের "ব্লাড সেন্টার নদোনা নোয়াখালী" এর হয়ে অত্যন্ত নিষ্ঠার সাথে কাজ করে মোট ${v.points || 0} পয়েন্ট অর্জন করেছেন।`;
      const line2 = `মানবতার সেবায় উনার এই অসামান্য ও নিঃস্বার্থ অবদানকে আমরা গভীরভাবে মূল্যায়ন করি।`;
      
      ctx.fillStyle = '#475569';
      ctx.font = '500 17px system-ui, sans-serif';
      ctx.fillText(line1, 560, 530);
      ctx.fillText(line2, 560, 560);

      // ব্যাজ/মেডেল স্ট্যাটাস
      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`অর্জন: ${getVolunteerBadge(v.points).text}`, 560, 605);

      // ৭. সিগনেচার এলাইনমেন্ট (১০এমএস স্টাইল সাইড সিগনেচার)
      ctx.strokeStyle = '#cbd5e1'; 
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(180, 655); ctx.lineTo(360, 655); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(760, 655); ctx.lineTo(940, 655); ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('সভাপতি', 270, 675);
      ctx.fillText('সাধারণ সম্পাদক', 850, 675);

      // ==========================================
      // ৮. হুবহু অ্যাপের ফুটার ডিজাইন ও ব্র্যান্ডিং
      // ==========================================
      
      // কপিরাইট এবং স্থাপিত সাল
      ctx.fillStyle = '#64748b'; 
      ctx.font = '400 12px system-ui, sans-serif';
      ctx.fillText('© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। স্থাপিত: ২৭ মার্চ ২০১৩ ইং।', 560, 710);
      
      // ট্রাস্টের নাম (পিল শেপড ব্যাকগ্রাউন্ড - লাইট মোড মানানসই)
      const trustText = 'সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট';
      ctx.font = 'bold 11px system-ui, sans-serif';
      const tWidth = ctx.measureText(trustText).width;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)'; 
      ctx.beginPath();
      ctx.roundRect(560 - (tWidth/2) - 12, 732 - 14, tWidth + 24, 22, 11);
      ctx.fill();
      
      ctx.fillStyle = '#334155'; 
      ctx.fillText(trustText, 560, 736);

      // কারিগরি সহযোগিতা ও ডেভেলপার সেকশন
      const devLabel = 'কারিগরি সহযোগিতায়:';
      const devName = 'অ্যাপ ডেভেলপার: গিয়াস উদ্দিন';
      
      ctx.font = '500 11px system-ui, sans-serif';
      const w1 = ctx.measureText(devLabel).width;
      
      ctx.font = 'bold 11px system-ui, sans-serif';
      const w2 = ctx.measureText(devName).width;
      
      const gap = 6;
      const imgSize = 20;
      const totalW = w1 + gap + imgSize + gap + w2;
      
      let startX = 560 - (totalW / 2);
      const devY = 765; 
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText(devLabel, startX, devY);
      
      startX += w1 + gap;

      // ছবি বসানো (Circular Shape)
      if (devImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(startX + (imgSize/2), devY - 4, imgSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(devImg, startX, devY - 4 - (imgSize/2), imgSize, imgSize);
        ctx.restore();
      }
      
      startX += imgSize + gap;
      
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(devName, startX, devY);
    };

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); 
      });
    };

    // আপনার ফোল্ডারের ফাইল নেম ফরম্যাট অনুযায়ী লোড করা হচ্ছে
    Promise.all([
      loadImage('/logo.png'), 
      loadImage('/gias.png')  
    ]).then(([logoImg, devImg]) => {
      drawPremiumCertificate(logoImg, devImg);
      triggerDownload(canvas, `Volunteer_Certificate_${v.name}.png`);
    });
  };
  
  // ==================== স্মার্ট ডোনার লগ ও হিস্ট্রি ট্র্যাকিং লজিক ====================
  const openLogModal = async (donor) => {
    console.log(`Invoking operational context view setup. Opening sub-logs history model dashboard for candidate parameter: ${donor.id}`);
    setActiveLogDonor(donor);
    setShowLogModal(true);
    const { data, error: fetchErr } = await supabase.from('donation_logs').select('*').eq('donor_id', donor.id).order('date', { ascending: false });
    if (fetchErr) console.error("Error loading targeted records from internal history indexes system configuration:", fetchErr);
    if (data) {
      console.log(`Sync complete matching target candidate key timeline datasets. Array count loaded: ${data.length}`);
      setDonorLogs(data);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    console.log(`Processing historical ledger logs appending block action framework sequence layout criteria inputs... Target Donor: ${activeLogDonor?.id}`, newLog);
    if (!newLog.patient_name || !newLog.hospital || !newLog.date) {
      console.warn("Log appending transaction blocked: Input verification parameters criteria failed standard schema tests.");
      return showToast('সব তথ্য পূরণ করুন', 'error');
    }
    
    const payload = {
      donor_id: activeLogDonor.id,
      patient_name: newLog.patient_name,
      hospital: newLog.hospital,
      date: newLog.date
    };
    const { error: logErr } = await supabase.from('donation_logs').insert([payload]);
    if (!logErr) {
      console.log("Historical timeline event node successfully committed across infrastructure systems storage arrays.");
      showToast('রক্তদানের স্মার্ট রেকর্ড লগ করা হয়েছে!', 'success');
      setNewLog({ patient_name: '', hospital: '', date: '' });
      // পুনরায় রিফ্রেশ লিস্ট
      const { data } = await supabase.from('donation_logs').select('*').eq('donor_id', activeLogDonor.id).order('date', { ascending: false });
      if (data) setDonorLogs(data);
      fetchAllLogs(); // গ্লোবাল হিস্ট্রি রিফ্রেশ
    } else {
      console.error("Supabase transactional database failures reported trying to ingest new layout trace indices details object:", logErr);
      showToast('লগ করতে সমস্যা হয়েছে: ' + logErr.message, 'error');
    }
  };
  
  const handleDeleteLog = async (logId) => {
    console.log(`Dispatching explicitly requested trace removal directive against specific history tracker identifier parameter node index: ${logId}`);
    if (confirm('আপনি কি নিশ্চিতভাবে এই ডোনেশন রেকর্ড হিস্ট্রিটি মুছে ফেলতে চান?')) {
      const { error: delErr } = await supabase.from('donation_logs').delete().eq('id', logId);
      if (delErr) console.error("Error intercepted tracking history removal process pipeline sequence flow code map:", delErr);
      if (activeLogDonor) {
        const { data } = await supabase.from('donation_logs').select('*').eq('donor_id', activeLogDonor.id).order('date', { ascending: false });
        if (data) setDonorLogs(data);
      }
      fetchAllLogs();
      // গ্লোবাল হিস্ট্রি রিফ্রেশ
      showToast('হিস্ট্রি রিমুভ করা হয়েছে।', 'success');
    }
  };
  
  // ফিল্টারিং প্যানেল
  const filteredDonors = donors.filter(donor => {
    const matchesGroup = selectedGroup === 'All' || donor.blood_group === selectedGroup;
    const locationString = `${donor.location || donor.village || ''}`.toLowerCase();
    
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

      {/* নতুন সংযোজিত নোয়াখালী পোস্ট সেকশন */}
      <div className="bg-white p-5 rounded-2xl shadow border-t-4 border-blue-600 space-y-4">
        <h2 className="text-lg font-black text-blue-600 flex items-center gap-2 leading-relaxed">
          <Megaphone className="w-5 h-5" /> ব্লাড সেন্টার পোস্ট
        </h2>
        {isAdmin && (
          <form onSubmit={handleAddNp} className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
            <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> নতুন পোস্ট তৈরি করুন
            </p>
            <textarea
              placeholder="ক্যাপশন লিখুন..."
              value={newNp.caption}
              onChange={e => setNewNp({...newNp, caption: e.target.value})}
              className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-blue-500"
              rows="3"
            />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleNpFileChange}
              className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-blue-500"
            />
            <button type="submit" disabled={isUploadingNp || noakhaliPosts.length >= 2} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 transition-colors">
              {isUploadingNp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isUploadingNp ? 'আপলোড হচ্ছে...' : 'পোস্ট করুন'}
            </button>
            {noakhaliPosts.length >= 2 && <p className="text-xs text-red-500 font-bold mt-1 text-center">৩ নাম্বার পোস্ট করতে হলে অবশ্যই পূর্বের ২টির মধ্য থেকে ১টি ডিলিট করতে হবে।</p>}
          </form>
        )}

        <div className="space-y-4">
          {noakhaliPosts.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4 leading-normal flex items-center justify-center gap-1">
              <Info className="w-4 h-4" /> বর্তমানে ব্লাড সেন্টার পোস্টে কোনো আপডেট নেই।
            </p>
          ) : (
            noakhaliPosts.map(post => (
              <div key={post.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="p-3 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-full bg-white border p-0.5 shadow-xs" onError={(e) => {e.target.style.display='none'}} />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-none mb-1">ব্লাড সেন্টার পোস্ট</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">{new Date(post.created_at || Date.now()).toLocaleString()}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteNp(post)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors border border-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {post.caption && <div className="p-4 text-sm text-slate-800 whitespace-pre-wrap font-medium">{post.caption}</div>}
                {post.media_url && post.media_type === 'image' && (
                  <img src={post.media_url} alt="Post media" className="w-full object-cover max-h-96 bg-slate-100" />
                )}
                {post.media_url && post.media_type === 'video' && (
                  <video src={post.media_url} controls className="w-full max-h-96 bg-black"></video>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div id="emergency-board-section" className="bg-white p-5 rounded-2xl shadow border-t-4 border-red-500 space-y-4">
        <h2 className="text-lg font-black text-red-600 flex items-center gap-2 animate-pulse leading-relaxed">
          <Megaphone className="w-5 h-5" /> জরুরি রক্তের লাইভ নোটিশ বোর্ড
        </h2>
        {isAdmin && (
          <form onSubmit={handleAddRequest} className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {editRequestId ? 'নোটিশ সংশোধন করুন:' : 'নতুন জরুরি নোটিশ পোস্ট করুন:'}
            </p>
            <input type="text" placeholder="রোগীর নাম" value={newRequest.patient_name} onChange={e => setNewRequest({...newRequest, patient_name: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={newRequest.blood_group} onChange={e => setNewRequest({...newRequest, blood_group: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white">
                {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="tel" placeholder="যোগাযোগের নাম্বার" value={newRequest.phone} onChange={e => setNewRequest({...newRequest, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
            </div>
            <input type="text" placeholder="নোয়াখালী সদর হাসপাতাল।মাইজদী,নোয়াখালী।" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
            <input type="text" placeholder="কখন রক্ত লাগবে" value={newRequest.needed_time} onChange={e => setNewRequest({...newRequest, needed_time: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white" required />
            <div className="flex gap-1.5">
              <button type="submit" className="flex-1 bg-red-600 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1">
                {editRequestId ? <Save className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {editRequestId ? 'নোটিশ আপডেট' : 'নোটিশ পোস্ট'}
              </button>
              {editRequestId && (
                <button type="button" onClick={() => { setEditRequestId(null); setNewRequest({ patient_name: '', blood_group: 'A+', hospital: '', phone: '', needed_time: '' }); }} className="bg-slate-200 text-slate-700 px-3 rounded-xl font-bold text-xs">বাতিল</button>
              )}
            </div>
          </form>
        )}

        <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
          {emergencyRequests.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6 leading-normal flex items-center justify-center gap-1">
              <Info className="w-4 h-4" /> বর্তমানে কোনো জরুরি রক্তের অনুরোধ নেই।
            </p>
          ) : (
            emergencyRequests.map(req => {
              const formattedPhone = req.phone.replace(/[^0-9]/g, '');
              const waNoticeText = encodeURIComponent(`আসসালামু আলাইকুম, ব্লাড সেন্টার নদোনা নোয়াখালী থেকে আপনার জরুরি রক্তের নোটিশটির (গ্রুপ: ${req.blood_group}) পরিপ্রেক্ষিতে যোগাযোগ করছি।`);
              const waNoticeUrl = `https://wa.me/${formattedPhone}?text=${waNoticeText}`;

              return (
                <div key={req.id} className="border-2 border-red-100 bg-red-50/20 p-4 rounded-xl relative shadow-xs space-y-1">
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Droplet className="w-3 h-3 fill-white" /> {req.blood_group}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 leading-normal flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" /> রোগী: {req.patient_name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-normal flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> স্থান: {req.hospital}
                  </p>
                  <p className="text-xs text-red-600 font-bold leading-normal flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> সময়: {req.needed_time}
                  </p>
                  
                  {isAdmin && (
                    <div className="mt-2.5 flex gap-1.5 border-t pt-2 border-dashed border-red-200">
                      <button onClick={() => handleEditRequest(req)} className="flex-1 bg-blue-50 text-blue-600 font-bold text-[11px] py-1 rounded-lg border border-blue-200 flex items-center justify-center gap-0.5">
                        <Pencil className="w-3 h-3" /> সংশোধন
                      </button>
                      <button onClick={() => handleDeleteRequest(req.id)} className="flex-1 bg-red-50 text-red-600 font-bold text-[11px] py-1 rounded-lg border border-red-200 flex items-center justify-center gap-0.5">
                        <Trash2 className="w-3 h-3" /> ডিলিট
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <a href={`tel:${req.phone}`} className="text-xs text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold shadow-xs flex items-center justify-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> কল দিন
                    </a>
                    <a href={waNoticeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-center bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-bold shadow-xs flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ
                    </a>
                  </div>
                  <button onClick={() => handleShareRequest(req)} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1 mt-1.5">
                    <Megaphone className="w-3.5 h-3.5" /> সোশ্যাল মিডিয়ায় শেয়ার নোটিশ (কপি)
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow border border-slate-100 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 tracking-wide border-b-2 border-red-500 inline-block pb-1 flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 text-red-500" /> আমাদের অর্জন
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border text-center shadow-xs">
            <span className="block text-2xl font-black text-red-600">{totalDonorsCount}</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">মোট নিবন্ধিত রক্তদাতা</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border text-center shadow-xs">
            <span className="block text-2xl font-black text-red-600">{totalDonationsCount}</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">মোট রক্তদান সম্পন্ন</span>
          </div>
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 text-center shadow-xs">
            <span className="block text-2xl font-black text-green-600">{readyTodayCount}</span>
            <span className="text-xs font-bold text-red-700 mt-1 block">আজকে রক্তদানে প্রস্তুত</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border text-center shadow-xs">
            <span className="block text-2xl font-black text-red-600">{emergencyRequests.length}</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">জরুরি রক্তের অনুরোধ</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100 flex gap-3 shadow-xs">
          <span className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-current" />
          </span>
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
          <span className="bg-green-100 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </span>
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
          <span className="bg-white text-slate-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border">
            <Award className="w-5 h-5 text-slate-600" />
          </span>
          <div className="space-y-2 w-full">
            <h4 className="font-black text-sm text-slate-800 mb-1 leading-relaxed border-b pb-1 flex items-center justify-between">
              <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> সংগঠনের গৌরবময় ইতিহাস ও উদ্যোক্তাগণ</span>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">      প্রতিষ্ঠা: ২০১৩ ইং</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              মানবতার সেবায় রক্তদানের মহান শপথ নিয়ে ২৭ মার্চ ২০১৩ ইং "ব্লাড সেন্টার নদোনা নোয়াখালী" এই সামাজিক সংগঠনের গৌরবময় পথচলা শুরু হয় এবং পরবর্তীতে একঝাঁক সমাজসেবক ও সচেতন তরুণ সেচ্ছাসেবী সদস্যদের নিয়ে "মরহুম হাজী তফসির আহমেদ ট্রাস্ট" এর সার্বিক সহযোগিতায়। মুমূর্ষু রোগীদের পাশে দাঁড়ানো ও গ্রামীণ জনপদে রক্তদানে সচেতনতা সৃষ্টি করাই ছিল এর মূল লক্ষ্য।
            </p>
            <div className="pt-1">
              <p className="text-xs font-bold text-slate-700 mb-1.5"> ৪ জন প্রতিষ্ঠাতা উদ্যোক্তা:</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> নিজাম উদ্দিন</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> তুহিন</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> নাজমুল হাসান</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> ইয়াসিন</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> 🩸 রক্ত দিন</div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> 🌱 জীবন বাঁচান</div>
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
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-700">
          <Search className="w-5 h-5" /> রক্তদাতা অনুসন্ধান প্যানেল
        </h2>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="নাম বা ঠিকানা দিয়ে খুঁজুন" 
              value={searchTerm} 
              onChange={e => { 
                console.log(`Search text mutating to parameters: "${e.target.value}". Resetting load counts rows threshold.`);
                setSearchTerm(e.target.value); 
                setVisibleDonorsCount(10); 
              }}
              className="w-full border-2 pl-10 p-3 rounded-2xl shadow-xs text-base focus:outline-red-500 leading-normal" 
            />
          </div>
          <select 
            value={eligibilityFilter} 
            onChange={e => { 
              console.log(`Eligibility tracking criteria condition swapped: ${e.target.value}`);
              setEligibilityFilter(e.target.value); 
              setVisibleDonorsCount(10); 
            }} 
            className="w-full border-2 p-3 rounded-2xl shadow-xs text-base bg-white font-bold text-slate-700 focus:outline-red-500 leading-normal"
          >
            <option value="All">সকল রক্তদাতা (ডাটাবেজে থাকা সবাই)</option>
            <option value="Eligible">যোগ্য রক্তদাতা (যারা এই মুহূর্তে রক্তদানে প্রস্তুত)</option>
            <option value="Ineligible">সাময়িক অযোগ্য রক্তদাতা (যাদের নির্দিষ্ট সময় পার হয়নি)</option>
          </select>
        </div>
        
        <div className="flex gap-1.5 overflow-x-auto pb-2 max-w-full">
          {bloodGroups.map(group => (
            <button 
              key={group} 
              onClick={() => { 
                console.log(`Active categorization blood group criteria switched targeting item tag match: ${group}`);
                setSelectedGroup(group); 
                setVisibleDonorsCount(10); 
              }} 
              className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap shadow-xs transition-all flex items-center gap-1 ${selectedGroup === group ? 'bg-red-600 text-white' : 'bg-white border-2 text-slate-600 hover:bg-slate-100'}`}
            >
              <Droplet className={`w-3.5 h-3.5 ${selectedGroup === group ? 'fill-white' : 'text-red-500'}`} />
              {group === 'All' ? 'সব গ্রুপ' : group}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredDonors.length === 0 ? (
          <p className="text-center text-base text-slate-400 py-10 bg-white rounded-2xl shadow-xs leading-normal flex items-center justify-center gap-1">
            <Info className="w-5 h-5 text-slate-300" /> এই ফিল্টারিংয়ে কোনো রক্তদাতা পাওয়া যায়নি।
          </p>
        ) : (
          <>
            {filteredDonors.slice(0, visibleDonorsCount).map(donor => {
              const elg = checkEligibility(donor.last_donation_date, donor.gender);
              const badge = getDonorBadge(donor.activity_count || 0);
              
              const cleanedDonorPhone = donor.phone ? donor.phone.replace(/[^0-9]/g, '') : '';
              const waDonorText = encodeURIComponent(`আসসালামু আলাইকুম, ব্লাড সেন্টার নদোনা নোয়াখালী থেকে যোগাযোগ করছি। আমাদের জরুরি একটি ${donor.blood_group} রক্তের প্রয়োজন। আপনি কি এই মুহূর্তে রক্তদানে আগ্রহী আছেন?`);
              const waDonorUrl = `https://wa.me/${cleanedDonorPhone}?text=${waDonorText}`;

              return (
                <div key={donor.id} className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 space-y-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center shadow-inner">
                        {donor.blood_group}
                      </span>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-1.5 leading-relaxed">
                          <User className="w-4 h-4 text-slate-400" /> {donor.name}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium leading-normal flex items-center gap-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {donor.location || donor.village || 'ঠিকানা দেওয়া হয়নি'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border leading-normal transition-all ${badge.classes}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border leading-relaxed ${elg.isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    <div className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> স্ট্যাটাস: {elg.statusText}</div>
                    
                    {!elg.isEligible && elg.remainingDays > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                          <span>রক্তদানের প্রস্তুতি অগ্রগতি</span>
                          <span>{elg.percent}% সম্পন্ন</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                          <div className="bg-slate-500 h-full rounded-full transition-all duration-500" style={{ width: `${elg.percent}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* নতুন সংযোজিত পার্ট: ডিজিটাল কার্ড, সার্টিফিকেট ও হিস্ট্রি লগ বাটনপ্যাক */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-t pt-2 border-dashed border-slate-200">
                    <button onClick={() => downloadDonorCard(donor)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border">
                      <Download className="w-3 h-3 text-red-500" /> পরিচয়পত্র
                    </button>
                    <button onClick={() => downloadDonorCertificate(donor)} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-amber-200">
                      <Award className="w-3 h-3 text-amber-600" /> সম্মাননা স্মারক
                    </button>
                    {(isAdmin || isUnlocked) && (
                      <button onClick={() => openLogModal(donor)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-blue-200">
                        <History className="w-3 h-3" />হিস্ট্রি
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-100 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1 leading-normal">
                      <Phone className="w-4 h-4 text-slate-400" /> {isUnlocked || isAdmin ? donor.phone : 'XXXXXXXXXXX'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditDonor(donor)} title="সংশোধন করুন" className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDeleteDonor(donor.id)} title="মুছে ফেলুন" className="p-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      {(isUnlocked || isAdmin) ? (
                        <button onClick={() => handleCopyDonorInfo(donor)} title="কপি করুন" className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                          <Copy className="w-4 h-4" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => showToast('রক্তদাতার তথ্য কপি করতে ভলান্টিয়ার কোড বা মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-200 text-slate-400 border border-slate-200 rounded-lg shadow-xs font-bold text-sm flex items-center justify-center cursor-not-allowed">
                          <Lock className="w-4 h-4" />
                        </button>
                      )}

                      {(isUnlocked || isAdmin) ? (
                        <>
                          <a href={`tel:${donor.phone}`} title="সরাসরি কল করুন" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </a>
                          <a href={waDonorUrl} target="_blank" rel="noopener noreferrer" title="হোয়াটসঅ্যাপ মেসেজ দিন" className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs font-bold text-sm flex items-center justify-center">
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => showToast('মোবাইল নাম্বার দেখতে ও কল করতে ভলান্টিয়ার কোড ও মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed">
                            <Lock className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => showToast('হোয়াটসঅ্যাপে মেসেজ দিতে ভলান্টিয়ার কোড ও মোবাইল নাম্বার দিয়ে ডাটা আনলক করুন।', 'error')} className="p-2 bg-slate-300 text-slate-500 rounded-lg font-bold text-sm flex items-center justify-center cursor-not-allowed">
                            <Lock className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed leading-normal">
                    <span className="font-bold text-red-600 flex items-center gap-1">
                      <Activity className="w-4 h-4" /> মোট দান: {donor.activity_count || 0} বার
                    </span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> সর্বশেষ দান: {donor.last_donation_date || 'কখনো দেওয়া হয়নি'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button onClick={() => handleIncrementActivity(donor.id, donor.activity_count || 0)} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-xl font-bold text-xs shadow mt-2 leading-normal flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" />রক্তদানের সংখ্যা ১ বার বৃদ্ধি করুন (+1)
                    </button>
                  )}
                </div>
              );
            })}

            {filteredDonors.length > visibleDonorsCount && (
              <button 
                onClick={() => {
                  console.log(`Paging boundary extension triggered. Increasing rows count visible thresholds map.`);
                  setVisibleDonorsCount(prev => prev + 10);
                }} 
                className="w-full bg-slate-800 hover:bg-slate-950 text-white p-3 rounded-2xl font-black text-sm tracking-wide shadow transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-4 h-4" /> আরো রক্তদাতা দেখুন (Load More)
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
        <h2 className="text-xl font-black text-green-600 flex items-center justify-center gap-1.5 leading-relaxed">
          <UserPlus className="w-5 h-5" /> রক্তদাতা নিবন্ধন ফরম
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal">
          {newDonor.id ? 'আপনার তথ্য সংশোধন করে ডাটাবেজ আপডেট করুন' : 'আপনার সঠিক তথ্য দিয়ে মানবসেবায় এগিয়ে আসুন'}
        </p>
      </div>
      
      <form onSubmit={handleRegisterDonor} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তদাতার সম্পূর্ণ নাম *</label>
          <input type="text" placeholder="বীরশ্রেষ্ঠ মোহাম্মদ রুহুল আমিন" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">মোবাইল নাম্বার *</label>
          <input type="tel" placeholder="কান্ট্রি কোড সহ মোবাইল নাম্বার দিন" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তের গ্রুপ *</label>
            <select value={newDonor.blood_group} onChange={e => setNewDonor({...newDonor, blood_group: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-green-500 leading-normal">
              {bloodGroups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">লিঙ্গ *</label>
            <select value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm bg-white focus:outline-green-500 leading-normal">
              <option value="পুরুষ">পুরুষ</option>
              <option value="মহিলা">মহিলা</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">ওজন (কেজি) *</label>
            <input type="number" placeholder="ওজন লিখুন" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">বয়স (বছর) *</label>
            <input type="number" placeholder="বয়স লিখুন" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
          </div>
        </div>

        {(newDonor.weight || newDonor.age) && (
          <div className="p-4 rounded-xl border space-y-2 bg-slate-50 border-slate-200 text-xs shadow-xs">
            <h5 className="font-bold text-slate-700 border-b pb-1 flex items-center gap-1">
              <Stethoscope className="w-4 h-4 text-slate-500" />  স্বাস্থ্যগত যোগ্যতা পর্যালোচনা:
            </h5>
            {newDonor.weight && (
              <div className="flex items-center gap-1.5 font-semibold">
                {Number(newDonor.weight) >= 50 ? (
                  <span className="text-green-600 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> ওজন: {newDonor.weight} কেজি (রক্তদানের জন্য সম্পূর্ণ উপযুক্ত)।</span>
                ) : Number(newDonor.weight) >= 45 ? (
                  <span className="text-amber-600 flex items-center gap-0.5"><AlertTriangle className="w-3.5 h-3.5" /> ওজন: {newDonor.weight} কেজি (ন্যূনতম ৪৫ কেজি অনুযায়ী বিশেষ ক্ষেত্রে রক্তদান সম্ভব, তবে ৫০ কেজি আদেশ)।</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-0.5"><X className="w-3.5 h-3.5" /> ওজন: {newDonor.weight} কেজি (রক্তদানের জন্য ন্যূনতম ৪৫-৫০ কেজি ওজন আবশ্যক)।</span>
                )}
              </div>
            )}
            {newDonor.age && (
              <div className="flex items-center gap-1.5 font-semibold">
                {Number(newDonor.age) >= 18 && Number(newDonor.age) <= 65 ? (
                  <span className="text-green-600 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> বয়স: {newDonor.age} বছর (১৮ থেকে ৬৫ বছরের নির্ধারিত সীমার মধ্যে রয়েছে)।</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-0.5"><X className="w-3.5 h-3.5" /> বয়স: {newDonor.age} বছর (রক্তদাতার বয়স অবশ্যই ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে)।</span>
                )}
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-medium pt-1">
              💡 শারীরিক ও মানসিকভাবে সুস্থ পুরুষরা ৪ মাস পর পর এবং মহিলারা সাধারণত ৪ থেকে ৬ মাস পর পর নিরাপদভাবে রক্তদান করতে পারেন।
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">রক্তদাতার সম্পূর্ণ ঠিকানা *</label>
          <input type="text" placeholder="বাঘপাঁচড়া, সোনাইমুড়ী, নোয়াখালী 🇧🇩" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" required />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">পূর্বে কতবার রক্ত দিয়েছেন? (ঐচ্ছিক)</label>
          <input type="number" placeholder="পূর্বে রক্তদানের মোট সংখ্যা লিখুন" value={newDonor.activity_count} onChange={e => setNewDonor({...newDonor, activity_count: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1 leading-normal">সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)</label>
          <input type="date" value={newDonor.last_donation_date} onChange={e => setNewDonor({...newDonor, last_donation_date: e.target.value})} className="w-full border-2 p-3 rounded-xl text-base focus:outline-green-500 leading-normal" />
          <p className="text-[10px] text-slate-400 mt-1 leading-normal">নোট: যদি পূর্বে কখনো রক্ত না দিয়ে থাকেন, তবে এই ঘরটি ফাঁকা রাখুন।</p>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-black text-lg shadow-md transition-colors flex items-center justify-center gap-2 leading-normal">
            <Save className="w-5 h-5" /> {newDonor.id ? 'সংশোধন নিরাপদ করুন' : 'তথ্য ডাটাবেজে সংরক্ষণ করুন'}
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
          <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> ভলান্টিয়ার আনলক প্যানেল
          </h3>
          {isUnlocked ? (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200">
              <span className="text-xs font-bold text-green-700 flex items-center gap-1.5 leading-normal">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> ডাটা সফলভাবে আনলক আছে ({volunteerPhone})
              </span>
              <button onClick={handleLockData} className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> লক করুন
              </button>
            </div>
          ) : (
            <form onSubmit={handleVolunteerUnlock} className="space-y-3">
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="tel" placeholder="ভলান্টিয়ার মোবাইল নাম্বার দিন" value={volunteerPhone} onChange={e => setVolunteerPhone(e.target.value)} className="w-full border-2 pl-9 p-2.5 rounded-xl text-sm focus:outline-red-500 leading-normal" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="password" placeholder="সিকিউরিটি কোড বা পাসওয়ার্ড দিন" value={volunteerPassword} onChange={e => setVolunteerPassword(e.target.value)} className="w-full border-2 pl-9 p-2.5 rounded-xl text-sm focus:outline-red-500 leading-normal" required />
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1">
                <Unlock className="w-4 h-4" /> ভলান্টিয়ার ডাটা আনলক করুন
              </button>
            </form>
          )}
        </div>
      )}

      {/* স্থানান্তরকৃত ভলান্টিয়ার লিডারবোর্ড মডিউল (ভলান্টিয়ার আনলক প্যানেল এর নিচে) */}
      <div className="bg-white p-5 rounded-2xl shadow border border-blue-100 space-y-3">
        <h3 className="text-base font-black text-blue-600 flex items-center gap-1.5">
          <Award className="w-5 h-5 text-amber-500 fill-amber-500" /> ভলান্টিয়ার লিডারবোর্ড (সক্রিয়তা তালিকা)
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold leading-none">ডোনার রেজিস্ট্রেশন ও ম্যানেজ করার উপর ভিত্তি করে তৈরি রিয়েলটাইম র‍্যাংকিং।</p>
        <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
          {volunteers.map((v, idx) => {
            const vBadge = getVolunteerBadge(v.points);
            return (
              <div key={v.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-600'}`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{v.name}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${vBadge.classes}`}>{vBadge.text}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{v.points || 0} পয়েন্ট</span>
                  {(isAdmin || isUnlocked) && (
      <div className="flex items-center gap-1">
    {/* আইডি কার্ড বাটন - সুপার স্লিম */}
    <button onClick={() => downloadVolunteerCard(v)} title="কার্ড" className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border rounded-sm text-slate-600 hover:bg-slate-50 shadow-none text-[8px] font-bold transition-all border-slate-200">
      <Download className="w-2.5 h-2.5" />
      কার্ড
    </button>
    
    {/* সার্টিফিকেট বাটন - সুপার স্লিম */}
    <button onClick={() => downloadVolunteerCertificate(v)} title="সার্টিফিকেট" className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 hover:bg-rose-100 shadow-none text-[8px] font-bold transition-all">
      <Award className="w-2.5 h-2.5" />
      সনদ
    </button>
  </div>
)}
              </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* নতুন গ্লোবাল ফিচার: দাতার রক্তদানের ইতিহাস ট্র্যাকিং সেকশন */}
      <div className="bg-white p-5 rounded-2xl shadow border border-red-100 space-y-3">
        <h3 className="text-base font-black text-red-600 flex items-center gap-1.5">
          <History className="w-5 h-5 text-red-500" /> দাতার রক্তদানের ইতিহাস
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold leading-none">কোনো ডোনার আগে কাকে, কোন হাসপাতালে এবং কত তারিখে রক্ত দিয়েছেন তার সংক্ষিপ্ত ইতিহাস রেকর্ড।</p>
        <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
          {allLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 flex items-center justify-center gap-1">
              <Info className="w-4 h-4" /> কোনো রক্তদানের ইতিহাস রেকর্ড খুঁজে পাওয়া যায়নি।
            </p>
          ) : (
            allLogs.map(log => {
              const matchedDonor = donors.find(d => d.id === log.donor_id);
              return (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span className="text-red-600">🩸 রক্তদাতা: {matchedDonor ? matchedDonor.name : 'অজানা দাতা'} ({matchedDonor ? matchedDonor.blood_group : ''})</span>
                    <span className="text-slate-500 text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">{log.date}</span>
                  </div>
                  <p className="text-slate-600 font-medium"> হাসপাতাল: <span className="text-slate-800">{log.hospital}</span></p>
                  <p className="text-slate-600 font-medium">👤 রোগী: <span className="text-slate-800">{log.patient_name}</span></p>
                  {isAdmin && (
                    <div className="text-right pt-1">
                      <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 font-bold text-[10px] bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 inline-flex items-center gap-0.5">
                        <Trash2 className="w-3 h-3" /> রেকর্ড মুছুন
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white p-5 rounded-2xl shadow-t-4 border-blue-600 space-y-4">
          <h3 className="text-lg font-black text-blue-600 flex items-center gap-2 leading-relaxed">
            <Users className="w-5 h-5" /> ভলান্টিয়ার কন্ট্রোল প্যানেল
          </h3>
          <form onSubmit={handleAddVolunteer} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Plus className="w-4 h-4" /> {editVolunteerId ? 'ভলান্টিয়ার তথ্য ও পাসওয়ার্ড সংশোধন:' : 'নতুন ভলান্টিয়ার ও কাস্টম পাসওয়ার্ড অনুমোদন:'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <input type="text" placeholder="ভলান্টিয়ার/সেচ্ছাসেবীর নাম" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
              <input type="tel" placeholder="মোবাইল নাম্বার" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
              <input type="text" placeholder="সিকিউরিটি কোড বা পাসওয়ার্ড" value={newVolunteer.password} onChange={e => setNewVolunteer({...newVolunteer, password: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
              <input type="number" placeholder="অ্যাক্টিভিটি স্কোর পয়েন্ট সেট করুন" value={newVolunteer.points} onChange={e => setNewVolunteer({...newVolunteer, points: e.target.value})} className="w-full border-2 p-2.5 rounded-xl text-sm" />
            </div>
            <div className="flex gap-1.5">
              <button type="submit" className="flex-1 bg-blue-600 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1">
                <Save className="w-3.5 h-3.5" /> {editVolunteerId ? 'তথ্য আপডেট' : 'ভলান্টিয়ার অনুমোদন'}
              </button>
              {editVolunteerId && (
                <button type="button" onClick={() => { setEditVolunteerId(null); setNewVolunteer({ name: '', phone: '', password: '', points: '' }); }} className="bg-slate-200 text-slate-700 px-3 rounded-xl font-bold text-xs">বাতিল</button>
              )}
            </div>
          </form>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {volunteers.map(v => (
              <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-normal">
                <div>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-slate-500" /> {v.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    মোবাইল: {v.phone} | কোড: <span className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{v.password || v.code || 'ডিফল্ট'}</span> | স্কোর: <span className="text-amber-600 font-bold">{v.points || 0}pt</span> {v.is_active ? '' : '(ব্লকড)'}
                  </p>
                </div>
                <div className="flex gap-1 items-center">
                  <button onClick={() => handleEditVolunteer(v)} title="সংশোধন" className="p-1.5 bg-white border rounded text-xs hover:bg-slate-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteVolunteer(v.id)} title="ডিলিট" className="p-1.5 bg-white border rounded text-xs hover:bg-slate-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleVolunteerStatus(v.id, v.is_active)} className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-white flex items-center gap-0.5 ${v.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                    {v.is_active ? <Ban className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {v.is_active ? 'ব্লক' : 'আনব্লক'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isAdmin && !isUnlocked && (
        <p className="text-center text-xs text-slate-400 py-10 leading-normal bg-white p-4 rounded-xl border flex items-center justify-center gap-1">
          <Lock className="w-4 h-4 text-slate-400" />  ভলান্টিয়ার প্যানেল পরিচালনার জন্য আপনার রেজিস্টার্ড মোবাইল নাম্বার ও অ্যাডমিনের দেওয়া কাস্টম পাসওয়ার্ড দিয়ে ডাটা আনলক করুন।
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 leading-normal">
      
      {/* ফিক্সড নোটিফিকেশন UI */}
      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className={`p-5 rounded-2xl shadow-2xl border text-center font-black text-sm sm:text-base max-w-sm w-11/12 pointer-events-auto transform transition-all duration-300 scale-100 break-words whitespace-normal ${
            notification.type === 'success' ? 'bg-green-600 text-white border-green-700' : 
            notification.type === 'error' ? 'bg-red-600 text-white border-red-700' : 
            'bg-slate-800 text-white border-slate-900'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-red-500 transform transition-all duration-300 scale-100 flex flex-col items-center text-center space-y-4">
            <div className="bg-white/20 p-3 rounded-full animate-bounce">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="font-bengali text-lg md:text-xl font-medium whitespace-normal break-words leading-relaxed w-full">
              {error}
            </div>
            <div className="w-full pt-2">
              <button 
                onClick={() => {
                  console.log("Resetting model error validation boundary message layout.");
                  setError(null);
                }} 
                className="font-bengali bg-white text-red-700 font-bold px-8 py-2.5 rounded-xl hover:bg-red-50 transition-colors duration-200 shadow-md text-sm w-full md:w-auto"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-red-600 text-white text-center py-8 shadow-lg px-4 relative">
        <div className="flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-md" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-center text-white tracking-wide drop-shadow-md leading-tight">
              ব্লাড সেন্টার নদোনা নোয়াখালী
          </h1>
          <div className="text-xs text-red-100 font-bold flex flex-col items-center gap-1 mt-1">
            <span className="bg-red-700/50 px-3 py-0.5 rounded-full">প্রতিষ্ঠা: ২০১৩ ইং</span>
            <span className="bg-red-700/50 px-3 py-0.5 rounded-full mt-1">📍নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী 🇧🇩</span>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          {!isAdmin ? (
            <button onClick={() => {
              console.log(`Toggling Admin Login container state configuration to: ${!showAdminLogin}`);
              setShowAdminLogin(!showAdminLogin);
            }} className="bg-red-700 hover:bg-red-800 text-xs font-bold px-3 py-2.0 rounded-xl text-white flex items-center gap-1 shadow">
              <Lock className="w-3.5 h-3.5" /> অ্যাডমিন
            </button>
          ) : (
      
      <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
          {!isAdmin ? (
            <button onClick={() => {
              console.log(`Toggling Admin Login container state configuration to: ${!showAdminLogin}`);
              setShowAdminLogin(!showAdminLogin);
            }} className="bg-red-700 hover:bg-red-800 text-xs font-bold px-3 py-1.5 rounded-lg text-white flex items-center gap-1 shadow">
              <Lock className="w-3 h-3" /> অ্যাডমিন
            </button>
          ) : (
            <div className="flex flex-col gap-1 items-end">
              <button onClick={() => setShowPassModal(true)} className="bg-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg text-white shadow flex items-center gap-0.5 w-full justify-center"><Lock className="w-2.5 h-2.5" /> পাসওয়ার্ড</button>
              <button onClick={() => {
                console.log("Admin log-out signal context fired. Revoking access states layout map.");
                setIsAdmin(false);
              }} className="bg-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg text-white shadow flex items-center gap-0.5 w-full justify-center"><LogOut className="w-2.5 h-2.5" /> লগআউট</button>
            </div>
          )}
          
          {/* অ্যাডমিন বাটনের নিচে শেয়ার বাটন */}
          <button onClick={() => setShowShareModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white shadow flex items-center gap-1 mt-1 transition-colors w-full justify-center">
             <Share2 className="w-3 h-3" /> শেয়ার
          </button>
          </div>

          )}
        </div>
      </header>

                  <div className="bg-gradient-to-r from-[#006a4e] via-[#006a4e] to-[#f42a41] text-white py-2 px-3 text-center flex flex-col items-center justify-center shadow-md sticky top-0 z-40">
        <span className="font-bold text-xs sm:text-sm mb-0.5 drop-shadow-sm">
          জরুরি রক্ত প্রয়োজনে যোগাযোগ করুন
        </span>
        <span className="text-[9px] sm:text-[10px] font-medium opacity-90 leading-tight max-w-[90%] mb-1.5 text-green-50">
          (কল দেওয়ার আগে "খুঁজুন" বাটনে ক্লিক করে প্রয়োজনীয় রক্তের ডোনার খুঁজে দেখুন)
        </span>
        <a href="tel:+8801813132013" className="bg-white text-[#f42a41] px-3 py-1 rounded-full text-[11px] font-black shadow-sm hover:shadow-md transition-all flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-[#006a4e]" /> +880 1813-132013
        </a>
      </div>


      {/* আপনার দেওয়া নতুন নেভিগেশন ট্যাবের অর্ডার (ঠিক আগের মতো) */}
      <nav className="bg-white border-b sticky top-[38px] z-30 shadow-xs">
        <div className="max-w-md mx-auto grid grid-cols-5 text-center font-bold text-[10px] sm:text-xs">
          <button onClick={() => { console.log("Tab Swapped: home"); setActiveTab('home'); }} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'home' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <Home className="w-4 h-4 sm:w-5 sm:h-5" /><span>হোম</span>
          </button>
          <button onClick={() => { console.log("Tab Swapped: notice"); setActiveTab('notice'); }} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'notice' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" /><span>জরুরি নোটিশ</span>
          </button>
          <button onClick={() => { console.log("Tab Swapped: search"); setActiveTab('search'); }} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'search' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <Search className="w-4 h-4 sm:w-5 sm:h-5" /><span>খুঁজুন</span>
          </button>
          <button onClick={() => { console.log("Tab Swapped: register"); setActiveTab('register'); }} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'register' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" /><span>নিবন্ধন</span>
          </button>
          <button onClick={() => { console.log("Tab Swapped: volunteer"); setActiveTab('volunteer'); }} className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'volunteer' ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500'}`}>
            <Users className="w-4 h-4 sm:w-5 sm:h-5" /><span>ভলান্টিয়ার</span>
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {showAdminLogin && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100">
            <h3 className="text-xl font-bold text-red-600 mb-4 text-center flex items-center justify-center gap-2 leading-relaxed">
              <Lock className="w-5 h-5" /> অ্যাডমিন লগইন ভেরিফিকেশন
            </h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input type="text" placeholder="ইউজার আইডি দিন" value={userId} onChange={e => setUserId(e.target.value)} className="w-full border-2 pl-10 p-3 rounded-xl text-base focus:outline-red-500 leading-normal" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input type={showPassword ? "text" : "password"} placeholder="গোপন পাসওয়ার্ড দিন" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 pl-10 pr-10 p-3 rounded-xl text-base focus:outline-red-500 leading-normal" required />
                <button type="button" onClick={() => { setShowPassword(!showPassword); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 focus:outline-none">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2">
                <Unlock className="w-4 h-4" /> লগইন করুন
              </button>
            </form>
          </div>
        )}

        {/* Change Password Modal */}
        {showPassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border w-full max-w-sm overflow-hidden">
               <div className="bg-blue-600 p-4 text-center">
                 <h3 className="text-white font-bold flex justify-center items-center gap-2"><Lock className="w-5 h-5"/> পাসওয়ার্ড পরিবর্তন</h3>
               </div>
               <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                 <input type="password" placeholder="মাস্টার কোড দিন" value={masterCode} onChange={e => setMasterCode(e.target.value)} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
                 <input type="password" placeholder="নতুন পাসওয়ার্ড দিন" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border-2 p-2.5 rounded-xl text-sm" required />
                 <div className="flex gap-2">
                   <button type="submit" className="flex-1 bg-blue-600 text-white p-2.5 rounded-xl font-bold text-sm">পরিবর্তন করুন</button>
                   <button type="button" onClick={() => setShowPassModal(false)} className="flex-1 bg-slate-200 text-slate-800 p-2.5 rounded-xl font-bold text-sm">বাতিল</button>
                 </div>
               </form>
            </div>
          </div>
        )}

        {/* Log Modal */}
        {showLogModal && activeLogDonor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-red-600 p-4 text-center flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2"><History className="w-5 h-5"/> ডোনার হিস্ট্রি ({activeLogDonor.name})</h3>
                <button onClick={() => setShowLogModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {(isAdmin || isUnlocked) && (
                   <form onSubmit={handleAddLog} className="bg-slate-50 p-3 rounded-xl border space-y-2">
                     <p className="text-xs font-bold text-slate-700">নতুন ডোনেশন রেকর্ড যুক্ত করুন</p>
                     <input type="text" placeholder="রোগীর নাম" value={newLog.patient_name} onChange={e => setNewLog({...newLog, patient_name: e.target.value})} className="w-full border p-2 rounded text-xs" required />
                     <input type="text" placeholder="হাসপাতাল" value={newLog.hospital} onChange={e => setNewLog({...newLog, hospital: e.target.value})} className="w-full border p-2 rounded text-xs" required />
                     <input type="date" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="w-full border p-2 rounded text-xs" required />
                     <button type="submit" className="w-full bg-red-600 text-white p-2 rounded font-bold text-xs">সেভ করুন</button>
                    </form>
                )}
                <div className="space-y-2">
                   {donorLogs.length === 0 ? (
                      <p className="text-xs text-center text-slate-500 py-4">কোনো রেকর্ড নেই।</p>
                   ) : (
                      donorLogs.map(log => (
                         <div key={log.id} className="bg-slate-50 p-2.5 rounded-lg border text-xs">
                           <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-slate-800">রোগী: {log.patient_name}</span>
                             <span className="text-slate-500">{log.date}</span>
                           </div>
                           <p className="text-slate-600">হাসপাতাল: {log.hospital}</p>
                           {isAdmin && (
                             <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-700 mt-1 flex items-center gap-1 text-[10px] font-bold">
                               <Trash2 className="w-3 h-3"/> মুছুন
                             </button>
                            )}
                         </div>
                      ))
                   )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Routing */}
        <div className="pb-10">
          {/* এখানে হোম ট্যাবের ভেতরে আপনার চাওয়া ৩টি বাটন যুক্ত করা হলো */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-2xl shadow border border-slate-100">
              <button onClick={() => { setActiveTab('notice'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
                <Megaphone className="w-6 h-6" />
                <span className="text-[11px] font-black">জরুরি নোটিশ</span>
              </button>
              <button onClick={() => { setActiveTab('register'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors shadow-sm">
                <UserPlus className="w-6 h-6" />
                <span className="text-[11px] font-black">নিবন্ধন</span>
              </button>
              <button onClick={() => { setActiveTab('search'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm">
                <Search className="w-6 h-6" />
                <span className="text-[11px] font-black">খুঁজুন</span>
              </button>
            </div>
          )}

          {activeTab === 'home' && renderNoticeSection()}
          {activeTab === 'notice' && renderNoticeSection()}
          {activeTab === 'search' && renderSearchSection()}
          {activeTab === 'register' && renderRegisterSection()}
          {activeTab === 'volunteer' && renderVolunteerSection()}
        </div>
      </main>

      {/* আপনার নির্দেশিত হুবহু ফুটার ডিজাইন ও লেখা */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed pb-8">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto whitespace-nowrap">
          <span className="text-xs font-medium text-slate-400 leading-normal">কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-6 h-6 rounded-full object-cover border shadow-xs" onError={(e) => {e.target.style.display='none'}} />
          <span className="font-black text-slate-600 text-sm tracking-normal">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
