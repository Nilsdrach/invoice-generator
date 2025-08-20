import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://qxhbxmglobiccfqspdip.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aGJ4bWdsb2JpY2NmcXNwZGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzg3NjIsImV4cCI6MjA3MDkxNDc2Mn0.PFZQj2G1j17J9owBUiwdwzZL5bnZFFXRyAvzkrtQ9eQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
