// certificateUtils.js
// ব্লাড সেন্টার নদোনা নোয়াখালী - ডিজিটাল কার্ড ও সার্টিফিকেট জেনারেটর ইউটিলিটি

/**
 * ডিজিটাল ডোনার আইডি কার্ড তৈরি এবং ডাউনলোড করার ফাংশন
 */
export const downloadDonorCard = (donor, getDonorBadge) => {
  if (!donor) return;

  const canvas = document.createElement('canvas');
  canvas.width = 638;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট এবং স্টাইলিং
  const gradient = ctx.createLinearGradient(0, 0, 638, 400);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#fff5f5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 638, 400);

  // মূল বর্ডার
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#dc2626'; // থিম রেড
  ctx.strokeRect(0, 0, 638, 400);

  // টপ হেডার ব্যানার
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(12, 12, 614, 85);

  // হেডার টেক্সট (প্রতিষ্ঠানের নাম ও স্লোগান)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 319, 48);

  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('রক্তদাতার ডিজিটাল আইডি কার্ড', 319, 80);

  // ডোনারের ডাটা এবং বিবরণ লিখন
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  
  // নাম
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`নাম: ${donor.name}`, 50, 145);
  
  // রক্তের গ্রুপ লেবেল ও হাইলাইটেড বক্স
  ctx.fillText(`রক্তের গ্রুপ:`, 50, 195);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(160, 168, 75, 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(donor.blood_group, 197, 196);

  // অন্যান্য তথ্যসমূহ পুনরায় নরমাল টেক্সটে
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`মোবাইল: ${donor.phone || 'N/A'}`, 50, 245);
  ctx.fillText(`ঠিকানা: ${donor.address || 'N/A'}`, 50, 295);

  // ডোনার মেম্বারশিপ ব্যাজ তথ্য
  const badge = getDonorBadge ? getDonorBadge(donor.activity_count) : { text: 'রক্তদাতা' };
  ctx.fillText(`মোট রক্তদান: ${donor.activity_count || 0} বার (${badge.text})`, 50, 345);

  // ওয়াটারমার্ক বা ফুটার স্লোগান
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 13px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('“রক্ত দিন, জীবন বাঁচান”', 590, 375);

  // ফাইল ডাউনলোড ট্রিগার মেকানিজম
  const link = document.createElement('a');
  link.download = `Donor_Card_${donor.name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/**
 * ভলান্টিয়ার ডিজিটাল সম্মাননা সনদ ও কার্ড তৈরি এবং ডাউনলোড করার ফাংশน
 */
export const downloadVolunteerCertificate = (volunteer, getVolunteerBadge) => {
  if (!volunteer) return;

  const canvas = document.createElement('canvas');
  canvas.width = 850;
  canvas.height = 580;
  const ctx = canvas.getContext('2d');

  // প্রিমিয়াম ব্যাকগ্রাউন্ড
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 850, 580);

  // ডাবল বর্ডার ডিজাইন
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#0f172a'; // ডার্ক স্লেট
  ctx.strokeRect(0, 0, 850, 580);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(22, 22, 806, 536);

  // হেডার সেকশন
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ব্লাড সেন্টার নদোনা নোয়াখালী', 425, 85);

  ctx.fillStyle = '#475569';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText('স্থাপিত - ২৭ মার্চ ২০১৩ ইং । সার্বিক সহযোগিতায়: মরহুম হাজী তফসির আহমেদ ট্রাস্ট', 425, 115);

  // সার্টিফিকেট নাম
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('স্বীকৃতি ও সম্মাননা সনদ', 425, 190);

  // মূল বিবরণী বডি টেক্সট
  ctx.fillStyle = '#334155';
  ctx.font = '19px Arial, sans-serif';
  ctx.fillText('অত্যন্ত আনন্দের সাথে সার্টিফাই করা যাচ্ছে যে,', 425, 250);

  // ভলান্টিয়ারের নাম হাইলাইট
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText(volunteer.name, 425, 295);

  // অবদানের স্বীকৃতি বিবরণ
  ctx.fillStyle = '#334155';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('যিনি একজন সক্রিয় মানবিক যোদ্ধা হিসেবে আমাদের সংগঠনে নিরলসভাবে সেবা দিয়েছেন।', 425, 345);

  const badge = getVolunteerBadge ? getVolunteerBadge(volunteer.points) : { text: 'সক্রিয় সদস্য' };
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`সংগঠনে তাঁর বর্তমান অর্জন ও পদবী: ${badge.text} (পয়েন্ট: ${volunteer.points || 0})`, 425, 390);

  ctx.font = '17px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('আমরা তাঁর এই মানবিক অবদানের আন্তরিক মূল্যায়ন করছি এবং উজ্জ্বল ভবিষ্যৎ কামনা করছি।', 425, 435);

  // অফিশিয়াল সিগনেচার লাইন ডিজাইন
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#94a3b8';

  // বাম পাশের সিগনেচার (পরিচালক)
  ctx.beginPath(); ctx.moveTo(140, 505); ctx.lineTo(300, 505); ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('পরিচালকের স্বাক্ষর', 220, 525);

  // ডান পাশের সিগনেচার (কারিগরি সহযোগী)
  ctx.beginPath(); ctx.moveTo(550, 505); ctx.lineTo(710, 505); ctx.stroke();
  ctx.fillText('কারিগরি সহযোগীর স্বাক্ষর', 630, 525);

  // ডাউনলোড প্রসেস সম্পূর্ণ করা
  const link = document.createElement('a');
  link.download = `Volunteer_Certificate_${volunteer.name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
