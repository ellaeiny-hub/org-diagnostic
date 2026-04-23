import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = await kv.get('resp_ids');
    const ids = raw ? JSON.parse(raw) : [];
    if (ids.length === 0) return res.status(200).json({ responses: [] });

    const responses = (await Promise.all(
      ids.map(async id => {
        const r = await kv.get('resp:' + id);
        return r ? JSON.parse(r) : null;
      })
    )).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.status(200).json({ responses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Fetch failed' });
  }
}
