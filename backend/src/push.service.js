import webpush from 'web-push';
import pool from './config/database.js';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const isConfigured = Boolean(publicKey && privateKey);

if (isConfigured) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export const getVapidPublicKey = () => publicKey || null;

export const savePushSubscription = async (userId, subscription) => {
  const { endpoint, keys } = subscription || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Subscription không hợp lệ');
  }

  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth), last_used_at = CURRENT_TIMESTAMP`,
    [userId, endpoint, keys.p256dh, keys.auth]
  );
};

export const removePushSubscription = async (userId, endpoint) => {
  await pool.query(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [userId, endpoint]
  );
};

export const sendPushNotification = async (userId, notification) => {
  if (!isConfigured) {
    return { configured: false, sent: 0, failed: 0 };
  }

  const [subscriptions] = await pool.query(
    userId === null || userId === undefined
      ? 'SELECT id, endpoint, p256dh, auth FROM push_subscriptions'
      : 'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    userId === null || userId === undefined ? [] : [userId]
  );

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    type: notification.type,
    notificationId: notification.id,
    url: '/'
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, payload, {
        TTL: 60,
        urgency: 'high'
      });
      await pool.query(
        'UPDATE push_subscriptions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
        [subscription.id]
      );
      sent += 1;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [subscription.id]);
      } else {
        console.error('Lỗi gửi Web Push:', error.message);
      }
      failed += 1;
    }
  }));

  return { configured: true, sent, failed, registered: subscriptions.length };
};