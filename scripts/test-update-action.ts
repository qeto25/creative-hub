import { updateBookingStepAction } from '../app/actions/update-booking';
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

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAdmin = createClient(url, serviceKey);

  console.log('--- Current DB state for CH-2609-5158 ---');
  const { data: before } = await supabaseAdmin
    .from('bookings')
    .select('id, ticket_code, profile_id, status')
    .eq('ticket_code', '#CH-2609-5158')
    .single();
  console.log('Before:', before);

  console.log('\n--- Calling updateBookingStepAction ---');
  const res = await updateBookingStepAction({
    bookingId: before!.id,
    stepProgress: 5,
    status: 'completed',
  });
  console.log('updateBookingStepAction result:', res);
}

test().catch(console.error);
