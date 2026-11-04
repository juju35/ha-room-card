/**
 * room-sensors-card — leak, door, window, opening and presence sensors of a Home Assistant area.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RS_I18N = {
  en: {
    ed_columns_helper: "Mini card: columns of the zoomed-in view",
    title: "Sensors",
    no_sensors: "No sensor",
    leak_on: "Leak!",
    leak_off: "Dry",
    open: "Open",
    closed: "Closed",
    presence_on: "Detected",
    presence_off: "Clear",
    motion_on: "Motion",
    motion_off: "Clear",
    occupied: "Presence detected",
    now: "just now",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Hide idle sensors",
    ed_only_alerts_helper: "Only open, leaking or detecting sensors stay visible",
    ed_hide_when_clear: "Hide the card when idle",
    ed_hide_when_clear_helper: "The card only appears when a door or window is open, or a leak or presence is detected",
    ed_presence: "Include presence sensors",
    ed_presence_helper: "Presence and motion sensors, cameras excluded",
    ed_blink: "Blink alerts",
    ed_include: "Sensors to add",
    ed_include_helper: "From another room or without one",
    ed_exclude: "Sensors to exclude",
  },
  fr: {
    ed_columns_helper: "Mini-carte : colonnes de la vue zoomée",
    title: "Capteurs",
    no_sensors: "Aucun capteur",
    leak_on: "Fuite !",
    leak_off: "Sec",
    open: "Ouvert",
    closed: "Fermé",
    open_f: "Ouverte",
    closed_f: "Fermée",
    presence_on: "Détectée",
    presence_off: "Aucune",
    motion_on: "Mouvement",
    motion_off: "Calme",
    occupied: "Présence détectée",
    now: "à l'instant",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} j",
    ed_only_alerts: "Masquer les capteurs au repos",
    ed_only_alerts_helper: "Seuls les capteurs ouverts, en fuite ou détectant une présence restent affichés",
    ed_hide_when_clear: "Masquer la carte au repos",
    ed_hide_when_clear_helper: "La carte n'apparaît que si une porte ou une fenêtre est ouverte, ou si une fuite ou une présence est détectée",
    ed_presence: "Inclure les capteurs de présence",
    ed_presence_helper: "Capteurs de présence et de mouvement, hors caméras",
    ed_blink: "Faire clignoter les alertes",
    ed_include: "Capteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce",
    ed_exclude: "Capteurs à exclure",
  },
  de: {
    ed_columns_helper: "Mini-Karte: Spalten der vergrößerten Ansicht",
    title: "Sensoren",
    no_sensors: "Kein Sensor",
    leak_on: "Leck!",
    leak_off: "Trocken",
    open: "Offen",
    closed: "Geschlossen",
    presence_on: "Erkannt",
    presence_off: "Frei",
    motion_on: "Bewegung",
    motion_off: "Ruhig",
    occupied: "Anwesenheit erkannt",
    now: "gerade eben",
    min: "{n} Min.",
    hour: "{n} Std.",
    day: "{n} Tg.",
    ed_only_alerts: "Inaktive Sensoren ausblenden",
    ed_only_alerts_helper: "Nur offene, leckende oder erkennende Sensoren bleiben sichtbar",
    ed_hide_when_clear: "Karte im Ruhezustand ausblenden",
    ed_hide_when_clear_helper: "Die Karte erscheint nur, wenn eine Tür oder ein Fenster offen ist oder ein Leck oder eine Anwesenheit erkannt wird",
    ed_presence: "Anwesenheitssensoren einbeziehen",
    ed_presence_helper: "Anwesenheits- und Bewegungsmelder, ohne Kameras",
    ed_blink: "Warnungen blinken lassen",
    ed_include: "Hinzuzufügende Sensoren",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum",
    ed_exclude: "Auszuschließende Sensoren",
  },
  es: {
    ed_columns_helper: "Minitarjeta: columnas de la vista ampliada",
    title: "Sensores",
    no_sensors: "Ningún sensor",
    leak_on: "¡Fuga!",
    leak_off: "Seco",
    open: "Abierto",
    closed: "Cerrado",
    open_f: "Abierta",
    closed_f: "Cerrada",
    presence_on: "Detectada",
    presence_off: "Ninguna",
    motion_on: "Movimiento",
    motion_off: "Tranquilo",
    occupied: "Presencia detectada",
    now: "ahora mismo",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Ocultar los sensores en reposo",
    ed_only_alerts_helper: "Solo quedan visibles los sensores abiertos, con fuga o que detectan presencia",
    ed_hide_when_clear: "Ocultar la tarjeta en reposo",
    ed_hide_when_clear_helper: "La tarjeta solo aparece cuando hay una puerta o ventana abierta, o se detecta una fuga o presencia",
    ed_presence: "Incluir los sensores de presencia",
    ed_presence_helper: "Sensores de presencia y movimiento, sin cámaras",
    ed_blink: "Hacer parpadear las alertas",
    ed_include: "Sensores a añadir",
    ed_include_helper: "De otra habitación o sin habitación",
    ed_exclude: "Sensores a excluir",
  },
  sr: {
    ed_columns_helper: "Мини картица: колоне у увећаном приказу",
    title: "Сензори",
    no_sensors: "Нема сензора",
    leak_on: "Цурење!",
    leak_off: "Суво",
    open: "Отворено",
    closed: "Затворено",
    presence_on: "Детектовано",
    presence_off: "Чисто",
    motion_on: "Покрет",
    motion_off: "Чисто",
    occupied: "Присутност детектована",
    now: "управо сада",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Сакриј неактивне сензоре",
    ed_only_alerts_helper: "Остаће видљиви само отворени сензори, они који цуре или детектују присутност/покрет",
    ed_hide_when_clear: "Сакриј картицу када нема активности",
    ed_hide_when_clear_helper: "Картица се приказује само када су врата или прозор отворени, или када се детектује цурење или присутност",
    ed_presence: "Укључи сензоре присутности",
    ed_presence_helper: "Сензори присутности и покрета, камере су искључене",
    ed_blink: "Треперење упозорења",
    ed_include: "Сензори за додавање",
    ed_include_helper: "Из друге просторије или без ње",
    ed_exclude: "Изостави сензоре",
  },
  "sr-Latn": {
    ed_columns_helper: "Mini kartica: kolone u uvećanom prikazu",
    title: "Senzori",
    no_sensors: "Nema senzora",
    leak_on: "Curenje!",
    leak_off: "Suvo",
    open: "Otvoreno",
    closed: "Zatvoreno",
    presence_on: "Detektovano",
    presence_off: "Čisto",
    motion_on: "Pokret",
    motion_off: "Čisto",
    occupied: "Prisutnost detektovana",
    now: "upravo sada",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Sakrij neaktivne senzore",
    ed_only_alerts_helper: "Ostaće vidljivi samo otvoreni senzori, oni koji cure ili detektuju prisutnost/pokret",
    ed_hide_when_clear: "Sakrij karticu kada nema aktivnosti",
    ed_hide_when_clear_helper: "Kartica se prikazuje samo kada su vrata ili prozor otvoreni, ili kada se detektuje curenje ili prisutnost",
    ed_presence: "Uključi senzore prisutnosti",
    ed_presence_helper: "Senzori prisutnosti i pokreta, kamere su isključene",
    ed_blink: "Treperenje upozorenja",
    ed_include: "Senzori za dodavanje",
    ed_include_helper: "Iz druge prostorije ili bez nje",
    ed_exclude: "Izostavi senzore",
  },
  it: {
    ed_columns_helper: "Mini scheda: colonne della vista ingrandita",
    title: "Sensori",
    no_sensors: "Nessun sensore",
    leak_on: "Perdita!",
    leak_off: "Asciutto",
    open: "Aperto",
    closed: "Chiuso",
    open_f: "Aperta",
    closed_f: "Chiusa",
    presence_on: "Rilevata",
    presence_off: "Nessuna",
    motion_on: "Movimento",
    motion_off: "Nessuno",
    occupied: "Presenza rilevata",
    now: "adesso",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} g",
    ed_only_alerts: "Nascondi i sensori inattivi",
    ed_only_alerts_helper: "Restano visibili solo i sensori aperti, con perdite o che rilevano una presenza",
    ed_hide_when_clear: "Nascondi la scheda se tutto è tranquillo",
    ed_hide_when_clear_helper: "La scheda appare solo quando una porta o una finestra è aperta, o viene rilevata una perdita o una presenza",
    ed_presence: "Includi i sensori di presenza",
    ed_presence_helper: "Sensori di presenza e di movimento, telecamere escluse",
    ed_blink: "Fai lampeggiare gli avvisi",
    ed_include: "Sensori da aggiungere",
    ed_include_helper: "Da un'altra stanza o senza stanza",
    ed_exclude: "Sensori da escludere",
  },
  nl: {
    ed_columns_helper: "Minikaart: kolommen van de vergrote weergave",
    title: "Sensoren",
    no_sensors: "Geen sensoren",
    leak_on: "Lek!",
    leak_off: "Droog",
    open: "Open",
    closed: "Gesloten",
    presence_on: "Gedetecteerd",
    presence_off: "Vrij",
    motion_on: "Beweging",
    motion_off: "Rustig",
    occupied: "Aanwezigheid gedetecteerd",
    now: "zojuist",
    min: "{n} min",
    hour: "{n} u",
    day: "{n} d",
    ed_only_alerts: "Inactieve sensoren verbergen",
    ed_only_alerts_helper: "Alleen open, lekkende of detecterende sensoren blijven zichtbaar",
    ed_hide_when_clear: "Kaart verbergen bij rust",
    ed_hide_when_clear_helper: "De kaart verschijnt alleen als een deur of raam open staat, of als een lek of aanwezigheid wordt gedetecteerd",
    ed_presence: "Aanwezigheidssensoren meenemen",
    ed_presence_helper: "Aanwezigheids- en bewegingssensoren, zonder camera's",
    ed_blink: "Waarschuwingen laten knipperen",
    ed_include: "Toe te voegen sensoren",
    ed_include_helper: "Uit een andere ruimte of zonder ruimte",
    ed_exclude: "Uit te sluiten sensoren",
  },
  pt: {
    ed_columns_helper: "Minicartão: colunas da vista ampliada",
    title: "Sensores",
    no_sensors: "Nenhum sensor",
    leak_on: "Fuga!",
    leak_off: "Seco",
    open: "Aberto",
    closed: "Fechado",
    open_f: "Aberta",
    closed_f: "Fechada",
    presence_on: "Detetada",
    presence_off: "Nenhuma",
    motion_on: "Movimento",
    motion_off: "Nenhum",
    occupied: "Presença detetada",
    now: "agora mesmo",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Ocultar os sensores em repouso",
    ed_only_alerts_helper: "Só ficam visíveis os sensores abertos, com fuga ou que detetam presença",
    ed_hide_when_clear: "Ocultar o cartão em repouso",
    ed_hide_when_clear_helper: "O cartão só aparece quando uma porta ou janela está aberta, ou é detetada uma fuga ou presença",
    ed_presence: "Incluir os sensores de presença",
    ed_presence_helper: "Sensores de presença e de movimento, sem câmaras",
    ed_blink: "Fazer piscar os alertas",
    ed_include: "Sensores a adicionar",
    ed_include_helper: "De outra divisão ou sem divisão",
    ed_exclude: "Sensores a excluir",
  },
  pl: {
    ed_columns_helper: "Minikarta: kolumny widoku powiększonego",
    title: "Czujniki",
    no_sensors: "Brak czujników",
    leak_on: "Wyciek!",
    leak_off: "Sucho",
    open: "Otwarte",
    closed: "Zamknięte",
    presence_on: "Wykryto",
    presence_off: "Brak",
    motion_on: "Ruch",
    motion_off: "Brak",
    occupied: "Wykryto obecność",
    now: "przed chwilą",
    min: "{n} min",
    hour: "{n} godz.",
    day: "{n} d",
    ed_only_alerts: "Ukryj nieaktywne czujniki",
    ed_only_alerts_helper: "Widoczne pozostają tylko czujniki otwarte, wykrywające wyciek lub obecność",
    ed_hide_when_clear: "Ukryj kartę, gdy nic się nie dzieje",
    ed_hide_when_clear_helper: "Karta pojawia się tylko, gdy drzwi lub okno są otwarte albo wykryto wyciek lub obecność",
    ed_presence: "Uwzględnij czujniki obecności",
    ed_presence_helper: "Czujniki obecności i ruchu, bez kamer",
    ed_blink: "Migające alerty",
    ed_include: "Czujniki do dodania",
    ed_include_helper: "Z innego pomieszczenia lub bez pomieszczenia",
    ed_exclude: "Czujniki do wykluczenia",
  },
  ro: {
    ed_columns_helper: "Mini-card: coloanele vizualizării mărite",
    title: "Senzori",
    no_sensors: "Niciun senzor",
    leak_on: "Scurgere!",
    leak_off: "Uscat",
    open: "Deschis",
    closed: "Închis",
    open_f: "Deschisă",
    closed_f: "Închisă",
    presence_on: "Detectată",
    presence_off: "Nedetectată",
    motion_on: "Mișcare",
    motion_off: "Nicio mișcare",
    occupied: "Prezență detectată",
    now: "acum",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} z",
    ed_only_alerts: "Ascunde senzorii inactivi",
    ed_only_alerts_helper: "Rămân vizibili doar senzorii deschiși, cu scurgeri sau care detectează prezență",
    ed_hide_when_clear: "Ascunde cardul când totul e liniștit",
    ed_hide_when_clear_helper: "Cardul apare doar când o ușă sau o fereastră e deschisă ori când se detectează o scurgere sau o prezență",
    ed_presence: "Include senzorii de prezență",
    ed_presence_helper: "Senzori de prezență și de mișcare, fără camere video",
    ed_blink: "Alerte intermitente",
    ed_include: "Senzori de adăugat",
    ed_include_helper: "Din altă cameră sau fără cameră",
    ed_exclude: "Senzori excluși",
  },
  da: {
    ed_columns_helper: "Minikort: kolonner i den forstørrede visning",
    title: "Sensorer",
    no_sensors: "Ingen sensorer",
    leak_on: "Lækage!",
    leak_off: "Tørt",
    open: "Åben",
    closed: "Lukket",
    presence_on: "Registreret",
    presence_off: "Ingen",
    motion_on: "Bevægelse",
    motion_off: "Ingen",
    occupied: "Tilstedeværelse registreret",
    now: "lige nu",
    min: "{n} min",
    hour: "{n} t",
    day: "{n} d",
    ed_only_alerts: "Skjul inaktive sensorer",
    ed_only_alerts_helper: "Kun åbne sensorer og sensorer, der registrerer lækage eller tilstedeværelse, forbliver synlige",
    ed_hide_when_clear: "Skjul kortet, når alt er roligt",
    ed_hide_when_clear_helper: "Kortet vises kun, når en dør eller et vindue er åbent, eller når der registreres lækage eller tilstedeværelse",
    ed_presence: "Medtag tilstedeværelsessensorer",
    ed_presence_helper: "Tilstedeværelses- og bevægelsessensorer, undtagen kameraer",
    ed_blink: "Blinkende advarsler",
    ed_include: "Sensorer, der tilføjes",
    ed_include_helper: "Fra et andet rum eller uden rum",
    ed_exclude: "Sensorer, der udelades",
  },
  sv: {
    ed_columns_helper: "Minikort: kolumner i inzoomad vy",
    title: "Sensorer",
    no_sensors: "Inga sensorer",
    leak_on: "Läcka!",
    leak_off: "Torrt",
    open: "Öppen",
    closed: "Stängd",
    presence_on: "Upptäckt",
    presence_off: "Ingen",
    motion_on: "Rörelse",
    motion_off: "Ingen",
    occupied: "Närvaro upptäckt",
    now: "nyss",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Dölj inaktiva sensorer",
    ed_only_alerts_helper: "Bara öppna sensorer och sensorer som upptäcker läcka eller närvaro förblir synliga",
    ed_hide_when_clear: "Dölj kortet när allt är lugnt",
    ed_hide_when_clear_helper: "Kortet visas bara när en dörr eller ett fönster är öppet, eller när en läcka eller närvaro upptäcks",
    ed_presence: "Inkludera närvarosensorer",
    ed_presence_helper: "Närvaro- och rörelsesensorer, utom kameror",
    ed_blink: "Blinkande varningar",
    ed_include: "Sensorer att lägga till",
    ed_include_helper: "Från ett annat rum eller utan rum",
    ed_exclude: "Sensorer att utesluta",
  },
  bg: {
    ed_columns_helper: "Мини карта: колони в увеличения изглед",
    title: "Сензори",
    no_sensors: "Няма сензори",
    leak_on: "Теч!",
    leak_off: "Сухо",
    open: "Отворено",
    closed: "Затворено",
    presence_on: "Засечено",
    presence_off: "Няма",
    motion_on: "Движение",
    motion_off: "Няма",
    occupied: "Засечено присъствие",
    now: "току-що",
    min: "{n} мин",
    hour: "{n} ч",
    day: "{n} д",
    ed_only_alerts: "Скрий неактивните сензори",
    ed_only_alerts_helper: "Остават видими само отворените сензори и тези, които засичат теч или присъствие",
    ed_hide_when_clear: "Скрий картата, когато всичко е спокойно",
    ed_hide_when_clear_helper: "Картата се показва само когато врата или прозорец е отворен или е засечен теч или присъствие",
    ed_presence: "Включи сензорите за присъствие",
    ed_presence_helper: "Сензори за присъствие и движение, без камери",
    ed_blink: "Мигащи предупреждения",
    ed_include: "Сензори за добавяне",
    ed_include_helper: "От друга стая или без стая",
    ed_exclude: "Сензори за пропускане",
  },
  ru: {
    ed_columns_helper: "Мини-карточка: столбцы развёрнутого вида",
    title: "Датчики",
    no_sensors: "Нет датчиков",
    leak_on: "Протечка!",
    leak_off: "Сухо",
    open: "Открыто",
    closed: "Закрыто",
    presence_on: "Обнаружено",
    presence_off: "Нет",
    motion_on: "Движение",
    motion_off: "Нет",
    occupied: "Обнаружено присутствие",
    now: "только что",
    min: "{n} мин",
    hour: "{n} ч",
    day: "{n} д",
    ed_only_alerts: "Скрыть неактивные датчики",
    ed_only_alerts_helper: "Видны только открытые датчики и датчики, обнаружившие протечку или присутствие",
    ed_hide_when_clear: "Скрывать карточку, когда всё спокойно",
    ed_hide_when_clear_helper: "Карточка появляется, только когда открыта дверь или окно либо обнаружены протечка или присутствие",
    ed_presence: "Учитывать датчики присутствия",
    ed_presence_helper: "Датчики присутствия и движения, кроме камер",
    ed_blink: "Мигающие оповещения",
    ed_include: "Добавить датчики",
    ed_include_helper: "Из другой комнаты или без комнаты",
    ed_exclude: "Исключить датчики",
  },
  uk: {
    ed_columns_helper: "Міні-картка: стовпці розгорнутого вигляду",
    title: "Датчики",
    no_sensors: "Немає датчиків",
    leak_on: "Протікання!",
    leak_off: "Сухо",
    open: "Відчинено",
    closed: "Зачинено",
    presence_on: "Виявлено",
    presence_off: "Немає",
    motion_on: "Рух",
    motion_off: "Немає",
    occupied: "Виявлено присутність",
    now: "щойно",
    min: "{n} хв",
    hour: "{n} год",
    day: "{n} д",
    ed_only_alerts: "Приховати неактивні датчики",
    ed_only_alerts_helper: "Видимими залишаються лише відчинені датчики та ті, що виявили протікання чи присутність",
    ed_hide_when_clear: "Приховувати картку, коли все спокійно",
    ed_hide_when_clear_helper: "Картка з'являється, лише коли відчинено двері чи вікно або виявлено протікання чи присутність",
    ed_presence: "Враховувати датчики присутності",
    ed_presence_helper: "Датчики присутності та руху, крім камер",
    ed_blink: "Блимання сповіщень",
    ed_include: "Додати датчики",
    ed_include_helper: "З іншої кімнати або без кімнати",
    ed_exclude: "Виключити датчики",
  },
  hu: {
    ed_columns_helper: "Mini kártya: a nagyított nézet oszlopai",
    title: "Érzékelők",
    no_sensors: "Nincs érzékelő",
    leak_on: "Szivárgás!",
    leak_off: "Száraz",
    open: "Nyitva",
    closed: "Zárva",
    presence_on: "Észlelve",
    presence_off: "Nincs",
    motion_on: "Mozgás",
    motion_off: "Nincs",
    occupied: "Jelenlét észlelve",
    now: "épp most",
    min: "{n} perc",
    hour: "{n} óra",
    day: "{n} nap",
    ed_only_alerts: "Inaktív érzékelők elrejtése",
    ed_only_alerts_helper: "Csak a nyitott, szivárgást vagy jelenlétet észlelő érzékelők maradnak láthatók",
    ed_hide_when_clear: "A kártya elrejtése, ha minden nyugodt",
    ed_hide_when_clear_helper: "A kártya csak akkor jelenik meg, ha egy ajtó vagy ablak nyitva van, vagy szivárgást, illetve jelenlétet észlel",
    ed_presence: "Jelenlét-érzékelők bevonása",
    ed_presence_helper: "Jelenlét- és mozgásérzékelők, kamerák nélkül",
    ed_blink: "Villogó riasztások",
    ed_include: "Hozzáadandó érzékelők",
    ed_include_helper: "Másik helyiségből vagy helyiség nélkül",
    ed_exclude: "Kihagyott érzékelők",
  },
  sk: {
    ed_columns_helper: "Minikarta: stĺpce priblíženého zobrazenia",
    title: "Senzory",
    no_sensors: "Žiadne senzory",
    leak_on: "Únik!",
    leak_off: "Sucho",
    open: "Otvorené",
    closed: "Zatvorené",
    presence_on: "Zistená",
    presence_off: "Nikto",
    motion_on: "Pohyb",
    motion_off: "Žiadny",
    occupied: "Zistená prítomnosť",
    now: "práve teraz",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Skryť neaktívne senzory",
    ed_only_alerts_helper: "Viditeľné zostanú len otvorené senzory a senzory, ktoré zistili únik alebo prítomnosť",
    ed_hide_when_clear: "Skryť kartu, keď je všetko pokojné",
    ed_hide_when_clear_helper: "Karta sa zobrazí len vtedy, keď sú otvorené dvere alebo okno, alebo keď sa zistí únik či prítomnosť",
    ed_presence: "Zahrnúť senzory prítomnosti",
    ed_presence_helper: "Senzory prítomnosti a pohybu, bez kamier",
    ed_blink: "Blikajúce upozornenia",
    ed_include: "Senzory na pridanie",
    ed_include_helper: "Z inej miestnosti alebo bez miestnosti",
    ed_exclude: "Vynechané senzory",
  },
  cs: {
    ed_columns_helper: "Minikarta: sloupce přiblíženého zobrazení",
    title: "Senzory",
    no_sensors: "Žádné senzory",
    leak_on: "Únik!",
    leak_off: "Sucho",
    open: "Otevřeno",
    closed: "Zavřeno",
    presence_on: "Zjištěna",
    presence_off: "Nikdo",
    motion_on: "Pohyb",
    motion_off: "Žádný",
    occupied: "Zjištěna přítomnost",
    now: "právě teď",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Skrýt neaktivní senzory",
    ed_only_alerts_helper: "Viditelné zůstanou jen otevřené senzory a senzory, které zjistily únik nebo přítomnost",
    ed_hide_when_clear: "Skrýt kartu, když je vše v klidu",
    ed_hide_when_clear_helper: "Karta se zobrazí jen tehdy, když jsou otevřené dveře nebo okno, nebo když se zjistí únik či přítomnost",
    ed_presence: "Zahrnout senzory přítomnosti",
    ed_presence_helper: "Senzory přítomnosti a pohybu, bez kamer",
    ed_blink: "Blikající upozornění",
    ed_include: "Senzory k přidání",
    ed_include_helper: "Z jiné místnosti nebo bez místnosti",
    ed_exclude: "Vynechané senzory",
  },
  sl: {
    ed_columns_helper: "Mini kartica: stolpci povečanega pogleda",
    title: "Senzorji",
    no_sensors: "Ni senzorjev",
    leak_on: "Puščanje!",
    leak_off: "Suho",
    open: "Odprto",
    closed: "Zaprto",
    presence_on: "Zaznana",
    presence_off: "Nikogar",
    motion_on: "Gibanje",
    motion_off: "Ni gibanja",
    occupied: "Zaznana prisotnost",
    now: "pravkar",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Skrij neaktivne senzorje",
    ed_only_alerts_helper: "Vidni ostanejo samo odprti senzorji in senzorji, ki zaznavajo puščanje ali prisotnost",
    ed_hide_when_clear: "Skrij kartico, ko je vse mirno",
    ed_hide_when_clear_helper: "Kartica se prikaže samo, ko so vrata ali okno odprti ali ko je zaznano puščanje ali prisotnost",
    ed_presence: "Vključi senzorje prisotnosti",
    ed_presence_helper: "Senzorji prisotnosti in gibanja, brez kamer",
    ed_blink: "Utripajoča opozorila",
    ed_include: "Senzorji za dodajanje",
    ed_include_helper: "Iz drugega prostora ali brez prostora",
    ed_exclude: "Izpuščeni senzorji",
  },
  lv: {
    ed_columns_helper: "Mini karte: palielinātā skata kolonnas",
    title: "Sensori",
    no_sensors: "Nav sensoru",
    leak_on: "Noplūde!",
    leak_off: "Sauss",
    open: "Atvērts",
    closed: "Aizvērts",
    presence_on: "Konstatēta",
    presence_off: "Nav",
    motion_on: "Kustība",
    motion_off: "Nav",
    occupied: "Konstatēta klātbūtne",
    now: "tikko",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_only_alerts: "Paslēpt neaktīvos sensorus",
    ed_only_alerts_helper: "Redzami paliek tikai atvērtie sensori un tie, kas konstatē noplūdi vai klātbūtni",
    ed_hide_when_clear: "Paslēpt karti, kad viss ir mierīgi",
    ed_hide_when_clear_helper: "Karte parādās tikai tad, kad ir atvērtas durvis vai logs vai konstatēta noplūde vai klātbūtne",
    ed_presence: "Iekļaut klātbūtnes sensorus",
    ed_presence_helper: "Klātbūtnes un kustības sensori, izņemot kameras",
    ed_blink: "Mirgojoši brīdinājumi",
    ed_include: "Pievienojamie sensori",
    ed_include_helper: "No citas telpas vai bez telpas",
    ed_exclude: "Izslēdzamie sensori",
  },
  el: {
    ed_columns_helper: "Μίνι κάρτα: στήλες της μεγεθυμένης προβολής",
    title: "Αισθητήρες",
    no_sensors: "Κανένας αισθητήρας",
    leak_on: "Διαρροή!",
    leak_off: "Στεγνό",
    open: "Ανοιχτό",
    closed: "Κλειστό",
    presence_on: "Ανιχνεύθηκε",
    presence_off: "Καμία",
    motion_on: "Κίνηση",
    motion_off: "Καμία",
    occupied: "Ανιχνεύθηκε παρουσία",
    now: "μόλις τώρα",
    min: "{n} λεπ.",
    hour: "{n} ώ.",
    day: "{n} ημ.",
    ed_only_alerts: "Απόκρυψη ανενεργών αισθητήρων",
    ed_only_alerts_helper: "Μένουν ορατοί μόνο οι ανοιχτοί αισθητήρες και όσοι ανιχνεύουν διαρροή ή παρουσία",
    ed_hide_when_clear: "Απόκρυψη της κάρτας όταν όλα είναι ήσυχα",
    ed_hide_when_clear_helper: "Η κάρτα εμφανίζεται μόνο όταν μια πόρτα ή ένα παράθυρο είναι ανοιχτό ή όταν ανιχνεύεται διαρροή ή παρουσία",
    ed_presence: "Συμπερίληψη αισθητήρων παρουσίας",
    ed_presence_helper: "Αισθητήρες παρουσίας και κίνησης, εκτός από κάμερες",
    ed_blink: "Ειδοποιήσεις που αναβοσβήνουν",
    ed_include: "Αισθητήρες προς προσθήκη",
    ed_include_helper: "Από άλλο δωμάτιο ή χωρίς δωμάτιο",
    ed_exclude: "Αισθητήρες προς εξαίρεση",
  },
};

// ── Sensor kinds ─────────────────────────────────────────────────────────────
// `fem`: the state is feminine in the languages that have `open_f` / `closed_f` (fr: porte, fenêtre; es: puerta, ventana;
// it: porta, finestra; pt: porta, janela; ro: ușă, fereastră).
// `info`: an active state that is not an alert (presence, motion).
const RS_KINDS = {
  leak: { on: "mdi:water-alert", off: "mdi:water-check" },
  slide: { on: "mdi:door-sliding-open", off: "mdi:door-sliding", fem: true },
  window: { on: "mdi:window-open-variant", off: "mdi:window-closed-variant", fem: true },
  garage: { on: "mdi:garage-open", off: "mdi:garage" },
  door: { on: "mdi:door-open", off: "mdi:door-closed", fem: true },
  opening: { on: "mdi:square-rounded-badge-outline", off: "mdi:square-rounded-outline" },
  presence: { on: "mdi:account", off: "mdi:account-outline", info: true },
  motion: { on: "mdi:motion-sensor", off: "mdi:motion-sensor-off", info: true },
};

const rsKindOf = (st) => {
  const dc = st.attributes.device_class;
  const id = st.entity_id;
  if (dc === "moisture") return "leak";
  if (dc === "occupancy" || dc === "presence") return "presence";
  if (dc === "motion") return "motion";
  if (dc === "garage_door") return "garage";
  if (/porte_fenetre|baie|sliding|patio/.test(id)) return "slide";
  if (dc === "window" || /fenetre|window/.test(id)) return "window";
  if (dc === "door") return "door";
  return "opening";
};

// "Capteur Porte Fenêtre Cuisine Porte" → "Porte Fenêtre Cuisine",
// "Capteur Présence Entrée Occupation" in Entrée → "Présence"
const RS_PREFIX = /^(capteur|sensor)\s+/i;
const RS_SUFFIX =
  /\s+(porte|ouverture|fuite d.eau|contact|door|window|opening|moisture|leak|occupation|occupancy|motion|mouvement)$/i;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomSensorsCard extends RcCard {
  static tag = "room-sensors-card";
  static i18n = RS_I18N;
  static needsArea = true;
  static includeDomains = ["binary_sensor"];
  static defaults = { columns: 2, only_alerts: false, hide_when_clear: false, presence: true, blink: true, exclude: [] };

  _candidate(id) {
    return rcMatchSensor(this._hass, id, { presence: this._config.presence, cameras: this._cameras });
  }

  // The "since" labels move with the clock, not only with the states: redrawn every minute while the card is shown
  // (the signature skips the redraw when no label changed; never during a press).
  connectedCallback() {
    super.connectedCallback?.();
    clearInterval(this._clock);
    this._clock = setInterval(() => {
      if (!this._pressing && !this._dragging) this._render();
    }, 60000);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._clock);
    this._clock = null;
  }

  _stateText(kind, on) {
    if (kind === "leak") return this._t(on ? "leak_on" : "leak_off");
    if (RS_KINDS[kind].info) return this._t(`${kind}_${on ? "on" : "off"}`);
    if (RS_KINDS[kind].fem && RS_I18N[this._lang()]?.open_f) return this._t(on ? "open_f" : "closed_f");
    return this._t(on ? "open" : "closed");
  }

  // Leaks first, then open doors and windows, then detected presence, then the rest.
  _rank(i) {
    if (!i.on) return 0;
    if (i.kind === "leak") return 3;
    return i.info ? 1 : 2;
  }

  _ago(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return this._t("now");
    if (s < 3600) return this._t("min", { n: Math.floor(s / 60) });
    if (s < 86400) return this._t("hour", { n: Math.floor(s / 3600) });
    return this._t("day", { n: Math.floor(s / 86400) });
  }

  _prepare() {
    this._cameras = rcCameraDevices(this._hass);
  }

  _collect() {
    const areaName = this._areaName();
    return this._entries()
      .map((e) => {
        const st = this._hass.states[e.entity];
        const kind = rsKindOf(st);
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        return {
          id: e.entity,
          kind,
          info: !!RS_KINDS[kind].info,
          on,
          unavailable,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RS_PREFIX, RS_SUFFIX),
          icon: e.icon ?? (on ? RS_KINDS[kind].on : RS_KINDS[kind].off),
          state: unavailable ? this._t("unavailable") : this._stateText(kind, on),
          since: st.last_changed,
        };
      })
      .sort((a, b) => this._rank(b) - this._rank(a) || a.name.localeCompare(b.name));
  }

  // State of the room, shared by the full and the mini card.
  _summary(items) {
    const leaks = items.filter((i) => i.kind === "leak" && i.on).length;
    const open = items.filter((i) => i.kind !== "leak" && !i.info && i.on).length;
    return {
      leaks,
      open,
      occupied: items.some((i) => i.info && i.on),
      level: leaks ? "alert" : open ? "warn" : "ok",
      icon: leaks ? "mdi:water-alert" : open ? "mdi:shield-alert-outline" : "mdi:shield-home-outline",
      status: this._openingStatus(
        leaks,
        open,
        items.some((i) => i.kind !== "leak" && !i.info),
        items.length ? "all_quiet" : "no_sensors",
      ),
    };
  }

  // The summary and the sensors to draw, or null when nothing changed since `parts` were last drawn or the card is
  // hidden (`hide_when_clear`: only when everything is closed and dry, and nobody is there).
  _visible(items, parts) {
    const c = this._config;
    const sum = this._summary(items);
    if (!this._changed(parts)) return null;
    if (this._hide(c.hide_when_clear && sum.level === "ok" && !sum.occupied)) return null;
    const shown = c.only_alerts ? items.filter((i) => i.on || i.unavailable) : items;
    this._shown = shown.length;
    return { ...sum, shown };
  }

  _draw(items) {
    const c = this._config;
    // The "since" label moves every minute; computed once per item (signature, then tile).
    const ago = new Map(items.map((i) => [i.id, i.on ? this._ago(i.since) : ""]));
    const v = this._visible(items, items.map((i) => [i.id, i.on, i.unavailable, i.name, ago.get(i.id)]));
    if (!v) return;
    const { occupied, level, icon, status, shown } = v;
    const tiles = shown
      .map((i) =>
        this._tile(i, {
          cls: `${i.kind === "leak" ? " leak" : ""}${i.info ? " info" : ""}`,
          state: `${rcEsc(i.state)}${i.on ? ` · <span class="since">${rcEsc(ago.get(i.id))}</span>` : ""}`,
        }),
      )
      .join("");
    const chips = occupied
      ? `<div class="chip" title="${rcEsc(this._t("occupied"))}"><ha-icon icon="mdi:account"></ha-icon></div>`
      : "";
    const head = this._head({
      icon,
      title: c.title || this._areaName() || this._t("title"),
      status,
      chips,
    });
    this._paint(level, head, tiles, c.blink === false ? " no-blink" : "");
  }

  // A tap opens the details: a sensor cannot be toggled.
  _bindTile(el) {
    el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
  }

  static styles = `
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }
    .chip { flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
            color: var(--rc-info); background: color-mix(in srgb, var(--rc-info) 14%, transparent); }
    .chip ha-icon { --mdc-icon-size: 13px; }
    .tile { --t: var(--rc-ok); }
    .tile.on      { --t: var(--rc-warn); }
    .tile.on.leak { --t: var(--rc-alert); }
    .tile.on.info { --t: var(--rc-info); }
    .tile:not(.off) .state { color: var(--t); }
    .tile.on:not(.info) .ic { animation: rc-blink 1.5s ease-in-out infinite; }
    .since { opacity: .8; }
    .no-blink .tile.on .ic, .no-blink.lvl-alert .badge { animation: none; }
    @media (prefers-reduced-motion: reduce) { .tile.on .ic { animation: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomSensorsCardEditor = rcEditor({
  card: RoomSensorsCard,
  helpers: ["title", "only_alerts", "hide_when_clear", "presence", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_alerts", "hide_when_clear", "presence", "blink"),
    ...rcIncludeField(RoomSensorsCard, hass, config),
    ...rcExcludeField(RoomSensorsCard, hass, config),
    ...rcAdvanced(RS_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomSensorsCard,
  RoomSensorsCardEditor,
  "Room Sensors Card",
  "Leak, door, window, opening and presence sensors of a room, open ones first",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then a tinted pill (icon and name) for each open, leaking or
// detecting sensor; quiet sensors only show once zoomed in to the full card.
class RoomSensorsMiniCard extends rcMini(
  RoomSensorsCard,
  "room-sensors-mini-card",
  `
    .r.icon { padding: 0 3px; }
    .r.icon ha-icon { margin-right: 0; }
    .r.on      { --t: var(--rc-warn); }
    .r.on.leak { --t: var(--rc-alert); }
    .r.on.info { --t: var(--rc-info); }
    .r.na      { --t: var(--rc-na); opacity: .7; }
    .r.on:not(.info) ha-icon { animation: rc-blink 1.5s ease-in-out infinite; }
    .no-blink .r.on ha-icon { animation: none; }
    @media (prefers-reduced-motion: reduce) { .r.on ha-icon { animation: none; } }
  `,
  { alertsOnly: true },
) {
  _drawMini(items) {
    const v = this._visible(items, ["mini", items.map((i) => [i.id, i.on, i.unavailable, i.name, i.icon])]);
    if (!v) return;
    const { level, icon, status, shown } = v;
    const chips = shown
      .map((i) => {
        const cls = `${i.on ? " on pill" : " icon"}${i.kind === "leak" ? " leak" : ""}${i.info ? " info" : ""}${i.unavailable ? " na" : ""}`;
        return `
        <button class="r${cls}" data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
          <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${i.on ? `<span>${rcEsc(i.name)}</span>` : ""}
        </button>`;
      })
      .join("");
    this._paintMini({ level, icon, status, chips, cls: this._config.blink === false ? " no-blink" : "" });
  }
}

const RoomSensorsMiniCardEditor = rcEditor({
  card: RoomSensorsMiniCard,
  helpers: ["title", "columns", "hide_when_clear", "presence", "zoom", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("hide_when_clear", "presence", "blink", "zoom"),
    ...rcIncludeField(RoomSensorsMiniCard, hass, config),
    ...rcExcludeField(RoomSensorsMiniCard, hass, config),
    ...rcAdvanced(RS_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomSensorsMiniCard,
  RoomSensorsMiniCardEditor,
  "Room Sensors Mini Card",
  "The sensors of a room on two lines: open, leaking or detecting ones first, with a zoom to the full card",
);
