import { loginDemoAction, getDemoSessionAction, logoutDemoAction } from '../app/actions/demo-auth';

async function test() {
  console.log('--- TESTING SERVER-SIDE DEMO AUTH ---');

  // Test 1: Unauthenticated request to /dashboard/owner
  const unauthOwner = await fetch('http://localhost:3001/dashboard/owner', { redirect: 'manual' });
  console.log('1. Unauthenticated /dashboard/owner -> Status:', unauthOwner.status, 'Location:', unauthOwner.headers.get('location'));
  if (unauthOwner.status !== 307 || !unauthOwner.headers.get('location')?.includes('/login')) {
    throw new Error('Test 1 failed: Unauthenticated owner route was not redirected to /login');
  }

  // Test 2: Unauthenticated request to /dashboard/member
  const unauthMember = await fetch('http://localhost:3001/dashboard/member', { redirect: 'manual' });
  console.log('2. Unauthenticated /dashboard/member -> Status:', unauthMember.status, 'Location:', unauthMember.headers.get('location'));
  if (unauthMember.status !== 307 || !unauthMember.headers.get('location')?.includes('/login')) {
    throw new Error('Test 2 failed: Unauthenticated member route was not redirected to /login');
  }

  // Test 3: Demo Owner cookie session
  const ownerSessionPayload = {
    role: 'owner',
    user_id: 'demo-owner-id',
    name: 'Owner Grown (Demo)',
    email: 'grown@creativehub.id',
    isDemo: true,
  };
  const ownerCookie = `creativehub_demo_session=${encodeURIComponent(JSON.stringify(ownerSessionPayload))}`;

  // 3a. Owner accessing /dashboard/owner
  const authOwner = await fetch('http://localhost:3001/dashboard/owner', {
    redirect: 'manual',
    headers: { Cookie: ownerCookie },
  });
  console.log('3a. Demo Owner on /dashboard/owner -> Status:', authOwner.status);
  if (authOwner.status !== 200) {
    throw new Error(`Test 3a failed: Demo owner got status ${authOwner.status}`);
  }

  // 3b. Owner accessing /dashboard/member (should redirect to /dashboard/owner)
  const ownerOnMember = await fetch('http://localhost:3001/dashboard/member', {
    redirect: 'manual',
    headers: { Cookie: ownerCookie },
  });
  console.log('3b. Demo Owner on /dashboard/member -> Status:', ownerOnMember.status, 'Location:', ownerOnMember.headers.get('location'));
  if (ownerOnMember.status !== 307 || !ownerOnMember.headers.get('location')?.includes('/dashboard/owner')) {
    throw new Error('Test 3b failed: Demo owner on member route was not redirected to /dashboard/owner');
  }

  // Test 4: Demo Member cookie session
  const memberSessionPayload = {
    role: 'member',
    user_id: 'demo-member-id',
    name: 'Devan Putra (Demo)',
    email: 'devan@creativehub.id',
    isDemo: true,
  };
  const memberCookie = `creativehub_demo_session=${encodeURIComponent(JSON.stringify(memberSessionPayload))}`;

  // 4a. Member accessing /dashboard/member
  const authMember = await fetch('http://localhost:3001/dashboard/member', {
    redirect: 'manual',
    headers: { Cookie: memberCookie },
  });
  console.log('4a. Demo Member on /dashboard/member -> Status:', authMember.status);
  if (authMember.status !== 200) {
    throw new Error(`Test 4a failed: Demo member got status ${authMember.status}`);
  }

  // 4b. Member accessing /dashboard/owner (should redirect to /dashboard/member)
  const memberOnOwner = await fetch('http://localhost:3001/dashboard/owner', {
    redirect: 'manual',
    headers: { Cookie: memberCookie },
  });
  console.log('4b. Demo Member on /dashboard/owner -> Status:', memberOnOwner.status, 'Location:', memberOnOwner.headers.get('location'));
  if (memberOnOwner.status !== 307 || !memberOnOwner.headers.get('location')?.includes('/dashboard/member')) {
    throw new Error('Test 4b failed: Demo member on owner route was not redirected to /dashboard/member');
  }

  // Test 5: Live Mode rejection
  process.env.NEXT_PUBLIC_APP_MODE = 'live';
  const liveResult = await loginDemoAction('owner');
  console.log('5. Live Mode rejection test -> Result:', liveResult);
  if (liveResult.success) {
    throw new Error('Test 5 failed: Demo login was allowed in live mode!');
  }
  const liveSession = await getDemoSessionAction();
  console.log('5b. Live Mode session check -> Result:', liveSession);
  if (liveSession !== null) {
    throw new Error('Test 5b failed: Demo session returned data in live mode!');
  }

  // Restore
  process.env.NEXT_PUBLIC_APP_MODE = 'demo';

  // --- TEST DRAFT PROFILE PRIVACY GUARDS ---
  const draftId = 'f1a23456-7890-4123-8123-000000000005';
  const publicId = 'f1a23456-7890-4123-8123-000000000001';

  // Test 6: Unauthenticated visitor / logged out user accessing draft profile
  const unauthDraftRes = await fetch(`http://localhost:3001/api/profile/${draftId}`);
  console.log('6. Unauthenticated on draft profile API -> Status:', unauthDraftRes.status);
  const unauthDraftJson = await unauthDraftRes.json();
  if (unauthDraftRes.status !== 404 || unauthDraftJson.profile) {
    throw new Error('Test 6 failed: Unauthenticated user was able to access draft profile data!');
  }
  if (JSON.stringify(unauthDraftJson).includes('Rian Syahputra')) {
    throw new Error('Test 6 failed: Draft talent name leaked in API response!');
  }

  // Test 7: Member user accessing draft profile
  const memberDraftRes = await fetch(`http://localhost:3001/api/profile/${draftId}`, {
    headers: { Cookie: memberCookie },
  });
  console.log('7. Member on draft profile API -> Status:', memberDraftRes.status);
  const memberDraftJson = await memberDraftRes.json();
  if (memberDraftRes.status !== 404 || memberDraftJson.profile) {
    throw new Error('Test 7 failed: Member user was able to access draft profile data!');
  }

  // Test 8: Valid Owner user accessing draft profile
  const ownerDraftRes = await fetch(`http://localhost:3001/api/profile/${draftId}`, {
    headers: { Cookie: ownerCookie },
  });
  console.log('8. Owner on draft profile API -> Status:', ownerDraftRes.status);
  const ownerDraftJson = await ownerDraftRes.json();
  if (ownerDraftRes.status !== 200 || !ownerDraftJson.profile || ownerDraftJson.canViewDraft !== true) {
    throw new Error('Test 8 failed: Owner with valid session could not view draft profile in review mode!');
  }
  if (!ownerDraftJson.profile.full_name.includes('Rian Syahputra')) {
    throw new Error('Test 8 failed: Owner did not receive expected draft profile data!');
  }

  // Test 9: Public profile accessible to anyone
  const publicRes = await fetch(`http://localhost:3001/api/profile/${publicId}`);
  console.log('9. Public profile API for normal talent -> Status:', publicRes.status);
  const publicJson = await publicRes.json();
  if (publicRes.status !== 200 || !publicJson.profile) {
    throw new Error('Test 9 failed: Public profile should be accessible to all users!');
  }

  console.log('✅ ALL SERVER-SIDE TESTS (AUTH, ROUTE PROTECTION, DRAFT PRIVACY) PASSED PERFECTLY!');
}

test().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
