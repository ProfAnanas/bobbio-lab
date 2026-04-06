let glossarioAccoglienza = {}; // Variabile per memorizzare il dizionario

// --- 1. AVVIO E COLLEGAMENTO SENSORI ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('griglia-menu')) {
        caricaMenuAccoglienza();
    }
    const campoRicerca = document.getElementById('campo-ricerca');
    if (campoRicerca) campoRicerca.addEventListener('input', applicaFiltriAccoglienza);

    // Carica il dizionario all'avvio dell'app
    caricaGlossarioAccoglienza();
});

async function caricaGlossarioAccoglienza() {
    try {
        const response = await fetch('data/accoglienza/glossario-accoglienza.json?v=' + new Date().getTime());
        if (response.ok) {
            glossarioAccoglienza = await response.json();
        }
    } catch (error) {
        console.warn('File glossario.json non trovato.');
    }
}

// --- 2. LOGICA DI RICERCA ---
function applicaFiltriAccoglienza() {
    const campoRicerca = document.getElementById('campo-ricerca');
    const query = campoRicerca ? campoRicerca.value.toLowerCase().trim() : '';
    const blocchiMacro = document.querySelectorAll('.blocco-categoria');

    blocchiMacro.forEach(catFolder => {
        let catHaContenuto = false;
        const ricette = catFolder.querySelectorAll('.btn-ricetta');

        ricette.forEach(btn => {
            const bNome = (btn.getAttribute('data-nome') || '').toLowerCase();
            const bTag = (btn.getAttribute('data-tag') || '').toLowerCase();

            if (query === '' || bNome.includes(query) || bTag.includes(query)) {
                btn.style.display = 'block';
                catHaContenuto = true;
            } else {
                btn.style.display = 'none';
            }
        });
        catFolder.style.display = catHaContenuto ? 'block' : 'none';
    });
}

// --- 3. CARICAMENTO CATALOGO (Punta a menu-accoglienza.json) ---
async function caricaMenuAccoglienza() {
    try {
        const response = await fetch('data/menu-accoglienza.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Errore nel caricamento del file menu-accoglienza.json');
        const data = await response.json();
        disegnaGrigliaMenu(data.catalogo);
        applicaFiltriAccoglienza(); 
    } catch (error) {
        console.error('Errore:', error);
        document.getElementById('griglia-menu').innerHTML = '<p>Errore nel caricamento dell\'archivio accoglienza.</p>';
    }
}

function disegnaGrigliaMenu(catalogo) {
    const contenitore = document.getElementById('griglia-menu');
    contenitore.innerHTML = '';

    catalogo.forEach(categoria => {
        const detailsCat = document.createElement('details');
        detailsCat.classList.add('blocco-categoria');
        
        // Teniamo la categoria già aperta di default per mostrare subito la dashboard!
        detailsCat.open = true; 
        
        const summaryCat = document.createElement('summary');
        summaryCat.textContent = categoria.nome_categoria;
        detailsCat.appendChild(summaryCat);

        const divProcedure = document.createElement('div');
        divProcedure.classList.add('griglia-bottoni-accoglienza');

        categoria.procedure.forEach(proc => {
            const bottone = document.createElement('button');
            bottone.classList.add('bottone-quadrato-accoglienza');
            
            // ECCO IL PEZZO MANCANTE CHE ROMPEVA IL FILTRO INVISIBILE
            bottone.classList.add('btn-ricetta'); 
            
            bottone.setAttribute('data-tag', String(proc.tag || '').toLowerCase());
            bottone.setAttribute('data-nome', String(proc.nome).toLowerCase());
            
            // Creiamo l'immagine centrale
            const img = document.createElement('img');
            img.src = `assets/accoglienza/${proc.icona || 'default.png'}`; 
            img.alt = proc.nome;
            img.classList.add('icona-bottone-accoglienza');

            // Creiamo il testo in basso
            const testo = document.createElement('span');
            testo.textContent = proc.nome;

            // Mettiamo immagine e testo dentro il bottone
            bottone.appendChild(img);
            bottone.appendChild(testo);
            
            bottone.onclick = () => apriProcedura(proc.id, proc.url_dati, proc.nome);
            divProcedure.appendChild(bottone);
        });

        detailsCat.appendChild(divProcedure);
        contenitore.appendChild(detailsCat);
    });
}

// --- 4. LOGICA DELLA PROCEDURA E PROCEDIMENTO (Diagramma Visivo RIMOSSO) ---
async function apriProcedura(idProc, urlDati, nomeProc) {
    document.getElementById('griglia-menu').style.display = 'none';
    document.getElementById('pannello-controllo').style.display = 'none';
    document.getElementById('vista-ricetta').style.display = 'block';
    document.getElementById('titolo-ricetta-corrente').textContent = nomeProc;
    
    const listaGobbo = document.getElementById('lista-gobbo');
    const listaProcedimento = document.getElementById('lista-procedimento');
    
    listaGobbo.innerHTML = '<li style="text-align: center;">Caricamento...</li>';
    listaProcedimento.innerHTML = '';
    
    try {
        const response = await fetch(urlDati + '?v=' + new Date().getTime());
        if (!response.ok) throw new Error('File non trovato');
        const procedura = await response.json();
        listaGobbo.innerHTML = '';

        // --- MOTORE DEL GOBBO (Sostituisce gli ingredienti) ---
        if (procedura.frasi_chiave) {
            procedura.frasi_chiave.forEach(frase => {
                const li = document.createElement('li');
                li.classList.add('riga-nota-ingrediente'); // Usiamo lo stile base per ora
                // Applichiamo il glossario alle frasi del gobbo
                li.innerHTML = `<strong>${frase.contesto}:</strong><br><span style="font-size: 1.1em; color: #d35400;">"${applicaGlossario(frase.testo)}"</span>`;
                listaGobbo.appendChild(li);
            });
        }
        
        // --- MOTORE PROCEDIMENTO ---
        procedura.procedimento.forEach(passaggio => {
            if (passaggio.tipo === 'bivio') {
                const divBivioTesto = document.createElement('div');
                divBivioTesto.classList.add('blocco-bivio-testo');
                
                // Catturiamo lo scopo dal JSON (se non c'è, è 'locale')
                const scopoBivio = passaggio.scopo || 'locale';

                passaggio.rami.forEach((ramo, indiceRamo) => {
                    const stepTesto = creaTestoSinistra(ramo);
                    divBivioTesto.appendChild(stepTesto);
                    
                    if (indiceRamo === 0) {
                        const divisore = document.createElement('div');
                        divisore.classList.add('divisore-bivio');
                        divisore.innerHTML = '<span>oppure:</span>';
                        divBivioTesto.appendChild(divisore);
                    }
                    
                    // Passiamo il parametro scopoBivio alla funzione dei tocchi!
                    attivaSincronia(stepTesto, ramo, 'bivio', scopoBivio); 
                });
                
                listaProcedimento.appendChild(divBivioTesto);

            } else if (passaggio.tipo === 'parallelo') {
                 passaggio.rami.forEach(ramo => {
                     const stepTesto = creaTestoSinistra(ramo);
                     listaProcedimento.appendChild(stepTesto);
                     attivaSincronia(stepTesto, ramo, 'parallelo'); 
                 });

            } else {
                const stepTesto = creaTestoSinistra(passaggio);
                listaProcedimento.appendChild(stepTesto);
                attivaSincronia(stepTesto, passaggio, 'singolo'); 
            }
        });

    } catch (error) {
        listaGobbo.innerHTML = '<li>Errore caricamento dati.</li>';
        listaProcedimento.innerHTML = '<li>Errore caricamento dati.</li>';
    }
}

function chiudiAlgoritmo() {
    document.getElementById('vista-ricetta').style.display = 'none';
    document.getElementById('griglia-menu').style.display = 'block';
    document.getElementById('pannello-controllo').style.display = 'flex';
}

// --- 5. FUNZIONI DI SUPPORTO GRAFICO ---
function creaTestoSinistra(dati) {
    const stepContainer = document.createElement('div');
    stepContainer.classList.add('step-ricetta');
    stepContainer.id = 'testo-' + dati.step_id; 

    if (dati.condizione) stepContainer.classList.add('blocco-condizionato', 'condizione-' + dati.condizione);

    const numeroStep = document.createElement('div');
    numeroStep.classList.add('numero-step');
    numeroStep.textContent = dati.step_id.replace('step-', '');

    const testoStep = document.createElement('div');
    testoStep.classList.add('testo-step');
    // Applichiamo il filtro del glossario al testo prima di stamparlo
    testoStep.innerHTML = applicaGlossario(dati.testo);

    stepContainer.appendChild(numeroStep);
    stepContainer.appendChild(testoStep);
    
    return stepContainer;
}

function attivaSincronia(testo, dati, tipoPadre, scopoBivio = 'locale') {
    const numeroStep = testo.querySelector('.numero-step');
    const testoStep = testo.querySelector('.testo-step');

    testo.addEventListener('mouseenter', () => testo.classList.add('evidenziato'));
    testo.addEventListener('mouseleave', () => testo.classList.remove('evidenziato'));

    let timerTocco = null;
    let tocchi = 0;

    function gestisciInterazione(evento) {
        evento.stopPropagation();
        
        testo.style.userSelect = 'none';
        testo.style.webkitUserSelect = 'none';
        tocchi++; 

        if (tocchi === 1) {
            timerTocco = setTimeout(() => {
                tocchi = 0; 
                testo.style.userSelect = 'auto';
                testo.style.webkitUserSelect = 'auto';

                const match = dati.step_id.match(/step-\d+([ab])$/);
                
                if (match && tipoPadre === 'bivio') {
                    const lettera = match[1];
                    const letteraOpposta = lettera === 'a' ? 'b' : 'a';
                    const idOpposto = dati.step_id.replace(lettera, letteraOpposta);

                    // SMISTATORE LOGICO: Globale vs Locale
                    if (scopoBivio === 'globale') {
                        document.querySelectorAll('.condizione-' + lettera).forEach(el => { el.classList.add('mostra-step'); el.classList.remove('nascosto-step'); });
                        document.querySelectorAll('.condizione-' + letteraOpposta).forEach(el => { el.classList.remove('mostra-step'); el.classList.add('nascosto-step'); });
                    } else {
                        const containerOpposto = document.getElementById('testo-' + idOpposto);
                        if (containerOpposto) {
                            containerOpposto.classList.add('nascosto-step');
                            containerOpposto.classList.remove('mostra-step');
                        }
                        const containerAttuale = document.getElementById('testo-' + dati.step_id);
                        if (containerAttuale) {
                            containerAttuale.classList.remove('nascosto-step');
                            containerAttuale.classList.add('mostra-step');
                        }
                    }
                }
            }, 250); 
            
        } else if (tocchi === 2) {
            clearTimeout(timerTocco); 
            tocchi = 0; 
            testo.style.userSelect = 'auto';
            testo.style.webkitUserSelect = 'auto';
            
            if (testo.classList.contains('nascosto-step') || (testo.classList.contains('blocco-condizionato') && !testo.classList.contains('mostra-step'))) return; 
            
            const completato = testoStep.classList.contains('testo-barrato');
            if (!completato) {
                testoStep.classList.add('testo-barrato');
                if(numeroStep) numeroStep.classList.add('numero-barrato');
            } else {
                testoStep.classList.remove('testo-barrato');
                if(numeroStep) numeroStep.classList.remove('numero-barrato');
            }
        }
    }

    testo.addEventListener('click', gestisciInterazione);
}

// --- 6. MOTORE DEL GLOSSARIO ---
function applicaGlossario(testo) {
    if (!glossarioAccoglienza || Object.keys(glossarioAccoglienza).length === 0) return testo;
    let testoModificato = testo;
    
    for (const [termine, definizione] of Object.entries(glossarioAccoglienza)) {
        // Cerca la parola e applica la TUA classe CSS
        const regex = new RegExp(`\\b(${termine})\\b`, 'g');
        testoModificato = testoModificato.replace(regex, `<span class="termine-accoglienza" onclick="mostraDefinizioneAccoglienza('${termine}')">$1</span>`);
    }
    return testoModificato;
}

function mostraDefinizioneAccoglienza(termine) {
    const definizione = glossarioAccoglienza[termine];
    if (!definizione) return;

    // Rimuove vecchi popup
    const vecchioPopup = document.getElementById('popup-glossario');
    if (vecchioPopup) vecchioPopup.remove();

    // Crea un popup usando uno stile coerente con il Bobbio lab
    const popup = document.createElement('div');
    popup.id = 'popup-glossario';
    
    // Stile elegante, bordo oro e sfondo chiaro
    popup.style.position = 'fixed';
    popup.style.bottom = '25px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.width = '85%';
    popup.style.backgroundColor = '#fdfaed';
    popup.style.border = '2px solid #f1c40f';
    popup.style.borderLeft = '8px solid #f1c40f';
    popup.style.padding = '15px 20px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 -5px 20px rgba(0,0,0,0.2)';
    popup.style.zIndex = '10000';
    popup.style.color = '#2c3e50';
    popup.style.textAlign = 'center';
    
    popup.innerHTML = `<strong style="font-size: 1.1em; color: #d39e00;">${termine}</strong><br><span style="font-size: 0.95em; line-height: 1.4;">${definizione}</span>`;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 0.4s ease';
        setTimeout(() => popup.remove(), 400);
    }, 6000); // Lo lasciamo visibile per 6 secondi per dare tempo di leggere
}
// --- 8. FUNZIONE SCHERMO SEMPRE ON (Wake Lock API) ---
let bloccoSchermo = null;

async function attivaSchermo() {
    const btnWakeLock = document.getElementById('btn-wake-lock'); 
    
    if (!('wakeLock' in navigator)) {
        alert("Il browser di questo dispositivo non supporta lo schermo sempre acceso.");
        return;
    }

    try {
        if (bloccoSchermo !== null) {
            // Spegne il blocco
            await bloccoSchermo.release();
            bloccoSchermo = null;
            if (btnWakeLock) {
                btnWakeLock.textContent = '🌙 Schermo: NORMALE';
                btnWakeLock.classList.remove('attivo');
            }
        } else {
            // Accende il blocco
            bloccoSchermo = await navigator.wakeLock.request('screen');
            if (btnWakeLock) {
                btnWakeLock.textContent = '☀️ Schermo: SEMPRE ACCESO';
                btnWakeLock.classList.add('attivo');
            }
            
            bloccoSchermo.addEventListener('release', () => {
                bloccoSchermo = null;
                if (btnWakeLock) {
                    btnWakeLock.textContent = '🌙 Schermo: NORMALE';
                    btnWakeLock.classList.remove('attivo');
                }
            });
        }
    } catch (errore) {
        alert("Impossibile attivare lo schermo: " + errore.message);
    }
}

// Colleghiamo "l'interruttore" al bottone
const bottoneSchermo = document.getElementById('btn-wake-lock');
if (bottoneSchermo) {
    bottoneSchermo.addEventListener('click', attivaSchermo);
}