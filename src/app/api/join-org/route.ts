// src/app/api/join-org/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeOrgSlug } from '@/lib/orgSlug';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { orgSlug, name, email, phone } = await req.json();

  if (!orgSlug || !name || !email || !phone) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const orgId = decodeOrgSlug(orgSlug);
  if (!orgId) return NextResponse.json({ error: 'Invalid organization.' }, { status: 400 });

  // Split name
  const [first_name, ...rest] = name.trim().split(' ');
  const last_name = rest.join(' ');

  // Check for existing member
  const { data: existing } = await supabase
    .from('org_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('phone_number', phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You are already a member of this organization.' }, { status: 409 });
  }

  // Insert new member
  const { error } = await supabase
    .from('org_members')
    .insert({
      organization_id: orgId,
      first_name,
      last_name,
      email,
      phone_number: phone,
      other: '',
    });

  if (error) return NextResponse.json({ error: 'Failed to add member.' }, { status: 500 });

  return NextResponse.json({ success: true });
}