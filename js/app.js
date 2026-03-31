// --- 0. MOTORE GLOSSARIO CUCINA AUTOMATICO ---
let dizionarioGlossarioCucina = {};

async function caricaGlossarioCucina() {
    try {
        const response = await fetch('data/ricette/glossario_cucina.json');
        dizionarioGlossarioCucina = await response.json();
        creaModaleGlossarioCucina(); 
    } catch (error) {
        console.error("Errore nel caricamento del glossario cucina:", error);
    }
}

function creaModaleGlossarioCucina() {
    if (document.getElementById('modale-glossario-cucina')) return;
    
    const modaleDiv = document.createElement('div');
    modaleDiv.id = 'modale-glossario-cucina';
    modaleDiv.className = 'modale-overlay';
    modaleDiv.innerHTML = `
        <div class="modale-box modale-box-cucina">
            <h2 id="modale-titolo-cucina" class="modale-titolo modale-titolo-cucina"></h2>
            <p id="modale-testo-cucina" class="modale-testo"></p>
            <button class="btn-chiudi-modale" style="background-color: #d35400;" onclick="chiudiModaleGlossarioCucina()">Chiudi</button>
        </div>
    `;
    document.body.appendChild(modaleDiv);
    
    modaleDiv.addEventListener('click', (e) => {
        if(e.target === modaleDiv) chiudiModaleGlossarioCucina();
    });
}

function apriModaleGlossarioCucina(termine) {
    const definizione = dizionarioGlossarioCucina[termine.toLowerCase()];
    if(definizione) {
        document.getElementById('modale-titolo-cucina').textContent = termine;
        document.getElementById('modale-testo-cucina').textContent = definizione;
        document.getElementById('modale-glossario-cucina').style.display = 'flex';
    }
}

function chiudiModaleGlossarioCucina() {
    document.getElementById('modale-glossario-cucina').style.display = 'none';
}

function analizzaTestoGlossarioCucina(testo) {
    if(!testo || Object.keys(dizionarioGlossarioCucina).length === 0) return testo;

    let testoModificato = testo;
    const chiavi = Object.keys(dizionarioGlossarioCucina).sort((a, b) => b.length - a.length);

    chiavi.forEach(chiave => {
        const regex = new RegExp(`\\b(${chiave})\\b`, 'gi');
        testoModificato = testoModificato.replace(regex, `<span class="termine-cucina" onclick="apriModaleGlossarioCucina('$1')">$1</span>`);
    });

    return testoModificato;
}

caricaGlossarioCucina();


// --- 1. DIZIONARIO SOTTOCATEGORIE ---
const mappaSottocategorie = {
    cucina: ["Preparazioni base", "Stuzzichini e aperitivi", "Antipasti", "Primi", "Secondi", "Contorni", "Salse e riduzioni"],
    pasticceria: ["Preparazioni base", "Frolle", "Sfoglie e sfogliati", "Choux", "Biscotteria e piccola pasticceria", "Creme e dolci al cucchiaio", "Masse montate", "Torte da credenza", "Lievitati", "Dolci fritti", "Cioccolato e pralineria", "Gelati e sorbetti", "Pasticceria salata", "Tecniche avanzate"],
    panificazione: ["Preparazioni base", "Lievitati", "Pani speciali", "Pizze e focacce", "Tecniche avanzate"],
    qualifiche_cucina: ["Prove d'esame"],
    qualifiche_pasticceria: ["Prove d'esame"]
};

// --- 2. AVVIO E COLLEGAMENTO SENSORI ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Sicurezza: Carica il menu SOLO se esiste la griglia nella pagina
    if (document.getElementById('griglia-menu')) {
        caricaMenu();
    }

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
        const grigliaMenu = document.getElementById('griglia-menu');
        if (grigliaMenu) grigliaMenu.innerHTML = '<p>Errore nel caricamento dell\'archivio.</p>';
    }
}

function disegnaGrigliaMenu(catalogo) {
    const contenitore = document.getElementById('griglia-menu');
    // Sicurezza: se il contenitore non esiste, non fare nulla
    if (!contenitore) return;
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
        // --- MOTORE PROCEDIMENTO ---
        ricetta.procedimento.forEach(passaggio => {
            if (passaggio.tipo === 'bivio') {
                const divBivioTesto = document.createElement('div');
                divBivioTesto.classList.add('blocco-bivio-testo');
                const divBivioNodi = document.createElement('div');
                divBivioNodi.classList.add('contenitore-bivio-visivo');
                
                passaggio.rami.forEach((ramo, indiceRamo) => {
                    const stepTesto = creaTestoSinistra(ramo);
                    divBivioTesto.appendChild(stepTesto);
                    
                    if (indiceRamo === 0) {
                        const divisore = document.createElement('div');
                        divisore.classList.add('divisore-bivio');
                        divisore.innerHTML = '<span>oppure scegli:</span>';
                        divBivioTesto.appendChild(divisore);

                        const divisoreNodo = document.createElement('div');
                        divisoreNodo.classList.add('divisore-bivio-nodo');
                        divisoreNodo.textContent = 'O'; 
                        divBivioNodi.appendChild(divisoreNodo);
                    }
                    
                    const divNodo = creaNodoDestra(ramo);
                    divNodo.classList.add('nodo-ramo');
                    divBivioNodi.appendChild(divNodo);
                    
                    // PASSAGGIAMO I DATI ALLA SINCRONIA
                    attivaSincronia(stepTesto, divNodo, ramo); 
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
                    attivaSincronia(stepTesto, divNodo, ramo);
                });
                
                listaProcedimento.appendChild(divParalleloTesto);
                pannelloAlgoritmo.appendChild(divParalleloNodi);

            } else {
                const stepTesto = creaTestoSinistra(passaggio);
                listaProcedimento.appendChild(stepTesto);
                const divNodo = creaNodoDestra(passaggio);
                pannelloAlgoritmo.appendChild(divNodo);
                attivaSincronia(stepTesto, divNodo, passaggio);
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
    stepContainer.id = 'testo-' + dati.step_id; 

    if (dati.condizione) {
        stepContainer.classList.add('blocco-condizionato', 'condizione-' + dati.condizione);
    }

    const numeroStep = document.createElement('div');
    numeroStep.classList.add('numero-step');
    numeroStep.textContent = dati.step_id.replace('step-', '');

    const testoStep = document.createElement('div');
    testoStep.classList.add('testo-step');
    testoStep.innerHTML = analizzaTestoGlossarioCucina(dati.testo);

    if (dati.opzionale) {
        const badgeOpzionale = document.createElement('span');
        badgeOpzionale.classList.add('badge-opzionale');
        badgeOpzionale.textContent = 'Opzionale';
        testoStep.prepend(badgeOpzionale); 
    }

    // PULIZIA ASSOLUTA: Niente più checkbox o bottoni radio!
    stepContainer.appendChild(numeroStep);
    stepContainer.appendChild(testoStep);

    return stepContainer;
}

function creaNodoDestra(dati) {
    const divNodo = document.createElement('div');
    divNodo.classList.add('nodo-visivo');
    divNodo.id = 'nodo-' + dati.step_id;
    
    // Nasconde anche i nodi grafici a destra se c'è condizione
    if (dati.condizione) {
        divNodo.classList.add('blocco-condizionato', 'condizione-' + dati.condizione);
    }
    
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

function attivaSincronia(testo, nodo, dati) {
    const numeroStep = testo.querySelector('.numero-step');
    const testoStep = testo.querySelector('.testo-step');

    // Manteniamo l'effetto hover per chi usa il PC col mouse
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
    });
    
    nodo.addEventListener('mouseleave', () => {
        if (!testoStep.classList.contains('mostra-testo-popup')) {
            nodo.classList.remove('nodo-attivo');
            testo.classList.remove('evidenziato');
        }
    });

    // 1. CLICK SINGOLO: Sceglie il ramo o apre l'ingrandimento
    function gestisciClickSingolo(evento) {
        evento.stopPropagation();
        
        // Magia del Bivio (si attiva se il passaggio ha 'a' o 'b')
        const match = dati.step_id.match(/step-\d+([ab])$/);
        if (match) {
            const lettera = match[1];
            const letteraOpposta = lettera === 'a' ? 'b' : 'a';
            const idOpposto = dati.step_id.replace(lettera, letteraOpposta);

            // Accende la strada scelta
            document.querySelectorAll('.condizione-' + lettera).forEach(el => {
                el.classList.add('mostra-step');
                el.classList.remove('nascosto-step');
            });
            // Spegne la strada scartata
            document.querySelectorAll('.condizione-' + letteraOpposta).forEach(el => {
                el.classList.remove('mostra-step');
                el.classList.add('nascosto-step');
            });

            // Spegne il ramo del bivio non scelto
            const containerOpposto = document.getElementById('testo-' + idOpposto);
            const nodoOpposto = document.getElementById('nodo-' + idOpposto);
            if (containerOpposto) containerOpposto.classList.add('nascosto-step');
            if (nodoOpposto) nodoOpposto.classList.add('nascosto-step');

            // Accende se stesso
            const containerAttuale = document.getElementById('testo-' + dati.step_id);
            if (containerAttuale) containerAttuale.classList.remove('nascosto-step');
            if (nodo) nodo.classList.remove('nascosto-step');
        }

        // Se sei in modalità Algoritmo, il singolo tocco ingrandisce il testo
        if (document.body.classList.contains('modalita-algoritmo')) {
            const eraAperto = testoStep.classList.contains('mostra-testo-popup');
            
            document.querySelectorAll('.mostra-testo-popup').forEach(el => el.classList.remove('mostra-testo-popup'));
            document.querySelectorAll('.step-ricetta.evidenziato').forEach(el => el.classList.remove('evidenziato'));
            document.querySelectorAll('.nodo-visivo.nodo-attivo').forEach(el => el.classList.remove('nodo-attivo'));
            
            if (!eraAperto) {
                testoStep.classList.add('mostra-testo-popup');
                testo.classList.add('evidenziato');
                nodo.classList.add('nodo-attivo');
                
                if (evento.currentTarget === nodo) {
                    nodo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    testo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    // 2. DOPPIO CLICK: Tira la riga di completamento
    function gestisciDoppioClick(evento) {
        evento.stopPropagation();
        evento.preventDefault(); // Blocca lo zoom di default dei telefoni
        
        const completato = testoStep.classList.contains('testo-barrato');
        
        if (!completato) {
            testoStep.classList.add('testo-barrato');
            if(numeroStep) numeroStep.classList.add('numero-barrato');
            if(nodo) nodo.classList.add('nodo-completato');
        } else {
            testoStep.classList.remove('testo-barrato');
            if(numeroStep) numeroStep.classList.remove('numero-barrato');
            if(nodo) nodo.classList.remove('nodo-completato');
        }
    }

    // Colleghiamo le funzioni ai tocchi
    testo.addEventListener('click', gestisciClickSingolo);
    nodo.addEventListener('click', gestisciClickSingolo);
    
    testo.addEventListener('dblclick', gestisciDoppioClick);
    nodo.addEventListener('dblclick', gestisciDoppioClick);
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

// --- 9. REGISTRAZIONE SERVICE WORKER ---
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

// --- 10. SINCRONIZZAZIONE OFFLINE RICETTE ---
async function sincronizzaRicetteOffline() {
    const btn = document.getElementById('btn-sync');
    const testoOriginale = btn.innerHTML;
    btn.innerHTML = '⏳ Download in corso...';
    btn.disabled = true;

    try {
        const response = await fetch('data/menu.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Errore download menu');
        const data = await response.json();
        
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

        const cache = await caches.open('bobbiolab-dati-v1');
        let scaricate = 0;
        let fallite = 0;
        
        for (let url of fileDaSalvare) {
            try {
                await cache.add(url + '?v=' + new Date().getTime());
                scaricate++;
            } catch (e) {
                console.warn('⚠️ Impossibile scaricare (file mancante):', url);
                fallite++;
            }
        }

        if (fallite > 0) {
            alert(`Download completato: ${scaricate} file salvati. Attenzione: ${fallite} ricette non trovate (controlla console F12).`);
        } else {
            alert(`✅ Tutte le ${scaricate} ricette sono state scaricate! App pronta per l'uso offline.`);
        }

    } catch (error) {
        console.error('Errore fatale di sincronizzazione:', error);
        alert('❌ Errore generale durante il download. Controlla la connessione.');
    } finally {
        btn.innerHTML = testoOriginale;
        btn.disabled = false;
    }
}