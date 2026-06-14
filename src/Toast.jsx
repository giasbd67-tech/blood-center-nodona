import React from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/20 pointer-events-none">
      {/* - fixed inset-0: পুরো স্ক্রিন জুড়ে পজিশন সেট করবে
        - flex items-center justify-center: বক্সটিকে স্ক্রিনের একদম মাঝখানে (Center) নিয়ে আসবে
        - p-4: মোবাইলের স্ক্রিনের বর্ডার থেকে ৪ পিক্সেল নিরাপদ দূরত্ব রাখবে যাতে কেটে না যায়
      */}
      <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-red-500 transform transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* আইকন এবং টেক্সট কন্টেইনার */}
        <div className="flex flex-col items-center text-center space-y-3">
          
          {/* এরর বা লাল কার্ডের ক্রস আইকন */}
          <div className="bg-white/20 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </</svg>
          </div>

          {/* আসল এরর মেসেজ বক্স (আপনার বাংলা ফন্ট সহ) */}
          <div className="font-bengali text-lg md:text-xl font-medium whitespace-normal break-words leading-relaxed w-full">
            {/* - font-bengali: আপনার সেট করা সোলাইমানলিপি/নোটো সান্স ফন্ট কাজ করবে
              - whitespace-normal: টেক্সট এক লাইনে না গিয়ে স্ক্রিনের শেষে নিচে ভেঙে আসবে
              - break-words: লম্বা কোনো শব্দ বা টেবিলের নাম (যেমন 'donors') থাকলে তা ভেঙে স্ক্রিনের ভেতরেই থাকবে
            */}
            {message || "নিবন্ধন ব্যর্থ হয়েছে: Could not find the relation 'donors' in the schema 'public'"}
          </div>
        </div>

        {/* বন্ধ করার বাটন */}
        <div className="mt-5 flex justify-center">
          <button 
            onClick={onClose}
            className="font-bengali bg-white text-red-700 font-bold px-6 py-2 rounded-xl hover:bg-red-50 transition-colors duration-200 shadow-md text-sm"
          >
            ঠিক আছে
          </button>
        </div>

      </div>
    </div>
  );
}
