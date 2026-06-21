import React, { useState, useEffect } from 'react';
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
  // অ্যাপ স্টেটসমূহ
  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [posts, setPosts] = useState([]); // নোয়াখালী পোস্ট স্টেট
  const [donorLogs, setDonorLogs] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); 
  const [activeTab, setActiveTab] = useState('home'); 

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassModal, setShowPassModal] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ফর্ম স্টেট (নিবন্ধন)
  const [newDonor, setNewDonor] = useState({
    name: '', phone: '', bloodGroup: 'A+', lastDonation: '', address: '', age: '', weight: '', gender: 'পুরুষ'
  });

  // ফর্ম স্টেট (জরুরি নোটিশ)
  const [newRequest, setNewRequest] = useState({
    patientName: '', bloodGroup: 'A+', amount: '', hospital: '', date: '', contact: '', urgent: true
  });

  // ফর্ম স্টেট (নোয়াখালী পোস্ট)
  const [postContent, setPostContent] = useState('');
  const [postFile, setPostFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // ডাটাবেস থেকে ডাটা লোড
  const fetchData = async () => {
    const [donorsRes, requestsRes, volunteersRes, postsRes, logsRes] = await Promise.all([
      supabase.from('donors').select('*').order('created_at', { ascending: false }),
      supabase.from('emergency_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('volunteers').select('*').order('created_at', { ascending: false }),
      supabase.from('noakhali_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('donor_logs').select('*').order('created_at', { ascending: false })
    ]);

    if (!donorsRes.error) setDonors(donorsRes.data);
    if (!requestsRes.error) setEmergencyRequests(requestsRes.data);
    if (!volunteersRes.error) setVolunteers(volunteersRes.data);
    if (!postsRes.error) setPosts(postsRes.data);
    if (!logsRes.error) setDonorLogs(logsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // নোয়াখালী পোস্ট সাবমিট ফাংশন (Bucket Fixed)
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsUploading(true);
    
    try {
      let fileUrl = null;
      let fileType = null;

      if (postFile) {
        const fileExt = postFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Fixed BUCKET NAME -> noakhali_posts
        const { error: uploadError } = await supabase.storage
          .from('noakhali_posts')
          .upload(filePath, postFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('noakhali_posts')
          .getPublicUrl(filePath);

        fileUrl = data.publicUrl;
        fileType = postFile.type.startsWith('video/') ? 'video' : 'image';
      }

      const { error } = await supabase
        .from('noakhali_posts')
        .insert([{ content: postContent, file_url: fileUrl, file_type: fileType }]);

      if (error) throw error;

      alert('পোস্ট সফলভাবে পাবলিশ হয়েছে!');
      setPostContent('');
      setPostFile(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('পোস্ট ব্যর্থ হয়েছে: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostDelete = async (id) => {
    if (!window.confirm('পোস্টটি মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('noakhali_posts').delete().match({ id });
    if (!error) {
      fetchData();
    } else {
      alert('ডিলিট ব্যর্থ হয়েছে!');
    }
  };

  const calculateEligibility = (lastDonation) => {
    if (!lastDonation) return { eligible: true, text: 'রক্ত দিতে পারবেন', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    const daysSince = Math.floor((new Date() - new Date(lastDonation)) / (1000 * 60 * 60 * 24));
    if (daysSince >= 120) return { eligible: true, text: 'রক্ত দিতে পারবেন', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    return { eligible: false, text: `রক্ত দিতে পারবেন ${120 - daysSince} দিন পর`, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  };

  const addDonor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('donors').insert([newDonor]);
    if (!error) {
      alert('রক্তদাতা সফলভাবে নিবন্ধিত হয়েছেন!');
      setNewDonor({ name: '', phone: '', bloodGroup: 'A+', lastDonation: '', address: '', age: '', weight: '', gender: 'পুরুষ' });
      fetchData();
    }
  };

  const addRequest = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('শুধুমাত্র ভলান্টিয়ার বা অ্যাডমিন নোটিশ পোস্ট করতে পারবেন।');
      return;
    }
    const { error } = await supabase.from('emergency_requests').insert([newRequest]);
    if (!error) {
      alert('জরুরি নোটিশ যুক্ত করা হয়েছে!');
      setNewRequest({ patientName: '', bloodGroup: 'A+', amount: '', hospital: '', date: '', contact: '', urgent: true });
      fetchData();
    }
  };

  const deleteRequest = async (id) => {
    const { error } = await supabase.from('emergency_requests').delete().match({ id });
    if (!error) fetchData();
  };

  const deleteDonor = async (id) => {
    const { error } = await supabase.from('donors').delete().match({ id });
    if (!error) fetchData();
  };

  const updateDonationDate = async (id, name, date) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('donors').update({ last_donation: date }).match({ id });
    if (!error) {
      alert(`${name} এর রক্তদানের তারিখ আপডেট হয়েছে!`);
      fetchData();
    }
  };

  const adminLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('admin_passwords')
      .select('password')
      .eq('phone', adminPhone)
      .single();

    if (data && data.password === adminPassword) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPhone('');
      setAdminPassword('');
      alert('লগইন সফল হয়েছে!');
    } else {
      alert('মোবাইল নাম্বার বা পাসওয়ার্ড ভুল!');
    }
  };

  const changeAdminPassword = async (e) => {
    e.preventDefault();
    if (masterCode === '102030') {
      const { error } = await supabase
        .from('admin_passwords')
        .update({ password: newPassword })
        .eq('id', 1);

      if (!error) {
        alert('অ্যাডমিন পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!');
        setShowPassModal(false);
        setMasterCode('');
        setNewPassword('');
      } else {
        alert('পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে!');
      }
    } else {
      alert('মাস্টার সিকিউরিটি কোড ভুল!');
    }
  };

  const filteredDonors = donors.filter(donor => {
    const matchSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        donor.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = selectedGroup === 'All' || donor.bloodGroup === selectedGroup;
    const isEligible = calculateEligibility(donor.lastDonation).eligible;
    const matchEligibility = eligibilityFilter === 'All' || 
                             (eligibilityFilter === 'Eligible' && isEligible) ||
                             (eligibilityFilter === 'NotEligible' && !isEligible);
    return matchSearch && matchGroup && matchEligibility;
  });

  // --- Render Sections ---

  const renderNoakhaliPostSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white tracking-wide">নোয়াখালী পোস্ট</h2>
      </div>

      <div className="p-4 space-y-4">
        {isAdmin && (
          <form onSubmit={handlePostSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm border-b pb-2">
              <Pencil className="w-4 h-4 text-rose-600" /> নতুন পোস্ট তৈরি করুন
            </h3>
            <textarea
              placeholder="পোস্টের বিবরণ লিখুন..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              rows="3"
              required
            />
            <div className="flex items-center gap-3">
              <label className="flex-1 border border-slate-200 border-dashed rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-slate-50 transition-colors text-sm text-slate-500">
                <Image className="w-4 h-4 text-rose-500" />
                <Video className="w-4 h-4 text-rose-500" />
                <span>{postFile ? postFile.name : 'ছবি/ভিডিও যুক্ত করুন'}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setPostFile(e.target.files[0])} />
              </label>
              <button type="submit" disabled={isUploading} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-rose-700 flex items-center gap-2">
                {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isUploading ? 'আপলোড হচ্ছে...' : 'পোস্ট করুন'}
              </button>
            </div>
          </form>
        )}

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-slate-100">
             <span className="text-slate-500 font-medium text-sm">① বর্তমানে নোয়াখালী পোস্টে কোনো আপডেট নেই।</span>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold border border-rose-200">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">ব্লাড সেন্টার নদোনা নোয়াখালী</h4>
                    <span className="text-[10px] text-slate-500">{new Date(post.created_at).toLocaleString('bn-BD')}</span>
                  </div>
                </div>
                
                <div className="p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>

                {post.file_url && (
                  <div className="bg-slate-100">
                    {post.file_type === 'video' ? (
                      <video src={post.file_url} controls className="w-full max-h-[400px] object-contain" />
                    ) : (
                      <img src={post.file_url} alt="Post media" className="w-full max-h-[400px] object-contain" />
                    )}
                  </div>
                )}

                <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                  <button className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-xs font-bold transition-colors">
                    <Share2 className="w-4 h-4" /> শেয়ার
                  </button>
                  {isAdmin && (
                    <button onClick={() => handlePostDelete(post.id)} className="flex items-center gap-1 text-rose-600 hover:bg-rose-50 px-2 py-1 rounded text-xs font-bold transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNoticeSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-white tracking-wide">জরুরি রক্তের লাইভ নোটিশ বোর্ড</h2>
        </div>
      </div>
      
      <div className="p-4 space-y-4 bg-slate-50">
        {isAdmin && (
          <form onSubmit={addRequest} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm">
              <Plus className="w-4 h-4 text-rose-600"/> নতুন নোটিশ পোস্ট করুন
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="রোগীর নাম" value={newRequest.patientName} onChange={e => setNewRequest({...newRequest, patientName: e.target.value})} className="border p-2.5 rounded-xl text-xs w-full" required />
              <select value={newRequest.bloodGroup} onChange={e => setNewRequest({...newRequest, bloodGroup: e.target.value})} className="border p-2.5 rounded-xl text-xs w-full font-bold text-rose-600" required>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => <option key={group} value={group}>{group}</option>)}
              </select>
              <input type="text" placeholder="রক্তের পরিমাণ (যেমন: ২ ব্যাগ)" value={newRequest.amount} onChange={e => setNewRequest({...newRequest, amount: e.target.value})} className="border p-2.5 rounded-xl text-xs w-full" required />
              <input type="text" placeholder="হাসপাতাল ও স্থান" value={newRequest.hospital} onChange={e => setNewRequest({...newRequest, hospital: e.target.value})} className="border p-2.5 rounded-xl text-xs w-full col-span-2" required />
              <input type="text" placeholder="কখন লাগবে (তারিখ/সময়)" value={newRequest.date} onChange={e => setNewRequest({...newRequest, date: e.target.value})} className="border p-2.5 rounded-xl text-xs w-full" required />
              <input type="tel" placeholder="যোগাযোগের নাম্বার" value={newRequest.contact} onChange={e => setNewRequest({...newRequest, contact: e.target.value})} className="border p-2.5 rounded-xl text-xs w-full" required />
            </div>
            <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold mt-2 flex items-center justify-center gap-2 text-sm shadow-md">
               পোস্ট করুন
            </button>
          </form>
        )}

        {emergencyRequests.map(req => (
          <div key={req.id} className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
              জরুরি প্রয়োজন
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start pt-2">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-base">
                    <User className="w-4 h-4 text-rose-500" /> রোগী: {req.patientName}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-100 inline-flex">
                    <Droplet className="w-4 h-4" fill="currentColor"/>
                    <span className="font-black text-sm">{req.bloodGroup}</span>
                    <span className="text-xs font-medium border-l border-rose-200 pl-2 ml-1">প্রয়োজন: {req.amount}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-start gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-tight"><span className="font-bold text-slate-700">স্থান:</span> {req.hospital}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
                  <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="leading-tight"><span className="font-bold text-slate-700">সময়:</span> {req.date}</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a href={`tel:${req.contact}`} className="bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm transition-all">
                  <Phone className="w-4 h-4" /> কল দিন
                </a>
                <a href={`https://wa.me/+88${req.contact}`} target="_blank" rel="noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm transition-all">
                  <MessageSquare className="w-4 h-4" /> হোয়াটসঅ্যাপ
                </a>
              </div>

              {isAdmin && (
                <button onClick={() => deleteRequest(req.id)} className="w-full bg-slate-100 text-rose-600 py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-xs mt-2 hover:bg-rose-50 border border-slate-200">
                  <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                </button>
              )}
            </div>
          </div>
        ))}
        {emergencyRequests.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed text-slate-400">
            <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">বর্তমানে কোনো জরুরি রক্তের প্রয়োজন নেই</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRegisterSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
             <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-white tracking-wide">নতুন রক্তদাতা নিবন্ধন</h2>
        </div>
      </div>
      <div className="p-5">
        <form onSubmit={addDonor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">সম্পূর্ণ নাম</label>
              <input type="text" placeholder="আপনার নাম লিখুন" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" required />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">রক্তের গ্রুপ</label>
              <select value={newDonor.bloodGroup} onChange={e => setNewDonor({...newDonor, bloodGroup: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none" required>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">মোবাইল নাম্বার</label>
              <input type="tel" placeholder="017XXXXXXXX" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" required />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">লিঙ্গ</label>
              <select value={newDonor.gender} onChange={e => setNewDonor({...newDonor, gender: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" required>
                <option value="পুরুষ">পুরুষ</option>
                <option value="মহিলা">মহিলা</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">বয়স</label>
              <input type="number" placeholder="বয়স" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" required />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">বর্তমান ঠিকানা</label>
              <input type="text" placeholder="আপনার ঠিকানা টাইপ করুন" value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" required />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">শেষ রক্তদানের তারিখ (যদি দিয়ে থাকেন)</label>
              <input type="date" value={newDonor.lastDonation} onChange={e => setNewDonor({...newDonor, lastDonation: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-black text-base shadow-md flex items-center justify-center gap-2 mt-4 transition-all">
            <Check className="w-5 h-5" /> নিবন্ধন সম্পন্ন করুন
          </button>
        </form>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
       <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4">
         <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-black text-white tracking-wide">রক্তদাতা খুঁজুন</h2>
         </div>
         
         <div className="space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="নাম বা ঠিকানা দিয়ে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border-none outline-none text-sm font-medium shadow-inner" />
            </div>
            
            <div className="flex gap-2">
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="flex-1 p-3 rounded-xl border-none outline-none text-sm font-bold text-rose-600 shadow-inner">
                <option value="All">সকল গ্রুপ</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => <option key={group} value={group}>{group}</option>)}
              </select>
              <select value={eligibilityFilter} onChange={e => setEligibilityFilter(e.target.value)} className="flex-1 p-3 rounded-xl border-none outline-none text-sm font-medium text-slate-700 shadow-inner">
                <option value="All">সব অবস্থা</option>
                <option value="Eligible">রক্ত দিতে পারবে</option>
                <option value="NotEligible">রক্ত দিতে পারবে না</option>
              </select>
            </div>
         </div>
       </div>

       <div className="p-4 space-y-3 bg-slate-50 min-h-[300px]">
         <div className="flex justify-between items-center pb-2 border-b border-slate-200">
           <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5"><Users className="w-4 h-4"/> মোট দাতা:</span>
           <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-black text-sm border border-rose-200">{filteredDonors.length} জন</span>
         </div>

         {filteredDonors.map((donor, idx) => {
           const eligibility = calculateEligibility(donor.lastDonation);
           return (
             <div key={donor.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
               <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                 #{idx + 1}
               </div>
               <div className="flex justify-between items-start mb-3">
                 <div>
                   <h3 className="font-bold text-slate-800 text-base">{donor.name}</h3>
                   <span className="text-xs text-slate-500 font-medium">{donor.gender} • {donor.age} বছর</span>
                 </div>
                 <div className="bg-rose-50 text-rose-600 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border border-rose-100 shadow-sm">
                   {donor.bloodGroup}
                 </div>
               </div>
               
               <div className="space-y-1.5 text-xs mb-3">
                 <p className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {donor.address}</p>
                 <p className="text-slate-600 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400"/> শেষ দান: {donor.lastDonation ? new Date(donor.lastDonation).toLocaleDateString('bn-BD') : 'কখনো দেননি'}</p>
               </div>

               <div className={`text-xs font-bold text-center py-2 rounded-lg mb-3 border ${eligibility.bg} ${eligibility.color}`}>
                 {eligibility.text}
               </div>

               {isAdmin && (
                 <div className="pt-3 border-t border-slate-100 space-y-2">
                   <a href={`tel:${donor.phone}`} className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-xs hover:bg-slate-200 transition-colors">
                     <Phone className="w-3.5 h-3.5" /> {donor.phone} (কল দিন)
                   </a>
                   <div className="flex gap-2">
                     <input type="date" className="border text-[10px] p-1.5 rounded w-full" onChange={(e) => updateDonationDate(donor.id, donor.name, e.target.value)} />
                     <button onClick={() => deleteDonor(donor.id)} className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded font-bold text-[10px] hover:bg-rose-100 border border-rose-100">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 </div>
               )}
             </div>
           );
         })}
         {filteredDonors.length === 0 && (
           <div className="text-center py-10 text-slate-400">
             <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
             <p className="text-sm">কোনো রক্তদাতা পাওয়া যায়নি</p>
           </div>
         )}
       </div>
    </div>
  );

  const renderVolunteerSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
             <Shield className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-white tracking-wide">অ্যাডমিন প্যানেল</h2>
        </div>
      </div>
      
      <div className="p-5">
        {!isAdmin ? (
          <div className="text-center py-6">
            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4 font-medium">ভলান্টিয়ার প্যানেল পরিচালনার জন্য আপনার রেজিস্টার্ড মোবাইল নাম্বার ও অ্যাডমিনের দেওয়া কাস্টম পাসওয়ার্ড দিয়ে ডাটা আনলক করুন।</p>
            <button onClick={() => setShowAdminLogin(true)} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-700 flex items-center justify-center gap-2 mx-auto w-full max-w-xs transition-colors">
              <Unlock className="w-4 h-4"/> ডাটা আনলক করুন
            </button>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-2 font-bold text-sm">
                 <Shield className="w-5 h-5" /> প্যানেল আনলকড
               </div>
               <button onClick={() => setIsAdmin(false)} className="text-xs bg-white border border-emerald-200 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-1 shadow-sm">
                 <LogOut className="w-3.5 h-3.5"/> লগআউট
               </button>
             </div>
             
             <button onClick={() => setShowPassModal(true)} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-sm">
               <Lock className="w-4 h-4"/> অ্যাডমিন পাসওয়ার্ড পরিবর্তন
             </button>

             <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-rose-500"/> ভলান্টিয়ার কার্যক্রম (লগস)
                </h3>
                <div className="space-y-2">
                   {donorLogs.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">কোনো কার্যক্রম নেই।</p>
                   ) : (
                      donorLogs.map((log, idx) => (
                         <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-sm flex items-center justify-between">
                           <div>
                             <div className="font-bold text-slate-800 flex items-center gap-1 mb-1"><User className="w-3 h-3 text-rose-500"/> {log.patient_name}</div>
                             <div className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {log.hospital}</div>
                             <div className="text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {log.date}</div>
                           </div>
                           <div className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">
                             #{idx + 1}
                           </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20 selection:bg-rose-200">
      {/* Header */}
      <header className="bg-gradient-to-b from-red-600 to-rose-700 text-white pt-8 pb-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-md mx-auto text-center relative">
          <div className="absolute top-0 right-0 bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm flex items-center gap-1 border border-white/20">
            <Shield className="w-3 h-3"/> অ্যাডমিন
          </div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl border-4 border-rose-500/30 relative">
             <Droplet className="w-8 h-8 text-rose-600" fill="currentColor"/>
             <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          <h1 className="text-2xl font-black mb-1 tracking-tight drop-shadow-md">ব্লাড সেন্টার নদোনা নোয়াখালী</h1>
          <p className="text-xs font-medium text-rose-100 bg-black/10 inline-block px-3 py-1 rounded-full backdrop-blur-sm mb-3">স্থাপিত: ২০১৩ ইং</p>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-rose-50 flex items-center justify-center gap-1.5 opacity-90"><MapPin className="w-3.5 h-3.5" /> নদোনা বাজার, সোনাইমুড়ী, নোয়াখালী</p>
            <p className="text-[11px] bg-white/10 py-1.5 px-3 rounded-lg inline-flex items-center gap-1.5 border border-white/10 shadow-sm backdrop-blur-sm mt-1">
              জরুরি রক্ত প্রয়োজনে সরাসরি যোগাযোগ করুন: <br/> 
              <span className="font-bold text-white text-sm tracking-wide">
                <a href="tel:+8801813132013" className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/>+880 1813-132013</a>
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[210px] sm:top-[200px] z-30 bg-white shadow-sm border-b border-slate-200 px-2 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max mx-auto justify-center">
          {[
            { id: 'home', icon: Home, label: 'হোম' },
            { id: 'notice', icon: Megaphone, label: 'জরুরি নোটিশ' },
            { id: 'search', icon: Search, label: 'খুঁজুন' },
            { id: 'register', icon: Plus, label: 'নিবন্ধন' },
            { id: 'volunteer', icon: Users, label: 'ভলান্টিয়ার' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === tab.id ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100 scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-rose-100' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 pt-6">
        
        {/* Modals */}
        {showAdminLogin && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-rose-600"></div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Lock className="w-5 h-5 text-rose-600"/> অ্যাডমিন লগইন ভেরিফিকেশন</h2>
                <button onClick={() => setShowAdminLogin(false)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={adminLogin} className="space-y-4">
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="tel" placeholder="ইউজার আইডি দিন" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none" required />
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type={showPassword ? "text" : "password"} placeholder="গোপন পাসওয়ার্ড দিন" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full border border-slate-200 pl-10 pr-10 py-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button type="submit" className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-slate-700 transition-colors mt-2">
                   লগইন করুন
                </button>
              </form>
            </div>
          </div>
        )}

        {showPassModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-rose-600"></div>
              <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-rose-600"/> পাসওয়ার্ড পরিবর্তন</h2>
              <form onSubmit={changeAdminPassword} className="space-y-3">
                <input type="password" placeholder="অ্যাডমিনের মাষ্টার সিকিউরিটি কোড" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none" required />
                <input type="password" placeholder="নতুন অ্যাডমিন পাসওয়ার্ড সেট করুন" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none" required />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1">
                    <RefreshCw className="w-4 h-4" /> আপডেট করুন
                  </button>
                  <button type="button" onClick={() => { setShowPassModal(false); setMasterCode(''); setNewPassword(''); }} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors">
                    <X className="w-4 h-4" /> বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Routing */}
        <div className="pb-10">
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              {renderNoakhaliPostSection()}
              {renderNoticeSection()}
              {renderRegisterSection()}
              {renderSearchSection()}
            </div>
          )}
          {activeTab === 'notice' && renderNoticeSection()}
          {activeTab === 'search' && renderSearchSection()}
          {activeTab === 'register' && renderRegisterSection()}
          {activeTab === 'volunteer' && renderVolunteerSection()}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-slate-400 mt-16 space-y-3 px-4 leading-relaxed pb-8">
        <p>© ২০২৬ ব্লাড সেন্টার নদোনা নোয়াখালী। সর্বস্বত্ব সংরক্ষিত। <br />স্থাপিত - ২৭ মার্চ ২০১৩ ইং ।</p>
        <p className="text-slate-500 font-bold text-xs bg-slate-200/50 inline-block px-4 py-1.5 rounded-full leading-normal">সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট</p>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-200 max-w-sm mx-auto whitespace-nowrap">
          <span className="text-xs font-medium text-slate-400 leading-normal">কারিগরি সহযোগিতায়:</span>
          <img src="/gias.png" alt="Developer" className="w-6 h-6 rounded-full object-cover border shadow-sm bg-slate-200" onError={(e) => {e.target.style.display='none'}} />
          <span className="text-xs font-bold text-slate-600 tracking-wide">অ্যাপ ডেভেলপার: গিয়াস উদ্দিন</span>
        </div>
      </footer>
    </div>
  );
}
