// src/components/JoinOrgForm.tsx
'use client';

import { useState } from 'react';

export default function JoinOrgForm({ orgSlug }: { orgSlug: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    const res = await fetch('/api/join-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, orgSlug }),
    });
    const data = await res.json();
    if (res.ok) setStatus('success');
    else {
      setStatus('error');
      setError(data.error || 'Failed to join organization.');
    }
  };

  if (status === 'success') {
    return <div className="p-4 text-green-600">You have been added to the organization!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        placeholder="Full Name"
        className="w-full border p-2 rounded"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="w-full border p-2 rounded"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        name="phone"
        placeholder="Phone"
        className="w-full border p-2 rounded"
        value={form.phone}
        onChange={handleChange}
        required
      />
      {error && <div className="text-red-600">{error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Joining...' : 'Join Organization'}
      </button>
    </form>
  );
}