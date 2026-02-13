
import { createClient } from '@supabase/supabase-js';

// NOTA: As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY devem estar configuradas
// Usando a URL e Chave fornecidas pelo usuário como fallback
const supabaseUrl = process.env.SUPABASE_URL || 'https://pcqqxeqppysuysikdfkn.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_71G4HlcXCg8mQWOrsoS6gQ_DhqLSXOT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
