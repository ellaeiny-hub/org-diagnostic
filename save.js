export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { manager, answers, timestamp } = req.body;
    if (!manager || !answers) return res.status(400).json({ error: 'Missing fields' });

    const url = process.env.STORAGE_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.STORAGE_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const entry = JSON.stringify({ id, manager, answers, timestamp: timestamp || new Date().toISOString() });

    await redis(url, token, ['SET', 'resp:' + id, entry]);
    await redis(url, token, ['RPUSH', 'resp_ids', id]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function redis(url, token, command) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  return r.json();
}
