// src/app/join/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import JoinOrgForm from '@/components/JoinOrgForm';

export default function JoinPage() {
  const params = useSearchParams();
  const orgSlug = params.get('org');
  const [org, setOrg] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug) {
      setError('No organization specified.');
      setLoading(false);
      return;
    }
    fetch(`/api/org-info?slug=${encodeURIComponent(orgSlug)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setOrg(data.org);
      })
      .catch(() => setError('Failed to load organization.'))
      .finally(() => setLoading(false));
  }, [orgSlug]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!org) return null;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Join {org.name}</h1>
      <p className="mb-6 text-gray-600">Enter your info to join this organization.</p>
      <JoinOrgForm orgSlug={orgSlug!} />
    </div>
  );
}