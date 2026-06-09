import { createClient } from '@supabase/supabase-js';

// আপনার সুপাবেস প্রজেক্টের URL এবং Anon Key এখানে বসাবেন
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL'; 
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
