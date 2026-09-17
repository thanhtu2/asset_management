import {
  getVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
  sendPushNotification
} from '../push.service.js';

export const getPublicKey = (req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(503).json({ message: 'Web Push chưa được cấu hình trên máy chủ' });
  }
  return res.json({ publicKey });
};

export const subscribe = async (req, res) => {
  try {
    await savePushSubscription(req.user.id, req.body);
    return res.status(201).json({ message: 'Đã đăng ký nhận thông báo đẩy' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (!endpoint) {
      return res.status(400).json({ message: 'Thiếu endpoint của subscription' });
    }
    await removePushSubscription(req.user.id, endpoint);
    return res.json({ message: 'Đã hủy đăng ký nhận thông báo đẩy' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendTestPush = async (req, res) => {
  try {
    const result = await sendPushNotification(req.user.id, {
      id: `test-${Date.now()}`,
      title: 'Kiểm tra thông báo đẩy',
      message: 'Thiết bị này đã nhận Web Push thành công.',
      type: 'success'
    });
    if (!result.configured) {
      return res.status(503).json({ message: 'VAPID chưa được cấu hình trên máy chủ' });
    }
    if (result.sent === 0) {
      return res.status(409).json({ message: 'Thiết bị này chưa đăng ký Web Push hoặc subscription đã hết hạn.' });
    }
    return res.json({ message: 'Đã gửi thông báo thử tới thiết bị của bạn', ...result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};