from pathlib import Path
import re

path = Path('index.html')
html = path.read_text(encoding='utf-8')
original = html

# 1) Mantiene la grafica originale e rimuove il riferimento geografico che non deve comparire.
html = html.replace(
    '<div class="date">Monte Cucco · Umbria<br>29 ottobre — 1 novembre 2026</div>',
    '<div class="date">29 ottobre — 1 novembre 2026</div>'
)

# 2) Macroaree operative aggiornate: concise nella landing, dettagliate nel form/modale.
activity_grid = '''<div class="activity-grid">
<button class="activity openNeed"><span>⌂</span><b>Allestimento e smontaggio</b></button>
<button class="activity openNeed"><span>i</span><b>Accoglienza · segreteria · info</b></button>
<button class="activity openNeed"><span>↔</span><b>Logistica · materiali · trasporti</b></button>
<button class="activity openNeed"><span>▤</span><b>Sale · conferenze · mostre · stand</b></button>
<button class="activity openNeed"><span>⛏</span><b>Speleo · escursioni · palestre</b></button>
<button class="activity openNeed"><span>☕</span><b>SpeleoBar · ristoro · riordino</b></button>
<button class="activity openNeed"><span>◉</span><b>Foto · video · social · comunicazione</b></button>
<button class="activity openNeed"><span>⌘</span><b>Sito · grafica · redazione · informatica</b></button>
<button class="activity openNeed"><span>⚙</span><b>Tecnica · manutenzione · sicurezza</b></button>
<button class="activity openNeed"><span>+</span><b>Jolly · dove serve</b></button>
</div>'''
html, n = re.subn(
    r'<div class="activity-grid">.*?</div>(?=</div></section>)',
    activity_grid,
    html,
    count=1,
    flags=re.S
)
if n != 1:
    raise RuntimeError('Activity grid non trovato o ambiguo')

# 3) Testo form: resta breve, progressivo e non ansiogeno.
html = html.replace(
    '<p>Compila il modulo ufficiale e lascia la tua disponibilità.</p>',
    '<p>Ci vogliono circa 2 minuti. Scegli solo le aree che ti interessano: i dettagli si aprono passo passo e puoi tornare indietro per correggere.</p>'
)

# 4) Modale informativo propositivo: niente “da definire”, ma mansioni già ragionate.
script = '''<script>
const needs=[
 {title:"Allestimento e smontaggio",what:"Gazebo, tavoli, sedie, pannelli, segnaletica, carico/scarico e ripristino finale.",experience:"Non necessaria per le mansioni semplici; competenze tecniche valorizzate.",when:"Prima, durante e dopo il raduno.",note:"Ideale anche per chi può arrivare prima o fermarsi dopo."},
 {title:"Accoglienza · segreteria · info",what:"Check-in, informazioni, orientamento, borse/gadget, supporto iscrizioni e assistenza al pubblico.",experience:"Non necessaria; utili lingue straniere e capacità relazionali.",when:"Soprattutto durante il raduno.",note:"Possibili turni brevi e affiancamento iniziale."},
 {title:"Logistica · materiali · trasporti",what:"Magazzino, rifornimenti, movimentazione, piccoli trasporti, ospiti e collegamenti tra aree.",experience:"Utile patente e disponibilità di auto/furgone; non obbligatoria per tutte le mansioni.",when:"Prima, durante e dopo.",note:"Le mansioni con guida vengono assegnate solo a persone idonee."},
 {title:"Sale · conferenze · mostre · stand",what:"Preparazione sale, microfoni/proiettori, assistenza relatori, cambi attività, mostre, espositori e stand.",experience:"Non necessaria; gradita familiarità audio/video o eventi.",when:"Durante il programma e nelle fasi di montaggio/smontaggio.",note:"Attività organizzate per area e fascia oraria."},
 {title:"Speleo · escursioni · palestre",what:"Punti di ritrovo, verifica partenze/rientri, materiali, supporto alle guide e presidio delle aree tecniche.",experience:"Le attività tecniche, di armo o accompagnamento richiedono esperienza/qualifiche adeguate.",when:"Durante il raduno e nella preparazione tecnica.",note:"Il form raccoglie esperienza speleologica e abilitazioni separatamente."},
 {title:"SpeleoBar · ristoro · riordino",what:"Rifornimento, distribuzione, supporto area ristoro, riordino continuo e ripristino degli spazi.",experience:"Non necessaria per il supporto generale; eventuali mansioni specifiche saranno assegnate dai responsabili.",when:"Durante e a fine giornata.",note:"Turni compatibili con altre attività."},
 {title:"Foto · video · social · comunicazione",what:"Reportage, riprese, archivio, aggiornamenti, avvisi, contenuti social e documentazione del raduno.",experience:"Da base a professionale: indica cosa sai fare e con quali strumenti.",when:"Prima e durante; parte del lavoro può proseguire dopo.",note:"Il form apre i dettagli solo se scegli quest’area."},
 {title:"Sito · grafica · redazione · informatica",what:"Aggiornamento contenuti, indicizzazione, testi, schede, cartelli, grafica, stampa e supporto digitale.",experience:"Utili competenze web, grafica, scrittura, impaginazione o assistenza informatica.",when:"Già prima del raduno, poi durante per gli aggiornamenti rapidi.",note:"Area pensata anche per alleggerire direttamente il lavoro organizzativo."},
 {title:"Tecnica · manutenzione · sicurezza",what:"Piccoli interventi elettrici/idraulici, manutenzione, supporto attrezzature, primo soccorso e sicurezza secondo competenze.",experience:"Le mansioni specialistiche richiedono competenze o abilitazioni dichiarate.",when:"Prima e durante, con reperibilità secondo necessità.",note:"Nessuna attività specialistica viene assegnata senza idoneità."},
 {title:"Jolly · dove serve",what:"Disponibilità trasversale per coprire picchi, sostituzioni e necessità impreviste.",experience:"Nessuna esperienza specifica richiesta.",when:"In qualunque fase indicata nella disponibilità.",note:"Perfetto se vuoi aiutare senza scegliere un ruolo preciso."}
];
const grid=document.getElementById('needGrid');
grid.innerHTML=needs.map(x=>`<article class="need"><h4>${x.title}</h4><dl><div><dt>Cosa si fa</dt><dd>${x.what}</dd></div><div><dt>Esperienza</dt><dd>${x.experience}</dd></div><div><dt>Quando</dt><dd>${x.when}</dd></div><div><dt>Nota</dt><dd>${x.note}</dd></div></dl></article>`).join('');
const modal=document.getElementById('needsModal');
function openModal(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
document.getElementById('openNeeds').addEventListener('click',openModal);document.querySelectorAll('.openNeed').forEach(x=>x.addEventListener('click',openModal));document.getElementById('closeNeeds').addEventListener('click',closeModal);document.getElementById('modalForm').addEventListener('click',closeModal);modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
</script>'''
html, n = re.subn(r'<script>.*?</script>', script, html, count=1, flags=re.S)
if n != 1:
    raise RuntimeError('Script principale non trovato o ambiguo')

# Firma di versione non visibile: utile per verificare che sia pubblicata la landing corretta.
marker = '<!-- landing-costacciaro-v2026-09-17-ruoli -->'
if marker not in html:
    html = html.replace('</head>', marker + '\n</head>')

if html == original:
    print('Nessuna modifica necessaria')
else:
    path.write_text(html, encoding='utf-8')
    print('Landing aggiornata preservando grafica e poster originali')
