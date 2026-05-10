export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const org = req.query.org || 'default';
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    const idsRes = await fetch(`${KV_URL}/lrange/resp_ids:${org}/0/-1`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const { result: ids } = await idsRes.json();

    if (!ids || ids.length === 0)
      return res.status(200).json({ error: 'no_data' });

    const responses = (await Promise.all(
      ids.map(id =>
        fetch(`${KV_URL}/get/resp:${org}:${id}`, {
          headers: { Authorization: `Bearer ${KV_TOKEN}` }
        }).then(r => r.json()).then(d => {
          try { return JSON.parse(d.result); } catch { return null; }
        })
      )
    )).filter(Boolean);

    const mid = responses.filter(r => r.manager?.level === 'mid');
    if (mid.length < 8)
      return res.status(200).json({ error: 'insufficient_data', count: mid.length });

    const formatted = responses.map(r => {
      const level = r.manager?.level === 'mid' ? 'מנהל משתתף' : 'מנהל בכיר';
      const a = r.answers || {};
      return `[${level}]\n• חוזקות: ${a.success || '—'}\n• אתגרים: ${a.challenges || '—'}\n• תרבות: ${a.culture || '—'}\n• תרומת בכירים: ${a.senior_helps || '—'}\n• עיכוב בכירים: ${a.senior_blocks || '—'}\n• שינוי נדרש: ${a.change || '—'}`;
    }).join('\n\n');

    const prompt = `אתה יועץ ארגוני מומחה. להלן תשובות שאלוני אבחון מ-${responses.length} מנהלים:\n\n${formatted}\n\nנתח לעומק והחזר JSON בלבד (ללא טקסט נוסף):\n{\n  "chozakot": "תובנה ממוקדת על חוזקות הצוות המרכזיות",\n  "etgarim": "תובנה על האתגרים המשמעותיים",\n  "tarbut": "תובנה על התרבות הארגונית",\n  "bakhir_totem": "מה הדרג הבכיר תורם לפי המנהלים",\n  "bakhir_meakev": "מה הדרג הבכיר מעכב לפי המנהלים",\n  "hashvaah": "הבדלים מרכזיים בין הדרגים",\n  "hamlatzot": "2-3 המלצות פעולה קונקרטיות"\n}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      }
    );

    const gData = await geminiRes.json();
    const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'gemini_failed' });

    return res.status(200).json(JSON.parse(text));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
