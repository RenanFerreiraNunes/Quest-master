
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ahvzjllcaggmghpkcyfr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UVD4DItofxEdUrX7Luhh5Q_VleX9fDI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
