// src/app/api/org-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeOrgSlug } from '@/lib/orgSlug';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 });

  const orgId = decodeOrgSlug(slug);
  if (!orgId) return NextResponse.json({ error: 'Invalid organization.' }, { status: 400 });

  const { data, error } = await supabase
    .from('organizations')
    .select('id, chapter_name')
    .eq('id', orgId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });

  return NextResponse.json({ org: { id: data.id, name: data.chapter_name } });
}