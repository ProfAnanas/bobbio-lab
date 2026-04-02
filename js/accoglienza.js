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

        const divProcedure = document.createElement('div');
        divProcedure.classList.add('lista-ricette');

        categoria.procedure.forEach(proc => {
            const bottone = document.createElement('button');
            bottone.textContent = proc.nome;
            bottone.classList.add('btn-ricetta');
            bottone.setAttribute('data-tag', String(proc.tag || '').toLowerCase());
            bottone.setAttribute('data-nome', String(proc.nome).toLowerCase());
            
            bottone.onclick = () => apriProcedura(proc.id, proc.url_dati, proc.nome);
            divProcedure.appendChild(bottone);
        });

        detailsCat.appendChild(divProcedure);
        contenitore.appendChild(detailsCat);
    });
}

// --- 4. LOGICA DELLA PROCEDURA E ALGORITMO ---
async function apriProcedura(idProc, urlDati, nomeProc) {
    document.getElementById('griglia-menu').style.display = 'none';
    document.getElementById('pannello-controllo').style.display = 'none';
    document.getElementById('vista-ricetta').style.display = 'block';
    document.getElementById('titolo-ricetta-corrente').textContent = nomeProc;
    
    document.body.classList.remove('modalita-algoritmo');
    document.getElementById('pulsante-toggle-vista').textContent = 'Mostra diagramma';
    
    const listaGobbo = document.getElementById('lista-gobbo');
    const listaProcedimento = document.getElementById('lista-procedimento');
    const pannelloAlgoritmo = document.getElementById('pannello-algoritmo');
    
    listaGobbo.innerHTML = '<li style="text-align: center;">Caricamento...</li>';
    listaProcedimento.innerHTML = '';
    pannelloAlgoritmo.innerHTML = '';
    
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
        
        // --- MOTORE PROCEDIMENTO (Identico a cucina/sala) ---
        procedura.procedimento.forEach(passaggio => {
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
                        divisore.innerHTML = '<span>oppure:</span>';
                        divBivioTesto.appendChild(divisore);

                        const divisoreNodo = document.createElement('div');
                        divisoreNodo.classList.add('divisore-bivio-nodo');
                        divisoreNodo.textContent = 'O'; 
                        divBivioNodi.appendChild(divisoreNodo);
                    }
                    
                    const divNodo = creaNodoDestra(ramo);
                    divNodo.classList.add('nodo-ramo');
                    divBivioNodi.appendChild(divNodo);
                    
                    attivaSincronia(stepTesto, divNodo, ramo, 'bivio');
                });
                
                listaProcedimento.appendChild(divBivioTesto);
                pannelloAlgoritmo.appendChild(divBivioNodi);

            } else {
                const stepTesto = creaTestoSinistra(passaggio);
                listaProcedimento.appendChild(stepTesto);
                const divNodo = creaNodoDestra(passaggio);
                pannelloAlgoritmo.appendChild(divNodo);
                
                attivaSincronia(stepTesto, divNodo, passaggio, 'singolo');
            }
        });

    } catch (error) {
        listaGobbo.innerHTML = '<li>Errore caricamento dati.</li>';
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

function creaNodoDestra(dati) {
    const divNodo = document.createElement('div');
    divNodo.classList.add('nodo-visivo');
    divNodo.id = 'nodo-' + dati.step_id;
    
    if (dati.condizione) divNodo.classList.add('blocco-condizionato', 'condizione-' + dati.condizione);
    
    if (dati.icona) {
        divNodo.classList.add('tipo-' + dati.icona, 'step-' + dati.icona); 
        const divIcona = document.createElement('div');
        divIcona.classList.add('icona-principale');
        const imgIcona = document.createElement('img');
        
        imgIcona.src = `assets/icone-accoglienza/${dati.icona}.svg`; 
        imgIcona.onerror = () => { console.warn(`Icona mancante: ${dati.icona}.svg`); };
        
        divIcona.appendChild(imgIcona);
        divNodo.appendChild(divIcona);
    } else {
        const testoPlaceholder = document.createElement('div');
        testoPlaceholder.textContent = "Step " + dati.step_id.replace('step-', '');
        divNodo.appendChild(testoPlaceholder);
    }
    return divNodo;
}

function attivaSincronia(testo, nodo, dati, tipoPadre) {
    const numeroStep = testo.querySelector('.numero-step');
    const testoStep = testo.querySelector('.testo-step');

    testo.addEventListener('mouseenter', () => { testo.classList.add('evidenziato'); nodo.classList.add('nodo-attivo'); });
    testo.addEventListener('mouseleave', () => { if (!testoStep.classList.contains('mostra-testo-popup')) { testo.classList.remove('evidenziato'); nodo.classList.remove('nodo-attivo'); } });
    nodo.addEventListener('mouseenter', () => { nodo.classList.add('nodo-attivo'); testo.classList.add('evidenziato'); });
    nodo.addEventListener('mouseleave', () => { if (!testoStep.classList.contains('mostra-testo-popup')) { nodo.classList.remove('nodo-attivo'); testo.classList.remove('evidenziato'); } });

    let timerTocco = null;
    let tocchi = 0;

    function gestisciInterazione(evento) {
        evento.stopPropagation();
        tocchi++; 

        if (tocchi === 1) {
            timerTocco = setTimeout(() => {
                tocchi = 0; 
                const match = dati.step_id.match(/step-\d+([ab])$/);
                
                if (match && tipoPadre === 'bivio') {
                    const lettera = match[1];
                    const letteraOpposta = lettera === 'a' ? 'b' : 'a';
                    const idOpposto = dati.step_id.replace(lettera, letteraOpposta);

                    document.querySelectorAll('.condizione-' + lettera).forEach(el => { el.classList.add('mostra-step'); el.classList.remove('nascosto-step'); });
                    document.querySelectorAll('.condizione-' + letteraOpposta).forEach(el => { el.classList.remove('mostra-step'); el.classList.add('nascosto-step'); });

                    const containerOpposto = document.getElementById('testo-' + idOpposto);
                    const nodoOpposto = document.getElementById('nodo-' + idOpposto);
                    if (containerOpposto) containerOpposto.classList.add('nascosto-step');
                    if (nodoOpposto) nodoOpposto.classList.add('nascosto-step');

                    const containerAttuale = document.getElementById('testo-' + dati.step_id);
                    if (containerAttuale) containerAttuale.classList.remove('nascosto-step');
                    if (nodo) nodo.classList.remove('nascosto-step');
                }

                if (document.body.classList.contains('modalita-algoritmo')) {
                    const eraAperto = testoStep.classList.contains('mostra-testo-popup');
                    document.querySelectorAll('.mostra-testo-popup').forEach(el => el.classList.remove('mostra-testo-popup'));
                    document.querySelectorAll('.step-ricetta.evidenziato').forEach(el => el.classList.remove('evidenziato'));
                    document.querySelectorAll('.nodo-visivo.nodo-attivo').forEach(el => el.classList.remove('nodo-attivo'));
                    
                    if (!eraAperto) {
                        testoStep.classList.add('mostra-testo-popup');
                        testo.classList.add('evidenziato');
                        nodo.classList.add('nodo-attivo');
                        if (evento.currentTarget === nodo) nodo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        else testo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 250); 
            
        } else if (tocchi === 2) {
            clearTimeout(timerTocco); 
            tocchi = 0; 
            if (testo.classList.contains('nascosto-step') || (testo.classList.contains('blocco-condizionato') && !testo.classList.contains('mostra-step'))) return; 
            
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
    }

    testo.addEventListener('click', gestisciInterazione);
    nodo.addEventListener('click', gestisciInterazione);
}

function cambiaVista() {
    const body = document.body;
    const btn = document.getElementById('pulsante-toggle-vista');
    body.classList.toggle('modalita-algoritmo');

    if (body.classList.contains('modalita-algoritmo')) {
        btn.textContent = 'Mostra cruscotto testuale';
    } else {
        btn.textContent = 'Mostra diagramma';
        document.querySelectorAll('.mostra-testo-popup').forEach(el => el.classList.remove('mostra-testo-popup'));
    }
}