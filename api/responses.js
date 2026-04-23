export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    const code = req.query.org || 'default';
    const idsResult = await redis(url, token, ['LRANGE', 'resp_ids:' + code, '0', '-1']);
    const ids = idsResult.result || [];
    if (ids.length === 0) return res.status(200).json({ responses: [] });
    const responses = (await Promise.all(
      ids.map(async id => {
        const r = await redis(url, token, ['GET', 'resp:' + code + ':' + id]);
        return r.result ? JSON.parse(r.result) : null;
      })
    )).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return res.status(200).json({ responses });
  } catch(err) {
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
