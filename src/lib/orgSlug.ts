const SECRET = process.env.ORG_SLUG_SECRET || 'changeme';

export function encodeOrgSlug(orgId: number): string {
  // Manual base64url encoding for compatibility
  return Buffer.from(`${orgId}:${SECRET}`).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeOrgSlug(slug: string): number | null {
  try {
    // Manual base64url decoding for compatibility
    const base64 = slug.replace(/-/g, '+').replace(/_/g, '/').padEnd(slug.length + (4 - slug.length % 4) % 4, '=');
    const decoded = Buffer.from(base64, 'base64').toString();
    const [id, secret] = decoded.split(':');
    if (secret !== SECRET) return null;
    return parseInt(id, 10);
  } catch {
    return null;
  }
}