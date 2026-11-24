// ── Overview card ────────────────────────────────────────────────────────────
// Every room with environment sensors, one tile per room: its status and its main readings. Tap a room to unfold
// its Environment card.
import { RE_RANK, reMatch } from "./sensor-kinds.js";
import { reConvert } from "./appliance-sensors.js";
import { RoomEnvironmentCard } from "./card.js";
import { RE_I18N } from "./i18n/re-i18n.js";

export const REO_I18N = {
  en: {
    ...RE_I18N.en,
    title: "Indoor climate",
    check_one: "{n} to check",
    check_many: "{n} to check",
    no_rooms: "No room with environment sensors",
    readings: "Readings",
    averages: "Average temperature and humidity",
    ed_title_helper: "Leave empty for “Indoor climate”",
    ed_columns_helper: "Empty: 3, or 2 on narrow screens",
    ed_zoom: "Detail button",
    ed_zoom_helper: "Only the rooms with a reading outside the comfort range show; the button shows every room. Off: every room, always",
    ed_hide_when_clear: "Hide when all clear",
    ed_hide_when_clear_helper: "The card only appears when a room has a reading to check",
    ed_sort_state: "Rooms needing a look first",
    ed_exclude_helper: "Left out of the tiles, the averages and the room details",
    ed_rooms_helper: "Order and overrides: a list of {area, name, icon, navigation_path, include, thresholds}, thresholds applying to that room only",
  },
  fr: {
    ...RE_I18N.fr,
    title: "Climat intérieur",
    check_one: "{n} à surveiller",
    check_many: "{n} à surveiller",
    no_rooms: "Aucune pièce avec des capteurs d'environnement",
    readings: "Mesures",
    averages: "Température et humidité moyennes",
    ed_title_helper: "Laisser vide pour « Climat intérieur »",
    ed_columns_helper: "Vide : 3, ou 2 sur les écrans étroits",
    ed_zoom: "Bouton détail",
    ed_zoom_helper: "Seules les pièces avec une mesure hors de la plage de confort s'affichent ; le bouton affiche toutes les pièces. Désactivé : toujours toutes les pièces",
    ed_hide_when_clear: "Masquer quand tout va bien",
    ed_hide_when_clear_helper: "La carte n'apparaît que si une pièce a une mesure à surveiller",
    ed_sort_state: "Pièces à surveiller en premier",
    ed_exclude_helper: "Ignorés dans les tuiles, les moyennes et le détail des pièces",
    ed_rooms_helper: "Ordre et personnalisation : une liste de {area, name, icon, navigation_path, include, thresholds}, thresholds ne valant que pour cette pièce",
  },
  de: {
    ...RE_I18N.de,
    title: "Raumklima",
    check_one: "{n} zu prüfen",
    check_many: "{n} zu prüfen",
    no_rooms: "Kein Raum mit Umgebungssensoren",
    readings: "Messwerte",
    averages: "Durchschnittliche Temperatur und Luftfeuchtigkeit",
    ed_title_helper: "Leer lassen für „Raumklima“",
    ed_columns_helper: "Leer: 3, oder 2 auf schmalen Bildschirmen",
    ed_zoom: "Detail-Schaltfläche",
    ed_zoom_helper: "Nur Räume mit einem Messwert außerhalb des Komfortbereichs werden angezeigt; die Schaltfläche zeigt alle Räume. Aus: immer alle Räume",
    ed_hide_when_clear: "Ausblenden, wenn alles in Ordnung ist",
    ed_hide_when_clear_helper: "Die Karte erscheint nur, wenn ein Raum einen zu prüfenden Messwert hat",
    ed_sort_state: "Räume, die Aufmerksamkeit brauchen, zuerst",
    ed_exclude_helper: "Bei den Kacheln, den Durchschnitten und den Raumdetails nicht berücksichtigt",
    ed_rooms_helper: "Reihenfolge und Anpassungen: eine Liste von {area, name, icon, navigation_path, include, thresholds}, wobei thresholds nur für diesen Raum gilt",
  },
  es: {
    ...RE_I18N.es,
    title: "Clima interior",
    check_one: "{n} a revisar",
    check_many: "{n} a revisar",
    no_rooms: "Ninguna habitación con sensores de ambiente",
    readings: "Lecturas",
    averages: "Temperatura y humedad medias",
    ed_title_helper: "Déjalo vacío para «Clima interior»",
    ed_columns_helper: "Vacío: 3, o 2 en pantallas estrechas",
    ed_zoom: "Botón de detalle",
    ed_zoom_helper: "Solo se muestran las habitaciones con una lectura fuera del rango de confort; el botón muestra todas las habitaciones. Desactivado: siempre todas las habitaciones",
    ed_hide_when_clear: "Ocultar cuando todo está en orden",
    ed_hide_when_clear_helper: "La tarjeta solo aparece cuando una habitación tiene una lectura que revisar",
    ed_sort_state: "Primero las habitaciones que requieren atención",
    ed_exclude_helper: "Se ignoran en los mosaicos, las medias y el detalle de las habitaciones",
    ed_rooms_helper: "Orden y personalización: una lista de {area, name, icon, navigation_path, include, thresholds}, aplicándose thresholds solo a esa habitación",
  },
  sr: {
    ...RE_I18N.sr,
    title: "Унутрашња клима",
    check_one: "{n} за проверу",
    check_many: "{n} за проверу",
    no_rooms: "Нема просторија са амбијенталним сензорима",
    readings: "Очитавања",
    averages: "Просечна температура и влажност",
    ed_title_helper: "Остави празно за „Унутрашња клима“",
    ed_columns_helper: "Празно: 3, или 2 на уским екранима",
    ed_zoom: "Дугме за детаље",
    ed_zoom_helper: "Приказују се само просторије са очитавањима ван опсега комфора; дугме приказује све просторије. Искључено: све просторије, увек",
    ed_hide_when_clear: "Сакриј кад је све у реду",
    ed_hide_when_clear_helper: "Картица се приказује само када просторија има очитавање за проверу",
    ed_sort_state: "Прво просторије које захтевају пажњу",
    ed_exclude_helper: "Изостављено из плочица, просека и детаља просторије",
    ed_rooms_helper:
      "Редослед и измене: листа са {area, name, icon, navigation_path, include, thresholds}, при чему thresholds важи само за ту просторију",
  },
  "sr-Latn": {
    ...RE_I18N["sr-Latn"],
    title: "Unutrašnja klima",
    check_one: "{n} za proveru",
    check_many: "{n} za proveru",
    no_rooms: "Nema prostorija sa ambijentalnim senzorima",
    readings: "Očitavanja",
    averages: "Prosečna temperatura i vlažnost",
    ed_title_helper: "Ostavi prazno za „Unutrašnja klima“",
    ed_columns_helper: "Prazno: 3, ili 2 na uskim ekranima",
    ed_zoom: "Dugme za detalje",
    ed_zoom_helper: "Prikazuju se samo prostorije sa očitavanjima van opsega komfora; dugme prikazuje sve prostorije. Isključeno: sve prostorije, uvek",
    ed_hide_when_clear: "Sakrij kad je sve u redu",
    ed_hide_when_clear_helper: "Kartica se prikazuje samo kada prostorija ima očitavanje za proveru",
    ed_sort_state: "Prvo prostorije koje zahtevaju pažnju",
    ed_exclude_helper: "Izostavljeno iz pločica, proseka i detalja prostorije",
    ed_rooms_helper:
      "Redosled i izmene: lista sa {area, name, icon, navigation_path, include, thresholds}, pri čemu thresholds važi samo za tu prostoriju",
  },
  it: {
    ...RE_I18N.it,
    title: "Clima interno",
    check_one: "{n} da controllare",
    check_many: "{n} da controllare",
    no_rooms: "Nessuna stanza con sensori ambientali",
    readings: "Misure",
    averages: "Temperatura e umidità medie",
    ed_title_helper: "Lascia vuoto per «Clima interno»",
    ed_columns_helper: "Vuoto: 3, o 2 sugli schermi stretti",
    ed_zoom: "Pulsante dettagli",
    ed_zoom_helper: "Vengono mostrate solo le stanze con una misura fuori dall'intervallo di comfort; il pulsante mostra tutte le stanze. Disattivato: sempre tutte le stanze",
    ed_hide_when_clear: "Nascondi quando è tutto a posto",
    ed_hide_when_clear_helper: "La scheda appare solo quando una stanza ha una misura da controllare",
    ed_sort_state: "Prima le stanze da controllare",
    ed_exclude_helper: "Ignorati nei riquadri, nelle medie e nei dettagli delle stanze",
    ed_rooms_helper: "Ordine e personalizzazioni: un elenco di {area, name, icon, navigation_path, include, thresholds}, dove thresholds vale solo per quella stanza",
  },
  nl: {
    ...RE_I18N.nl,
    title: "Binnenklimaat",
    check_one: "{n} te controleren",
    check_many: "{n} te controleren",
    no_rooms: "Geen ruimte met omgevingssensoren",
    readings: "Metingen",
    averages: "Gemiddelde temperatuur en luchtvochtigheid",
    ed_title_helper: "Leeg laten voor “Binnenklimaat”",
    ed_columns_helper: "Leeg: 3, of 2 op smalle schermen",
    ed_zoom: "Detailknop",
    ed_zoom_helper: "Alleen ruimtes met een meting buiten het comfortbereik worden getoond; de knop toont alle ruimtes. Uit: altijd alle ruimtes",
    ed_hide_when_clear: "Verbergen als alles in orde is",
    ed_hide_when_clear_helper: "De kaart verschijnt alleen als een ruimte een meting heeft om te controleren",
    ed_sort_state: "Ruimtes die aandacht nodig hebben eerst",
    ed_exclude_helper: "Niet meegeteld in de tegels, de gemiddelden en de ruimtedetails",
    ed_rooms_helper: "Volgorde en aanpassingen: een lijst van {area, name, icon, navigation_path, include, thresholds}, waarbij thresholds alleen voor die ruimte geldt",
  },
  pt: {
    ...RE_I18N.pt,
    title: "Clima interior",
    check_one: "{n} a verificar",
    check_many: "{n} a verificar",
    no_rooms: "Nenhuma divisão com sensores ambientais",
    readings: "Medições",
    averages: "Temperatura e humidade médias",
    ed_title_helper: "Deixe vazio para «Clima interior»",
    ed_columns_helper: "Vazio: 3, ou 2 em ecrãs estreitos",
    ed_zoom: "Botão de detalhe",
    ed_zoom_helper: "Só são mostradas as divisões com uma medição fora do intervalo de conforto; o botão mostra todas as divisões. Desativado: sempre todas as divisões",
    ed_hide_when_clear: "Ocultar quando está tudo em ordem",
    ed_hide_when_clear_helper: "O cartão só aparece quando uma divisão tem uma medição a verificar",
    ed_sort_state: "Primeiro as divisões que precisam de atenção",
    ed_exclude_helper: "Ignorados nos mosaicos, nas médias e no detalhe das divisões",
    ed_rooms_helper: "Ordem e personalização: uma lista de {area, name, icon, navigation_path, include, thresholds}, aplicando-se thresholds apenas a essa divisão",
  },
  pl: {
    ...RE_I18N.pl,
    title: "Klimat wewnętrzny",
    check_one: "Do sprawdzenia: {n}",
    check_many: "Do sprawdzenia: {n}",
    no_rooms: "Brak pomieszczeń z czujnikami środowiskowymi",
    readings: "Odczyty",
    averages: "Średnia temperatura i wilgotność",
    ed_title_helper: "Pozostaw puste, aby użyć nazwy „Klimat wewnętrzny”",
    ed_columns_helper: "Puste: 3 lub 2 na wąskich ekranach",
    ed_zoom: "Przycisk szczegółów",
    ed_zoom_helper: "Wyświetlane są tylko pomieszczenia z odczytem poza zakresem komfortu; przycisk pokazuje wszystkie pomieszczenia. Wyłączone: zawsze wszystkie pomieszczenia",
    ed_hide_when_clear: "Ukryj, gdy wszystko w porządku",
    ed_hide_when_clear_helper: "Karta pojawia się tylko, gdy w pomieszczeniu jest odczyt do sprawdzenia",
    ed_sort_state: "Najpierw pomieszczenia wymagające uwagi",
    ed_exclude_helper: "Pomijane w kafelkach, średnich i szczegółach pomieszczeń",
    ed_rooms_helper: "Kolejność i nadpisania: lista {area, name, icon, navigation_path, include, thresholds}, przy czym thresholds dotyczy tylko tego pomieszczenia",
  },
  ro: {
    ...RE_I18N.ro,
    title: "Climat interior",
    check_one: "De verificat: {n}",
    check_many: "De verificat: {n}",
    no_rooms: "Nicio cameră cu senzori de mediu",
    readings: "Valori",
    averages: "Temperatură și umiditate medii",
    ed_title_helper: "Lasă gol pentru „Climat interior”",
    ed_columns_helper: "Gol: 3 sau 2 pe ecranele înguste",
    ed_zoom: "Buton de detalii",
    ed_zoom_helper: "Se afișează doar camerele cu o valoare în afara intervalului de confort; butonul afișează toate camerele. Dezactivat: mereu toate camerele",
    ed_hide_when_clear: "Ascunde când totul e în regulă",
    ed_hide_when_clear_helper: "Cardul apare doar când o cameră are o valoare de verificat",
    ed_sort_state: "Întâi camerele care necesită atenție",
    ed_exclude_helper: "Ignorați în dale, în medii și în detaliile camerelor",
    ed_rooms_helper: "Ordine și personalizări: o listă de {area, name, icon, navigation_path, include, thresholds}, thresholds aplicându-se doar acelei camere",
  },
  da: {
    ...RE_I18N.da,
    title: "Indeklima",
    check_one: "{n} skal tjekkes",
    check_many: "{n} skal tjekkes",
    no_rooms: "Ingen rum med miljøsensorer",
    readings: "Målinger",
    averages: "Gennemsnitlig temperatur og luftfugtighed",
    ed_title_helper: "Lad stå tomt for »Indeklima«",
    ed_columns_helper: "Tomt: 3, eller 2 på smalle skærme",
    ed_zoom: "Detaljeknap",
    ed_zoom_helper: "Kun rum med en måling uden for komfortområdet vises; knappen viser alle rum. Fra: altid alle rum",
    ed_hide_when_clear: "Skjul, når alt er i orden",
    ed_hide_when_clear_helper: "Kortet vises kun, når et rum har en måling, der skal tjekkes",
    ed_sort_state: "Rum, der kræver opmærksomhed, først",
    ed_exclude_helper: "Udelades fra felterne, gennemsnittene og rummenes detaljer",
    ed_rooms_helper: "Rækkefølge og tilpasninger: en liste med {area, name, icon, navigation_path, include, thresholds}, hvor thresholds kun gælder for det rum",
  },
  sv: {
    ...RE_I18N.sv,
    title: "Inomhusklimat",
    check_one: "{n} att se över",
    check_many: "{n} att se över",
    no_rooms: "Inga rum med miljösensorer",
    readings: "Mätvärden",
    averages: "Genomsnittlig temperatur och luftfuktighet",
    ed_title_helper: "Lämna tomt för ”Inomhusklimat”",
    ed_columns_helper: "Tomt: 3, eller 2 på smala skärmar",
    ed_zoom: "Detaljknapp",
    ed_zoom_helper: "Bara rum med ett mätvärde utanför komfortintervallet visas; knappen visar alla rum. Av: alltid alla rum",
    ed_hide_when_clear: "Dölj när allt är i ordning",
    ed_hide_when_clear_helper: "Kortet visas bara när ett rum har ett mätvärde att kontrollera",
    ed_sort_state: "Rum som behöver ses över först",
    ed_exclude_helper: "Utelämnas från rutorna, medelvärdena och rummens detaljer",
    ed_rooms_helper: "Ordning och anpassningar: en lista med {area, name, icon, navigation_path, include, thresholds}, där thresholds bara gäller det rummet",
  },
  bg: {
    ...RE_I18N.bg,
    title: "Вътрешен климат",
    check_one: "За проверка: {n}",
    check_many: "За проверка: {n}",
    no_rooms: "Няма стаи със сензори за среда",
    readings: "Стойности",
    averages: "Средна температура и влажност",
    ed_title_helper: "Оставете празно за „Вътрешен климат“",
    ed_columns_helper: "Празно: 3 или 2 на тесни екрани",
    ed_zoom: "Бутон за подробности",
    ed_zoom_helper: "Показват се само стаите със стойност извън диапазона на комфорт; бутонът показва всички стаи. Изключено: винаги всички стаи",
    ed_hide_when_clear: "Скрий, когато всичко е наред",
    ed_hide_when_clear_helper: "Картата се показва само когато в стая има стойност за проверка",
    ed_sort_state: "Първо стаите, които изискват внимание",
    ed_exclude_helper: "Пропускат се в плочките, средните стойности и подробностите за стаите",
    ed_rooms_helper: "Ред и персонализиране: списък от {area, name, icon, navigation_path, include, thresholds}, като thresholds важи само за тази стая",
  },
  ru: {
    ...RE_I18N.ru,
    title: "Климат в доме",
    check_one: "Проверить: {n}",
    check_many: "Проверить: {n}",
    no_rooms: "Нет комнат с датчиками микроклимата",
    readings: "Показания",
    averages: "Средняя температура и влажность",
    ed_title_helper: "Оставьте пустым для «Климат в доме»",
    ed_columns_helper: "Пусто: 3 или 2 на узких экранах",
    ed_zoom: "Кнопка подробностей",
    ed_zoom_helper: "Показываются только комнаты с показанием вне диапазона комфорта; кнопка показывает все комнаты. Выключено: всегда все комнаты",
    ed_hide_when_clear: "Скрывать, когда всё в порядке",
    ed_hide_when_clear_helper: "Карточка появляется, только когда в комнате есть показание, требующее внимания",
    ed_sort_state: "Сначала комнаты, требующие внимания",
    ed_exclude_helper: "Не учитываются в плитках, средних значениях и подробностях комнат",
    ed_rooms_helper: "Порядок и настройки: список {area, name, icon, navigation_path, include, thresholds}, где thresholds действует только для этой комнаты",
  },
  uk: {
    ...RE_I18N.uk,
    title: "Клімат у домі",
    check_one: "Перевірити: {n}",
    check_many: "Перевірити: {n}",
    no_rooms: "Немає кімнат із датчиками мікроклімату",
    readings: "Показники",
    averages: "Середня температура й вологість",
    ed_title_helper: "Залиште порожнім для «Клімат у домі»",
    ed_columns_helper: "Порожньо: 3 або 2 на вузьких екранах",
    ed_zoom: "Кнопка подробиць",
    ed_zoom_helper: "Показуються лише кімнати з показником поза діапазоном комфорту; кнопка показує всі кімнати. Вимкнено: завжди всі кімнати",
    ed_hide_when_clear: "Приховувати, коли все гаразд",
    ed_hide_when_clear_helper: "Картка з'являється, лише коли в кімнаті є показник, що потребує уваги",
    ed_sort_state: "Спершу кімнати, що потребують уваги",
    ed_exclude_helper: "Не враховуються в плитках, середніх значеннях і подробицях кімнат",
    ed_rooms_helper: "Порядок і налаштування: список {area, name, icon, navigation_path, include, thresholds}, де thresholds діє лише для цієї кімнати",
  },
  hu: {
    ...RE_I18N.hu,
    title: "Beltéri klíma",
    check_one: "{n} ellenőrizendő",
    check_many: "{n} ellenőrizendő",
    no_rooms: "Nincs helyiség környezeti érzékelőkkel",
    readings: "Mérések",
    averages: "Átlagos hőmérséklet és páratartalom",
    ed_title_helper: "Hagyd üresen a „Beltéri klíma” címhez",
    ed_columns_helper: "Üres: 3, keskeny képernyőn 2",
    ed_zoom: "Részletek gomb",
    ed_zoom_helper: "Csak a komforttartományon kívüli értékkel rendelkező helyiségek jelennek meg; a gomb minden helyiséget megjelenít. Kikapcsolva: mindig minden helyiség",
    ed_hide_when_clear: "Elrejtés, ha minden rendben",
    ed_hide_when_clear_helper: "A kártya csak akkor jelenik meg, ha egy helyiségben ellenőrizendő érték van",
    ed_sort_state: "Elöl a figyelmet igénylő helyiségek",
    ed_exclude_helper: "Kimaradnak a csempékből, az átlagokból és a helyiségek részleteiből",
    ed_rooms_helper: "Sorrend és testreszabás: {area, name, icon, navigation_path, include, thresholds} elemek listája, ahol a thresholds csak az adott helyiségre vonatkozik",
  },
  sk: {
    ...RE_I18N.sk,
    title: "Vnútorná klíma",
    check_one: "Na kontrolu: {n}",
    check_many: "Na kontrolu: {n}",
    no_rooms: "Žiadna miestnosť so senzormi prostredia",
    readings: "Hodnoty",
    averages: "Priemerná teplota a vlhkosť",
    ed_title_helper: "Nechajte prázdne pre „Vnútorná klíma“",
    ed_columns_helper: "Prázdne: 3, alebo 2 na úzkych obrazovkách",
    ed_zoom: "Tlačidlo podrobností",
    ed_zoom_helper: "Zobrazia sa len miestnosti s hodnotou mimo rozsahu komfortu; tlačidlo zobrazí všetky miestnosti. Vypnuté: vždy všetky miestnosti",
    ed_hide_when_clear: "Skryť, keď je všetko v poriadku",
    ed_hide_when_clear_helper: "Karta sa zobrazí len vtedy, keď má miestnosť hodnotu na kontrolu",
    ed_sort_state: "Najprv miestnosti vyžadujúce pozornosť",
    ed_exclude_helper: "Vynechané z dlaždíc, priemerov a podrobností miestností",
    ed_rooms_helper: "Poradie a úpravy: zoznam {area, name, icon, navigation_path, include, thresholds}, pričom thresholds platí len pre danú miestnosť",
  },
  cs: {
    ...RE_I18N.cs,
    title: "Vnitřní klima",
    check_one: "Ke kontrole: {n}",
    check_many: "Ke kontrole: {n}",
    no_rooms: "Žádná místnost se senzory prostředí",
    readings: "Hodnoty",
    averages: "Průměrná teplota a vlhkost",
    ed_title_helper: "Ponechte prázdné pro „Vnitřní klima“",
    ed_columns_helper: "Prázdné: 3, nebo 2 na úzkých obrazovkách",
    ed_zoom: "Tlačítko podrobností",
    ed_zoom_helper: "Zobrazí se jen místnosti s hodnotou mimo rozsah komfortu; tlačítko zobrazí všechny místnosti. Vypnuto: vždy všechny místnosti",
    ed_hide_when_clear: "Skrýt, když je vše v pořádku",
    ed_hide_when_clear_helper: "Karta se zobrazí jen tehdy, když má místnost hodnotu ke kontrole",
    ed_sort_state: "Nejprve místnosti vyžadující pozornost",
    ed_exclude_helper: "Vynechané z dlaždic, průměrů a podrobností místností",
    ed_rooms_helper: "Pořadí a úpravy: seznam {area, name, icon, navigation_path, include, thresholds}, přičemž thresholds platí jen pro danou místnost",
  },
  sl: {
    ...RE_I18N.sl,
    title: "Notranja klima",
    check_one: "Za preverjanje: {n}",
    check_many: "Za preverjanje: {n}",
    no_rooms: "Ni prostorov s senzorji okolja",
    readings: "Vrednosti",
    averages: "Povprečna temperatura in vlažnost",
    ed_title_helper: "Pustite prazno za »Notranja klima«",
    ed_columns_helper: "Prazno: 3 ali 2 na ozkih zaslonih",
    ed_zoom: "Gumb za podrobnosti",
    ed_zoom_helper: "Prikazani so samo prostori z vrednostjo zunaj območja udobja; gumb prikaže vse prostore. Izklopljeno: vedno vsi prostori",
    ed_hide_when_clear: "Skrij, ko je vse v redu",
    ed_hide_when_clear_helper: "Kartica se prikaže samo, ko ima prostor vrednost za preverjanje",
    ed_sort_state: "Najprej prostori, ki potrebujejo pozornost",
    ed_exclude_helper: "Izpuščeni iz ploščic, povprečij in podrobnosti prostorov",
    ed_rooms_helper: "Vrstni red in prilagoditve: seznam {area, name, icon, navigation_path, include, thresholds}, pri čemer thresholds velja samo za ta prostor",
  },
  lv: {
    ...RE_I18N.lv,
    title: "Iekštelpu klimats",
    check_one: "Jāpārbauda: {n}",
    check_many: "Jāpārbauda: {n}",
    no_rooms: "Nav telpu ar vides sensoriem",
    readings: "Rādījumi",
    averages: "Vidējā temperatūra un mitrums",
    ed_title_helper: "Atstājiet tukšu, lai izmantotu “Iekštelpu klimats”",
    ed_columns_helper: "Tukšs: 3 vai 2 šauros ekrānos",
    ed_zoom: "Detaļu poga",
    ed_zoom_helper: "Tiek rādītas tikai telpas ar rādījumu ārpus komforta diapazona; poga parāda visas telpas. Izslēgts: vienmēr visas telpas",
    ed_hide_when_clear: "Paslēpt, kad viss kārtībā",
    ed_hide_when_clear_helper: "Karte parādās tikai tad, kad telpā ir pārbaudāms rādījums",
    ed_sort_state: "Vispirms telpas, kurām jāpievērš uzmanība",
    ed_exclude_helper: "Netiek ņemti vērā flīzēs, vidējās vērtībās un telpu detaļās",
    ed_rooms_helper: "Secība un pielāgojumi: saraksts ar {area, name, icon, navigation_path, include, thresholds}, kur thresholds attiecas tikai uz šo telpu",
  },
  el: {
    ...RE_I18N.el,
    title: "Εσωτερικό κλίμα",
    check_one: "{n} για έλεγχο",
    check_many: "{n} για έλεγχο",
    no_rooms: "Κανένα δωμάτιο με αισθητήρες περιβάλλοντος",
    readings: "Μετρήσεις",
    averages: "Μέση θερμοκρασία και υγρασία",
    ed_title_helper: "Αφήστε το κενό για «Εσωτερικό κλίμα»",
    ed_columns_helper: "Κενό: 3 ή 2 σε στενές οθόνες",
    ed_zoom: "Κουμπί λεπτομερειών",
    ed_zoom_helper: "Εμφανίζονται μόνο τα δωμάτια με μέτρηση εκτός του εύρους άνεσης· το κουμπί εμφανίζει όλα τα δωμάτια. Ανενεργό: πάντα όλα τα δωμάτια",
    ed_hide_when_clear: "Απόκρυψη όταν όλα είναι εντάξει",
    ed_hide_when_clear_helper: "Η κάρτα εμφανίζεται μόνο όταν ένα δωμάτιο έχει μέτρηση προς έλεγχο",
    ed_sort_state: "Πρώτα τα δωμάτια που χρειάζονται έλεγχο",
    ed_exclude_helper: "Παραλείπονται από τα πλακίδια, τους μέσους όρους και τις λεπτομέρειες των δωματίων",
    ed_rooms_helper: "Σειρά και προσαρμογές: μια λίστα με {area, name, icon, navigation_path, include, thresholds}, όπου το thresholds ισχύει μόνο για εκείνο το δωμάτιο",
  },
};

// Readings always shown on a room tile; the others only when they need a look.
export const REO_MAIN = ["temperature", "humidity", "co2"];

export class RoomEnvironmentOverviewCard extends rcRoomsPanel(RoomEnvironmentCard) {
  static tag = "room-environment-overview-card";
  static sceneTheme = "environment";
  static i18n = REO_I18N;
  static needsArea = false;
  static defaults = { zoom: true, hide_when_clear: false, sort: "name", exclude_areas: [], exclude: [], rooms: [] };

  static getStubConfig() {
    return {};
  }

  set hass(hass) {
    super.hass = hass;
    if (this._detail) this._detail.hass = hass;
  }

  getCardSize() {
    if (this.hidden) return 0;
    return 1 + Math.ceil((this._items?.length || 1) / 3);
  }

  _collect() {
    const h = this._hass;
    const c = this._config;
    const excluded = new Set(c.exclude_areas || []);
    const overrides = Object.fromEntries((c.rooms || []).map((x) => [x.area, x]));
    // `rooms[].include`: sensors added by hand to a room, counted there only and taken as they are (no appliance
    // filter); a sensor of no known kind gives no reading.
    const included = rcRoomIncludes(h, c);
    this._included = included;
    const byArea = {};
    for (const [id, aid] of rcByArea(this, (id) => id.startsWith("sensor."))) if (!included.has(id)) (byArea[aid] ||= []).push(id);
    for (const { aid } of included.values()) byArea[aid] ||= [];
    const rooms = [];
    for (const [aid, ids] of Object.entries(byArea)) {
      const area = h.areas?.[aid];
      const entries = [
        ...ids.filter((id) => h.states[id] && reMatch(h, id) && this._ambientSensor(id)).map((entity) => ({ entity })),
        ...rcIncludesOf(included, aid),
      ];
      const o = overrides[aid] || {};
      const thresholds = this._roomThresholds(o);
      const items = area && !excluded.has(aid) ? this._itemsOf(entries, { name: area.name, thresholds }) : [];
      if (!items.length) continue;
      const worst = this._worst(items);
      rooms.push({
        id: aid,
        name: o.name ?? area.name ?? aid,
        icon: o.icon ?? rcRoomIcon(area),
        navigation_path: o.navigation_path,
        items,
        worst,
        rank: worst ? RE_RANK[worst.sev] : 0,
        level: worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok",
        status: this._status(items, worst),
      });
    }
    rcSortRooms(rooms, c, (x) => x.rank);
    this._total = rooms.length;
    this._everyRoom = rooms; // the header averages count every room, shown or not
    return rcCompact(this) ? rooms.filter((x) => x.rank >= RE_RANK.warn || x.id === this._openArea) : rooms;
  }

  // Mean of the rooms' readings of `kind` (each room counting once), formatted with `digits`. Each room's reading is
  // in its own sensor's unit: temperatures are converted to Home Assistant's unit system (or, unknown, to the first
  // room's unit) before the mean, so a room in °F and one in °C do not mix.
  _average(rooms, kind, digits) {
    const readings = rooms.map((x) => x.items.find((i) => i.kind === kind)).filter((i) => i?.num != null);
    if (!readings.length) return null;
    const target = this._hass?.config?.unit_system?.[kind] ?? readings[0].unit;
    const values = readings.map((i) => reConvert(kind, i.num, i.unit, target));
    const mean = values.reduce((t, v) => t + v, 0) / values.length;
    return this._formatNumber(mean, digits);
  }

  // The banner: the home's worst reading, else its average temperature and humidity, on the wall sensor.
  _sceneState() {
    const all = this._everyRoom || [];
    const s = this._envScene(all.flatMap((x) => x.items));
    if (s.fx === "air") return s;
    const t = this._average(all, "temperature", 1);
    const h = this._average(all, "humidity", 0);
    return { ...s, top: t ? `${t}°` : h ? `${h}%` : "—", bottom: t && h ? `${h}%` : "" };
  }

  _chip(i) {
    const cls = `chip s-${i.sev}${i.cold ? " cold" : ""}`;
    return `<span class="${cls}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${this._chipValue(i)}</span>`;
  }

  // The base card's render collects the rooms (`_collect`) and hands them here.
  _draw(rooms) {
    const c = this._config;
    const parts = rooms.map((x) => [x.id, x.name, x.icon, x.status, x.items.map((i) => [i.id, i.state, i.sev, i.cold])]);
    // The header averages and the room count cover every room, shown or not (a comfortable room is hidden in the
    // compact view): they belong in the signature, or the header freezes while only hidden rooms change.
    const all = this._everyRoom || [];
    const temp = this._average(all, "temperature", 1);
    const hum = this._average(all, "humidity", 0);
    if (!this._changed([this._openArea, this._zoomed, this._total, temp, hum, parts])) return;
    // hide_when_clear: no room with a reading to check (the rooms the compact view keeps), and at least one room.
    if (this._hide(c.hide_when_clear && all.length > 0 && all.every((x) => x.rank < RE_RANK.warn))) return;

    const illus = this._illustrated();
    if (this._shellOnce(RoomEnvironmentOverviewCard.styles, '<div class="panel" hidden></div><div class="grid"></div>')) {
      this.shadowRoot.querySelector(".grid").addEventListener("click", (ev) => {
        const tile = ev.target.closest(".room");
        if (tile) this._tap(tile.dataset.area);
      });
      this.shadowRoot.querySelector(".head").addEventListener("click", (ev) => rcZoomClick(this, ev));
    }

    const worst = this._worst(rooms.map((x) => x.worst).filter(Boolean));
    const level = worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok";
    const toCheck = rooms.filter((x) => x.rank >= RE_RANK.warn).length;
    const status = !this._total
      ? this._t("no_rooms")
      : toCheck
        ? this._tn("check", toCheck)
        : worst
          ? worst.word
          : this._t("comfortable");
    // One chip for the home averages: "21,0° · 53 %".
    const avgText = [temp && `${temp}°`, hum && `${hum} %`].filter(Boolean).join(" · ");
    const avg = avgText
      ? `<span class="chip avg" title="${rcEsc(this._t("averages"))}"><ha-icon icon="mdi:home-thermometer-outline"></ha-icon><span>${rcEsc(avgText)}</span></span>`
      : "";

    const card = this.shadowRoot.querySelector("ha-card");
    card.className = `lvl-${level}`;
    const pill = `<div class="pill" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></div>`;
    const badge = `<div class="badge"><ha-icon icon="${this._headIcon(worst)}"></ha-icon></div>`;
    const title = `<div class="title">${rcEsc(c.title || this._t("title"))}</div>`;
    if (illus) this._updateBanner(card.querySelector(".banner"));
    // In place (see rcMorph): the header keeps its nodes, the pill is fitted again.
    rcMorph(card.querySelector(".head"), illus
      ? `${badge}<div class="titles"><div class="trow">${title}${pill}</div>${avg ? `<div class="sub">${avg}</div>` : ""}</div>${rcZoomButton(this)}`
      : `${badge}${title}${avg}${pill}${rcZoomButton(this)}`,
    );
    this._fitPill();

    this._roomGrid(card.querySelector(".grid"), rooms, (x) => {
      const chips = x.items
        .filter((i) => REO_MAIN.includes(i.kind) || RE_RANK[i.sev] >= RE_RANK.warn)
        .map((i) => this._chip(i))
        .join("");
      return `
      <button class="room lvl-${x.level}${x.id === this._openArea ? " sel" : ""}" data-area="${rcEsc(x.id)}"
              title="${rcEsc(x.name)} — ${rcEsc(x.status)}">
        <span class="ic"><ha-icon icon="${rcEsc(x.icon)}"></ha-icon></span>
        <span class="name">${rcEsc(x.name)}</span>
        <span class="state">${rcEsc(x.status)}</span>
        <span class="chips">${chips}</span>
      </button>`;
    });
  }

  // rcRoomsPanel hooks: the tiles shown, and the room's Environment card dropped on fold.
  _shownRooms() {
    return this._items;
  }

  _clearPanel() {
    this._detail = null;
  }

  // The card's `thresholds` with the room's own (`rooms: [{ area, thresholds }]`) on top.
  _roomThresholds(override) {
    const t = { ...this._config.thresholds, ...override?.thresholds };
    return Object.keys(t).length ? t : undefined;
  }

  // The Environment card of the open room, built once per room.
  _fillPanel() {
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = false;
    if (this._panelArea === this._openArea) return;
    this._panelArea = this._openArea;
    const c = this._config;
    const thresholds = this._roomThresholds((c.rooms || []).find((x) => x.area === this._openArea));
    const el = document.createElement(RoomEnvironmentCard.tag);
    el.setConfig({
      type: `custom:${RoomEnvironmentCard.tag}`,
      area: this._openArea,
      title: this._t("readings"),
      exclude: [...(c.exclude || []), ...rcIncludedElsewhere(this._included || new Map(), this._openArea)],
      illustration: false,
      ...(rcIncludesOf(this._included || new Map(), this._openArea).length ? { include: rcIncludesOf(this._included, this._openArea) } : {}),
      ...(c.appliance_filter === false ? { appliance_filter: false } : {}),
      ...(thresholds ? { thresholds } : {}),
      ...(c.language ? { language: c.language } : {}),
    });
    el.hass = this._hass;
    panel.innerHTML = "";
    panel.appendChild(el);
    this._detail = el;
  }

  static styles = `${RC_ZOOM_STYLES}${RC_ROOM_GRID_STYLES}
    ha-card { container-type: inline-size; }
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-cold  { --c: var(--rc-info); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }

    /* Comfortable readings are plain text, the ones needing a look a tinted pill (as on the mini card). */
    .chip { --k: var(--rc-ok); flex: none; display: inline-flex; align-items: baseline; gap: 1px; height: 18px; padding: 0 4px 0 3px;
            border-radius: 999px; font-size: 11px; font-weight: 500; line-height: 18px; white-space: nowrap;
            color: var(--primary-text-color); }
    .chip ha-icon { --mdc-icon-size: 12px; color: var(--k); align-self: center; margin-right: 1px; }
    .chip small { font-size: 9px; opacity: .7; margin-left: 1px; }
    .chip.s-warn  { --k: var(--rc-warn); }
    .chip.s-alert { --k: var(--rc-alert); }
    .chip.cold    { --k: var(--rc-info); }
    .chip.s-warn, .chip.s-alert, .chip.cold.s-info, .chip.cold.s-warn {
      color: var(--k); background: color-mix(in srgb, var(--k) 14%, transparent); }
    .head .chip.avg { --k: var(--secondary-text-color); height: 20px; padding: 0 6px; color: var(--secondary-text-color);
                      background: color-mix(in srgb, var(--rc-idle) 12%, transparent); }
    @container (max-width: 340px) { .head { gap: 6px; } .head .chip.avg { display: none; } }

    .room { --t: var(--rc-ok); }
    .room.lvl-cold  { --t: var(--rc-info); }
    .room.lvl-warn  { --t: var(--rc-warn); }
    .room.lvl-alert { --t: var(--rc-alert); }
    .chips { gap: 1px 2px; margin: 3px 0 0 -3px; }
  `;
}

export const RoomEnvironmentOverviewCardEditor = rcEditor({
  card: RoomEnvironmentOverviewCard,
  helpers: ["title", "columns", "zoom", "hide_when_clear", "exclude", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => {
    const probe = hass && rcProbe(RoomEnvironmentOverviewCard, hass, { ...config, exclude_areas: [], exclude: [], zoom: false });
    const rooms = probe ? probe._collect() : [];
    const ids = rooms.flatMap((x) => x.items.flatMap((i) => i.ids));
    for (const id of config?.exclude || []) if (!ids.includes(id)) ids.push(id);
    return [
      ...rcOverviewFields(REO_I18N, lang),
      ...rcBooleans("show_title", "zoom", "hide_when_clear"),
      ...rcIllustrationFields(REO_I18N, lang),
      {
        name: "exclude_areas",
        selector: { select: { multiple: true, mode: "dropdown", options: rooms.map((x) => ({ value: x.id, label: x.name })) } },
      },
      ...rcEntitiesField("exclude", ids),
      ...rcAdvanced(REO_I18N, lang, "thresholds", "rooms", "language"),
    ];
  },
});

rcRegister(
  RoomEnvironmentOverviewCard,
  RoomEnvironmentOverviewCardEditor,
  "Room Environment Overview Card",
  "The indoor climate of every room at a glance: temperature, humidity, CO₂ and what needs a look; tap a room for its readings",
);
