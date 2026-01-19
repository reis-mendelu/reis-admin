
// config.js
// Supabase Configuration

const SUPABASE_URL = 'https://zvbpgkmnrqyprtkyxkwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YnBna21ucnF5cHJ0a3l4a3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDU5NjYsImV4cCI6MjA4NDMyMTk2Nn0.8eaGOhlZHUf9uOlb6vL_P5D61bILFdgSu245kaIhMvQ';

if (typeof window.supabaseClient === 'undefined') {
  // Ensure the supabase library is loaded globally via CDN before this runs
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabaseClient = window.supabaseClient;
