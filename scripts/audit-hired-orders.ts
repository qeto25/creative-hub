import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(url, serviceKey);

async function main() {
  // Query pg_policies to see all policies on bookings and profiles
  const { data, error } = await supabaseAdmin.rpc('get_policies');
  if (error) {
    console.log('RPC get_policies not available, querying directly or checking schema...');
  }
}

main().catch(console.error);
