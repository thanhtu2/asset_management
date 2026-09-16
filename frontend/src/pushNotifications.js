import { pushAPI } from './api';

const serviceWorkerPath = '/service-worker.js';

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
};

export const isPushSupported = () => (
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window
);

export const registerPushNotifications = async () => {
  if (!isPushSupported()) {
    throw new Error('Trình duyệt không hỗ trợ thông báo đẩy');
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('Bạn chưa cấp quyền hiển thị thông báo');
  }

  const registration = await navigator.serviceWorker.register(serviceWorkerPath);
  const readyRegistration = await navigator.serviceWorker.ready;
  const { data } = await pushAPI.getPublicKey();
  const existingSubscription = await readyRegistration.pushManager.getSubscription();
  const subscription = existingSubscription || await readyRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey)
  });

  await pushAPI.subscribe(subscription.toJSON());
  return subscription;
};
