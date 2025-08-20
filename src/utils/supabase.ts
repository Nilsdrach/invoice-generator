import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://qxhbxmglobiccfqspdip.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aGJ4bWdsb2JpY2NmcXNwZGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI4NzQsImV4cCI6MjA0NzU0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
