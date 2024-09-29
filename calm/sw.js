const CACHE_NAME = 'meditation-sounds-v1';
const SOUND_FILES = [
    '/sounds/rain.mp3',
    '/sounds/forest.mp3',
    '/sounds/waves.mp3',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(SOUND_FILES);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});