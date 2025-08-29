const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { AutomatedRecapService } = require('../../services/recapGenerator');

const recapService = new AutomatedRecapService();

function parseRange(data) {
  const start = data?.startDate ? new Date(data.startDate) : null;
  const end = data?.endDate ? new Date(data.endDate) : null;
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new HttpsError('invalid-argument', 'startDate and endDate must be valid dates');
  }
  return { start, end };
}

const generateWeeklyRecap = onCall({ region: 'us-central1', secrets: ['OPENAI_API_KEY'] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const { childId } = request.data || {};
    const userId = request.data?.userId || request.auth.uid;
    const weekRange = parseRange(request.data || {});
    const result = await recapService.generateWeeklyRecap(userId, childId, weekRange);
    return result;
  } catch (error) {
    console.error('generateWeeklyRecap callable error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

const generateMonthlyRecap = onCall({ region: 'us-central1', secrets: ['OPENAI_API_KEY'] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const { childId } = request.data || {};
    const userId = request.data?.userId || request.auth.uid;
    const monthRange = parseRange(request.data || {});
    const result = await recapService.generateMonthlyRecap(userId, childId, monthRange);
    return result;
  } catch (error) {
    console.error('generateMonthlyRecap callable error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

const generateYearlyRecap = onCall({ region: 'us-central1', secrets: ['OPENAI_API_KEY'] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const { childId } = request.data || {};
    const userId = request.data?.userId || request.auth.uid;
    const yearRange = parseRange(request.data || {});
    const result = await recapService.generateYearlyRecap(userId, childId, yearRange);
    return result;
  } catch (error) {
    console.error('generateYearlyRecap callable error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

module.exports = {
  generateWeeklyRecap,
  generateMonthlyRecap,
  generateYearlyRecap,
};
