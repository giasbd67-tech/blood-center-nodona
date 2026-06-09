import { createClient } from "@supabase/supabase-js";

// এই কোডটি Vercel-এর এনভায়রনমেন্ট ভ্যারিয়েবল থেকে অটোমেটিক ডাটা রিড করবে
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
