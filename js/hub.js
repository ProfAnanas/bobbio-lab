// Registrazione service worker per la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registrazione) => {
                console.log('Service worker registrato dall\'hub con successo. Scope:', registrazione.scope);
            })
            .catch((errore) => {
                console.error('Errore nella registrazione del service worker:', errore);
            });
    });
}

// Forzatura aggiornamento app (spostata qui perché il tasto è nell'hub)
async function forzaAggiornamentoApp() {
    const btn = document.getElementById('btn-aggiorna-app');
    if (!btn) return; // Sicurezza aggiuntiva
    
    btn.innerHTML = '🔄 Pulizia e aggiornamento...';
    btn.disabled = true;

    try {
        if ('serviceWorker' in navigator) {
            const registrazioni = await navigator.serviceWorker.getRegistrations();
            for (let registrazione of registrazioni) {
                await registrazione.unregister();
            }
        }

        const chiaviCache = await caches.keys();
        for (let chiave of chiaviCache) {
            await caches.delete(chiave);
        }

        window.location.reload(true);
        
    } catch (error) {
        console.error('Errore durante l\'aggiornamento forzato:', error);
        alert('Errore durante l\'aggiornamento. Chiudi l\'app e riaprila.');
        btn.innerHTML = '🔄 Aggiorna app';
        btn.disabled = false;
    }
}