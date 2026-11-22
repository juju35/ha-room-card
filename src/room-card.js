/**
 * room-card — a whole room in one card: its lights, plugs, door / window / presence sensors and environment readings,
 * from its Home Assistant area. Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RM_I18N = {
  en: {
    title: "Room",
    occupied: "Occupied",
    lights_on_one: "{n} light on",
    lights_on_many: "{n} lights on",
    chip_lights: "Lights on",
    chip_plugs: "Plugs on",
    no_entities: "Nothing found in this room",
    ed_sections: "Sections",
    ed_sections_helper: "Shown in this order; empty: all of them",
    ed_collapsed: "Folded sections",
    ed_collapsed_helper: "Start folded; tap a section's header to unfold it",
    ed_show_environment: "Environment readings",
    ed_show_environment_helper: "Temperature, humidity, air quality… under the header",
    ed_include: "Entities to add",
    ed_include_helper: "From another room or without one: lights, plugs, door, window and presence sensors, environment readings",
    ed_exclude: "Entities to exclude",
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /kitchen",
    ed_columns_helper: "Columns of each section's tiles",
  },
  fr: {
    title: "Pièce",
    occupied: "Occupée",
    lights_on_one: "{n} lumière allumée",
    lights_on_many: "{n} lumières allumées",
    chip_lights: "Lumières allumées",
    chip_plugs: "Prises allumées",
    no_entities: "Rien trouvé dans cette pièce",
    ed_sections: "Sections",
    ed_sections_helper: "Affichées dans cet ordre ; vide : toutes",
    ed_collapsed: "Sections repliées",
    ed_collapsed_helper: "Repliées au départ ; un tap sur l'en-tête d'une section la déplie",
    ed_show_environment: "Mesures d'ambiance",
    ed_show_environment_helper: "Température, humidité, qualité de l'air… sous l'en-tête",
    ed_include: "Entités à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce : lumières, prises, capteurs de porte, de fenêtre et de présence, mesures d'ambiance",
    ed_exclude: "Entités à exclure",
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /cuisine",
    ed_columns_helper: "Colonnes des tuiles de chaque section",
  },
  de: {
    title: "Raum",
    occupied: "Belegt",
    lights_on_one: "{n} Licht an",
    lights_on_many: "{n} Lichter an",
    chip_lights: "Lichter an",
    chip_plugs: "Steckdosen an",
    no_entities: "In diesem Raum wurde nichts gefunden",
    ed_sections: "Abschnitte",
    ed_sections_helper: "In dieser Reihenfolge angezeigt; leer: alle",
    ed_collapsed: "Eingeklappte Abschnitte",
    ed_collapsed_helper: "Anfangs eingeklappt; Tippen auf den Kopf eines Abschnitts klappt ihn aus",
    ed_show_environment: "Umgebungswerte",
    ed_show_environment_helper: "Temperatur, Luftfeuchtigkeit, Luftqualität … unter dem Kopfbereich",
    ed_include: "Hinzuzufügende Entitäten",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum: Lichter, Steckdosen, Tür-, Fenster- und Präsenzsensoren, Umgebungswerte",
    ed_exclude: "Auszuschließende Entitäten",
    ed_navigation_path_helper: "Dashboard, das beim Tippen auf den Titel geöffnet wird, z. B. /kueche",
    ed_columns_helper: "Spalten der Kacheln jedes Abschnitts",
  },
  es: {
    title: "Habitación",
    occupied: "Ocupada",
    lights_on_one: "{n} luz encendida",
    lights_on_many: "{n} luces encendidas",
    chip_lights: "Luces encendidas",
    chip_plugs: "Enchufes encendidos",
    no_entities: "No se encontró nada en esta habitación",
    ed_sections: "Secciones",
    ed_sections_helper: "Se muestran en este orden; vacío: todas",
    ed_collapsed: "Secciones plegadas",
    ed_collapsed_helper: "Plegadas al inicio; toca el encabezado de una sección para desplegarla",
    ed_show_environment: "Lecturas ambientales",
    ed_show_environment_helper: "Temperatura, humedad, calidad del aire… bajo el encabezado",
    ed_include: "Entidades a añadir",
    ed_include_helper: "De otra habitación o sin habitación: luces, enchufes, sensores de puerta, ventana y presencia, lecturas ambientales",
    ed_exclude: "Entidades a excluir",
    ed_navigation_path_helper: "Panel que se abre al tocar el título, p. ej. /cocina",
    ed_columns_helper: "Columnas de los mosaicos de cada sección",
  },
  sr: {
    title: "Просторија",
    occupied: "Заузета",
    lights_on_one: "{n} светло укључено",
    lights_on_few: "{n} светла укључена",
    lights_on_many: "{n} светала укључено",
    chip_lights: "Укључена светла",
    chip_plugs: "Укључене утичнице",
    no_entities: "У овој просторији ништа није пронађено",
    ed_sections: "Одељци",
    ed_sections_helper: "Приказују се овим редом; празно: сви",
    ed_collapsed: "Скупљени одељци",
    ed_collapsed_helper: "Скупљени на почетку; додир на заглавље одељка га отвара",
    ed_show_environment: "Очитавања амбијента",
    ed_show_environment_helper: "Температура, влажност, квалитет ваздуха… испод заглавља",
    ed_include: "Ентитети за додавање",
    ed_include_helper: "Из друге просторије или без ње: светла, утичнице, сензори врата, прозора и присуства, очитавања амбијента",
    ed_exclude: "Изостави ентитете",
    ed_navigation_path_helper: "Контролна табла која се отвара додиром на наслов, нпр. /kuhinja",
    ed_columns_helper: "Колоне плочица сваког одељка",
  },
  "sr-Latn": {
    title: "Prostorija",
    occupied: "Zauzeta",
    lights_on_one: "{n} svetlo uključeno",
    lights_on_few: "{n} svetla uključena",
    lights_on_many: "{n} svetala uključeno",
    chip_lights: "Uključena svetla",
    chip_plugs: "Uključene utičnice",
    no_entities: "U ovoj prostoriji ništa nije pronađeno",
    ed_sections: "Odeljci",
    ed_sections_helper: "Prikazuju se ovim redom; prazno: svi",
    ed_collapsed: "Skupljeni odeljci",
    ed_collapsed_helper: "Skupljeni na početku; dodir na zaglavlje odeljka ga otvara",
    ed_show_environment: "Očitavanja ambijenta",
    ed_show_environment_helper: "Temperatura, vlažnost, kvalitet vazduha… ispod zaglavlja",
    ed_include: "Entiteti za dodavanje",
    ed_include_helper: "Iz druge prostorije ili bez nje: svetla, utičnice, senzori vrata, prozora i prisustva, očitavanja ambijenta",
    ed_exclude: "Izostavi entitete",
    ed_navigation_path_helper: "Kontrolna tabla koja se otvara dodirom na naslov, npr. /kuhinja",
    ed_columns_helper: "Kolone pločica svakog odeljka",
  },
  it: {
    title: "Stanza",
    occupied: "Occupata",
    lights_on_one: "{n} luce accesa",
    lights_on_many: "{n} luci accese",
    chip_lights: "Luci accese",
    chip_plugs: "Prese accese",
    no_entities: "Nessun elemento trovato in questa stanza",
    ed_sections: "Sezioni",
    ed_sections_helper: "Mostrate in quest'ordine; vuoto: tutte",
    ed_collapsed: "Sezioni chiuse",
    ed_collapsed_helper: "Chiuse all'inizio; tocca l'intestazione di una sezione per aprirla",
    ed_show_environment: "Letture ambientali",
    ed_show_environment_helper: "Temperatura, umidità, qualità dell'aria… sotto l'intestazione",
    ed_include: "Entità da aggiungere",
    ed_include_helper: "Da un'altra stanza o senza stanza: luci, prese, sensori di porta, finestra e presenza, letture ambientali",
    ed_exclude: "Entità da escludere",
    ed_navigation_path_helper: "Plancia aperta toccando il titolo, ad es. /cucina",
    ed_columns_helper: "Colonne dei riquadri di ogni sezione",
  },
  nl: {
    title: "Ruimte",
    occupied: "Bezet",
    lights_on_one: "{n} lamp aan",
    lights_on_many: "{n} lampen aan",
    chip_lights: "Lampen aan",
    chip_plugs: "Stekkers aan",
    no_entities: "Niets gevonden in deze ruimte",
    ed_sections: "Secties",
    ed_sections_helper: "In deze volgorde getoond; leeg: allemaal",
    ed_collapsed: "Ingeklapte secties",
    ed_collapsed_helper: "Bij de start ingeklapt; tik op de kop van een sectie om die uit te klappen",
    ed_show_environment: "Omgevingswaarden",
    ed_show_environment_helper: "Temperatuur, luchtvochtigheid, luchtkwaliteit… onder de koptekst",
    ed_include: "Toe te voegen entiteiten",
    ed_include_helper: "Uit een andere ruimte of zonder ruimte: lampen, stekkers, deur-, raam- en aanwezigheidssensoren, omgevingswaarden",
    ed_exclude: "Uit te sluiten entiteiten",
    ed_navigation_path_helper: "Dashboard dat opent bij een tik op de titel, bijv. /keuken",
    ed_columns_helper: "Kolommen van de tegels van elke sectie",
  },
  pt: {
    title: "Divisão",
    occupied: "Ocupada",
    lights_on_one: "{n} luz acesa",
    lights_on_many: "{n} luzes acesas",
    chip_lights: "Luzes acesas",
    chip_plugs: "Tomadas ligadas",
    no_entities: "Nada encontrado nesta divisão",
    ed_sections: "Secções",
    ed_sections_helper: "Mostradas por esta ordem; vazio: todas",
    ed_collapsed: "Secções recolhidas",
    ed_collapsed_helper: "Recolhidas ao início; toque no cabeçalho de uma secção para a expandir",
    ed_show_environment: "Leituras ambientais",
    ed_show_environment_helper: "Temperatura, humidade, qualidade do ar… sob o cabeçalho",
    ed_include: "Entidades a adicionar",
    ed_include_helper: "De outra divisão ou sem divisão: luzes, tomadas, sensores de porta, janela e presença, leituras ambientais",
    ed_exclude: "Entidades a excluir",
    ed_navigation_path_helper: "Painel aberto ao tocar no título, p. ex. /cozinha",
    ed_columns_helper: "Colunas dos mosaicos de cada secção",
  },
  pl: {
    title: "Pomieszczenie",
    occupied: "Zajęte",
    lights_on_one: "Włączone światła: {n}",
    lights_on_many: "Włączone światła: {n}",
    chip_lights: "Włączone światła",
    chip_plugs: "Włączone gniazdka",
    no_entities: "Nic nie znaleziono w tym pomieszczeniu",
    ed_sections: "Sekcje",
    ed_sections_helper: "Wyświetlane w tej kolejności; puste: wszystkie",
    ed_collapsed: "Zwinięte sekcje",
    ed_collapsed_helper: "Zwinięte na starcie; dotknij nagłówka sekcji, aby ją rozwinąć",
    ed_show_environment: "Odczyty środowiska",
    ed_show_environment_helper: "Temperatura, wilgotność, jakość powietrza… pod nagłówkiem",
    ed_include: "Encje do dodania",
    ed_include_helper: "Z innego pomieszczenia lub bez pomieszczenia: światła, gniazdka, czujniki drzwi, okien i obecności, odczyty środowiska",
    ed_exclude: "Encje do wykluczenia",
    ed_navigation_path_helper: "Dashboard otwierany po dotknięciu tytułu, np. /kuchnia",
    ed_columns_helper: "Kolumny kafelków każdej sekcji",
  },
  ro: {
    title: "Cameră",
    occupied: "Ocupată",
    lights_on_one: "Lumini aprinse: {n}",
    lights_on_many: "Lumini aprinse: {n}",
    chip_lights: "Lumini aprinse",
    chip_plugs: "Prize pornite",
    no_entities: "Nimic găsit în această cameră",
    ed_sections: "Secțiuni",
    ed_sections_helper: "Afișate în această ordine; gol: toate",
    ed_collapsed: "Secțiuni pliate",
    ed_collapsed_helper: "Pliate la început; atinge antetul unei secțiuni pentru a o desface",
    ed_show_environment: "Valori ambientale",
    ed_show_environment_helper: "Temperatură, umiditate, calitatea aerului… sub antet",
    ed_include: "Entități de adăugat",
    ed_include_helper: "Din altă cameră sau fără cameră: lumini, prize, senzori de ușă, fereastră și prezență, valori ambientale",
    ed_exclude: "Entități excluse",
    ed_navigation_path_helper: "Tablou de bord deschis la atingerea titlului, de ex. /bucatarie",
    ed_columns_helper: "Coloanele dalelor fiecărei secțiuni",
  },
  da: {
    title: "Rum",
    occupied: "Optaget",
    lights_on_one: "{n} lys tændt",
    lights_on_many: "{n} lys tændt",
    chip_lights: "Tændte lys",
    chip_plugs: "Tændte stikkontakter",
    no_entities: "Intet fundet i dette rum",
    ed_sections: "Sektioner",
    ed_sections_helper: "Vises i denne rækkefølge; tom: alle",
    ed_collapsed: "Sammenklappede sektioner",
    ed_collapsed_helper: "Sammenklappet fra start; tryk på en sektions overskrift for at folde den ud",
    ed_show_environment: "Miljømålinger",
    ed_show_environment_helper: "Temperatur, luftfugtighed, luftkvalitet… under overskriften",
    ed_include: "Enheder, der tilføjes",
    ed_include_helper: "Fra et andet rum eller uden rum: lys, stikkontakter, dør-, vindues- og tilstedeværelsessensorer, miljømålinger",
    ed_exclude: "Enheder, der udelades",
    ed_navigation_path_helper: "Dashboard, der åbnes ved tryk på titlen, f.eks. /koekken",
    ed_columns_helper: "Kolonner af fliser i hver sektion",
  },
  sv: {
    title: "Rum",
    occupied: "Upptaget",
    lights_on_one: "{n} lampa tänd",
    lights_on_many: "{n} lampor tända",
    chip_lights: "Tända lampor",
    chip_plugs: "Påslagna uttag",
    no_entities: "Inget hittades i det här rummet",
    ed_sections: "Sektioner",
    ed_sections_helper: "Visas i den här ordningen; tomt: alla",
    ed_collapsed: "Hopfällda sektioner",
    ed_collapsed_helper: "Hopfällda från början; tryck på en sektions rubrik för att fälla ut den",
    ed_show_environment: "Miljövärden",
    ed_show_environment_helper: "Temperatur, luftfuktighet, luftkvalitet… under rubriken",
    ed_include: "Entiteter att lägga till",
    ed_include_helper: "Från ett annat rum eller utan rum: lampor, uttag, dörr-, fönster- och närvarosensorer, miljövärden",
    ed_exclude: "Entiteter att utesluta",
    ed_navigation_path_helper: "Instrumentpanel som öppnas vid tryck på titeln, t.ex. /kok",
    ed_columns_helper: "Kolumner med brickor i varje sektion",
  },
  bg: {
    title: "Стая",
    occupied: "Заета",
    lights_on_one: "{n} светлина включена",
    lights_on_many: "{n} светлини включени",
    chip_lights: "Включени светлини",
    chip_plugs: "Включени контакти",
    no_entities: "В тази стая не е намерено нищо",
    ed_sections: "Секции",
    ed_sections_helper: "Показват се в този ред; празно: всички",
    ed_collapsed: "Свити секции",
    ed_collapsed_helper: "Свити в началото; докоснете заглавието на секция, за да я разгънете",
    ed_show_environment: "Показания на средата",
    ed_show_environment_helper: "Температура, влажност, качество на въздуха… под заглавието",
    ed_include: "Обекти за добавяне",
    ed_include_helper: "От друга стая или без стая: светлини, контакти, сензори за врата, прозорец и присъствие, показания на средата",
    ed_exclude: "Обекти за пропускане",
    ed_navigation_path_helper: "Табло, което се отваря с докосване на заглавието, напр. /kuhnya",
    ed_columns_helper: "Колони плочки във всяка секция",
  },
  ru: {
    title: "Комната",
    occupied: "Занята",
    lights_on_one: "Включено светильников: {n}",
    lights_on_many: "Включено светильников: {n}",
    chip_lights: "Включённые светильники",
    chip_plugs: "Включённые розетки",
    no_entities: "В этой комнате ничего не найдено",
    ed_sections: "Разделы",
    ed_sections_helper: "Показываются в этом порядке; пусто: все",
    ed_collapsed: "Свёрнутые разделы",
    ed_collapsed_helper: "Свёрнуты изначально; нажмите на заголовок раздела, чтобы развернуть его",
    ed_show_environment: "Показатели среды",
    ed_show_environment_helper: "Температура, влажность, качество воздуха… под заголовком",
    ed_include: "Добавить объекты",
    ed_include_helper: "Из другой комнаты или без комнаты: светильники, розетки, датчики двери, окна и присутствия, показатели среды",
    ed_exclude: "Исключить объекты",
    ed_navigation_path_helper: "Панель, открываемая нажатием на заголовок, например /kitchen",
    ed_columns_helper: "Столбцы плиток каждого раздела",
  },
  uk: {
    title: "Кімната",
    occupied: "Зайнята",
    lights_on_one: "Увімкнено світильників: {n}",
    lights_on_many: "Увімкнено світильників: {n}",
    chip_lights: "Увімкнені світильники",
    chip_plugs: "Увімкнені розетки",
    no_entities: "У цій кімнаті нічого не знайдено",
    ed_sections: "Розділи",
    ed_sections_helper: "Показуються в цьому порядку; порожньо: усі",
    ed_collapsed: "Згорнуті розділи",
    ed_collapsed_helper: "Згорнуті спочатку; натисніть заголовок розділу, щоб розгорнути його",
    ed_show_environment: "Показники середовища",
    ed_show_environment_helper: "Температура, вологість, якість повітря… під заголовком",
    ed_include: "Додати сутності",
    ed_include_helper: "З іншої кімнати або без кімнати: світильники, розетки, датчики дверей, вікон і присутності, показники середовища",
    ed_exclude: "Виключити сутності",
    ed_navigation_path_helper: "Панель, що відкривається натисканням на заголовок, наприклад /kitchen",
    ed_columns_helper: "Стовпці плиток кожного розділу",
  },
  hu: {
    title: "Helyiség",
    occupied: "Foglalt",
    lights_on_one: "{n} lámpa bekapcsolva",
    lights_on_many: "{n} lámpa bekapcsolva",
    chip_lights: "Bekapcsolt lámpák",
    chip_plugs: "Bekapcsolt aljzatok",
    no_entities: "Ebben a helyiségben nem található semmi",
    ed_sections: "Szakaszok",
    ed_sections_helper: "Ebben a sorrendben jelennek meg; üres: mind",
    ed_collapsed: "Összecsukott szakaszok",
    ed_collapsed_helper: "Kezdetben összecsukva; koppints egy szakasz fejlécére a kibontáshoz",
    ed_show_environment: "Környezeti értékek",
    ed_show_environment_helper: "Hőmérséklet, páratartalom, levegőminőség… a fejléc alatt",
    ed_include: "Hozzáadandó entitások",
    ed_include_helper: "Másik helyiségből vagy helyiség nélkül: lámpák, aljzatok, ajtó-, ablak- és jelenlétérzékelők, környezeti értékek",
    ed_exclude: "Kihagyott entitások",
    ed_navigation_path_helper: "A címre koppintva megnyíló irányítópult, pl. /konyha",
    ed_columns_helper: "Az egyes szakaszok csempéinek oszlopai",
  },
  sk: {
    title: "Miestnosť",
    occupied: "Obsadená",
    lights_on_one: "Zapnuté svetlá: {n}",
    lights_on_many: "Zapnuté svetlá: {n}",
    chip_lights: "Zapnuté svetlá",
    chip_plugs: "Zapnuté zásuvky",
    no_entities: "V tejto miestnosti sa nič nenašlo",
    ed_sections: "Sekcie",
    ed_sections_helper: "Zobrazené v tomto poradí; prázdne: všetky",
    ed_collapsed: "Zbalené sekcie",
    ed_collapsed_helper: "Na začiatku zbalené; ťuknutím na hlavičku sekcie ju rozbalíte",
    ed_show_environment: "Hodnoty prostredia",
    ed_show_environment_helper: "Teplota, vlhkosť, kvalita vzduchu… pod hlavičkou",
    ed_include: "Entity na pridanie",
    ed_include_helper: "Z inej miestnosti alebo bez miestnosti: svetlá, zásuvky, senzory dverí, okien a prítomnosti, hodnoty prostredia",
    ed_exclude: "Vynechané entity",
    ed_navigation_path_helper: "Ovládací panel otvorený ťuknutím na názov, napr. /kuchyna",
    ed_columns_helper: "Stĺpce dlaždíc každej sekcie",
  },
  cs: {
    title: "Místnost",
    occupied: "Obsazená",
    lights_on_one: "Zapnutá světla: {n}",
    lights_on_many: "Zapnutá světla: {n}",
    chip_lights: "Zapnutá světla",
    chip_plugs: "Zapnuté zásuvky",
    no_entities: "V této místnosti nebylo nic nalezeno",
    ed_sections: "Sekce",
    ed_sections_helper: "Zobrazeny v tomto pořadí; prázdné: všechny",
    ed_collapsed: "Sbalené sekce",
    ed_collapsed_helper: "Na začátku sbalené; klepnutím na záhlaví sekce ji rozbalíte",
    ed_show_environment: "Hodnoty prostředí",
    ed_show_environment_helper: "Teplota, vlhkost, kvalita vzduchu… pod záhlavím",
    ed_include: "Entity k přidání",
    ed_include_helper: "Z jiné místnosti nebo bez místnosti: světla, zásuvky, senzory dveří, oken a přítomnosti, hodnoty prostředí",
    ed_exclude: "Vynechané entity",
    ed_navigation_path_helper: "Ovládací panel otevřený klepnutím na název, např. /kuchyne",
    ed_columns_helper: "Sloupce dlaždic každé sekce",
  },
  sl: {
    title: "Prostor",
    occupied: "Zaseden",
    lights_on_one: "Prižgane luči: {n}",
    lights_on_many: "Prižgane luči: {n}",
    chip_lights: "Prižgane luči",
    chip_plugs: "Vklopljene vtičnice",
    no_entities: "V tem prostoru ni bilo najdeno nič",
    ed_sections: "Razdelki",
    ed_sections_helper: "Prikazani v tem vrstnem redu; prazno: vsi",
    ed_collapsed: "Strnjeni razdelki",
    ed_collapsed_helper: "Na začetku strnjeni; dotaknite se glave razdelka, da ga razprete",
    ed_show_environment: "Vrednosti okolja",
    ed_show_environment_helper: "Temperatura, vlažnost, kakovost zraka… pod glavo",
    ed_include: "Entitete za dodajanje",
    ed_include_helper: "Iz drugega prostora ali brez prostora: luči, vtičnice, senzorji vrat, oken in prisotnosti, vrednosti okolja",
    ed_exclude: "Izpuščene entitete",
    ed_navigation_path_helper: "Nadzorna plošča, ki se odpre ob dotiku naslova, npr. /kuhinja",
    ed_columns_helper: "Stolpci ploščic vsakega razdelka",
  },
  lv: {
    title: "Telpa",
    occupied: "Aizņemta",
    lights_on_one: "Ieslēgtas gaismas: {n}",
    lights_on_many: "Ieslēgtas gaismas: {n}",
    chip_lights: "Ieslēgtas gaismas",
    chip_plugs: "Ieslēgtas kontaktligzdas",
    no_entities: "Šajā telpā nekas netika atrasts",
    ed_sections: "Sadaļas",
    ed_sections_helper: "Tiek rādītas šādā secībā; tukšs: visas",
    ed_collapsed: "Sakļautās sadaļas",
    ed_collapsed_helper: "Sākumā sakļautas; pieskarieties sadaļas galvenei, lai to izvērstu",
    ed_show_environment: "Vides rādījumi",
    ed_show_environment_helper: "Temperatūra, mitrums, gaisa kvalitāte… zem galvenes",
    ed_include: "Pievienojamās entītijas",
    ed_include_helper: "No citas telpas vai bez telpas: gaismas, kontaktligzdas, durvju, logu un klātbūtnes sensori, vides rādījumi",
    ed_exclude: "Izslēgtās entītijas",
    ed_navigation_path_helper: "Informācijas panelis, kas tiek atvērts, pieskaroties virsrakstam, piem., /virtuve",
    ed_columns_helper: "Katras sadaļas flīžu kolonnas",
  },
  el: {
    title: "Δωμάτιο",
    occupied: "Κατειλημμένο",
    lights_on_one: "{n} φως αναμμένο",
    lights_on_many: "{n} φώτα αναμμένα",
    chip_lights: "Αναμμένα φώτα",
    chip_plugs: "Ενεργές πρίζες",
    no_entities: "Δεν βρέθηκε τίποτα σε αυτό το δωμάτιο",
    ed_sections: "Ενότητες",
    ed_sections_helper: "Εμφανίζονται με αυτή τη σειρά· κενό: όλες",
    ed_collapsed: "Συμπτυγμένες ενότητες",
    ed_collapsed_helper: "Συμπτυγμένες αρχικά· πατήστε την κεφαλίδα μιας ενότητας για να την αναπτύξετε",
    ed_show_environment: "Μετρήσεις περιβάλλοντος",
    ed_show_environment_helper: "Θερμοκρασία, υγρασία, ποιότητα αέρα… κάτω από την κεφαλίδα",
    ed_include: "Οντότητες προς προσθήκη",
    ed_include_helper: "Από άλλο δωμάτιο ή χωρίς δωμάτιο: φώτα, πρίζες, αισθητήρες πόρτας, παραθύρου και παρουσίας, μετρήσεις περιβάλλοντος",
    ed_exclude: "Οντότητες προς εξαίρεση",
    ed_navigation_path_helper: "Πίνακας που ανοίγει πατώντας τον τίτλο, π.χ. /kitchen",
    ed_columns_helper: "Στήλες πλακιδίων κάθε ενότητας",
  },
};

// ── Sections ─────────────────────────────────────────────────────────────────
// Each section is one of the room cards, embedded (no frame of its own, a header that folds the section): the room card
// reuses their discovery, tiles, actions and hold-to-dim as they are. The environment readings sit under the banner,
// with no header. Default order: lights, plugs, then sensors.
const RM_SECTIONS = { lights: "room-lights-card", plugs: "room-switch-card", sensors: "room-sensors-card" };
const RM_ORDER = Object.keys(RM_SECTIONS);
const RM_ENV = "room-environment-mini-card";

// The section an `include` entity goes to, from its domain (a switch named like a light goes to the lights).
const rmRoute = (hass, id) => {
  const domain = id.split(".")[0];
  if (domain === "light") return "lights";
  if (domain === "switch") return hass.states[id] && rcIsLightSwitch(hass.states[id]) ? "lights" : "plugs";
  if (domain === "binary_sensor") return "sensors";
  if (domain === "sensor") return "environment";
  return null;
};

// A section's title: the embedded card's own ("Lights", "Plugs", "Sensors"), in the card's language.
const rmTitle = (tag, lang) => {
  const card = customElements.get(tag);
  return card ? rcT(card.i18n, lang, "title") : tag;
};

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomCard extends RcCard {
  static tag = "room-card";
  static i18n = RM_I18N;
  static needsArea = true;
  static includeDomains = ["light", "switch", "binary_sensor", "sensor"];
  static includeMatch = (hass, id) => !id.startsWith("sensor.") || !!customElements.get("room-environment-card")?.includeMatch?.(hass, id);
  static sceneTheme = "room";
  static defaults = { columns: 2, layout: "compact", show_environment: true, exclude: [] };

  // The sections shown, in their order (`sections`, all of them by default).
  _sections() {
    const list = (this._config.sections || []).filter((k) => k in RM_SECTIONS);
    return list.length ? [...new Set(list)] : RM_ORDER;
  }

  // The config of each embedded card: the room's area, `exclude`, the `include` entities of its kind, the tiles' layout.
  _kidConfigs() {
    const c = this._config;
    const lang = this._lang();
    const inc = {};
    for (const e of c.include || []) {
      const id = typeof e === "string" ? e : e?.entity;
      const key = id && rmRoute(this._hass || { states: {} }, id);
      if (key) (inc[key] ||= []).push(e);
    }
    const base = {
      ...(c.area ? { area: c.area } : {}),
      exclude: c.exclude || [],
      illustration: false,
      embedded: true,
      ...(c.names ? { names: c.names } : {}),
      ...(c.language ? { language: c.language } : {}),
    };
    const tiles = { columns: c.columns, layout: c.layout };
    const out = {};
    for (const key of this._sections()) {
      const tag = RM_SECTIONS[key];
      out[key] = {
        type: `custom:${tag}`,
        ...base,
        ...tiles,
        title: rmTitle(tag, lang),
        include: inc[key] || [],
        ...(key === "sensors" && c.presence !== undefined ? { presence: c.presence } : {}),
      };
    }
    if (c.show_environment !== false) {
      out.environment = { type: `custom:${RM_ENV}`, ...base, include: inc.environment || [], zoom: false, show_history: false };
    }
    return out;
  }

  // The embedded cards, built again when the config, the language or the registries change (an `include` entity's
  // section depends on its name). A section whose card cannot run (no area and nothing included for it) is left out.
  _ensureKids() {
    const h = this._hass;
    const deps = [this._config, this._lang(), h.entities, h.devices];
    if (this._kids && this._kidDeps?.every((d, i) => d === deps[i])) return;
    this._kidDeps = deps;
    this._kidsGen = (this._kidsGen || 0) + 1;
    const folded = (this._folded ||= new Set(this._config.collapsed || []));
    this._kids = {};
    for (const [key, config] of Object.entries(this._kidConfigs())) {
      const tag = config.type.slice(7);
      if (!customElements.get(tag)) continue;
      const el = document.createElement(tag);
      try {
        el.setConfig(config);
      } catch {
        continue;
      }
      el.toggleAttribute?.("collapsed", folded.has(key));
      el.addEventListener("rc-fold", (ev) => {
        if (ev.detail.collapsed) folded.add(key);
        else folded.delete(key);
      });
      // Its own visibility is not the room card's: kept from reaching Lovelace.
      el.addEventListener("card-visibility-changed", (ev) => ev.stopPropagation());
      this._kids[key] = el;
    }
  }

  // What the room shows, for the editor's lists (include, exclude, names): what each embedded card finds.
  _entries() {
    return Object.values(this._kidConfigs()).flatMap(({ type, ...config }) => {
      const card = customElements.get(type.slice(7));
      return card ? rcProbe(card, this._hass, config)._entries() : [];
    });
  }

  // Left (another dashboard view, a conditional card hidden): the sections come back as configured.
  disconnectedCallback() {
    super.disconnectedCallback();
    this._folded = new Set(this._config?.collapsed || []);
    for (const [key, el] of Object.entries(this._kids || {})) el.toggleAttribute?.("collapsed", this._folded.has(key));
  }

  // Every embedded card brought up to date (they draw themselves), and the room's state from what they found.
  _collect() {
    this._ensureKids();
    for (const el of Object.values(this._kids)) el.hass = this._hass;
    const items = (key) => this._kids[key]?._items || [];
    const lights = items("lights");
    const plugs = items("plugs");
    const sensors = items("sensors");
    const env = items("environment");
    const lit = lights.filter((i) => i.on);
    const plugsOn = plugs.filter((i) => i.on);
    return {
      lights,
      plugs,
      sensors,
      env,
      lit,
      plugsOn,
      watts: plugsOn.some((i) => i.watts != null) ? plugsOn.reduce((t, i) => t + (i.watts ?? 0), 0) : null,
      sens: sensors.length ? this._kids.sensors._summary(sensors) : null,
      worst: env.length ? this._kids.environment._worst(env) : null,
    };
  }

  // The banner's state, its icon and status: an open door or window first, then a reading needing a look, then someone
  // there, then the lights on.
  _summary(x) {
    const { sens, worst, lit } = x;
    const envWarn = worst && (worst.sev === "warn" || worst.sev === "alert");
    const area = this._hass.areas?.[this._config.area];
    if (sens?.level === "warn") return { level: "warn", icon: "mdi:home-alert-outline", status: sens.status };
    if (envWarn) return { level: worst.sev, icon: "mdi:home-alert-outline", status: this._kids.environment._status(x.env, worst) };
    const icon = area?.icon || "mdi:home-outline";
    if (sens?.occupied) return { level: "info", icon, status: this._t("occupied") };
    if (lit.length) return { level: "on", icon, status: this._tn("lights_on", lit.length) };
    return { level: "ok", icon, status: this._t("all_quiet") };
  }

  // The header chips: someone there, the lights on, the plugs on (their power draw when they report it).
  _chips(x) {
    const chip = (cls, icon, label, text) =>
      `<span class="chip ${cls}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</span>`;
    return [
      x.sens?.occupied ? chip("info", "mdi:account", this._t("occupied"), "") : "",
      x.lit.length ? chip("light", "mdi:lightbulb", this._t("chip_lights"), String(x.lit.length)) : "",
      x.plugsOn.length
        ? chip("plug", "mdi:power-socket-fr", this._t("chip_plugs"), x.watts != null ? rcWatts(x.watts, this._lang()) : String(x.plugsOn.length))
        : "",
    ].join("");
  }

  _sceneState() {
    const x = this._items;
    if (!x) return {};
    return {
      lamp: x.lit[0] ? { on: true, color: x.lit[0].color } : { on: false },
      window: x.sensors.some((i) => !i.info && i.on),
      motion: !!x.sens?.occupied,
      plug: x.plugsOn.length > 0,
    };
  }

  _sigOf(x, sum) {
    return [
      sum,
      x.lit.map((i) => [i.id, i.color]),
      x.plugsOn.length,
      x.watts == null ? null : Math.round(x.watts),
      this._sceneState(),
      ...["lights", "plugs", "sensors", "environment"].map((k) => this._kids[k]?._items?.length ?? -1),
    ];
  }

  getCardSize() {
    if (this.hidden || !this._kids) return 1;
    return 2 + Object.values(this._kids).reduce((t, el) => t + (el._items?.length ? el.getCardSize() : 0), 0);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  // The card is drawn once (banner, readings, sections) and kept: the embedded cards draw themselves inside it, the
  // banner and the sections' visibility follow the room.
  _draw(x) {
    const c = this._config;
    const root = this.shadowRoot;
    if (this._view !== "full") {
      root.innerHTML = "";
      this._view = "full";
    }
    if (this._shellOnce(this.constructor.styles, '<div class="env"></div><div class="secs"></div><div class="empty" hidden></div>')) {
      this._placed = null;
      this._sig = null;
      const head = root.querySelector(".head");
      if (head && c.navigation_path) {
        head.classList.add("nav");
        head.setAttribute("role", "link");
        head.tabIndex = 0;
        rcBindNav(head, c.navigation_path);
      }
    }
    this._place();
    const sum = this._summary(x);
    if (!this._changed(["full", this._sigOf(x, sum)])) return;
    const card = root.querySelector("ha-card");
    if (!card) return;
    card.className = `lvl-${sum.level}`;
    const title = rcEsc(c.title || this._areaName() || this._t("title"));
    const pill = `<div class="pill" title="${rcEsc(sum.status)}"><span class="pt">${rcEsc(sum.status)}</span></div>`;
    const chips = this._chips(x);
    const hchips = chips ? `<div class="hchips">${chips}</div>` : "";
    if (this._illustrated()) {
      this._updateBanner(card.querySelector(".banner"));
      rcMorph(
        card.querySelector(".head"),
        `<div class="badge"><ha-icon icon="${rcEsc(sum.icon)}"></ha-icon></div><div class="titles"><div class="trow"><div class="title">${title}</div>${pill}</div>${hchips}</div>`,
      );
    } else {
      rcMorph(card.querySelector(".head"), `<div class="badge"><ha-icon icon="${rcEsc(sum.icon)}"></ha-icon></div><div class="title">${title}</div>${hchips}${pill}`);
    }
    this._fitPill();
  }

  // The embedded cards in their places (again only when they were rebuilt), each shown only when it found something.
  _place() {
    const root = this.shadowRoot;
    const env = root.querySelector(".env");
    const secs = root.querySelector(".secs");
    if (!env || !secs) return;
    if (this._placed !== this._kidsGen) {
      this._placed = this._kidsGen;
      env.replaceChildren(...(this._kids.environment ? [this._kids.environment] : []));
      secs.replaceChildren(
        ...this._sections()
          .filter((k) => this._kids[k])
          .map((k) => {
            const wrap = document.createElement("div");
            wrap.className = "sec";
            wrap.dataset.sec = k;
            wrap.appendChild(this._kids[k]);
            return wrap;
          }),
      );
    }
    const has = (el) => !!el?._items?.length;
    env.hidden = !has(this._kids.environment);
    let any = !env.hidden;
    for (const wrap of secs.children) {
      wrap.hidden = !has(this._kids[wrap.dataset.sec]);
      any ||= !wrap.hidden;
    }
    const empty = root.querySelector(".empty");
    if (empty) {
      empty.hidden = any;
      if (!any && empty.textContent !== this._t("no_entities")) empty.textContent = this._t("no_entities");
    }
  }

  static styles = `${RC_CHIP_STYLES}
    ha-card { position: relative; }
    ha-card.lvl-ok   { --c: var(--rc-ok); }
    ha-card.lvl-on   { --c: var(--rc-light); }
    ha-card.lvl-info { --c: var(--rc-info); }
    ha-card.lvl-warn { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }
    /* The embedded cards: no frame nor background of their own, flush with the room card's edges, a hairline between
       the sections. */
    .env, .secs { margin: 0 -12px; --ha-card-background: transparent; --card-background-color: transparent;
                  --ha-card-box-shadow: none; --ha-card-border-width: 0; --ha-card-border-radius: 0; }
    .env { margin-top: 2px; margin-bottom: -6px; }
    .env > *, .sec > * { display: block; }
    .env[hidden], .sec[hidden] { display: none; }
    .sec + .sec:not([hidden]), .sec:not([hidden]) ~ .sec:not([hidden]) { border-top: 1px solid var(--divider-color, rgba(127,127,127,.15)); }
    .secs { margin-bottom: -12px; }
    .empty { padding: 12px 0 0; text-align: center; font-size: 13px; color: var(--secondary-text-color); }
    .empty[hidden] { display: none; }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
// The sections to show and to fold, picked from the list (labels in the card's language).
const rmSectionsField = (name, lang) => ({
  name,
  selector: { select: { multiple: true, mode: "list", options: RM_ORDER.map((value) => ({ value, label: rmTitle(RM_SECTIONS[value], lang) })) } },
});

const rmSchema = (card, booleans) => (lang, hass, config) => [
  ...rcAreaFields(true),
  rcLayoutField(RM_I18N, lang),
  ...rcBooleans("show_title", "show_environment", ...booleans),
  rmSectionsField("sections", lang),
  rmSectionsField("collapsed", lang),
  ...rcIllustrationFields(RM_I18N, lang, true),
  ...rcIncludeField(card, hass, config),
  ...rcExcludeField(card, hass, config),
  ...rcRenameField(card, hass, config),
  ...rcAdvanced(RM_I18N, lang, "language"),
];
const RM_HELPERS = ["title", "navigation_path", "layout", "columns", "show_environment", "sections", "collapsed", "include", "names", "language"];

rcRegister(
  RoomCard,
  rcEditor({ card: RoomCard, helpers: RM_HELPERS, schema: rmSchema(RoomCard, []) }),
  "Room Card",
  "A whole room in one card: lights, plugs, door, window and presence sensors, environment readings",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then its environment readings and a pill for the lights on, the
// plugs on (their power draw) and someone there. The zoom button switches to the full Room card and back.
class RoomMiniCard extends rcMini(
  RoomCard,
  "room-mini-card",
  `
    .r small { font-size: 10px; font-weight: 400; opacity: .7; margin-left: 1px; }
    .r.s-warn  { --t: var(--rc-warn); }
    .r.s-alert { --t: var(--rc-alert); }
    .r.cold    { --t: var(--rc-info); }
    .r.light   { --t: var(--rc-light); }
    .r.plug    { --t: var(--rc-plug); }
    .r.info    { --t: var(--rc-info); }
    .r.k-illuminance { --t: var(--rc-idle); }
  `,
) {
  _drawMini(x) {
    if (this._view !== "mini") {
      this.shadowRoot.innerHTML = "";
      this._view = "mini";
    }
    const sum = this._summary(x);
    if (!this._changed(["mini", this._sigOf(x, sum), x.env.map((i) => [i.id, i.state, i.sev, i.cold])])) return;
    const env = this._kids.environment;
    const readings = x.env
      .map((i) => {
        const tint = i.sev === "warn" || i.sev === "alert" || (i.cold && i.sev !== "ok") ? " pill" : "";
        return `<button class="r s-${i.sev}${i.cold ? " cold" : ""}${tint} k-${i.kind}" data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${env._chipValue(i)}</button>`;
      })
      .join("");
    // Each pill opens the details of the entity it stands for: the first light on, the plug drawing the most, the
    // presence sensor.
    const pill = (cls, id, icon, label, text) =>
      `<button class="r pill ${cls}" data-id="${rcEsc(id)}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</button>`;
    const top = [...x.plugsOn].sort((a, b) => (b.watts ?? -1) - (a.watts ?? -1))[0];
    const present = x.sensors.find((i) => i.info && i.on);
    const pills = [
      x.lit.length ? pill("light", x.lit[0].id, "mdi:lightbulb", this._t("chip_lights"), String(x.lit.length)) : "",
      top ? pill("plug", top.id, "mdi:power-socket-fr", this._t("chip_plugs"), x.watts != null ? rcWatts(x.watts, this._lang()) : String(x.plugsOn.length)) : "",
      present ? pill("info", present.id, "mdi:account", this._t("occupied"), "") : "",
    ].join("");
    this._shown = x.env.length;
    this._paintMini({ level: sum.level, icon: sum.icon, status: sum.status, chips: readings + pills });
  }
}

rcRegister(
  RoomMiniCard,
  rcEditor({ card: RoomMiniCard, helpers: [...RM_HELPERS, "zoom"], schema: rmSchema(RoomMiniCard, ["zoom"]) }),
  "Room Mini Card",
  "A whole room on two lines: its status, environment readings, lights and plugs on, and a zoom to the full card",
);
