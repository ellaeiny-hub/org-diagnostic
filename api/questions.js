const DEFAULT_QUESTIONS = [
  { id: 'success', text: 'תאר/י הצלחה שחווה הצוות / העובדים שלך', badge: 'חוזקות' },
  { id: 'challenges', text: 'תאר/י אתגרים ניהוליים מרכזיים שאתה/את מתמודד/ת איתם כיום', badge: 'אתגרים' },
  { id: 'culture', text: 'מה המאפיינים הבולטים ביותר של התרבות הארגונית?', badge: 'תרבות ארגונית' },
  { id: 'senior_helps', text: 'כיצד הדרג שמעליך מסייע לך בעבודתך? תאר/י את המשאבים והצרכים שהדרג שמעליך נותן להם מענה', badge: 'דרג בכיר' },
  { id: 'senior_blocks', text: 'כיצד הדרג שמעליך מעכב אותך בעבודתך? תאר/י את המשאבים והצרכים שהדרג שמעליך לא מצליח לתת להם מענה', badge: 'דרג בכיר' },
  { id: 'change', text: 'מה השינוי האחד שהיה משפר משמעותית את יעילות הניהול בארגון?', badge: 'חזון' }
];

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
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', 'questions:' + code])
    });
    const data = await r.json();
    const questions = data.result ? JSON.parse(data.result) : DEFAULT_QUESTIONS;
    return res.status(200).json({ questions });
  } catch(err) {
    return res.status(200).json({ questions: DEFAULT_QUESTIONS });
  }
}
