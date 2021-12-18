const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp({
  credential: applicationDefault(),
});

// getAuth().setCustomUserClaims('8d1iz5fM5NaVjot8WzlHYRfwHH63', {
//   admin: true,
// });
