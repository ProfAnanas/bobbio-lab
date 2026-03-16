const NOME_CACHE = 'bobbiolab-cache-v1.5.6';

// Elenco dei file base da salvare per far funzionare l'interfaccia offline
const FILE_DA_SALVARE = [
    './',
    './index.html',  // Il nostro nuovo Hub
    './enog.html',   // La tua app principale rinominata
    './css/style.css',
    './js/app.js',
    './manifest.json'
];

// Fase di installazione: il telefono scarica i file e li mette in "cassaforte"
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(NOME_CACHE)
        .then((cache) => {
            console.log('Cache aperta con successo');
            return cache.addAll(FILE_DA_SALVARE);
        })
    );
});

// Fase di attivazione: pulizia delle vecchie versioni se aggiorni il NOME_CACHE
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((chiaviCache) => {
            return Promise.all(
                chiaviCache.map((chiave) => {
                    if (chiave !== NOME_CACHE) {
                        console.log('Rimozione vecchia cache:', chiave);
                        return caches.delete(chiave);
                    }
                })
            );
        })
    );
});

// Fase di fetch: quando l'app cerca un file, guarda prima in cache (ignorando i parametri ?v=...)
self.addEventListener('fetch', (evento) => {
    evento.respondWith(
        caches.match(evento.request, { ignoreSearch: true })
        .then((risposta) => {
            // Se trova il file in cache lo restituisce subito
            if (risposta) {
                return risposta;
            }
            // Altrimenti lo va a cercare in rete
            return fetch(evento.request);
        })
    );
});