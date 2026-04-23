import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { manager, answers, timestamp } = req.body;
    if (!manager || !answers) return res.status(400).json({ error: 'Missing fields' });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const entry = { id, manager, answers, timestamp: timestamp || new Date().toISOString() };

    await kv.set('resp:' + id, JSON.stringify(entry));

    const raw = await kv.get('resp_ids');
    const ids = raw ? JSON.parse(raw) : [];
    ids.push(id);
    await kv.set('resp_ids', JSON.stringify(ids));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Save failed' });
  }
}
