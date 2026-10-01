import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Substitua com a sua URL e a Publishable Key do Supabase
const supabaseUrl = 'https://krwbauytjqgoywcoonah.supabase.co'; // <--- Sua Project URL
const supabaseAnonKey = 'sb_publishable_JxarscrHVIuxbAA9tfjFZA_6xrNDsjj'; // <--- Sua Publishable Key (sb_publishable_...)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});