// --- 1. AVVIO E COLLEGAMENTO SENSORI ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Carica il menu solo se esiste la griglia nella pagina
    if (document.getElementById('griglia-menu')) {
        caricaMenuSala();
    }

    const filtroFunzione = document.getElementById('filtro-funzione');
    const filtroFamiglia = document.getElementById('filtro-famiglia');
    const filtroQuantita = document.getElementById('filtro-quantita');
    const campoRicerca = document.getElementById('campo-ricerca');

    // Tutti i filtri sono sbloccati fin dall'inizio e ascoltano i cambiamenti
    if (filtroFunzione) filtroFunzione.addEventListener('change', applicaFiltriSala);
    if (filtroFamiglia) filtroFamiglia.addEventListener('change', applicaFiltriSala);
    if (filtroQuantita) filtroQuantita.addEventListener('change', applicaFiltriSala);
    if (campoRicerca) campoRicerca.addEventListener('input', applicaFiltriSala);
});

// --- 2. LOGICA DEI FILTRI FACCETTATI (Tag Incrociati) ---
function applicaFiltriSala() {
    const campoRicerca = document.getElementById('campo-ricerca');
    const filtroFunzione = document.getElementById('filtro-funzione');
    const filtroFamiglia = document.getElementById('filtro-famiglia');
    const filtroQuantita = document.getElementById('filtro-quantita');

    const query = campoRicerca ? campoRicerca.value.toLowerCase().trim() : '';
    const selFunzione = filtroFunzione ? filtroFunzione.value.toLowerCase().trim() : '';
    const selFamiglia = filtroFamiglia ? filtroFamiglia.value.toLowerCase().trim() : '';
    const selQuantita = filtroQuantita ? filtroQuantita.value.toLowerCase().trim() : '';

    const blocchiMacro = document.querySelectorAll('.blocco-categoria');

    blocchiMacro.forEach(catFolder => {
        let catHaContenuto = false;
        const sottocategorieFolder = catFolder.querySelectorAll('.blocco-sottocategoria');

        sottocategorieFolder.forEach(subFolder => {
            let subHaContenuto = false;
            const ricette = subFolder.querySelectorAll('.btn-ricetta');

            ricette.forEach(btn => {
                const bFunzione = (btn.getAttribute('data-funzione') || '').toLowerCase();
                const bFamiglia = (btn.getAttribute('data-famiglia') || '').toLowerCase();
                const bQuantita = (btn.getAttribute('data-quantita') || '').toLowerCase();
                const bNome = (btn.getAttribute('data-nome') || '').toLowerCase();
                const bTag = (btn.getAttribute('data-tag') || '').toLowerCase();

                const passaFunzione = selFunzione === '' || bFunzione.includes(selFunzione);
                const passaFamiglia = selFamiglia === '' || bFamiglia.includes(selFamiglia);
                const passaQuantita = selQuantita === '' || bQuantita.includes(selQuantita);
                const passaRicerca = query === '' || bNome.includes(query) || bTag.includes(query);

                if (passaFunzione && passaFamiglia && passaQuantita && passaRicerca) {
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

// --- 3. CARICAMENTO E GENERAZIONE MENU SALA ---
async function caricaMenuSala() {
    try {
        const response = await fetch('data/menu-sala.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Errore nel caricamento del file menu-sala.json');
        const data = await response.json();
        disegnaGrigliaMenuSala(data.catalogo);
        applicaFiltriSala(); 
    } catch (error) {
        console.error('Errore fatale:', error);
        const grigliaMenu = document.getElementById('griglia-menu');
        if (grigliaMenu) grigliaMenu.innerHTML = '<p>Errore nel caricamento dell\'archivio bar.</p>';
    }
}

function disegnaGrigliaMenuSala(catalogo) {
    const contenitore = document.getElementById('griglia-menu');
    if (!contenitore) return;
    contenitore.innerHTML = '';

    catalogo.forEach(categoria => {
        const detailsCat = document.createElement('details');
        detailsCat.classList.add('blocco-categoria');
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
                
                bottone.setAttribute('data-funzione', String(ricetta.funzione || '').toLowerCase());
                bottone.setAttribute('data-famiglia', String(ricetta.famiglia || '').toLowerCase());
                bottone.setAttribute('data-quantita', String(ricetta.quantita || '').toLowerCase());
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

// --- 4. LOGICA DELLA SINGOLA RICETTA E ALGORITMO VISIVO ---
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
    
    const vecchioSpoiler = document.getElementById('contenitore-foto-spoiler');
    if (vecchioSpoiler) vecchioSpoiler.remove();
    
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
            notaEl.innerHTML = `<span>🍸 <strong>Bicchiere:</strong> ${ricetta.nota_dosi}</span>`;
            listaIngredienti.parentNode.insertBefore(notaEl, listaIngredienti);
        }

        // --- NUOVO: STAMPA DELLA GARNISH ---
        if (ricetta.garnish) {
            const garnishEl = document.createElement('div');
            garnishEl.id = 'garnish-ricetta';
            garnishEl.style.backgroundColor = '#f39c12'; // Arancione brillante
            garnishEl.style.color = 'white';
            garnishEl.style.padding = '8px 15px';
            garnishEl.style.borderRadius = '5px';
            garnishEl.style.marginBottom = '20px';
            garnishEl.style.fontWeight = 'bold';
            garnishEl.style.display = 'inline-block';
            garnishEl.innerHTML = `🍋 Decorazione: ${ricetta.garnish}`;
            
            // La inseriamo subito dopo il bicchiere
            listaIngredienti.parentNode.insertBefore(garnishEl, listaIngredienti);
        }

        // --- SISTEMA FOTO SPOILER ---
        if (ricetta.foto) {
            const spoilerDiv = document.createElement('div');
            spoilerDiv.id = 'contenitore-foto-spoiler';
            spoilerDiv.innerHTML = `
                <div class="btn-spoiler" id="btn-toggle-foto" style="background-color: #8e44ad; color: white; padding: 10px; border-radius: 5px; cursor: pointer; margin-bottom: 15px; display: inline-block; font-weight: bold; text-align: center; width: 100%; box-sizing: border-box;">📸 Mostra foto suggerita</div>
                <div id="foto-cocktail" class="contenitore-foto" style="display: none; margin-bottom: 20px; text-align: center; border-radius: 10px; overflow: hidden; border: 3px solid #8e44ad;">
                    <img src="${ricetta.foto}" alt="${ricetta.titolo}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
            `;
            listaIngredienti.parentNode.insertBefore(spoilerDiv, listaIngredienti);

            const btnToggleFoto = spoilerDiv.querySelector('#btn-toggle-foto');
            const fotoCont = spoilerDiv.querySelector('#foto-cocktail');
            btnToggleFoto.addEventListener('click', () => {
                if (fotoCont.style.display === 'none') {
                    fotoCont.style.display = 'block';
                    btnToggleFoto.textContent = '🙈 Nascondi foto';
                } else {
                    fotoCont.style.display = 'none';
                    btnToggleFoto.textContent = '📸 Mostra foto suggerita';
                }
            });
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
        document.getElementById('lista-ingredienti').innerHTML = '<li>Errore: impossibile caricare i dati della ricetta.</li>';
    }
}

function chiudiAlgoritmo() {
    document.getElementById('vista-ricetta').style.display = 'none';
    document.getElementById('griglia-menu').style.display = 'block';
    document.getElementById('pannello-controllo').style.display = 'flex';
    const pannelloFiltri = document.getElementById('pannello-filtri');
    if (pannelloFiltri) pannelloFiltri.style.display = 'flex'; 
    applicaFiltriSala();
}

// --- 5. FUNZIONI DI SUPPORTO GRAFICO ---
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
        divNodo.classList.add('tipo-' + dati.icona); // Mantiene retrocompatibilità
        divNodo.classList.add('step-' + dati.icona); // Nuova classe usata dal bar
        
        const divIcona = document.createElement('div');
        divIcona.classList.add('icona-principale');
        const imgIcona = document.createElement('img');
        
        // PERCORSO AGGIORNATO PER LA SALA
        imgIcona.src = `assets/icone-sala/${dati.icona}.svg`; 
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

// --- 6. ESPORTAZIONE IN WORD (Formattazione Mantenuta) ---
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

// --- 7. WAKE LOCK E SERVICE WORKER ---
let bloccoSchermo = null;

async function attivaSchermo() {
    const btnWakeLock = document.getElementById('btn-wake-lock'); 
    
    if (!('wakeLock' in navigator)) {
        alert("Il browser di questo dispositivo non supporta lo schermo sempre acceso.");
        return;
    }

    try {
        if (bloccoSchermo !== null) {
            await bloccoSchermo.release();
            bloccoSchermo = null;
            if (btnWakeLock) {
                btnWakeLock.textContent = '🌙 Schermo';
                btnWakeLock.classList.remove('attivo');
            }
        } else {
            bloccoSchermo = await navigator.wakeLock.request('screen');
            if (btnWakeLock) {
                btnWakeLock.textContent = '☀️ Schermo';
                btnWakeLock.classList.add('attivo');
            }
            
            bloccoSchermo.addEventListener('release', () => {
                bloccoSchermo = null;
                if (btnWakeLock) {
                    btnWakeLock.textContent = '🌙 Schermo';
                    btnWakeLock.classList.remove('attivo');
                }
            });
        }
    } catch (errore) {
        alert("Impossibile attivare lo schermo: " + errore.message);
    }
}

const bottoneSchermo = document.getElementById('btn-wake-lock');
if (bottoneSchermo) {
    bottoneSchermo.addEventListener('click', attivaSchermo);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch((errore) => console.error('Errore SW:', errore));
    });
}

// --- 8. SINCRONIZZAZIONE (Punta a menu_sala.json) ---
async function sincronizzaRicetteOffline() {
    const btn = document.getElementById('btn-sync');
    const testoOriginale = btn.innerHTML;
    btn.innerHTML = '⏳ Download...';
    btn.disabled = true;

    try {
        const response = await fetch('data/menu_sala.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Errore download menu_sala');
        const data = await response.json();
        
        let fileDaSalvare = ['data/menu_sala.json'];

        data.catalogo.forEach(categoria => {
            categoria.sottocategorie.forEach(sub => {
                sub.preparazioni.forEach(ricetta => {
                    if (ricetta.url_dati) fileDaSalvare.push(ricetta.url_dati);
                });
            });
        });

        const cache = await caches.open('bobbiolab-dati-v1');
        let scaricate = 0; let fallite = 0;
        
        for (let url of fileDaSalvare) {
            try {
                await cache.add(url + '?v=' + new Date().getTime());
                scaricate++;
            } catch (e) {
                fallite++;
            }
        }

        if (fallite > 0) alert(`Scaricati ${scaricate} file. Mancanti: ${fallite}.`);
        else alert(`✅ Tutte le ${scaricate} ricette bar scaricate!`);

    } catch (error) {
        alert('❌ Errore generale durante il download.');
    } finally {
        btn.innerHTML = testoOriginale;
        btn.disabled = false;
    }
}