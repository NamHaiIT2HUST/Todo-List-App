// Tăng số này mỗi khi đổi nội dung app-shell để buộc trình duyệt lấy bản mới
// (nếu không, PWA đã cài sẽ mãi phục vụ file cache cũ).
const CACHE_NAME = 'galaxy-todo-v1';

const APP_SHELL = [
  './',
  './index.html',
  './main.js',
  './db.js',
  './style.css',
  './manifest.json',
  './image/icon-192.png',
  './image/icon-512.png',
  './image/my_profile_avatar.png',
  './image/my_profile_avatar_2.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    // Không chặn install nếu 1 asset lỗi mạng lần đầu
    .catch((err) => console.error('SW precache lỗi:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: trả cache ngay (nếu có) để offline dùng được,
// đồng thời âm thầm cập nhật cache từ mạng cho lần sau (áp dụng cả cho
// các thư viện CDN như Bootstrap/Chart.js/sql.js để offline hoạt động thật sự).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
