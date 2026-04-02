// --- 1. AVVIO E COLLEGAMENTO SENSORI ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('griglia-menu')) {
        caricaMenuAccoglienza();
    }
    const campoRicerca = document.getElementById('campo-ricerca');
    if (campoRicerca) campoRicerca.addEventListener('input', applicaFiltriAccoglienza);
});

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
        
        const summaryCat = document.createElement('summary');
        summaryCat.textContent = categoria.nome_categoria;
        detailsCat.appendChild(summaryCat);

        // QUI CAMBIA LA MAGIA: Usiamo la nuova griglia a quadratoni
        const divProcedure = document.createElement('div');
        divProcedure.classList.add('griglia-bottoni-accoglienza');

        categoria.procedure.forEach(proc => {
            const bottone = document.createElement('button');
            bottone.classList.add('bottone-quadrato-accoglienza');
            bottone.setAttribute('data-tag', String(proc.tag || '').toLowerCase());
            bottone.setAttribute('data-nome', String(proc.nome).toLowerCase());
            
            // 1. Creiamo l'immagine centrale
            const img = document.createElement('img');
            // Se non c'è nel JSON, prova a caricare default.png per non rompere nulla
            img.src = `assets/accoglienza/${proc.icona || 'default.png'}`; 
            img.alt = proc.nome;
            img.classList.add('icona-bottone-accoglienza');

            // 2. Creiamo il testo in basso
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
    
    // Rimosse regole per modalita-algoritmo e pulsante toggle
    // document.body.classList.remove('modalita-algoritmo');
    // document.getElementById('pulsante-toggle-vista').textContent = 'Mostra diagramma';
    
    const listaGobbo = document.getElementById('lista-gobbo');
    const listaProcedimento = document.getElementById('lista-procedimento');
    // const pannelloAlgoritmo = document.getElementById('pannello-algoritmo'); // Diagram panel removed
    
    listaGobbo.innerHTML = '<li style="text-align: center;">Caricamento...</li>';
    listaProcedimento.innerHTML = '';
    // pannelloAlgoritmo.innerHTML = ''; // Diagram panel removed
    
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
                li.innerHTML = `<strong>${frase.contesto}:</strong><br><span style="font-size: 1.1em; color: #d35400;">"${frase.testo}"</span>`;
                listaGobbo.appendChild(li);
            });
        }
        
        // --- MOTORE PROCEDIMENTO (Identico a cucina/sala, but text only appended) ---
        procedura.procedimento.forEach(passaggio => {
            if (passaggio.tipo === 'bivio') {
                const divBivioTesto = document.createElement('div');
                divBivioTesto.classList.add('blocco-bivio-testo');
                // divBivioNodi Logic Removed
                
                // FIX: Iterate through branches and correctly pass TYPE and DATA to activaSincronia
                passaggio.rami.forEach((ramo, indiceRamo) => {
                    const stepTesto = creaTestoSinistra(ramo);
                    divBivioTesto.appendChild(stepTesto);
                    
                    if (indiceRamo === 0) {
                        const divisore = document.createElement('div');
                        divisore.classList.add('divisore-bivio');
                        divisore.innerHTML = '<span>oppure:</span>';
                        divBivioTesto.appendChild(divisore);
                        // divisoreNodo logic removed
                    }
                    // creaNodoDestra logic removed

                    // Crucial Fix: Pass types/dati for tap functionality in bivio (NODE ARGUMENT REMOVED)
                    attivaSincronia(stepTesto, ramo, 'bivio'); 
                });
                
                listaProcedimento.appendChild(divBivioTesto);
                // pannelloAlgoritmo logic removed

            } else if (passaggio.tipo === 'parallelo') {
                 // Logic simplified for parallel text flow, strike-through handles completion
                 passaggio.rami.forEach(ramo => {
                     const stepTesto = creaTestoSinistra(ramo);
                     listaProcedimento.appendChild(stepTesto);
                     // attivaSincronia flat or strike only logic if diagram gone
                      attivaSincronia(stepTesto, ramo, 'parallelo'); 
                 });

            } else {
                const stepTesto = creaTestoSinistra(passaggio);
                listaProcedimento.appendChild(stepTesto);
                // creaNodoDestra logic removed
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
    testoStep.innerHTML = dati.testo;

    stepContainer.appendChild(numeroStep);
    stepContainer.appendChild(testoStep);
    
    return stepContainer;
}

// creaNodoDestra function logic removed

// Updated signature: NO NODE passed. Node listeners removed.
function attivaSincronia(testo, dati, tipoPadre) {
    const numeroStep = testo.querySelector('.numero-step');
    const testoStep = testo.querySelector('.testo-step');

    // Highlighter on text only (hover state defined in CSS)
    testo.addEventListener('mouseenter', () => testo.classList.add('evidenziato'));
    testo.addEventListener('mouseleave', () => testo.classList.remove('evidenziato'));

    let timerTocco = null;
    let tocchi = 0;

    function gestisciInterazione(evento) {
        evento.stopPropagation();
        
        // Disable selection during tap processing
        testo.style.userSelect = 'none';
        testo.style.webkitUserSelect = 'none';

        tocchi++; 

        if (tocchi === 1) {
            timerTocco = setTimeout(() => {
                tocchi = 0; 
                testo.style.userSelect = 'auto'; // restore
                testo.style.webkitUserSelect = 'auto';

                const match = dati.step_id.match(/step-\d+([ab])$/);
                
                // FIX: Handling tap functionality inside bivio without diagram nodes
                if (match && tipoPadre === 'bivio') {
                    const lettera = match[1];
                    const letteraOpposta = lettera === 'a' ? 'b' : 'a';
                    const idOpposto = dati.step_id.replace(lettera, letteraOpposta);

                    // Show standard procedure classes condition-a text elements
                    document.querySelectorAll('.condizione-' + lettera).forEach(el => { el.classList.add('mostra-step'); el.classList.remove('nascosto-step'); });
                    document.querySelectorAll('.condizione-' + letteraOpposta).forEach(el => { el.classList.remove('mostra-step'); el.classList.add('nascosto-step'); });

                    // Handle specific text container ID hiding (for the branching step itself)
                    const containerOpposto = document.getElementById('testo-' + idOpposto);
                    if (containerOpposto) containerOpposto.classList.add('nascosto-step');

                    const containerAttuale = document.getElementById('testo-' + dati.step_id);
                    if (containerAttuale) containerAttuale.classList.remove('nascosto-step');
                }

                // Diagram interaction logic removed
                // Popup handling logic removed as diagram is disabled.
            }, 250); 
            
        } else if (tocchi === 2) {
            clearTimeout(timerTocco); 
            tocchi = 0; 
            testo.style.userSelect = 'auto'; // restore
            testo.style.webkitUserSelect = 'auto';
            
            // Cancello di sicurezza: Target completion strike on text container.
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

// cambiaVista function logic removed