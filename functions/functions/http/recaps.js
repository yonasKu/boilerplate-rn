const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { AutomatedRecapService } = require('../../services/recapGenerator');

async function requireAuth(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return null;
  }
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    return decoded;
  } catch (e) {
    res.status(401).json({ error: 'Invalid ID token' });
    return null;
  }
}

const recapService = new AutomatedRecapService();

const saveWeeklySnippet = onRequest(
  { region: 'us-central1', invoker: 'public', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
    try {
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { startDate, endDate } = req.body || {};
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }
      const userId = decoded.uid;
      const range = { start: new Date(startDate), end: new Date(endDate) };
      const result = await recapService.generateWeeklySnippet(userId, range, { source: 'http' });
      return res.json(result);
    } catch (err) {
      console.error('saveWeeklySnippet error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

const generateWeeklyRecap = onRequest(
  { region: 'us-central1', invoker: 'public', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
    try {
      console.log('Admin SDK project (runtime):', admin.app().options.projectId);
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { userId: bodyUserId, childId, startDate, endDate } = req.body || {};
      const userId = bodyUserId || decoded.uid;
      const weekRange = { start: new Date(startDate), end: new Date(endDate) };
      const result = await recapService.generateWeeklyRecap(userId, childId, weekRange);
      return res.json(result);
    } catch (err) {
      console.error('generateWeeklyRecap error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

const generateMonthlyRecap = onRequest(
  { region: 'us-central1', invoker: 'public', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
    try {
      console.log('Admin SDK project (runtime):', admin.app().options.projectId);
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { userId: bodyUserId, childId, startDate, endDate } = req.body || {};
      const userId = bodyUserId || decoded.uid;
      const monthRange = { start: new Date(startDate), end: new Date(endDate) };
      const result = await recapService.generateMonthlyRecap(userId, childId, monthRange);
      return res.json(result);
    } catch (err) {
      console.error('generateMonthlyRecap error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

const generateYearlyRecap = onRequest(
  { region: 'us-central1', invoker: 'public', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
    try {
      console.log('Admin SDK project (runtime):', admin.app().options.projectId);
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { userId: bodyUserId, childId, startDate, endDate } = req.body || {};
      const userId = bodyUserId || decoded.uid;
      const yearRange = { start: new Date(startDate), end: new Date(endDate) };
      const result = await recapService.generateYearlyRecap(userId, childId, yearRange);
      return res.json(result);
    } catch (err) {
      console.error('generateYearlyRecap error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = {
  saveWeeklySnippet,
  generateWeeklyRecap,
  generateMonthlyRecap,
  generateYearlyRecap,
};
