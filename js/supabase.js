const SUPABASE_URL = 'https://gjdoopyjwlnfzmjhwcux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZG9vcHlqd2xuZnptamh3Y3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjQ1NTcsImV4cCI6MjA4OTk0MDU1N30.Gel_R0yn2dLjI1cubEATB0jaSQN8-pS8NlOrWj8T4FM';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
