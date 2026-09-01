// FILE: apps/web/lib/supabaseAdmin.js

import { createClient } from '@supabase/supabase-js';

// SERVER-SIDE ONLY. Never import this into a 'use client' component —
// it uses the service role key, which must never reach the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);