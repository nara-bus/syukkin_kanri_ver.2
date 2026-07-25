// ※キャッシュ名の日付は古い値を引き継がず、必ず編集する「当日」の日付に変更すること。日付が変わったら連番(NNN)は001にリセット。
// ※CACHE_NAMEの接頭辞「shukkin-ver2-」は、このアプリ（syukkin_kanri_ver.2）専用の識別子。
//   本番アプリ（shukkin-のみ、verなし）や他の改正版と絶対に重複しない値にすること。
const CACHE_NAME = 'shukkin-ver2-20260725-001';
const ASSETS = [
  './',
  './index.html',
];

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // ※同じGitHubアカウント配下の他アプリ（年休管理・月払い管理・出勤管理の本番／他の
  //   改正版等）とキャッシュ領域を共有しているため、「自分以外を全部消す」のではなく
  //   「自分と同じ系統(shukkin-ver2-)の古いバージョンだけ」を消すようにする。
  //   他アプリ・他バージョンのキャッシュには一切触れない。
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('shukkin-ver2-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // index.htmlはネットワークファースト（常に最新を取得）
  if (e.request.url.endsWith('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // その他はキャッシュファースト
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
