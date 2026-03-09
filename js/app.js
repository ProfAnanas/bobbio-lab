// --- 1. DIZIONARIO SOTTOCATEGORIE ---
const mappaSottocategorie = {
    cucina: ["Preparazioni base", "Stuzzichini e aperitivi", "Antipasti", "Primi", "Secondi", "Contorni", "Salse e riduzioni"],
    pasticceria: ["Preparazioni base", "Frolle", "Sfoglie e sfogliati", "Choux", "Biscotteria e piccola pasticceria", "Creme e dolci al cucchiaio", "Masse montate", "Torte da credenza", "Lievitati", "Cioccolato e pralineria", "Gelati e sorbetti", "Pasticceria salata", "Tecniche avanzate"],
    panificazione: ["Preparazioni base", "Lievitati", "Pani speciali", "Pizze e focacce", "Tecniche avanzate"],
    qualifiche_cucina: ["Prove d'esame"],
    qualifiche_pasticceria: ["Prove d'esame"]
};

// --- 2. AVVIO E COLLEGAMENTO SENSORI ---
document.addEventListener('DOMContentLoaded', () => {
    caricaMenu();

    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroSottocategoria = document.getElementById('filtro-sottocategoria');
    const filtroAnno = document.getElementById('filtro-anno');
    const campoRicerca = document.getElementById('campo-ricerca');

    // Assicuriamoci che all'avvio la tendina delle sottocategorie sia bloccata
    if (filtroSottocategoria) filtroSottocategoria.disabled = true;

    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', (e) => {
            aggiornaSottocategorie(e.target.value);
            applicaFiltri();
        });
    }

    if (filtroSottocategoria) filtroSottocategoria.addEventListener('change', applicaFiltri);
    if (filtroAnno) filtroAnno.addEventListener('change', applicaFiltri);
    if (campoRicerca) campoRicerca.addEventListener('input', applicaFiltri);
});

// --- 3. LOGICA DEI FILTRI A TENDINA ---
function aggiornaSottocategorie(categoriaSel) {
    const selectSub = document.getElementById('filtro-sottocategoria');
    if (!selectSub) return;

    if (!categoriaSel) {
        selectSub.innerHTML = '<option value="">Tutte le sottocategorie</option>';
        selectSub.disabled = true;
        return;
    }

    selectSub.disabled = false;
    selectSub.innerHTML = '<option value="">Tutte le sottocategorie</option>';
    
    const lista = mappaSottocategorie[categoriaSel] || [];
    lista.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.toLowerCase().trim();
        opt.textContent = sub;
        selectSub.appendChild(opt);
    });
}

function applicaFiltri() {
    const campoRicerca = document.getElementById('campo-ricerca');
    const filtroAnno = document.getElementById('filtro-anno');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroSottocategoria = document.getElementById('filtro-sottocategoria');

    const query = campoRicerca ? campoRicerca.value.toLowerCase().trim() : '';
    const annoSel = filtroAnno ? filtroAnno.value.toLowerCase().trim() : '';
    const catSel = filtroCategoria ? filtroCategoria.value.toLowerCase().trim() : '';
    const subSel = filtroSottocategoria && !filtroSottocategoria.disabled ? filtroSottocategoria.value.toLowerCase().trim() : '';

    const blocchiMacro = document.querySelectorAll('.blocco-categoria');

    blocchiMacro.forEach(catFolder => {
        const idMacro = catFolder.getAttribute('data-id-macro') || '';

        // REGOLE MACRO: Se scelgo Cucina, spengo Pasticceria e Panificazione all'istante
        if (catSel !== "" && idMacro !== catSel) {
            catFolder.style.display = 'none';
            return; 
        }

        let catHaContenuto = false;
        const sottocategorieFolder = catFolder.querySelectorAll('.blocco-sottocategoria');

        sottocategorieFolder.forEach(subFolder => {
            const nomeSub = subFolder.querySelector('summary').textContent.toLowerCase().trim();

            // REGOLE SOTTOCATEGORIA: Se cerco Frolle, nascondo Creme, Lievitati ecc.
            if (subSel !== "" && nomeSub !== subSel) {
                subFolder.style.display = 'none';
                return;
            }

            let subHaContenuto = false;
            const ricette = subFolder.querySelectorAll('.btn-ricetta');

            ricette.forEach(btn => {
                const bAnno = btn.getAttribute('data-anno') || 'tutti';
                const bNome = (btn.getAttribute('data-nome') || '').toLowerCase();
                const bTag = (btn.getAttribute('data-tag') || '').toLowerCase();

                const passaAnno = annoSel === '' || annoSel === 'tutti' || bAnno.includes(annoSel) || bAnno === 'tutti';
                const passaRicerca = query === '' || bNome.includes(query) || bTag.includes(query);

                if (passaAnno && passaRicerca) {
                    btn.style.display = 'block';
                    subHaContenuto = true;
                    catHaContenuto = true;
                } else {
                    btn.style.display = 'none';
                }
            });

            subFolder.style.display = subHaContenuto ? 'block' : 'none';
        });

        catFolder.style.display = catHaContenuto ? 'block' : 'none';
    });
}

// --- 4. CARICAMENTO E GENERAZIONE MENU ---
async function caricaMenu() {
    try {
        const response = await fetch('data/menu.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Errore nel caricamento del file menu.json');
        const data = await response.json();
        disegnaGrigliaMenu(data.catalogo);
        applicaFiltri(); 
    } catch (error) {
        console.error('Errore fatale:', error);
        document.getElementById('griglia-menu').innerHTML = '<p>Errore nel caricamento dell\'archivio.</p>';
    }
}

function disegnaGrigliaMenu(catalogo) {
    const contenitore = document.getElementById('griglia-menu');
    contenitore.innerHTML = '';

    catalogo.forEach(categoria => {
        const detailsCat = document.createElement('details');
        detailsCat.classList.add('blocco-categoria');
        // ID MACRO FONDAMENTALE PER IL FILTRO
        detailsCat.setAttribute('data-id-macro', categoria.id_categoria.toLowerCase().trim());
        
        const summaryCat = document.createElement('summary');
        summaryCat.textContent = categoria.nome_categoria;
        detailsCat.appendChild(summaryCat);

        categoria.sottocategorie.forEach(sub => {
            const detailsSub = document.createElement('details');
            detailsSub.classList.add('blocco-sottocategoria');

            const summarySub = document.createElement('summary');
            summarySub.textContent = sub.nome_sottocategoria;
            detailsSub.appendChild(summarySub);

            const divRicette = document.createElement('div');
            divRicette.classList.add('lista-ricette');

            sub.preparazioni.forEach(ricetta => {
                const bottone = document.createElement('button');
                bottone.textContent = ricetta.nome;
                bottone.classList.add('btn-ricetta');
                
                bottone.setAttribute('data-anno', String(ricetta.anno || 'tutti').toLowerCase());
                bottone.setAttribute('data-tag', String(ricetta.tag || '').toLowerCase());
                bottone.setAttribute('data-nome', String(ricetta.nome).toLowerCase());
                
                bottone.onclick = () => apriAlgoritmo(ricetta.id, ricetta.url_dati, ricetta.nome);
                divRicette.appendChild(bottone);
            });

            detailsSub.appendChild(divRicette);
            detailsCat.appendChild(detailsSub);
        });
        contenitore.appendChild(detailsCat);
    });
}

// --- 5. LOGICA DELLA SINGOLA RICETTA ---
async function apriAlgoritmo(idRicetta, urlDati, nomeRicetta) {
    document.getElementById('griglia-menu').style.display = 'none';
    const pannelloFiltri = document.getElementById('pannello-filtri');
    if (pannelloFiltri) pannelloFiltri.style.display = 'none';
    document.getElementById('pannello-controllo').style.display = 'none';
    document.getElementById('vista-ricetta').style.display = 'block';
    document.getElementById('titolo-ricetta-corrente').textContent = nomeRicetta;
    
    document.body.classList.remove('modalita-algoritmo');
    
    const btnToggle = document.getElementById('pulsante-toggle-vista');
    if (btnToggle) btnToggle.textContent = 'Mostra algoritmo';
    
    const listaIngredienti = document.getElementById('lista-ingredienti');
    const listaProcedimento = document.getElementById('lista-procedimento');
    const pannelloAlgoritmo = document.getElementById('pannello-algoritmo');
    
    listaIngredienti.innerHTML = '<li style="text-align: center; color: #7f8c8d;">Caricamento in corso...</li>';
    listaProcedimento.innerHTML = '';
    pannelloAlgoritmo.innerHTML = '';
    
    const vecchiaNota = document.getElementById('nota-dosi-ricetta');
    if (vecchiaNota) vecchiaNota.remove();
    
    try {
        const response = await fetch(urlDati + '?v=' + new Date().getTime());
        if (!response.ok) throw new Error('File ricetta non trovato');
        const ricetta = await response.json();
        
        window.ricettaCorrente = ricetta; 
        listaIngredienti.innerHTML = '';

        if (ricetta.nota_dosi) {
            const notaEl = document.createElement('div');
            notaEl.id = 'nota-dosi-ricetta';
            notaEl.classList.add('badge-nota-dosi');
            notaEl.innerHTML = `<span>${ricetta.nota_dosi}</span>`;
            listaIngredienti.parentNode.insertBefore(notaEl, listaIngredienti);
        }
        
        // --- MOTORE INGREDIENTI PROPORZIONALI ---
        ricetta.ingredienti.forEach((ingrediente, index) => {
            const li = document.createElement('li');

            if (typeof ingrediente === 'object' && ingrediente.quantita !== null && ingrediente.quantita !== undefined) {
                li.classList.add('riga-ingrediente');
                const quantitaBase = ingrediente.quantita;
                const unitaDesc = ingrediente.unita_descrizione;

                li.innerHTML = `
                    <div class="ingrediente-originale">${quantitaBase} ${unitaDesc}</div>
                    <div class="ingrediente-proporzionato">
                        <input type="number" step="any" class="input-quantita" data-index="${index}" data-base="${quantitaBase}" value="${quantitaBase}">
                    </div>
                `;
            } else {
                li.classList.add('riga-nota-ingrediente');
                const testoIngrediente = typeof ingrediente === 'object' ? ingrediente.unita_descrizione : ingrediente;
                li.innerHTML = `<span>${testoIngrediente}</span>`;
            }
            listaIngredienti.appendChild(li);
        });

        const inputsQuantita = listaIngredienti.querySelectorAll('.input-quantita');
        inputsQuantita.forEach(input => {
            input.addEventListener('input', (evento) => {
                const nuovoValore = parseFloat(evento.target.value);
                const valoreBase = parseFloat(evento.target.getAttribute('data-base'));

                if (isNaN(nuovoValore) || nuovoValore <= 0 || isNaN(valoreBase) || valoreBase <= 0) return;

                const fattoreDiScala = nuovoValore / valoreBase;

                inputsQuantita.forEach(altroInput => {
                    if (altroInput !== evento.target) {
                        const suaBase = parseFloat(altroInput.getAttribute('data-base'));
                        let calcolo = suaBase * fattoreDiScala;
                        calcolo = Math.round(calcolo * 10) / 10;
                        altroInput.value = calcolo;
                    }
                });
            });
        });
        
        // --- MOTORE PROCEDIMENTO ---
        ricetta.procedimento.forEach(passaggio => {
            if (passaggio.tipo === 'bivio') {
                const divBivioTesto = document.createElement('div');
                divBivioTesto.classList.add('blocco-bivio-testo');
                const divBivioNodi = document.createElement('div');
                divBivioNodi.classList.add('contenitore-bivio-visivo');
                
                passaggio.rami.forEach(ramo => {
                    const stepTesto = creaTestoSinistra(ramo);
                    divBivioTesto.appendChild(stepTesto);
                    const divNodo = creaNodoDestra(ramo);
                    divNodo.classList.add('nodo-ramo');
                    divBivioNodi.appendChild(divNodo);
                    attivaSincronia(stepTesto, divNodo);
                });
                
                listaProcedimento.appendChild(divBivioTesto);
                pannelloAlgoritmo.appendChild(divBivioNodi);

            } else if (passaggio.tipo === 'parallelo') {
                const divParalleloTesto = document.createElement('div');
                divParalleloTesto.classList.add('blocco-parallelo-testo');
                const divParalleloNodi = document.createElement('div');
                divParalleloNodi.classList.add('contenitore-parallelo-visivo');
                
                passaggio.rami.forEach(ramo => {
                    const stepTesto = creaTestoSinistra(ramo);
                    divParalleloTesto.appendChild(stepTesto);
                    const divNodo = creaNodoDestra(ramo);
                    divNodo.classList.add('nodo-ramo');
                    divParalleloNodi.appendChild(divNodo);
                    attivaSincronia(stepTesto, divNodo);
                });
                
                listaProcedimento.appendChild(divParalleloTesto);
                pannelloAlgoritmo.appendChild(divParalleloNodi);

            } else {
                const stepTesto = creaTestoSinistra(passaggio);
                listaProcedimento.appendChild(stepTesto);
                const divNodo = creaNodoDestra(passaggio);
                pannelloAlgoritmo.appendChild(divNodo);
                attivaSincronia(stepTesto, divNodo);
            }
        });

    } catch (error) {
        console.error('Errore nel caricamento della ricetta:', error);
        document.getElementById('lista-ingredienti').innerHTML = '<li>Errore: Impossibile caricare i dati della ricetta.</li>';
    }
}

function chiudiAlgoritmo() {
    document.getElementById('vista-ricetta').style.display = 'none';
    document.getElementById('griglia-menu').style.display = 'block';
    document.getElementById('pannello-controllo').style.display = 'flex';
    const pannelloFiltri = document.getElementById('pannello-filtri');
    if (pannelloFiltri) pannelloFiltri.style.display = 'flex'; 
    applicaFiltri();
}

// --- 6. FUNZIONI DI SUPPORTO GRAFICO ---
function creaTestoSinistra(dati) {
    const stepContainer = document.createElement('div');
    stepContainer.classList.add('step-ricetta');

    const numeroStep = document.createElement('div');
    numeroStep.classList.add('numero-step');
    numeroStep.textContent = dati.step_id.replace('step-', '');

    const testoStep = document.createElement('div');
    testoStep.classList.add('testo-step');
    testoStep.textContent = dati.testo;

    const divCheck = document.createElement('div');
    divCheck.classList.add('contenitore-check');

    const checkStep = document.createElement('input');
    checkStep.type = 'checkbox';
    checkStep.id = 'check-' + dati.step_id; 
    checkStep.classList.add('checkbox-stato-step');
    checkStep.setAttribute('aria-label', `Segna step ${dati.step_id.replace('step-','')} come completato`);

    checkStep.addEventListener('change', () => {
        const nodoVisivoTarget = document.getElementById('nodo-' + dati.step_id);
        if (checkStep.checked) {
            testoStep.classList.add('testo-barrato');
            numeroStep.classList.add('numero-barrato');
            if (nodoVisivoTarget) nodoVisivoTarget.classList.add('nodo-completato');
        } else {
            testoStep.classList.remove('testo-barrato');
            numeroStep.classList.remove('numero-barrato');
            if (nodoVisivoTarget) nodoVisivoTarget.classList.remove('nodo-completato');
        }
    });

    divCheck.appendChild(checkStep);
    stepContainer.appendChild(divCheck);
    stepContainer.appendChild(numeroStep);
    stepContainer.appendChild(testoStep);

    if (dati.opzionale) {
        const badgeOpzionale = document.createElement('span');
        badgeOpzionale.classList.add('badge-opzionale');
        badgeOpzionale.textContent = 'Opzionale';
        testoStep.prepend(badgeOpzionale); 
    }
    return stepContainer;
}

function creaNodoDestra(dati) {
    const divNodo = document.createElement('div');
    divNodo.classList.add('nodo-visivo');
    divNodo.id = 'nodo-' + dati.step_id;
    
    if (dati.icona) {
        divNodo.classList.add('tipo-' + dati.icona);
        const divIcona = document.createElement('div');
        divIcona.classList.add('icona-principale');
        const imgIcona = document.createElement('img');
        imgIcona.src = `assets/icone/${dati.icona}.svg`; 
        imgIcona.onerror = () => { console.warn(`Icona mancante: ${dati.icona}.svg`); };
        divIcona.appendChild(imgIcona);
        divNodo.appendChild(divIcona);
    } else if (dati.testo_nodo) {
        const divTestoSpeciale = document.createElement('div');
        divTestoSpeciale.classList.add('testo-nodo-alternativo');
        divTestoSpeciale.textContent = dati.testo_nodo;
        divNodo.appendChild(divTestoSpeciale);
    } else {
        const testoPlaceholder = document.createElement('div');
        testoPlaceholder.textContent = "Step " + dati.step_id.replace('step-', '');
        divNodo.appendChild(testoPlaceholder);
    }

    if (dati.temperatura || dati.tempo || dati.dimensione || dati.velocita) {
        const divParametri = document.createElement('div');
        divParametri.classList.add('pannello-parametri');
        
        if (dati.temperatura) {
            const badgeTemp = document.createElement('span');
            badgeTemp.classList.add('badge-parametro', 'badge-temp');
            badgeTemp.textContent = `🌡️ ${dati.temperatura}`;
            divParametri.appendChild(badgeTemp);
        }
        if (dati.tempo) {
            const badgeTempo = document.createElement('span');
            badgeTempo.classList.add('badge-parametro', 'badge-tempo');
            badgeTempo.textContent = `⏱️ ${dati.tempo}`;
            divParametri.appendChild(badgeTempo);
        }
        if (dati.dimensione) {
            const badgeDim = document.createElement('span');
            badgeDim.classList.add('badge-parametro', 'badge-dim');
            badgeDim.textContent = `📏 ${dati.dimensione}`;
            divParametri.appendChild(badgeDim);
        }
        if (dati.velocita) {
            const badgeVel = document.createElement('span');
            badgeVel.classList.add('badge-parametro', 'badge-vel');
            badgeVel.textContent = `⚙️ ${dati.velocita}`;
            divParametri.appendChild(badgeVel);
        }
        divNodo.appendChild(divParametri);
    }
    if (dati.opzionale) {
        divNodo.classList.add('nodo-opzionale');
    }
    return divNodo;
}

function attivaSincronia(testo, nodo) {
    const numeroStep = testo.querySelector('.numero-step');
    const testoStep = testo.querySelector('.testo-step');

    testo.addEventListener('mouseenter', () => {
        testo.classList.add('evidenziato');
        nodo.classList.add('nodo-attivo');
    });
    
    testo.addEventListener('mouseleave', () => {
        if (!testoStep.classList.contains('mostra-testo-popup')) {
            testo.classList.remove('evidenziato');
            nodo.classList.remove('nodo-attivo');
        }
    });
    
    nodo.addEventListener('mouseenter', () => {
        nodo.classList.add('nodo-attivo');
        testo.classList.add('evidenziato');
        testo.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
    });
    
    nodo.addEventListener('mouseleave', () => {
        if (!testoStep.classList.contains('mostra-testo-popup')) {
            nodo.classList.remove('nodo-attivo');
            testo.classList.remove('evidenziato');
        }
    });

    function toggleSincronizzato(evento) {
        if (document.body.classList.contains('modalita-algoritmo')) {
            evento.stopPropagation();
            const eraAperto = testoStep.classList.contains('mostra-testo-popup');
            
            document.querySelectorAll('.mostra-testo-popup').forEach(el => el.classList.remove('mostra-testo-popup'));
            document.querySelectorAll('.step-ricetta.evidenziato').forEach(el => el.classList.remove('evidenziato'));
            document.querySelectorAll('.nodo-visivo.nodo-attivo').forEach(el => el.classList.remove('nodo-attivo'));
            
            if (!eraAperto) {
                testoStep.classList.add('mostra-testo-popup');
                testo.classList.add('evidenziato');
                nodo.classList.add('nodo-attivo');
                
                if (evento.currentTarget === numeroStep) {
                    nodo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    testo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    if (numeroStep) numeroStep.addEventListener('click', toggleSincronizzato);
    nodo.addEventListener('click', toggleSincronizzato);

    if (testoStep) {
        testoStep.addEventListener('click', (evento) => {
            if (document.body.classList.contains('modalita-algoritmo')) {
                evento.stopPropagation();
                testoStep.classList.remove('mostra-testo-popup');
                testo.classList.remove('evidenziato');
                nodo.classList.remove('nodo-attivo');
            }
        });
    }
}

function cambiaVista() {
    const body = document.body;
    const btn = document.getElementById('pulsante-toggle-vista');
    body.classList.toggle('modalita-algoritmo');

    if (body.classList.contains('modalita-algoritmo')) {
        btn.textContent = 'Ricetta testuale';
    } else {
        btn.textContent = 'Mostra algoritmo';
        document.querySelectorAll('.mostra-testo-popup').forEach(el => el.classList.remove('mostra-testo-popup'));
    }
}

// --- 7. ESPORTAZIONE E UTILITÀ ---
function esportaWord() {
    if (!window.ricettaCorrente) return alert("Nessuna ricetta caricata!");
    const r = window.ricettaCorrente;

    let html = `<html xmlns:w="urn:schemas-microsoft-com:office:word">
                <head><meta charset="utf-8"><title>${r.titolo}</title></head>
                <body style="font-family: Arial, sans-serif; color: #000;">`;

    html += `<h1>${r.titolo}</h1>`;
    if (r.nota_dosi) html += `<p><em>${r.nota_dosi}</em></p>`;

    html += `<h2>Ingredienti</h2><ul>`;
    r.ingredienti.forEach(ing => {
        if (ing.quantita) {
            html += `<li><strong>${ing.quantita}</strong> ${ing.unita_descrizione}</li>`;
        } else {
            const desc = typeof ing === 'object' ? ing.unita_descrizione : ing;
            html += `<li><em>${desc}</em></li>`;
        }
    });
    html += `</ul>`;

    html += `<h2>Procedimento</h2><ol>`;
    r.procedimento.forEach(passaggio => {
        if (passaggio.tipo === 'bivio') {
            html += `<li><strong>Bivio:</strong><ul>`;
            passaggio.rami.forEach(ramo => html += `<li>${ramo.testo}</li>`);
            html += `</ul></li>`;
        } else if (passaggio.tipo === 'parallelo') {
            html += `<li><strong>In contemporanea:</strong><ul>`;
            passaggio.rami.forEach(ramo => html += `<li>${ramo.testo}</li>`);
            html += `</ul></li>`;
        } else {
            let prefisso = passaggio.opzionale ? "<em>(Opzionale)</em> " : "";
            html += `<li>${prefisso}${passaggio.testo}</li>`;
        }
    });
    html += `</ol></body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${r.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- FUNZIONE SCHERMO SEMPRE ON (Wake Lock API) ---
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
                btnWakeLock.classList.remove('attivo'); // Usa la tua classe originale!
            }
        } else {
            // Accende il blocco
            bloccoSchermo = await navigator.wakeLock.request('screen');
            if (btnWakeLock) {
                btnWakeLock.textContent = '☀️ Schermo: SEMPRE ACCESO';
                btnWakeLock.classList.add('attivo'); // Usa la tua classe originale!
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

function forzaAggiornamentoApp() {
    const timestamp = new Date().getTime();
    window.location.href = window.location.pathname + '?clear=' + timestamp;
}

// --- REGISTRAZIONE SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registrazione) => {
                console.log('Service Worker registrato con successo. Scope:', registrazione.scope);
            })
            .catch((errore) => {
                console.error('Errore nella registrazione del Service Worker:', errore);
            });
    });
}

// --- 5. SINCRONIZZAZIONE OFFLINE (PWA) ---
async function sincronizzaRicetteOffline() {
    const btn = document.getElementById('btn-sync');
    const testoOriginale = btn.innerHTML;
    btn.innerHTML = '⏳ Download ricette in corso...';
    btn.disabled = true;

    try {
        // 1. Scarica l'ultima versione del menu
        const response = await fetch('data/menu.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Errore download menu');
        const data = await response.json();
        
        // 2. Prepara la lista dei file da salvare (partendo dal menu stesso)
        let fileDaSalvare = ['data/menu.json'];

        data.catalogo.forEach(categoria => {
            categoria.sottocategorie.forEach(sub => {
                sub.preparazioni.forEach(ricetta => {
                    if (ricetta.url_dati) {
                        fileDaSalvare.push(ricetta.url_dati);
                    }
                });
            });
        });

        // 3. Apri la memoria del telefono e salva tutto
        const cache = await caches.open('bobbiolab-dati-v1');
        
        // Svuota i vecchi dati per evitare conflitti e carica i nuovi
        const vecchiFile = await cache.keys();
        for (let req of vecchiFile) {
            await cache.delete(req);
        }
        await cache.addAll(fileDaSalvare);

        alert('✅ Tutte le ricette sono state scaricate! Ora l\'app funzionerà anche senza internet.');
    } catch (error) {
        console.error('Errore di sincronizzazione:', error);
        alert('❌ Errore durante il download. Assicurati di avere una buona connessione e riprova.');
    } finally {
        btn.innerHTML = testoOriginale;
        btn.disabled = false;
    }
}