/**
 * room-overview-card — compact Lovelace card giving an overview of every room:
 * openings and leaks, presence, lights and plugs, one tile per room.
 * Tap a room to unfold its details (room-sensors-card, room-lights-card and
 * room-switch-card). Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RO_I18N = {
  en: {
    title: "Home",
    presence: "Presence",
    no_rooms: "No room with sensors, lights or plugs",
    lights_on: "Lights on",
    plugs_on: "Plugs on",
    turn_lights_off: "Turn all lights off",
    turn_plugs_off: "Turn all plugs off",
    confirm_plugs_one: "Turn this plug off?",
    confirm_plugs_many: "Turn these {n} plugs off?",
    turn_off: "Turn off",
    cancel: "Cancel",
    rooms_occupied: "Occupied rooms",
    sensors: "Sensors",
    lights: "Lights",
    plugs: "Plugs",
    ed_title_helper: "Leave empty for “Home”",
    ed_columns_helper: "Empty: 3, or 2 on narrow screens",
    ed_presence: "Include presence sensors",
    ed_presence_helper: "Presence and motion sensors",
    ed_zoom: "Detail button",
    ed_zoom_helper: "Only the rooms with something open, on or detected show; the button shows every room. Off: every room, always",
    ed_all_off_button: "“Turn all lights off” button",
    ed_all_off_button_helper: "Tapping the lights chip of the header turns every light the card counts off",
    ed_plugs_off_button: "“Turn all plugs off” button",
    ed_plugs_off_button_helper:
      "Tapping the plugs chip of the header lists every plug the card counts that is on and turns them off once confirmed; also on the Plugs card of the room details. Off by default: a plug may feed a camera or a network switch",
    ed_sort_state: "Rooms needing attention first",
    ed_exclude: "Entities to exclude",
    ed_exclude_helper: "Left out of the tiles, the totals and the room details",
  },
  fr: {
    title: "Maison",
    presence: "Présence",
    no_rooms: "Aucune pièce avec des capteurs, lumières ou prises",
    lights_on: "Lumières allumées",
    plugs_on: "Prises allumées",
    turn_lights_off: "Éteindre toutes les lumières",
    turn_plugs_off: "Éteindre toutes les prises",
    confirm_plugs_one: "Éteindre cette prise ?",
    confirm_plugs_many: "Éteindre ces {n} prises ?",
    turn_off: "Éteindre",
    cancel: "Annuler",
    rooms_occupied: "Pièces occupées",
    sensors: "Capteurs",
    lights: "Lumières",
    plugs: "Prises",
    ed_title_helper: "Laisser vide pour « Maison »",
    ed_columns_helper: "Vide : 3, ou 2 sur les écrans étroits",
    ed_presence: "Inclure les capteurs de présence",
    ed_presence_helper: "Capteurs de présence et de mouvement",
    ed_zoom: "Bouton détail",
    ed_zoom_helper: "Seules les pièces avec quelque chose d'ouvert, d'allumé ou de détecté s'affichent ; le bouton affiche toutes les pièces. Désactivé : toujours toutes les pièces",
    ed_all_off_button: "Bouton « Éteindre toutes les lumières »",
    ed_all_off_button_helper: "Un tap sur la pastille des lumières de l'en-tête éteint toutes les lumières comptées par la carte",
    ed_plugs_off_button: "Bouton « Éteindre toutes les prises »",
    ed_plugs_off_button_helper:
      "Un tap sur la pastille des prises de l'en-tête liste les prises allumées comptées par la carte et les éteint après confirmation ; aussi sur la carte Prises du détail des pièces. Désactivé par défaut : une prise peut alimenter une caméra ou un switch réseau",
    ed_sort_state: "Pièces à surveiller en premier",
    ed_exclude: "Entités à exclure",
    ed_exclude_helper: "Ignorées dans les tuiles, les totaux et le détail des pièces",
  },
  de: {
    title: "Zuhause",
    presence: "Anwesenheit",
    no_rooms: "Kein Raum mit Sensoren, Lichtern oder Steckdosen",
    lights_on: "Lichter an",
    plugs_on: "Steckdosen an",
    turn_lights_off: "Alle Lichter ausschalten",
    turn_plugs_off: "Alle Steckdosen ausschalten",
    confirm_plugs_one: "Diese Steckdose ausschalten?",
    confirm_plugs_many: "Diese {n} Steckdosen ausschalten?",
    turn_off: "Ausschalten",
    cancel: "Abbrechen",
    rooms_occupied: "Belegte Räume",
    sensors: "Sensoren",
    lights: "Lichter",
    plugs: "Steckdosen",
    ed_title_helper: "Leer lassen für „Zuhause“",
    ed_columns_helper: "Leer: 3, oder 2 auf schmalen Bildschirmen",
    ed_presence: "Anwesenheitssensoren einbeziehen",
    ed_presence_helper: "Anwesenheits- und Bewegungsmelder",
    ed_zoom: "Detail-Schaltfläche",
    ed_zoom_helper: "Nur Räume, in denen etwas offen, an oder erkannt ist, werden angezeigt; die Schaltfläche zeigt alle Räume. Aus: immer alle Räume",
    ed_all_off_button: "Schaltfläche „Alle Lichter ausschalten“",
    ed_all_off_button_helper: "Tippen auf den Lichter-Chip der Kopfzeile schaltet alle von der Karte gezählten Lichter aus",
    ed_plugs_off_button: "Schaltfläche „Alle Steckdosen ausschalten“",
    ed_plugs_off_button_helper: "Tippen auf den Steckdosen-Chip der Kopfzeile listet alle eingeschalteten, von der Karte gezählten Steckdosen auf und schaltet sie nach Bestätigung aus; auch auf der Steckdosen-Karte der Raumdetails. Standardmäßig aus: eine Steckdose kann eine Kamera oder einen Netzwerk-Switch versorgen",
    ed_sort_state: "Räume, die Aufmerksamkeit brauchen, zuerst",
    ed_exclude: "Auszuschließende Entitäten",
    ed_exclude_helper: "Bei den Kacheln, den Summen und den Raumdetails nicht berücksichtigt",
  },
  es: {
    title: "Casa",
    presence: "Presencia",
    no_rooms: "Ninguna habitación con sensores, luces o enchufes",
    lights_on: "Luces encendidas",
    plugs_on: "Enchufes encendidos",
    turn_lights_off: "Apagar todas las luces",
    turn_plugs_off: "Apagar todos los enchufes",
    confirm_plugs_one: "¿Apagar este enchufe?",
    confirm_plugs_many: "¿Apagar estos {n} enchufes?",
    turn_off: "Apagar",
    cancel: "Cancelar",
    rooms_occupied: "Habitaciones ocupadas",
    sensors: "Sensores",
    lights: "Luces",
    plugs: "Enchufes",
    ed_title_helper: "Déjalo vacío para «Casa»",
    ed_columns_helper: "Vacío: 3, o 2 en pantallas estrechas",
    ed_presence: "Incluir los sensores de presencia",
    ed_presence_helper: "Sensores de presencia y movimiento",
    ed_zoom: "Botón de detalle",
    ed_zoom_helper: "Solo se muestran las habitaciones con algo abierto, encendido o detectado; el botón muestra todas las habitaciones. Desactivado: siempre todas las habitaciones",
    ed_all_off_button: "Botón «Apagar todas las luces»",
    ed_all_off_button_helper: "Al tocar el chip de luces de la cabecera se apagan todas las luces que cuenta la tarjeta",
    ed_plugs_off_button: "Botón «Apagar todos los enchufes»",
    ed_plugs_off_button_helper: "Al tocar el chip de enchufes de la cabecera se listan los enchufes encendidos que cuenta la tarjeta y se apagan tras confirmar; también en la tarjeta Enchufes del detalle de las habitaciones. Desactivado por defecto: un enchufe puede alimentar una cámara o un conmutador de red",
    ed_sort_state: "Primero las habitaciones que requieren atención",
    ed_exclude: "Entidades a excluir",
    ed_exclude_helper: "Se ignoran en los mosaicos, los totales y el detalle de las habitaciones",
  },
  sr: {
    title: "Кућа",
    presence: "Присутност",
    no_rooms: "Нема просторија са сензорима, светлима или утичницама",
    lights_on: "Светла укључена",
    plugs_on: "Утичнице укључене",
    turn_lights_off: "Искључи сва светла",
    turn_plugs_off: "Искључи све утичнице",
    confirm_plugs_one: "Искључити ову утичницу?",
    confirm_plugs_few: "Искључити ове {n} утичнице?",
    confirm_plugs_many: "Искључити ових {n} утичница?",
    turn_off: "Искључи",
    cancel: "Откажи",
    rooms_occupied: "Заузете просторије",
    sensors: "Сензори",
    lights: "Светла",
    plugs: "Утичнице",
    ed_title_helper: "Остави празно за „Кућа“",
    ed_columns_helper: "Празно: 3, или 2 на уским екранима",
    ed_presence: "Укључи сензоре присутности",
    ed_presence_helper: "Сензори присутности и покрета",
    ed_zoom: "Дугме за детаље",
    ed_zoom_helper: "Приказују се само просторије у којима је нешто отворено, укључено или детектовано; дугме приказује све просторије. Искључено: све просторије, увек",
    ed_all_off_button: "Дугме „Искључи сва светла“",
    ed_all_off_button_helper: "Додир на чип за светла у заглављу искључује сва светла која картица броји",
    ed_plugs_off_button: "Дугме „Искључи све утичнице“",
    ed_plugs_off_button_helper: "Додир на чип за утичнице у заглављу приказује листу свих укључених утичница које картица броји и искључује их након потврде; такође доступно на картици утичница у детаљима просторије. Подразумевано искључено: утичница може напајати камеру или мрежни свич",
    ed_sort_state: "Прво просторије које захтевају пажњу",
    ed_exclude: "Изостави ентитете",
    ed_exclude_helper: "Изостављено из плочица, укупних вредности и детаља просторије",
  },
  "sr-Latn": {
    title: "Kuća",
    presence: "Prisutnost",
    no_rooms: "Nema prostorija sa senzorima, svetlima ili utičnicama",
    lights_on: "Svetla uključena",
    plugs_on: "Utičnice uključene",
    turn_lights_off: "Isključi sva svetla",
    turn_plugs_off: "Isključi sve utičnice",
    confirm_plugs_one: "Isključiti ovu utičnicu?",
    confirm_plugs_few: "Isključiti ove {n} utičnice?",
    confirm_plugs_many: "Isključiti ovih {n} utičnica?",
    turn_off: "Isključi",
    cancel: "Otkaži",
    rooms_occupied: "Zauzete prostorije",
    sensors: "Senzori",
    lights: "Svetla",
    plugs: "Utičnice",
    ed_title_helper: "Ostavi prazno za „Kuća“",
    ed_columns_helper: "Prazno: 3, ili 2 na uskim ekranima",
    ed_presence: "Uključi senzore prisutnosti",
    ed_presence_helper: "Senzori prisutnosti i pokreta",
    ed_zoom: "Dugme za detalje",
    ed_zoom_helper: "Prikazuju se samo prostorije u kojima je nešto otvoreno, uključeno ili detektovano; dugme prikazuje sve prostorije. Isključeno: sve prostorije, uvek",
    ed_all_off_button: "Dugme „Isključi sva svetla“",
    ed_all_off_button_helper: "Dodir na čip za svetla u zaglavlju isključuje sva svetla koja kartica broji",
    ed_plugs_off_button: "Dugme „Isključi sve utičnice“",
    ed_plugs_off_button_helper: "Dodir na čip za utičnice u zaglavlju prikazuje listu svih uključenih utičnica koje kartica broji i isključuje ih nakon potvrde; takođe dostupno na kartici utičnica u detaljima prostorije. Podrazumevano isključeno: utičnica može napajati kameru ili mrežni svič",
    ed_sort_state: "Prvo prostorije koje zahtevaju pažnju",
    ed_exclude: "Izostavi entitete",
    ed_exclude_helper: "Izostavljeno iz pločica, ukupnih vrednosti i detalja prostorije",
  },
  it: {
    title: "Casa",
    presence: "Presenza",
    no_rooms: "Nessuna stanza con sensori, luci o prese",
    lights_on: "Luci accese",
    plugs_on: "Prese accese",
    turn_lights_off: "Spegni tutte le luci",
    turn_plugs_off: "Spegni tutte le prese",
    confirm_plugs_one: "Spegnere questa presa?",
    confirm_plugs_many: "Spegnere queste {n} prese?",
    turn_off: "Spegni",
    cancel: "Annulla",
    rooms_occupied: "Stanze occupate",
    sensors: "Sensori",
    lights: "Luci",
    plugs: "Prese",
    ed_title_helper: "Lascia vuoto per «Casa»",
    ed_columns_helper: "Vuoto: 3, o 2 sugli schermi stretti",
    ed_presence: "Includi i sensori di presenza",
    ed_presence_helper: "Sensori di presenza e di movimento",
    ed_zoom: "Pulsante dettagli",
    ed_zoom_helper: "Vengono mostrate solo le stanze con qualcosa di aperto, acceso o rilevato; il pulsante mostra tutte le stanze. Disattivato: sempre tutte le stanze",
    ed_all_off_button: "Pulsante «Spegni tutte le luci»",
    ed_all_off_button_helper: "Toccando il chip delle luci nell'intestazione si spengono tutte le luci contate dalla scheda",
    ed_plugs_off_button: "Pulsante «Spegni tutte le prese»",
    ed_plugs_off_button_helper: "Toccando il chip delle prese nell'intestazione si elencano le prese accese contate dalla scheda, che vengono spente dopo la conferma; anche nella scheda Prese dei dettagli della stanza. Disattivato per impostazione predefinita: una presa può alimentare una telecamera o uno switch di rete",
    ed_sort_state: "Prima le stanze che richiedono attenzione",
    ed_exclude: "Entità da escludere",
    ed_exclude_helper: "Ignorate nei riquadri, nei totali e nei dettagli delle stanze",
  },
  nl: {
    title: "Thuis",
    presence: "Aanwezigheid",
    no_rooms: "Geen ruimte met sensoren, lampen of stekkers",
    lights_on: "Lampen aan",
    plugs_on: "Stekkers aan",
    turn_lights_off: "Alle lampen uitschakelen",
    turn_plugs_off: "Alle stekkers uitschakelen",
    confirm_plugs_one: "Deze stekker uitschakelen?",
    confirm_plugs_many: "Deze {n} stekkers uitschakelen?",
    turn_off: "Uitschakelen",
    cancel: "Annuleren",
    rooms_occupied: "Bezette ruimtes",
    sensors: "Sensoren",
    lights: "Lampen",
    plugs: "Stekkers",
    ed_title_helper: "Leeg laten voor “Thuis”",
    ed_columns_helper: "Leeg: 3, of 2 op smalle schermen",
    ed_presence: "Aanwezigheidssensoren meenemen",
    ed_presence_helper: "Aanwezigheids- en bewegingssensoren",
    ed_zoom: "Detailknop",
    ed_zoom_helper: "Alleen ruimtes waar iets open, aan of gedetecteerd is worden getoond; de knop toont alle ruimtes. Uit: altijd alle ruimtes",
    ed_all_off_button: "Knop “Alle lampen uitschakelen”",
    ed_all_off_button_helper: "Een tik op de lampenchip in de koptekst schakelt alle lampen uit die de kaart telt",
    ed_plugs_off_button: "Knop “Alle stekkers uitschakelen”",
    ed_plugs_off_button_helper: "Een tik op de stekkerchip in de koptekst toont alle ingeschakelde stekkers die de kaart telt en schakelt ze na bevestiging uit; ook op de kaart Stekkers in de ruimtedetails. Standaard uit: een stekker kan een camera of een netwerkswitch voeden",
    ed_sort_state: "Ruimtes die aandacht nodig hebben eerst",
    ed_exclude: "Uit te sluiten entiteiten",
    ed_exclude_helper: "Niet meegeteld in de tegels, de totalen en de ruimtedetails",
  },
  pt: {
    title: "Casa",
    presence: "Presença",
    no_rooms: "Nenhuma divisão com sensores, luzes ou tomadas",
    lights_on: "Luzes acesas",
    plugs_on: "Tomadas ligadas",
    turn_lights_off: "Apagar todas as luzes",
    turn_plugs_off: "Desligar todas as tomadas",
    confirm_plugs_one: "Desligar esta tomada?",
    confirm_plugs_many: "Desligar estas {n} tomadas?",
    turn_off: "Desligar",
    cancel: "Cancelar",
    rooms_occupied: "Divisões ocupadas",
    sensors: "Sensores",
    lights: "Luzes",
    plugs: "Tomadas",
    ed_title_helper: "Deixe vazio para «Casa»",
    ed_columns_helper: "Vazio: 3, ou 2 em ecrãs estreitos",
    ed_presence: "Incluir os sensores de presença",
    ed_presence_helper: "Sensores de presença e de movimento",
    ed_zoom: "Botão de detalhe",
    ed_zoom_helper: "Só são mostradas as divisões com algo aberto, ligado ou detetado; o botão mostra todas as divisões. Desativado: sempre todas as divisões",
    ed_all_off_button: "Botão «Apagar todas as luzes»",
    ed_all_off_button_helper: "Tocar no chip das luzes do cabeçalho apaga todas as luzes contadas pelo cartão",
    ed_plugs_off_button: "Botão «Desligar todas as tomadas»",
    ed_plugs_off_button_helper: "Tocar no chip das tomadas do cabeçalho lista as tomadas ligadas contadas pelo cartão e desliga-as após confirmação; também no cartão Tomadas do detalhe das divisões. Desativado por predefinição: uma tomada pode alimentar uma câmara ou um switch de rede",
    ed_sort_state: "Primeiro as divisões que precisam de atenção",
    ed_exclude: "Entidades a excluir",
    ed_exclude_helper: "Ignoradas nos mosaicos, nos totais e no detalhe das divisões",
  },
  pl: {
    title: "Dom",
    presence: "Obecność",
    no_rooms: "Brak pomieszczeń z czujnikami, światłami lub gniazdkami",
    lights_on: "Włączone światła",
    plugs_on: "Włączone gniazdka",
    turn_lights_off: "Wyłącz wszystkie światła",
    turn_plugs_off: "Wyłącz wszystkie gniazdka",
    confirm_plugs_one: "Wyłączyć to gniazdko?",
    confirm_plugs_many: "Wyłączyć te gniazdka ({n})?",
    turn_off: "Wyłącz",
    cancel: "Anuluj",
    rooms_occupied: "Zajęte pomieszczenia",
    sensors: "Czujniki",
    lights: "Światła",
    plugs: "Gniazdka",
    ed_title_helper: "Pozostaw puste, aby użyć nazwy „Dom”",
    ed_columns_helper: "Puste: 3 lub 2 na wąskich ekranach",
    ed_presence: "Uwzględnij czujniki obecności",
    ed_presence_helper: "Czujniki obecności i ruchu",
    ed_zoom: "Przycisk szczegółów",
    ed_zoom_helper: "Wyświetlane są tylko pomieszczenia, w których coś jest otwarte, włączone lub wykryte; przycisk pokazuje wszystkie pomieszczenia. Wyłączone: zawsze wszystkie pomieszczenia",
    ed_all_off_button: "Przycisk „Wyłącz wszystkie światła”",
    ed_all_off_button_helper: "Dotknięcie chipa świateł w nagłówku wyłącza wszystkie światła liczone przez kartę",
    ed_plugs_off_button: "Przycisk „Wyłącz wszystkie gniazdka”",
    ed_plugs_off_button_helper: "Dotknięcie chipa gniazdek w nagłówku wyświetla listę włączonych gniazdek liczonych przez kartę i wyłącza je po potwierdzeniu; także na karcie Gniazdka w szczegółach pomieszczenia. Domyślnie wyłączone: gniazdko może zasilać kamerę lub switch sieciowy",
    ed_sort_state: "Najpierw pomieszczenia wymagające uwagi",
    ed_exclude: "Encje do wykluczenia",
    ed_exclude_helper: "Pomijane w kafelkach, sumach i szczegółach pomieszczeń",
  },
  ro: {
    title: "Acasă",
    presence: "Prezență",
    no_rooms: "Nicio cameră cu senzori, lumini sau prize",
    lights_on: "Lumini aprinse",
    plugs_on: "Prize pornite",
    turn_lights_off: "Stinge toate luminile",
    turn_plugs_off: "Oprește toate prizele",
    confirm_plugs_one: "Oprești această priză?",
    confirm_plugs_many: "Oprești aceste prize ({n})?",
    turn_off: "Oprește",
    cancel: "Anulează",
    rooms_occupied: "Camere ocupate",
    sensors: "Senzori",
    lights: "Lumini",
    plugs: "Prize",
    ed_title_helper: "Lasă gol pentru „Acasă”",
    ed_columns_helper: "Gol: 3 sau 2 pe ecranele înguste",
    ed_presence: "Include senzorii de prezență",
    ed_presence_helper: "Senzori de prezență și de mișcare",
    ed_zoom: "Buton de detalii",
    ed_zoom_helper: "Se afișează doar camerele cu ceva deschis, aprins sau detectat; butonul afișează toate camerele. Dezactivat: mereu toate camerele",
    ed_all_off_button: "Butonul „Stinge toate luminile”",
    ed_all_off_button_helper: "Atingerea cipului de lumini din antet stinge toate luminile numărate de card",
    ed_plugs_off_button: "Butonul „Oprește toate prizele”",
    ed_plugs_off_button_helper: "Atingerea cipului de prize din antet listează toate prizele pornite numărate de card și le oprește după confirmare; și pe cardul Prize din detaliile camerei. Dezactivat implicit: o priză poate alimenta o cameră video sau un switch de rețea",
    ed_sort_state: "Întâi camerele care necesită atenție",
    ed_exclude: "Entități excluse",
    ed_exclude_helper: "Ignorate în dale, în totaluri și în detaliile camerelor",
  },
  da: {
    title: "Hjem",
    presence: "Til stede",
    no_rooms: "Ingen rum med sensorer, lys eller stikkontakter",
    lights_on: "Tændte lys",
    plugs_on: "Tændte stikkontakter",
    turn_lights_off: "Sluk alle lys",
    turn_plugs_off: "Sluk alle stikkontakter",
    confirm_plugs_one: "Sluk denne stikkontakt?",
    confirm_plugs_many: "Sluk disse {n} stikkontakter?",
    turn_off: "Sluk",
    cancel: "Annuller",
    rooms_occupied: "Optagede rum",
    sensors: "Sensorer",
    lights: "Lys",
    plugs: "Stik",
    ed_title_helper: "Lad stå tomt for »Hjem«",
    ed_columns_helper: "Tomt: 3, eller 2 på smalle skærme",
    ed_presence: "Medtag tilstedeværelsessensorer",
    ed_presence_helper: "Tilstedeværelses- og bevægelsessensorer",
    ed_zoom: "Detaljeknap",
    ed_zoom_helper: "Kun rum, hvor noget er åbent, tændt eller registreret, vises; knappen viser alle rum. Fra: altid alle rum",
    ed_all_off_button: "Knappen »Sluk alle lys«",
    ed_all_off_button_helper: "Et tryk på lys-chippen i overskriften slukker alle lys, som kortet tæller med",
    ed_plugs_off_button: "Knappen »Sluk alle stikkontakter«",
    ed_plugs_off_button_helper: "Et tryk på stikkontakt-chippen i overskriften viser alle tændte stikkontakter, som kortet tæller med, og slukker dem efter bekræftelse; også på kortet Stikkontakter i rummets detaljer. Fra som standard: en stikkontakt kan forsyne et kamera eller en netværksswitch",
    ed_sort_state: "Rum, der kræver opmærksomhed, først",
    ed_exclude: "Enheder, der udelades",
    ed_exclude_helper: "Udelades fra felterne, totalerne og rummenes detaljer",
  },
  sv: {
    title: "Hem",
    presence: "Närvaro",
    no_rooms: "Inga rum med sensorer, lampor eller uttag",
    lights_on: "Tända lampor",
    plugs_on: "Påslagna uttag",
    turn_lights_off: "Släck alla lampor",
    turn_plugs_off: "Stäng av alla uttag",
    confirm_plugs_one: "Stäng av det här uttaget?",
    confirm_plugs_many: "Stäng av dessa {n} uttag?",
    turn_off: "Stäng av",
    cancel: "Avbryt",
    rooms_occupied: "Upptagna rum",
    sensors: "Sensorer",
    lights: "Lampor",
    plugs: "Uttag",
    ed_title_helper: "Lämna tomt för ”Hem”",
    ed_columns_helper: "Tomt: 3, eller 2 på smala skärmar",
    ed_presence: "Inkludera närvarosensorer",
    ed_presence_helper: "Närvaro- och rörelsesensorer",
    ed_zoom: "Detaljknapp",
    ed_zoom_helper: "Bara rum där något är öppet, på eller upptäckt visas; knappen visar alla rum. Av: alltid alla rum",
    ed_all_off_button: "Knappen ”Släck alla lampor”",
    ed_all_off_button_helper: "Ett tryck på lampchippet i rubriken släcker alla lampor som kortet räknar",
    ed_plugs_off_button: "Knappen ”Stäng av alla uttag”",
    ed_plugs_off_button_helper: "Ett tryck på uttagschippet i rubriken listar alla påslagna uttag som kortet räknar och stänger av dem efter bekräftelse; även på kortet Uttag i rummets detaljer. Av som standard: ett uttag kan driva en kamera eller en nätverksswitch",
    ed_sort_state: "Rum som behöver ses över först",
    ed_exclude: "Entiteter att utesluta",
    ed_exclude_helper: "Utelämnas från rutorna, summorna och rummens detaljer",
  },
  bg: {
    title: "Дом",
    presence: "Присъствие",
    no_rooms: "Няма стаи със сензори, осветление или контакти",
    lights_on: "Включени лампи",
    plugs_on: "Включени контакти",
    turn_lights_off: "Изключи всички лампи",
    turn_plugs_off: "Изключи всички контакти",
    confirm_plugs_one: "Да се изключи ли този контакт?",
    confirm_plugs_many: "Да се изключат ли тези {n} контакта?",
    turn_off: "Изключи",
    cancel: "Отказ",
    rooms_occupied: "Заети стаи",
    sensors: "Сензори",
    lights: "Светлини",
    plugs: "Контакти",
    ed_title_helper: "Оставете празно за „Дом“",
    ed_columns_helper: "Празно: 3 или 2 на тесни екрани",
    ed_presence: "Включи сензорите за присъствие",
    ed_presence_helper: "Сензори за присъствие и движение",
    ed_zoom: "Бутон за подробности",
    ed_zoom_helper: "Показват се само стаите, в които нещо е отворено, включено или засечено; бутонът показва всички стаи. Изключено: винаги всички стаи",
    ed_all_off_button: "Бутон „Изключи всички лампи“",
    ed_all_off_button_helper: "Докосването на чипа за осветление в заглавната част изключва всички лампи, отчитани от картата",
    ed_plugs_off_button: "Бутон „Изключи всички контакти“",
    ed_plugs_off_button_helper: "Докосването на чипа за контакти в заглавната част показва всички включени контакти, отчитани от картата, и ги изключва след потвърждение; също и в картата Контакти в подробностите за стаята. Изключено по подразбиране: контакт може да захранва камера или мрежов комутатор",
    ed_sort_state: "Първо стаите, които изискват внимание",
    ed_exclude: "Обекти за пропускане",
    ed_exclude_helper: "Пропускат се в плочките, общите суми и подробностите за стаите",
  },
  ru: {
    title: "Дом",
    presence: "Присутствие",
    no_rooms: "Нет комнат с датчиками, светильниками или розетками",
    lights_on: "Включённый свет",
    plugs_on: "Включённые розетки",
    turn_lights_off: "Выключить весь свет",
    turn_plugs_off: "Выключить все розетки",
    confirm_plugs_one: "Выключить эту розетку?",
    confirm_plugs_many: "Выключить эти розетки ({n})?",
    turn_off: "Выключить",
    cancel: "Отмена",
    rooms_occupied: "Занятые комнаты",
    sensors: "Датчики",
    lights: "Освещение",
    plugs: "Розетки",
    ed_title_helper: "Оставьте пустым для «Дом»",
    ed_columns_helper: "Пусто: 3 или 2 на узких экранах",
    ed_presence: "Учитывать датчики присутствия",
    ed_presence_helper: "Датчики присутствия и движения",
    ed_zoom: "Кнопка подробностей",
    ed_zoom_helper: "Показываются только комнаты, где что-то открыто, включено или обнаружено; кнопка показывает все комнаты. Выключено: всегда все комнаты",
    ed_all_off_button: "Кнопка «Выключить весь свет»",
    ed_all_off_button_helper: "Нажатие на чип освещения в заголовке выключает все светильники, учитываемые карточкой",
    ed_plugs_off_button: "Кнопка «Выключить все розетки»",
    ed_plugs_off_button_helper: "Нажатие на чип розеток в заголовке показывает все включённые розетки, учитываемые карточкой, и выключает их после подтверждения; также в карточке «Розетки» в подробностях комнаты. По умолчанию выключено: розетка может питать камеру или сетевой коммутатор",
    ed_sort_state: "Сначала комнаты, требующие внимания",
    ed_exclude: "Исключить объекты",
    ed_exclude_helper: "Не учитываются в плитках, итогах и подробностях комнат",
  },
  uk: {
    title: "Дім",
    presence: "Присутність",
    no_rooms: "Немає кімнат із датчиками, світильниками чи розетками",
    lights_on: "Увімкнене світло",
    plugs_on: "Увімкнені розетки",
    turn_lights_off: "Вимкнути все світло",
    turn_plugs_off: "Вимкнути всі розетки",
    confirm_plugs_one: "Вимкнути цю розетку?",
    confirm_plugs_many: "Вимкнути ці розетки ({n})?",
    turn_off: "Вимкнути",
    cancel: "Скасувати",
    rooms_occupied: "Зайняті кімнати",
    sensors: "Датчики",
    lights: "Освітлення",
    plugs: "Розетки",
    ed_title_helper: "Залиште порожнім для «Дім»",
    ed_columns_helper: "Порожньо: 3 або 2 на вузьких екранах",
    ed_presence: "Враховувати датчики присутності",
    ed_presence_helper: "Датчики присутності та руху",
    ed_zoom: "Кнопка подробиць",
    ed_zoom_helper: "Показуються лише кімнати, де щось відчинено, увімкнено чи виявлено; кнопка показує всі кімнати. Вимкнено: завжди всі кімнати",
    ed_all_off_button: "Кнопка «Вимкнути все світло»",
    ed_all_off_button_helper: "Натискання на чип освітлення в заголовку вимикає всі світильники, які враховує картка",
    ed_plugs_off_button: "Кнопка «Вимкнути всі розетки»",
    ed_plugs_off_button_helper: "Натискання на чип розеток у заголовку показує всі ввімкнені розетки, які враховує картка, і вимикає їх після підтвердження; також у картці «Розетки» в подробицях кімнати. Типово вимкнено: розетка може живити камеру чи мережевий комутатор",
    ed_sort_state: "Спершу кімнати, що потребують уваги",
    ed_exclude: "Виключити сутності",
    ed_exclude_helper: "Не враховуються в плитках, підсумках і подробицях кімнат",
  },
  hu: {
    title: "Otthon",
    presence: "Jelenlét",
    no_rooms: "Nincs helyiség érzékelőkkel, lámpákkal vagy konnektorokkal",
    lights_on: "Bekapcsolt lámpák",
    plugs_on: "Bekapcsolt konnektorok",
    turn_lights_off: "Minden lámpa kikapcsolása",
    turn_plugs_off: "Minden konnektor kikapcsolása",
    confirm_plugs_one: "Kikapcsolod ezt a konnektort?",
    confirm_plugs_many: "Kikapcsolod ezeket a konnektorokat ({n})?",
    turn_off: "Kikapcsolás",
    cancel: "Mégse",
    rooms_occupied: "Foglalt helyiségek",
    sensors: "Érzékelők",
    lights: "Világítás",
    plugs: "Aljzatok",
    ed_title_helper: "Hagyd üresen az „Otthon” címhez",
    ed_columns_helper: "Üres: 3, keskeny képernyőn 2",
    ed_presence: "Jelenlét-érzékelők bevonása",
    ed_presence_helper: "Jelenlét- és mozgásérzékelők",
    ed_zoom: "Részletek gomb",
    ed_zoom_helper: "Csak azok a helyiségek jelennek meg, ahol valami nyitva vagy bekapcsolva van, illetve észlelés történt; a gomb minden helyiséget megjelenít. Kikapcsolva: mindig minden helyiség",
    ed_all_off_button: "„Minden lámpa kikapcsolása” gomb",
    ed_all_off_button_helper: "A fejléc lámpa chipjére koppintva a kártya által számolt összes lámpa kikapcsol",
    ed_plugs_off_button: "„Minden konnektor kikapcsolása” gomb",
    ed_plugs_off_button_helper: "A fejléc konnektor chipjére koppintva megjelenik a kártya által számolt összes bekapcsolt konnektor, és megerősítés után kikapcsolnak; a helyiség részleteiben a Konnektorok kártyán is. Alapértelmezetten ki: egy konnektor kamerát vagy hálózati switchet is táplálhat",
    ed_sort_state: "Elöl a figyelmet igénylő helyiségek",
    ed_exclude: "Kihagyott entitások",
    ed_exclude_helper: "Kimaradnak a csempékből, az összesítésekből és a helyiségek részleteiből",
  },
  sk: {
    title: "Domov",
    presence: "Prítomnosť",
    no_rooms: "Žiadna miestnosť so senzormi, svetlami alebo zásuvkami",
    lights_on: "Zapnuté svetlá",
    plugs_on: "Zapnuté zásuvky",
    turn_lights_off: "Vypnúť všetky svetlá",
    turn_plugs_off: "Vypnúť všetky zásuvky",
    confirm_plugs_one: "Vypnúť túto zásuvku?",
    confirm_plugs_many: "Vypnúť tieto zásuvky ({n})?",
    turn_off: "Vypnúť",
    cancel: "Zrušiť",
    rooms_occupied: "Obsadené miestnosti",
    sensors: "Senzory",
    lights: "Svetlá",
    plugs: "Zásuvky",
    ed_title_helper: "Nechajte prázdne pre „Domov“",
    ed_columns_helper: "Prázdne: 3, alebo 2 na úzkych obrazovkách",
    ed_presence: "Zahrnúť senzory prítomnosti",
    ed_presence_helper: "Senzory prítomnosti a pohybu",
    ed_zoom: "Tlačidlo podrobností",
    ed_zoom_helper: "Zobrazia sa len miestnosti, kde je niečo otvorené, zapnuté alebo zistené; tlačidlo zobrazí všetky miestnosti. Vypnuté: vždy všetky miestnosti",
    ed_all_off_button: "Tlačidlo „Vypnúť všetky svetlá“",
    ed_all_off_button_helper: "Ťuknutie na čip svetiel v hlavičke vypne všetky svetlá, ktoré karta započítava",
    ed_plugs_off_button: "Tlačidlo „Vypnúť všetky zásuvky“",
    ed_plugs_off_button_helper: "Ťuknutie na čip zásuviek v hlavičke zobrazí všetky zapnuté zásuvky, ktoré karta započítava, a po potvrdení ich vypne; aj na karte Zásuvky v podrobnostiach miestnosti. Predvolene vypnuté: zásuvka môže napájať kameru alebo sieťový switch",
    ed_sort_state: "Najprv miestnosti vyžadujúce pozornosť",
    ed_exclude: "Vynechané entity",
    ed_exclude_helper: "Vynechané z dlaždíc, súčtov a podrobností miestností",
  },
  cs: {
    title: "Domov",
    presence: "Přítomnost",
    no_rooms: "Žádná místnost se senzory, světly nebo zásuvkami",
    lights_on: "Zapnutá světla",
    plugs_on: "Zapnuté zásuvky",
    turn_lights_off: "Vypnout všechna světla",
    turn_plugs_off: "Vypnout všechny zásuvky",
    confirm_plugs_one: "Vypnout tuto zásuvku?",
    confirm_plugs_many: "Vypnout tyto zásuvky ({n})?",
    turn_off: "Vypnout",
    cancel: "Zrušit",
    rooms_occupied: "Obsazené místnosti",
    sensors: "Senzory",
    lights: "Světla",
    plugs: "Zásuvky",
    ed_title_helper: "Ponechte prázdné pro „Domov“",
    ed_columns_helper: "Prázdné: 3, nebo 2 na úzkých obrazovkách",
    ed_presence: "Zahrnout senzory přítomnosti",
    ed_presence_helper: "Senzory přítomnosti a pohybu",
    ed_zoom: "Tlačítko podrobností",
    ed_zoom_helper: "Zobrazí se jen místnosti, kde je něco otevřené, zapnuté nebo zjištěné; tlačítko zobrazí všechny místnosti. Vypnuto: vždy všechny místnosti",
    ed_all_off_button: "Tlačítko „Vypnout všechna světla“",
    ed_all_off_button_helper: "Klepnutí na čip světel v záhlaví vypne všechna světla, která karta započítává",
    ed_plugs_off_button: "Tlačítko „Vypnout všechny zásuvky“",
    ed_plugs_off_button_helper: "Klepnutí na čip zásuvek v záhlaví zobrazí všechny zapnuté zásuvky, které karta započítává, a po potvrzení je vypne; také na kartě Zásuvky v podrobnostech místnosti. Ve výchozím stavu vypnuto: zásuvka může napájet kameru nebo síťový switch",
    ed_sort_state: "Nejprve místnosti vyžadující pozornost",
    ed_exclude: "Vynechané entity",
    ed_exclude_helper: "Vynechané z dlaždic, součtů a podrobností místností",
  },
  sl: {
    title: "Dom",
    presence: "Prisotnost",
    no_rooms: "Ni prostorov s senzorji, lučmi ali vtičnicami",
    lights_on: "Prižgane luči",
    plugs_on: "Vklopljene vtičnice",
    turn_lights_off: "Ugasni vse luči",
    turn_plugs_off: "Izklopi vse vtičnice",
    confirm_plugs_one: "Izklopim to vtičnico?",
    confirm_plugs_many: "Izklopim te vtičnice ({n})?",
    turn_off: "Izklopi",
    cancel: "Prekliči",
    rooms_occupied: "Zasedeni prostori",
    sensors: "Senzorji",
    lights: "Luči",
    plugs: "Vtičnice",
    ed_title_helper: "Pustite prazno za »Dom«",
    ed_columns_helper: "Prazno: 3 ali 2 na ozkih zaslonih",
    ed_presence: "Vključi senzorje prisotnosti",
    ed_presence_helper: "Senzorji prisotnosti in gibanja",
    ed_zoom: "Gumb za podrobnosti",
    ed_zoom_helper: "Prikazani so samo prostori, kjer je kaj odprto, vklopljeno ali zaznano; gumb prikaže vse prostore. Izklopljeno: vedno vsi prostori",
    ed_all_off_button: "Gumb »Ugasni vse luči«",
    ed_all_off_button_helper: "Dotik čipa luči v glavi ugasne vse luči, ki jih šteje kartica",
    ed_plugs_off_button: "Gumb »Izklopi vse vtičnice«",
    ed_plugs_off_button_helper: "Dotik čipa vtičnic v glavi prikaže vse vklopljene vtičnice, ki jih šteje kartica, in jih po potrditvi izklopi; tudi na kartici Vtičnice v podrobnostih prostora. Privzeto izklopljeno: vtičnica lahko napaja kamero ali omrežno stikalo",
    ed_sort_state: "Najprej prostori, ki potrebujejo pozornost",
    ed_exclude: "Izpuščene entitete",
    ed_exclude_helper: "Izpuščene iz ploščic, seštevkov in podrobnosti prostorov",
  },
  lv: {
    title: "Mājas",
    presence: "Klātbūtne",
    no_rooms: "Nav telpu ar sensoriem, gaismekļiem vai kontaktligzdām",
    lights_on: "Ieslēgtie gaismekļi",
    plugs_on: "Ieslēgtās kontaktligzdas",
    turn_lights_off: "Izslēgt visus gaismekļus",
    turn_plugs_off: "Izslēgt visas kontaktligzdas",
    confirm_plugs_one: "Izslēgt šo kontaktligzdu?",
    confirm_plugs_many: "Izslēgt šīs kontaktligzdas ({n})?",
    turn_off: "Izslēgt",
    cancel: "Atcelt",
    rooms_occupied: "Aizņemtās telpas",
    sensors: "Sensori",
    lights: "Gaismas",
    plugs: "Ligzdas",
    ed_title_helper: "Atstājiet tukšu, lai izmantotu “Mājas”",
    ed_columns_helper: "Tukšs: 3 vai 2 šauros ekrānos",
    ed_presence: "Iekļaut klātbūtnes sensorus",
    ed_presence_helper: "Klātbūtnes un kustības sensori",
    ed_zoom: "Detaļu poga",
    ed_zoom_helper: "Tiek rādītas tikai telpas, kurās kaut kas ir atvērts, ieslēgts vai konstatēts; poga parāda visas telpas. Izslēgts: vienmēr visas telpas",
    ed_all_off_button: "Poga “Izslēgt visus gaismekļus”",
    ed_all_off_button_helper: "Pieskaroties galvenes apgaismojuma žetonam, tiek izslēgti visi kartes uzskaitītie gaismekļi",
    ed_plugs_off_button: "Poga “Izslēgt visas kontaktligzdas”",
    ed_plugs_off_button_helper: "Pieskaroties galvenes kontaktligzdu žetonam, tiek parādītas visas ieslēgtās kartes uzskaitītās kontaktligzdas, un pēc apstiprināšanas tās tiek izslēgtas; arī kartē Kontaktligzdas telpas detaļās. Pēc noklusējuma izslēgts: kontaktligzda var barot kameru vai tīkla komutatoru",
    ed_sort_state: "Vispirms telpas, kurām jāpievērš uzmanība",
    ed_exclude: "Izslēdzamās vienības",
    ed_exclude_helper: "Netiek ņemtas vērā flīzēs, kopsummās un telpu detaļās",
  },
  el: {
    title: "Σπίτι",
    presence: "Παρουσία",
    no_rooms: "Κανένα δωμάτιο με αισθητήρες, φώτα ή πρίζες",
    lights_on: "Αναμμένα φώτα",
    plugs_on: "Ενεργές πρίζες",
    turn_lights_off: "Σβήσιμο όλων των φώτων",
    turn_plugs_off: "Απενεργοποίηση όλων των πριζών",
    confirm_plugs_one: "Απενεργοποίηση αυτής της πρίζας;",
    confirm_plugs_many: "Απενεργοποίηση αυτών των {n} πριζών;",
    turn_off: "Απενεργοποίηση",
    cancel: "Άκυρο",
    rooms_occupied: "Κατειλημμένα δωμάτια",
    sensors: "Αισθητήρες",
    lights: "Φώτα",
    plugs: "Πρίζες",
    ed_title_helper: "Αφήστε το κενό για «Σπίτι»",
    ed_columns_helper: "Κενό: 3 ή 2 σε στενές οθόνες",
    ed_presence: "Συμπερίληψη αισθητήρων παρουσίας",
    ed_presence_helper: "Αισθητήρες παρουσίας και κίνησης",
    ed_zoom: "Κουμπί λεπτομερειών",
    ed_zoom_helper: "Εμφανίζονται μόνο τα δωμάτια όπου κάτι είναι ανοιχτό, αναμμένο ή ανιχνεύθηκε· το κουμπί εμφανίζει όλα τα δωμάτια. Ανενεργό: πάντα όλα τα δωμάτια",
    ed_all_off_button: "Κουμπί «Σβήσιμο όλων των φώτων»",
    ed_all_off_button_helper: "Το πάτημα της ετικέτας φώτων στην κεφαλίδα σβήνει όλα τα φώτα που μετρά η κάρτα",
    ed_plugs_off_button: "Κουμπί «Απενεργοποίηση όλων των πριζών»",
    ed_plugs_off_button_helper: "Το πάτημα της ετικέτας πριζών στην κεφαλίδα εμφανίζει όλες τις ενεργές πρίζες που μετρά η κάρτα και τις απενεργοποιεί μετά από επιβεβαίωση· επίσης στην κάρτα Πρίζες στις λεπτομέρειες του δωματίου. Ανενεργό από προεπιλογή: μια πρίζα μπορεί να τροφοδοτεί κάμερα ή μεταγωγέα δικτύου",
    ed_sort_state: "Πρώτα τα δωμάτια που χρειάζονται έλεγχο",
    ed_exclude: "Οντότητες προς εξαίρεση",
    ed_exclude_helper: "Παραλείπονται από τα πλακίδια, τα σύνολα και τις λεπτομέρειες των δωματίων",
  },
};

// After the confirmation popup closes, clicks are ignored for this long: the second click of a double click on OK
// would otherwise land on what lies under the button (the lights chip, a room tile).
const RO_CLOSED_GUARD_MS = 400;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomOverviewCard extends rcRoomsPanel(RcCard) {
  static tag = "room-overview-card";
  static i18n = RO_I18N;
  static defaults = {
    presence: true,
    zoom: true,
    all_off_button: true,
    plugs_off_button: false,
    sort: "name",
    exclude_areas: [],
    exclude: [],
    rooms: [],
  };

  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    // Escape closes the confirmation popup (as Cancel), wherever the focus is.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  set hass(hass) {
    super.hass = hass;
    for (const el of this._details || []) el.hass = hass;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._confirm) this._closeConfirm();
    // A press cut short by the detach never gets its pointerup: end it, or the header stays frozen.
    if (this._pressing) this._released();
  }

  getCardSize() {
    return 1 + Math.ceil((this._rooms?.length || 1) / 3);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  _collect() {
    const h = this._hass;
    const c = this._config;
    const reg = h.entities || {};

    const power = rcPowerSensors(h);
    const watts = (id) => rcWattsOf(h, power[reg[id]?.device_id]);

    const overrides = Object.fromEntries((c.rooms || []).map((x) => [x.area, x]));
    const outdoor = (aid) => overrides[aid]?.outdoor ?? rcIsOutdoor(h.areas?.[aid]);

    const rooms = {};
    const room = (aid) => {
      if (!rooms[aid]) {
        rooms[aid] = { id: aid, outdoor: outdoor(aid), sensors: [], presence: [], lights: [], plugs: [] };
      }
      return rooms[aid];
    };

    // The room cards' own rules, so that a room counts what its unfolded details show.
    for (const [id, aid] of rcByArea(this, (id) => /^(binary_sensor|light|switch)\./.test(id))) {
      const st = h.states[id];
      if (!st) continue;
      const dc = st.attributes.device_class;
      if (rcMatchSensor(h, id, { presence: c.presence, outdoor: outdoor(aid) })) {
        if (RC_OPENING_CLASSES.includes(dc)) room(aid).sensors.push({ id, leak: dc === "moisture", st });
        else room(aid).presence.push({ id, st });
      } else if (rcMatchLight(h, id)) {
        room(aid).lights.push({ id, st });
      } else if (rcMatchPlug(h, id)) {
        room(aid).plugs.push({ id, st, watts: watts(id) });
      }
    }

    const exclude = new Set(c.exclude_areas || []);

    let list = Object.values(rooms)
      .filter((x) => !exclude.has(x.id) && h.areas?.[x.id])
      .map((x) => {
        const area = h.areas[x.id];
        const o = overrides[x.id] || {};
        const on = (e) => e.st.state === "on";
        const plugsOn = x.plugs.filter(on);
        const plugWatts = plugsOn.filter((p) => p.watts != null);
        return {
          ...x,
          name: o.name ?? area.name ?? x.id,
          icon: o.icon ?? rcRoomIcon(area),
          navigation_path: o.navigation_path,
          leaks: x.sensors.filter((s) => s.leak && on(s)).length,
          open: x.sensors.filter((s) => !s.leak && on(s)).length,
          // A leak or opening sensor that cannot report is no all-clear: the room needs a look.
          unavail: x.sensors.filter((s) => rcUnavailable(s.st)).length,
          occupied: x.presence.some(on),
          lightsOn: x.lights.filter(on).length,
          plugsOn: plugsOn.length,
          watts: plugWatts.length ? plugWatts.reduce((t, p) => t + p.watts, 0) : null,
        };
      });

    const rank = (x) => (x.leaks ? 5 : x.open ? 4 : x.unavail ? 3 : x.occupied ? 2 : x.lightsOn || x.plugsOn ? 1 : 0);
    rcSortRooms(list, c, rank);
    this._total = list.length;
    this._anySensors = list.some((x) => x.sensors.some((e) => !e.leak));
    if (rcCompact(this)) list = list.filter((x) => rank(x) > 0 || x.id === this._openArea);
    return list;
  }

  _roomState(x) {
    if (x.leaks || x.open || x.unavail) {
      return { lvl: x.leaks ? "alert" : "warn", text: this._openingStatus(x.leaks, x.open, false, "all_quiet", x.unavail) };
    }
    if (x.occupied) return { lvl: "info", text: this._t("presence") };
    return { lvl: "ok", text: this._openingStatus(0, 0, x.sensors.some((e) => !e.leak)) };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const rooms = this._collect();
    this._rooms = rooms;

    // The sensor count too: a door added to an idle room turns "All quiet" into "All closed" without any state change.
    const parts = rooms.map((x) => [x.id, x.name, x.icon, x.leaks, x.open, x.occupied, x.lightsOn, x.plugsOn, x.watts && Math.round(x.watts), x.sensors.length, x.unavail]);
    if (!this._changed([this._openArea, this._zoomed, this._anySensors, parts])) return;

    if (!this.shadowRoot.querySelector("ha-card")) {
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${RoomOverviewCard.styles}</style>
        <ha-card><div class="head"></div><div class="panel" hidden></div><div class="grid"></div><div class="confirm" hidden></div></ha-card>`;
      // Just after the popup closed, the second click of a double click on OK lands on what lies under it: the header,
      // a room tile, or a tile of the unfolded room's details (room-* cards acting on pointerup). Swallowed here, in
      // the capture phase, before it reaches any of them.
      const card = this.shadowRoot.querySelector("ha-card");
      for (const type of ["pointerdown", "pointerup", "click"]) {
        card.addEventListener(
          type,
          (ev) => {
            if (this._justClosed()) ev.stopPropagation();
          },
          true,
        );
      }
      const head = this.shadowRoot.querySelector(".head");
      head.addEventListener("click", (ev) => {
        if (rcZoomClick(this, ev)) return;
        const button = ev.target.closest(".chip.action");
        if (!button || this._justClosed()) return;
        ev.stopPropagation();
        this._headAction(button.dataset.kind === "plugs" ? "plugs" : "lights");
      });
      // No header rewrite while an action chip is pressed (a power reading changes its text): the chip under the
      // finger would be replaced and the click lost. The update is rendered once the click is through.
      head.addEventListener("pointerdown", (ev) => {
        if (ev.button === 0 && ev.target.closest(".chip.action")) this._pressing = true;
      });
      for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
        head.addEventListener(type, () => {
          if (this._pressing) setTimeout(() => this._released());
        });
      }
      this.shadowRoot.querySelector(".grid").addEventListener("click", (ev) => {
        const tile = ev.target.closest(".room");
        if (tile && !this._justClosed()) this._tap(tile.dataset.area);
      });
      this.shadowRoot.querySelector(".confirm").addEventListener("click", (ev) => {
        ev.stopPropagation();
        const el = ev.target.closest("[data-action]");
        const action = el?.dataset.action;
        if (action === "ok") {
          const ids = this._confirm.map((e) => e.id);
          this._closeConfirm();
          rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
        } else if (action === "cancel" || (action === "backdrop" && ev.target === el)) {
          this._closeConfirm();
        }
      });
    }

    const leaks = rooms.reduce((t, x) => t + x.leaks, 0);
    const open = rooms.reduce((t, x) => t + x.open, 0);
    const unavail = rooms.reduce((t, x) => t + x.unavail, 0);
    const lights = rooms.reduce((t, x) => t + x.lightsOn, 0);
    const plugs = rooms.reduce((t, x) => t + x.plugsOn, 0);
    const watts = rooms.some((x) => x.watts != null) ? rooms.reduce((t, x) => t + (x.watts ?? 0), 0) : null;
    const occupied = rooms.filter((x) => x.occupied).length;
    const level = leaks ? "alert" : open || unavail ? "warn" : "ok";
    const status = this._openingStatus(leaks, open, this._anySensors, "all_quiet", unavail);
    const headIcon = leaks ? "mdi:water-alert" : open || unavail ? "mdi:home-alert-outline" : "mdi:home-outline";

    const chip = (cls, icon, label, text) =>
      `<span class="chip ${cls}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</span>`;
    // Header chip that turns everything of its kind off when tapped.
    const offChip = (cls, kind, icon, label, text, offIcon) =>
      `<button class="chip ${cls} action" data-kind="${kind}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon><span>${rcEsc(text)}</span><ha-icon class="off" icon="${offIcon}"></ha-icon></button>`;
    const plugText = watts != null ? rcWatts(watts, this._lang()) : String(plugs);

    // The header chips, in one group: on a narrow card it goes to its own line under the title.
    const headChips = [
      occupied ? chip("info", "mdi:account", this._t("rooms_occupied"), String(occupied)) : "",
      lights
        ? c.all_off_button !== false
          ? offChip("light", "lights", "mdi:lightbulb", this._t("turn_lights_off"), String(lights), "mdi:power")
          : chip("light", "mdi:lightbulb", this._t("lights_on"), String(lights))
        : "",
      plugs
        ? c.plugs_off_button
          ? offChip("plug", "plugs", "mdi:power-socket-fr", this._t("turn_plugs_off"), plugText, "mdi:power-plug-off")
          : chip("plug", "mdi:power-socket-fr", this._t("plugs_on"), plugText)
        : "",
    ].join("");

    const card = this.shadowRoot.querySelector("ha-card");
    card.className = `lvl-${level}`;
    card.querySelector(".head").innerHTML = `
      <div class="badge"><ha-icon icon="${headIcon}"></ha-icon></div>
      <div class="title">${rcEsc(c.title || this._t("title"))}</div>
      ${headChips ? `<div class="hchips">${headChips}</div>` : ""}
      <div class="pill" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></div>
      ${rcZoomButton(this)}`;

    this._roomGrid(card.querySelector(".grid"), rooms, (x) => {
      const s = this._roomState(x);
      // Chips only add what the state line does not already say.
      const chips = [
        x.leaks && x.open ? chip("warn", "mdi:door-open", this._tn("open", x.open), String(x.open)) : "",
        x.occupied && s.lvl !== "info" ? chip("info", "mdi:account", this._t("presence")) : "",
        x.lightsOn ? chip("light", "mdi:lightbulb", this._t("lights_on"), String(x.lightsOn)) : "",
        x.plugsOn
          ? chip("plug", "mdi:power-socket-fr", this._t("plugs_on"), x.watts != null ? rcWatts(x.watts, this._lang()) : String(x.plugsOn))
          : "",
      ].join("");
      return `
      <button class="room lvl-${s.lvl}${x.id === this._openArea ? " sel" : ""}" data-area="${rcEsc(x.id)}"
              title="${rcEsc(x.name)} — ${rcEsc(s.text)}">
        <span class="ic"><ha-icon icon="${rcEsc(x.icon)}"></ha-icon></span>
        <span class="name">${rcEsc(x.name)}</span>
        <span class="state">${rcEsc(s.text)}</span>
        <span class="chips">${chips}</span>
      </button>`;
    });
  }

  // What a header chip turns off: every light, or every plug, that is on in the rooms shown. Lights go off at once;
  // plugs only once the list is confirmed, since one of them may feed a fridge, a camera or the network.
  _headAction(kind) {
    const on = this._rooms.flatMap((x) => x[kind].filter((e) => e.st.state === "on").map((e) => ({ ...e, room: x.name })));
    if (!on.length) return;
    if (kind === "plugs") this._openConfirm(on);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: on.map((e) => e.id) });
  }

  // Plugs `ids` of room `x` turned off from the room details: listed and confirmed like the header's plugs chip.
  // The room is looked up again: `x` is the one seen when the details were built, its power long out of date.
  _confirmPlugs(ids, x) {
    x = this._rooms?.find((r) => r.id === x.id) ?? x;
    const plugs = ids
      .map((id) => {
        const known = x.plugs.find((e) => e.id === id);
        const st = known?.st ?? this._hass.states[id];
        return st ? { id, st, watts: known?.watts ?? null, room: x.name } : null;
      })
      .filter(Boolean);
    if (plugs.length) this._openConfirm(plugs);
  }

  // In-card confirmation at the top of the card (as in ha-system-monitor-card and ha-roborock-card), drawn once:
  // updates leave it, and the focus in it, alone. OK turns off the plugs listed, nothing else.
  _openConfirm(plugs) {
    this._confirm = plugs;
    const n = plugs.length;
    const items = plugs
      .map((e) => {
        const extra = [e.room, e.watts != null ? rcWatts(e.watts, this._lang()) : ""].filter(Boolean).join(" · ");
        return `<div class="modal-item"><span>${rcEsc(e.st.attributes.friendly_name || e.id)}</span><span>${rcEsc(extra)}</span></div>`;
      })
      .join("");
    const box = this.shadowRoot.querySelector(".confirm");
    box.innerHTML = `
      <div class="backdrop" data-action="backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${rcEsc(this._t("turn_plugs_off"))}">
          <h3>${rcEsc(this._t("turn_plugs_off"))}</h3>
          <div class="hint">${rcEsc(this._tn("confirm_plugs", n))}</div>
          <div class="modal-list">${items}</div>
          <div class="modal-actions">
            <button class="act cancel" data-action="cancel">${rcEsc(this._t("cancel"))}</button>
            <button class="act primary" data-action="ok">${rcEsc(this._t("turn_off"))}</button>
          </div>
        </div>
      </div>`;
    box.hidden = false;
    window.addEventListener("keydown", this._onKey);
    box.querySelector(".primary")?.focus({ preventScroll: true });
  }

  _closeConfirm() {
    this._confirm = null;
    this._closedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    const box = this.shadowRoot?.querySelector(".confirm");
    if (box) {
      box.hidden = true;
      box.innerHTML = "";
    }
  }

  _justClosed() {
    return this._closedAt != null && Date.now() - this._closedAt < RO_CLOSED_GUARD_MS;
  }

  // rcRoomsPanel hooks: the tiles shown, the room details dropped on fold, and the confirmation closed by an outside
  // click (as Cancel) before the open room folds back.
  _shownRooms() {
    return this._rooms;
  }

  _clearPanel() {
    this._details = [];
  }

  _beforeFold() {
    if (this._confirm) this._closeConfirm();
  }

  // Details of the open room: its room-sensors, room-lights and room-switch cards (same bundle, always defined; a room
  // only exists with at least one entity, so at least one of them is shown).
  _fillPanel() {
    const x = this._rooms.find((r) => r.id === this._openArea);
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = false;
    const key = JSON.stringify([x.id, x.sensors.length, x.presence.length, x.lights.length, x.plugs.length]);
    if (this._panelArea === key) return;
    this._panelArea = key;
    panel.innerHTML = "";
    this._details = [];

    const parts = [
      ["room-sensors-card", x.sensors.length + x.presence.length, { title: this._t("sensors"), presence: this._config.presence, outdoor: x.outdoor }],
      ["room-lights-card", x.lights.length, { title: this._t("lights") }],
      ["room-switch-card", x.plugs.length, { title: this._t("plugs"), all_off_button: this._config.plugs_off_button === true }],
    ];
    for (const [tag, count, extra] of parts) {
      if (!count || !customElements.get(tag)) continue;
      const el = document.createElement(tag);
      el.setConfig({
        type: `custom:${tag}`,
        area: x.id,
        exclude: this._config.exclude || [],
        ...(this._config.language ? { language: this._config.language } : {}),
        ...extra,
      });
      // The Plugs card's all-off pill goes through the same confirmation as the header's plugs chip.
      if (tag === "room-switch-card") el._confirmOff = (ids) => this._confirmPlugs(ids, x);
      el.hass = this._hass;
      panel.appendChild(el);
      this._details.push(el);
    }
  }

  static styles = `${RC_ZOOM_STYLES}${RC_ROOM_GRID_STYLES}
      ha-card { container-type: inline-size; position: relative; }
      ha-card.lvl-ok    { --c: var(--rc-ok); }
      ha-card.lvl-warn  { --c: var(--rc-warn); }
      ha-card.lvl-alert { --c: var(--rc-alert); }

      :where(button.chip) { all: unset; }
      .chip { --k: var(--rc-idle); flex: none; display: inline-flex; align-items: center; gap: 2px; height: 18px; padding: 0 5px;
              border-radius: 999px; font-size: 11px; font-weight: 500; line-height: 1; white-space: nowrap;
              color: var(--k); background: color-mix(in srgb, var(--k) 14%, transparent); }
      .head .chip { height: 20px; padding: 0 6px; font-size: 11px; }
      .chip ha-icon { --mdc-icon-size: 12px; }
      .chip:not(:has(span)) { width: 18px; padding: 0; justify-content: center; }
      .chip.alert { --k: var(--rc-alert); }
      .chip.warn  { --k: var(--rc-warn); }
      .chip.info  { --k: var(--rc-info); }
      .chip.light { --k: var(--rc-light); }
      .chip.plug  { --k: var(--rc-plug); }
      button.chip { cursor: pointer; transition: background .2s; }
      button.chip:hover { background: color-mix(in srgb, var(--k) 26%, transparent); }
      button.chip:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
      button.chip .off { --mdc-icon-size: 11px; margin-left: 2px; opacity: .75; }
      /* A 32 px tall touch target around the 20 px header chips, without changing how they look. */
      .head button.chip { position: relative; }
      .head button.chip::before { content: ""; position: absolute; inset: -6px -3px; }
      .hchips { flex: none; display: flex; align-items: center; gap: inherit; }
      /* Narrow card: the chips go to a line of their own under the title, which keeps the first line (title, status,
         detail button) readable; they wrap there if they still do not fit. */
      @container (max-width: 420px) {
        .head { gap: 6px; flex-wrap: wrap; }
        .hchips { order: 1; flex: 1 0 100%; flex-wrap: wrap; box-sizing: border-box; padding-left: 46px; }
      }
      /* The overview's pill keeps its place on the title's line: its chips have the second line already. */
      @container (max-width: 260px) {
        .head::after { content: none; }
        .head > .pill { order: 0; margin-left: 0; max-width: none; }
      }

      .confirm[hidden] { display: none; }
      ha-card:has(> .confirm:not([hidden])) { min-height: 220px; }
      .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
                  padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
      .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
               box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4);
               display: flex; flex-direction: column; gap: 10px; }
      .modal h3 { margin: 0; font-size: 16px; font-weight: 500; }
      .modal .hint { font-size: 13px; color: var(--secondary-text-color); }
      .modal-list { display: flex; flex-direction: column; gap: 4px; overflow: auto; min-height: 0; }
      .modal-item { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
      .modal-item span:first-child { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .modal-item span:last-child { flex: none; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
      .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px; }
      .modal button.act { border: 0; border-radius: 8px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
      .modal button.cancel { background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); }
      .modal button.cancel:hover { background: color-mix(in srgb, var(--primary-text-color) 10%, var(--secondary-background-color, transparent)); }
      .modal button.primary { background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent); color: var(--primary-color, #03a9f4); }
      .modal button.primary:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent); }
      .modal button.act:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

      .room { --t: var(--rc-idle); }
      .room.lvl-warn  { --t: var(--rc-warn); }
      .room.lvl-alert { --t: var(--rc-alert); }
      .room.lvl-info  { --t: var(--rc-info); }
      .room.lvl-alert .ic { animation: rc-blink 1.5s ease-in-out infinite; }
      .chips { gap: 3px; margin-top: 4px; }

      .panel > * + * { border-top: 1px solid var(--divider-color, rgba(127,127,127,.15)); }

      @media (prefers-reduced-motion: reduce) { .room .ic { animation: none; } }
    `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
// Entities the card counts in the rooms it shows, plus the ones already excluded.
const roExcludeField = (hass, config) => {
  if (!hass) return [];
  const rooms = rcProbe(RoomOverviewCard, hass, { ...config, exclude: [], zoom: false })._collect();
  const ids = rooms.flatMap((x) => [...x.sensors, ...x.presence, ...x.lights, ...x.plugs].map((e) => e.id));
  for (const id of config?.exclude || []) if (!ids.includes(id)) ids.push(id);
  return rcEntitiesField("exclude", ids);
};

const RoomOverviewCardEditor = rcEditor({
  card: RoomOverviewCard,
  helpers: ["title", "columns", "presence", "zoom", "all_off_button", "plugs_off_button", "exclude", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcOverviewFields(RO_I18N, lang),
    { name: "presence", selector: { boolean: {} } },
    { name: "zoom", selector: { boolean: {} } },
    { name: "all_off_button", selector: { boolean: {} } },
    { name: "plugs_off_button", selector: { boolean: {} } },
    {
      name: "exclude_areas",
      // The rooms the card finds, excluded ones included.
      selector: {
        select: {
          multiple: true,
          mode: "dropdown",
          options: hass
            ? rcProbe(RoomOverviewCard, hass, { ...config, exclude_areas: [], zoom: false })
                ._collect()
                .map((x) => ({ value: x.id, label: x.name }))
            : [],
        },
      },
    },
    ...roExcludeField(hass, config),
    ...rcAdvanced(RO_I18N, lang, "rooms", "language"),
  ],
});

rcRegister(
  RoomOverviewCard,
  RoomOverviewCardEditor,
  "Room Overview Card",
  "Every room at a glance: openings, leaks, presence, lights and plugs; tap a room for its details",
);
