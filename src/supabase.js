import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eqyjkqcofwxmjcwhsgtc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeWprcWNvZnd4bWpjd2hzZ3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzY2OTksImV4cCI6MjA4OTYxMjY5OX0.m3s21nAfUgZuW0EiySz3I4el1RjApfpy0sXItBqf0AU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
