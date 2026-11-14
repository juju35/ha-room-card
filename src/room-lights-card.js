/**
 * room-lights-card — lights of a Home Assistant area: tap to toggle, drag to dim, hold for details.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RL_I18N = {
  en: {
    title: "Lights",
    ed_columns_helper: "Mini card: columns of the zoomed-in view",
    // Light tiles: feminine where "light" is ("1 encendida" / "Encendida · 50 %").
    on: "On",
    off: "Off",
    all_off: "All off",
    on_one: "{n} on",
    on_many: "{n} on",
    no_lights: "No light",
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /light",
    ed_only_on: "Hide lights that are off",
    ed_only_on_helper: "Only the lights that are on stay visible",
    ed_hide_when_off: "Hide the card when everything is off",
    ed_hide_when_off_helper: "The card only appears when a light is on",
    ed_show_brightness: "Show and adjust brightness",
    ed_show_brightness_helper: "Drag a light sideways to set its brightness",
    ed_all_off_button_helper: "Tapping the status pill turns every light of the card off",
    ed_include: "Lights to add",
    ed_include_helper: "From another room or without one",
    ed_exclude: "Lights to exclude",
    scenes: "Scenes",
    activate_scene: "Activate {name}",
    ed_show_scenes: "Show the room's scenes",
    ed_show_scenes_helper: "Scenes of the room (Philips Hue included), activated in one tap",
    ed_scenes: "Scenes to show (YAML)",
    ed_scenes_helper: "Replaces the room's scenes: scene IDs, or {entity, name, icon}",
  },
  fr: {
    title: "Lumières",
    ed_columns_helper: "Mini-carte : colonnes de la vue zoomée",
    on: "Allumée",
    off: "Éteinte",
    all_off: "Tout est éteint",
    on_one: "{n} allumée",
    on_many: "{n} allumées",
    no_lights: "Aucune lumière",
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /light",
    ed_only_on: "Masquer les lumières éteintes",
    ed_only_on_helper: "Seules les lumières allumées restent affichées",
    ed_hide_when_off: "Masquer la carte quand tout est éteint",
    ed_hide_when_off_helper: "La carte n'apparaît que si une lumière est allumée",
    ed_show_brightness: "Afficher et régler la luminosité",
    ed_show_brightness_helper: "Glisser une lumière sur le côté pour régler sa luminosité",
    ed_all_off_button_helper: "Un tap sur la pastille éteint toutes les lumières de la carte",
    ed_include: "Lumières à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce",
    ed_exclude: "Lumières à exclure",
    scenes: "Scènes",
    activate_scene: "Activer {name}",
    ed_show_scenes: "Afficher les scènes de la pièce",
    ed_show_scenes_helper: "Les scènes de la pièce (Philips Hue comprises), activées d'un tap",
    ed_scenes: "Scènes à afficher (YAML)",
    ed_scenes_helper: "Remplace les scènes de la pièce : identifiants de scènes, ou {entity, name, icon}",
  },
  de: {
    title: "Lichter",
    ed_columns_helper: "Mini-Karte: Spalten der vergrößerten Ansicht",
    on: "An",
    off: "Aus",
    all_off: "Alles aus",
    on_one: "{n} an",
    on_many: "{n} an",
    no_lights: "Kein Licht",
    ed_navigation_path_helper: "Dashboard, das beim Tippen auf den Titel geöffnet wird, z. B. /light",
    ed_only_on: "Ausgeschaltete Lichter ausblenden",
    ed_only_on_helper: "Nur eingeschaltete Lichter bleiben sichtbar",
    ed_hide_when_off: "Karte ausblenden, wenn alles aus ist",
    ed_hide_when_off_helper: "Die Karte erscheint nur, wenn ein Licht an ist",
    ed_show_brightness: "Helligkeit anzeigen und einstellen",
    ed_show_brightness_helper: "Ziehe ein Licht seitwärts, um seine Helligkeit einzustellen",
    ed_all_off_button_helper: "Tippen auf die Statusanzeige schaltet alle Lichter der Karte aus",
    ed_include: "Hinzuzufügende Lichter",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum",
    ed_exclude: "Auszuschließende Lichter",
    scenes: "Szenen",
    activate_scene: "{name} aktivieren",
    ed_show_scenes: "Szenen des Raums anzeigen",
    ed_show_scenes_helper: "Die Szenen des Raums (auch Philips Hue), mit einem Tippen aktiviert",
    ed_scenes: "Anzuzeigende Szenen (YAML)",
    ed_scenes_helper: "Ersetzt die Szenen des Raums: Szenen-IDs oder {entity, name, icon}",
  },
  es: {
    title: "Luces",
    ed_columns_helper: "Minitarjeta: columnas de la vista ampliada",
    on: "Encendida",
    off: "Apagada",
    all_off: "Todo apagado",
    on_one: "{n} encendida",
    on_many: "{n} encendidas",
    no_lights: "Ninguna luz",
    ed_navigation_path_helper: "Panel que se abre al tocar el título, p. ej. /light",
    ed_only_on: "Ocultar las luces apagadas",
    ed_only_on_helper: "Solo quedan visibles las luces encendidas",
    ed_hide_when_off: "Ocultar la tarjeta cuando todo está apagado",
    ed_hide_when_off_helper: "La tarjeta solo aparece cuando hay una luz encendida",
    ed_show_brightness: "Mostrar y ajustar el brillo",
    ed_show_brightness_helper: "Desliza una luz hacia un lado para ajustar su brillo",
    ed_all_off_button_helper: "Al tocar el indicador de estado se apagan todas las luces de la tarjeta",
    ed_include: "Luces a añadir",
    ed_include_helper: "De otra habitación o sin habitación",
    ed_exclude: "Luces a excluir",
    scenes: "Escenas",
    activate_scene: "Activar {name}",
    ed_show_scenes: "Mostrar las escenas de la habitación",
    ed_show_scenes_helper: "Las escenas de la habitación (Philips Hue incluidas), activadas con un toque",
    ed_scenes: "Escenas a mostrar (YAML)",
    ed_scenes_helper: "Sustituye las escenas de la habitación: IDs de escena o {entity, name, icon}",
  },
  sr: {
    title: "Светла",
    ed_columns_helper: "Мини картица: колоне у увећаном приказу",
    on: "Укључено",
    off: "Искључено",
    all_off: "Све искључено",
    on_one: "{n} укључено",
    on_few: "{n} укључена",
    on_many: "{n} укључених",
    no_lights: "Нема светала",
    ed_navigation_path_helper: "Контролна табла која се отвара додиром на наслов, нпр. /light",
    ed_only_on: "Сакриј светла која су искључена",
    ed_only_on_helper: "Остаће видљива само светла која су укључена",
    ed_hide_when_off: "Сакриј картицу када је све искључено",
    ed_hide_when_off_helper: "Картица се приказује само када је неко светло укључено",
    ed_show_brightness: "Прикажи и подеси осветљеност",
    ed_show_brightness_helper: "Превуците светло устрану да бисте подесили његову осветљеност",
    ed_all_off_button_helper: "Додир на статусну пилулу искључује сва светла на картици",
    ed_include: "Светла за додавање",
    ed_include_helper: "Из друге просторије или без ње",
    ed_exclude: "Изостави светла",
    scenes: "Сцене",
    activate_scene: "Активирај {name}",
    ed_show_scenes: "Прикажи сцене просторије",
    ed_show_scenes_helper: "Сцене просторије (укључујући Philips Hue), активиране једним додиром",
    ed_scenes: "Сцене за приказ (YAML)",
    ed_scenes_helper: "Замењује сцене просторије: ID-јеви сцена или {entity, name, icon}",
  },
  "sr-Latn": {
    title: "Svetla",
    ed_columns_helper: "Mini kartica: kolone u uvećanom prikazu",
    on: "Uključeno",
    off: "Isključeno",
    all_off: "Sve isključeno",
    on_one: "{n} uključeno",
    on_few: "{n} uključena",
    on_many: "{n} uključenih",
    no_lights: "Nema svetala",
    ed_navigation_path_helper: "Kontrolna tabla koja se otvara dodirom na naslov, npr. /light",
    ed_only_on: "Sakrij svetla koja su isključena",
    ed_only_on_helper: "Ostaće vidljiva samo svetla koja su uključena",
    ed_hide_when_off: "Sakrij karticu kada je sve isključeno",
    ed_hide_when_off_helper: "Kartica se prikazuje samo kada je neko svetlo uključeno",
    ed_show_brightness: "Prikaži i podesi osvetljenost",
    ed_show_brightness_helper: "Prevucite svetlo ustranu da biste podesili njegovu osvetljenost",
    ed_all_off_button_helper: "Dodir na statusnu pilulu isključuje sva svetla na kartici",
    ed_include: "Svetla za dodavanje",
    ed_include_helper: "Iz druge prostorije ili bez nje",
    ed_exclude: "Izostavi svetla",
    scenes: "Scene",
    activate_scene: "Aktiviraj {name}",
    ed_show_scenes: "Prikaži scene prostorije",
    ed_show_scenes_helper: "Scene prostorije (uključujući Philips Hue), aktivirane jednim dodirom",
    ed_scenes: "Scene za prikaz (YAML)",
    ed_scenes_helper: "Zamenjuje scene prostorije: ID-jevi scena ili {entity, name, icon}",
  },
  it: {
    title: "Luci",
    ed_columns_helper: "Mini scheda: colonne della vista ingrandita",
    on: "Accesa",
    off: "Spenta",
    all_off: "Tutto spento",
    on_one: "{n} accesa",
    on_many: "{n} accese",
    no_lights: "Nessuna luce",
    ed_navigation_path_helper: "Plancia aperta toccando il titolo, ad es. /light",
    ed_only_on: "Nascondi le luci spente",
    ed_only_on_helper: "Restano visibili solo le luci accese",
    ed_hide_when_off: "Nascondi la scheda quando tutto è spento",
    ed_hide_when_off_helper: "La scheda appare solo quando una luce è accesa",
    ed_show_brightness: "Mostra e regola la luminosità",
    ed_show_brightness_helper: "Trascina una luce di lato per regolarne la luminosità",
    ed_all_off_button_helper: "Toccando l'indicatore di stato si spengono tutte le luci della scheda",
    ed_include: "Luci da aggiungere",
    ed_include_helper: "Da un'altra stanza o senza stanza",
    ed_exclude: "Luci da escludere",
    scenes: "Scene",
    activate_scene: "Attiva {name}",
    ed_show_scenes: "Mostra le scene della stanza",
    ed_show_scenes_helper: "Le scene della stanza (comprese Philips Hue), attivate con un tocco",
    ed_scenes: "Scene da mostrare (YAML)",
    ed_scenes_helper: "Sostituisce le scene della stanza: ID delle scene o {entity, name, icon}",
  },
  nl: {
    title: "Lampen",
    ed_columns_helper: "Minikaart: kolommen van de vergrote weergave",
    on: "Aan",
    off: "Uit",
    all_off: "Alles uit",
    on_one: "{n} aan",
    on_many: "{n} aan",
    no_lights: "Geen lampen",
    ed_navigation_path_helper: "Dashboard dat opent bij een tik op de titel, bijv. /light",
    ed_only_on: "Uitgeschakelde lampen verbergen",
    ed_only_on_helper: "Alleen ingeschakelde lampen blijven zichtbaar",
    ed_hide_when_off: "Kaart verbergen als alles uit is",
    ed_hide_when_off_helper: "De kaart verschijnt alleen als er een lamp aan is",
    ed_show_brightness: "Helderheid tonen en aanpassen",
    ed_show_brightness_helper: "Sleep een lamp opzij om de helderheid in te stellen",
    ed_all_off_button_helper: "Een tik op de statusindicator schakelt alle lampen van de kaart uit",
    ed_include: "Toe te voegen lampen",
    ed_include_helper: "Uit een andere ruimte of zonder ruimte",
    ed_exclude: "Uit te sluiten lampen",
    scenes: "Scènes",
    activate_scene: "{name} activeren",
    ed_show_scenes: "Scènes van de ruimte tonen",
    ed_show_scenes_helper: "De scènes van de ruimte (ook Philips Hue), met één tik geactiveerd",
    ed_scenes: "Te tonen scènes (YAML)",
    ed_scenes_helper: "Vervangt de scènes van de ruimte: scène-ID's of {entity, name, icon}",
  },
  pt: {
    title: "Luzes",
    ed_columns_helper: "Minicartão: colunas da vista ampliada",
    on: "Acesa",
    off: "Apagada",
    all_off: "Tudo apagado",
    on_one: "{n} acesa",
    on_many: "{n} acesas",
    no_lights: "Nenhuma luz",
    ed_navigation_path_helper: "Painel aberto ao tocar no título, p. ex. /light",
    ed_only_on: "Ocultar as luzes apagadas",
    ed_only_on_helper: "Só ficam visíveis as luzes acesas",
    ed_hide_when_off: "Ocultar o cartão quando está tudo apagado",
    ed_hide_when_off_helper: "O cartão só aparece quando há uma luz acesa",
    ed_show_brightness: "Mostrar e ajustar o brilho",
    ed_show_brightness_helper: "Deslize uma luz para o lado para ajustar o brilho",
    ed_all_off_button_helper: "Tocar no indicador de estado apaga todas as luzes do cartão",
    ed_include: "Luzes a adicionar",
    ed_include_helper: "De outra divisão ou sem divisão",
    ed_exclude: "Luzes a excluir",
    scenes: "Cenas",
    activate_scene: "Ativar {name}",
    ed_show_scenes: "Mostrar as cenas da divisão",
    ed_show_scenes_helper: "As cenas da divisão (incluindo Philips Hue), ativadas com um toque",
    ed_scenes: "Cenas a mostrar (YAML)",
    ed_scenes_helper: "Substitui as cenas da divisão: IDs de cenas ou {entity, name, icon}",
  },
  pl: {
    title: "Światła",
    ed_columns_helper: "Minikarta: kolumny widoku powiększonego",
    on: "Włączone",
    off: "Wyłączone",
    all_off: "Wyłączone",
    on_one: "Włączone: {n}",
    on_many: "Włączone: {n}",
    no_lights: "Brak świateł",
    ed_navigation_path_helper: "Dashboard otwierany po dotknięciu tytułu, np. /light",
    ed_only_on: "Ukryj wyłączone światła",
    ed_only_on_helper: "Widoczne pozostają tylko włączone światła",
    ed_hide_when_off: "Ukryj kartę, gdy wszystko jest wyłączone",
    ed_hide_when_off_helper: "Karta pojawia się tylko, gdy jakieś światło jest włączone",
    ed_show_brightness: "Pokaż i reguluj jasność",
    ed_show_brightness_helper: "Przeciągnij światło w bok, aby ustawić jego jasność",
    ed_all_off_button_helper: "Dotknięcie wskaźnika stanu wyłącza wszystkie światła na karcie",
    ed_include: "Światła do dodania",
    ed_include_helper: "Z innego pomieszczenia lub bez pomieszczenia",
    ed_exclude: "Światła do wykluczenia",
    scenes: "Sceny",
    activate_scene: "Aktywuj {name}",
    ed_show_scenes: "Pokaż sceny pomieszczenia",
    ed_show_scenes_helper: "Sceny pomieszczenia (także Philips Hue), aktywowane jednym dotknięciem",
    ed_scenes: "Sceny do pokazania (YAML)",
    ed_scenes_helper: "Zastępuje sceny pomieszczenia: identyfikatory scen lub {entity, name, icon}",
  },
  ro: {
    title: "Lumini",
    ed_columns_helper: "Mini-card: coloanele vizualizării mărite",
    on: "Aprinsă",
    off: "Stinsă",
    all_off: "Totul stins",
    on_one: "Aprinse: {n}",
    on_many: "Aprinse: {n}",
    no_lights: "Nicio lumină",
    ed_navigation_path_helper: "Tablou de bord deschis la atingerea titlului, de ex. /light",
    ed_only_on: "Ascunde luminile stinse",
    ed_only_on_helper: "Rămân vizibile doar luminile aprinse",
    ed_hide_when_off: "Ascunde cardul când totul e stins",
    ed_hide_when_off_helper: "Cardul apare doar când o lumină e aprinsă",
    ed_show_brightness: "Afișează și reglează luminozitatea",
    ed_show_brightness_helper: "Glisează o lumină lateral pentru a-i regla luminozitatea",
    ed_all_off_button_helper: "Atingerea indicatorului de stare stinge toate luminile cardului",
    ed_include: "Lumini de adăugat",
    ed_include_helper: "Din altă cameră sau fără cameră",
    ed_exclude: "Lumini excluse",
    scenes: "Scene",
    activate_scene: "Activează {name}",
    ed_show_scenes: "Afișează scenele camerei",
    ed_show_scenes_helper: "Scenele camerei (inclusiv Philips Hue), activate cu o atingere",
    ed_scenes: "Scene de afișat (YAML)",
    ed_scenes_helper: "Înlocuiește scenele camerei: ID-uri de scene sau {entity, name, icon}",
  },
  da: {
    title: "Lys",
    ed_columns_helper: "Minikort: kolonner i den forstørrede visning",
    on: "Tændt",
    off: "Slukket",
    all_off: "Alt slukket",
    on_one: "{n} tændt",
    on_many: "{n} tændte",
    no_lights: "Intet lys",
    ed_navigation_path_helper: "Dashboard, der åbnes ved tryk på titlen, f.eks. /light",
    ed_only_on: "Skjul slukkede lys",
    ed_only_on_helper: "Kun de tændte lys forbliver synlige",
    ed_hide_when_off: "Skjul kortet, når alt er slukket",
    ed_hide_when_off_helper: "Kortet vises kun, når et lys er tændt",
    ed_show_brightness: "Vis og justér lysstyrke",
    ed_show_brightness_helper: "Træk et lys til siden for at indstille dets lysstyrke",
    ed_all_off_button_helper: "Et tryk på statusindikatoren slukker alle lys på kortet",
    ed_include: "Lys, der tilføjes",
    ed_include_helper: "Fra et andet rum eller uden rum",
    ed_exclude: "Lys, der udelades",
    scenes: "Scener",
    activate_scene: "Aktivér {name}",
    ed_show_scenes: "Vis rummets scener",
    ed_show_scenes_helper: "Rummets scener (også Philips Hue), aktiveret med ét tryk",
    ed_scenes: "Scener, der vises (YAML)",
    ed_scenes_helper: "Erstatter rummets scener: scene-id'er eller {entity, name, icon}",
  },
  sv: {
    title: "Lampor",
    ed_columns_helper: "Minikort: kolumner i inzoomad vy",
    on: "På",
    off: "Av",
    all_off: "Allt släckt",
    on_one: "{n} tänd",
    on_many: "{n} tända",
    no_lights: "Inga lampor",
    ed_navigation_path_helper: "Instrumentpanel som öppnas vid tryck på titeln, t.ex. /light",
    ed_only_on: "Dölj släckta lampor",
    ed_only_on_helper: "Bara tända lampor förblir synliga",
    ed_hide_when_off: "Dölj kortet när allt är släckt",
    ed_hide_when_off_helper: "Kortet visas bara när en lampa är tänd",
    ed_show_brightness: "Visa och justera ljusstyrka",
    ed_show_brightness_helper: "Dra en lampa åt sidan för att ställa in dess ljusstyrka",
    ed_all_off_button_helper: "Ett tryck på statusindikatorn släcker alla lampor på kortet",
    ed_include: "Lampor att lägga till",
    ed_include_helper: "Från ett annat rum eller utan rum",
    ed_exclude: "Lampor att utesluta",
    scenes: "Scener",
    activate_scene: "Aktivera {name}",
    ed_show_scenes: "Visa rummets scener",
    ed_show_scenes_helper: "Rummets scener (även Philips Hue), aktiveras med ett tryck",
    ed_scenes: "Scener att visa (YAML)",
    ed_scenes_helper: "Ersätter rummets scener: scen-ID:n eller {entity, name, icon}",
  },
  bg: {
    title: "Светлини",
    ed_columns_helper: "Мини карта: колони в увеличения изглед",
    on: "Включена",
    off: "Изключена",
    all_off: "Всичко е изключено",
    on_one: "{n} включена",
    on_many: "{n} включени",
    no_lights: "Няма осветление",
    ed_navigation_path_helper: "Табло, което се отваря с докосване на заглавието, напр. /light",
    ed_only_on: "Скрий изключените лампи",
    ed_only_on_helper: "Остават видими само включените лампи",
    ed_hide_when_off: "Скрий картата, когато всичко е изключено",
    ed_hide_when_off_helper: "Картата се показва само когато има включена лампа",
    ed_show_brightness: "Показвай и регулирай яркостта",
    ed_show_brightness_helper: "Плъзнете лампа настрани, за да зададете яркостта ѝ",
    ed_all_off_button_helper: "Докосването на индикатора за състояние изключва всички лампи от картата",
    ed_include: "Лампи за добавяне",
    ed_include_helper: "От друга стая или без стая",
    ed_exclude: "Лампи за пропускане",
    scenes: "Сцени",
    activate_scene: "Активиране на {name}",
    ed_show_scenes: "Показвай сцените на стаята",
    ed_show_scenes_helper: "Сцените на стаята (включително Philips Hue), активирани с едно докосване",
    ed_scenes: "Сцени за показване (YAML)",
    ed_scenes_helper: "Заменя сцените на стаята: ID на сцени или {entity, name, icon}",
  },
  ru: {
    title: "Освещение",
    ed_columns_helper: "Мини-карточка: столбцы развёрнутого вида",
    on: "Включено",
    off: "Выключено",
    all_off: "Всё выключено",
    on_one: "Включено: {n}",
    on_many: "Включено: {n}",
    no_lights: "Нет светильников",
    ed_navigation_path_helper: "Панель, открываемая нажатием на заголовок, например /light",
    ed_only_on: "Скрыть выключенные светильники",
    ed_only_on_helper: "Видны только включённые светильники",
    ed_hide_when_off: "Скрывать карточку, когда всё выключено",
    ed_hide_when_off_helper: "Карточка появляется, только когда включён хотя бы один светильник",
    ed_show_brightness: "Показывать и регулировать яркость",
    ed_show_brightness_helper: "Проведите по светильнику в сторону, чтобы задать его яркость",
    ed_all_off_button_helper: "Нажатие на индикатор состояния выключает все светильники карточки",
    ed_include: "Добавить светильники",
    ed_include_helper: "Из другой комнаты или без комнаты",
    ed_exclude: "Исключить светильники",
    scenes: "Сцены",
    activate_scene: "Активировать {name}",
    ed_show_scenes: "Показывать сцены комнаты",
    ed_show_scenes_helper: "Сцены комнаты (включая Philips Hue), запускаются одним нажатием",
    ed_scenes: "Показываемые сцены (YAML)",
    ed_scenes_helper: "Заменяет сцены комнаты: ID сцен или {entity, name, icon}",
  },
  uk: {
    title: "Освітлення",
    ed_columns_helper: "Міні-картка: стовпці розгорнутого вигляду",
    on: "Увімкнено",
    off: "Вимкнено",
    all_off: "Усе вимкнено",
    on_one: "Увімкнено: {n}",
    on_many: "Увімкнено: {n}",
    no_lights: "Немає світильників",
    ed_navigation_path_helper: "Панель, що відкривається натисканням на заголовок, наприклад /light",
    ed_only_on: "Приховати вимкнені світильники",
    ed_only_on_helper: "Видимими залишаються лише ввімкнені світильники",
    ed_hide_when_off: "Приховувати картку, коли все вимкнено",
    ed_hide_when_off_helper: "Картка з'являється, лише коли ввімкнено хоча б один світильник",
    ed_show_brightness: "Показувати й регулювати яскравість",
    ed_show_brightness_helper: "Проведіть світильником убік, щоб задати його яскравість",
    ed_all_off_button_helper: "Натискання на індикатор стану вимикає всі світильники картки",
    ed_include: "Додати світильники",
    ed_include_helper: "З іншої кімнати або без кімнати",
    ed_exclude: "Виключити світильники",
    scenes: "Сцени",
    activate_scene: "Активувати {name}",
    ed_show_scenes: "Показувати сцени кімнати",
    ed_show_scenes_helper: "Сцени кімнати (зокрема Philips Hue), запускаються одним натисканням",
    ed_scenes: "Сцени для показу (YAML)",
    ed_scenes_helper: "Замінює сцени кімнати: ID сцен або {entity, name, icon}",
  },
  hu: {
    title: "Világítás",
    ed_columns_helper: "Mini kártya: a nagyított nézet oszlopai",
    on: "Be",
    off: "Ki",
    all_off: "Minden kikapcsolva",
    on_one: "{n} bekapcsolva",
    on_many: "{n} bekapcsolva",
    no_lights: "Nincs lámpa",
    ed_navigation_path_helper: "A címre koppintva megnyíló irányítópult, pl. /light",
    ed_only_on: "Kikapcsolt lámpák elrejtése",
    ed_only_on_helper: "Csak a bekapcsolt lámpák maradnak láthatók",
    ed_hide_when_off: "A kártya elrejtése, ha minden ki van kapcsolva",
    ed_hide_when_off_helper: "A kártya csak akkor jelenik meg, ha egy lámpa be van kapcsolva",
    ed_show_brightness: "Fényerő megjelenítése és állítása",
    ed_show_brightness_helper: "Húzz oldalra egy lámpát a fényerejének beállításához",
    ed_all_off_button_helper: "Az állapotjelzőre koppintva a kártya összes lámpája kikapcsol",
    ed_include: "Hozzáadandó lámpák",
    ed_include_helper: "Másik helyiségből vagy helyiség nélkül",
    ed_exclude: "Kihagyott lámpák",
    scenes: "Jelenetek",
    activate_scene: "{name} aktiválása",
    ed_show_scenes: "A helyiség jeleneteinek megjelenítése",
    ed_show_scenes_helper: "A helyiség jelenetei (a Philips Hue is), egy koppintással aktiválva",
    ed_scenes: "Megjelenítendő jelenetek (YAML)",
    ed_scenes_helper: "A helyiség jeleneteit helyettesíti: jelenetazonosítók vagy {entity, name, icon}",
  },
  sk: {
    title: "Svetlá",
    ed_columns_helper: "Minikarta: stĺpce priblíženého zobrazenia",
    on: "Zapnuté",
    off: "Vypnuté",
    all_off: "Všetko vypnuté",
    on_one: "Zapnuté: {n}",
    on_many: "Zapnuté: {n}",
    no_lights: "Žiadne svetlá",
    ed_navigation_path_helper: "Ovládací panel otvorený ťuknutím na názov, napr. /light",
    ed_only_on: "Skryť vypnuté svetlá",
    ed_only_on_helper: "Viditeľné zostanú len zapnuté svetlá",
    ed_hide_when_off: "Skryť kartu, keď je všetko vypnuté",
    ed_hide_when_off_helper: "Karta sa zobrazí len vtedy, keď svieti nejaké svetlo",
    ed_show_brightness: "Zobraziť a nastaviť jas",
    ed_show_brightness_helper: "Potiahnutím svetla do strany nastavíte jeho jas",
    ed_all_off_button_helper: "Ťuknutie na indikátor stavu vypne všetky svetlá na karte",
    ed_include: "Svetlá na pridanie",
    ed_include_helper: "Z inej miestnosti alebo bez miestnosti",
    ed_exclude: "Vynechané svetlá",
    scenes: "Scény",
    activate_scene: "Aktivovať {name}",
    ed_show_scenes: "Zobraziť scény miestnosti",
    ed_show_scenes_helper: "Scény miestnosti (aj Philips Hue), aktivované jedným ťuknutím",
    ed_scenes: "Zobrazené scény (YAML)",
    ed_scenes_helper: "Nahrádza scény miestnosti: ID scén alebo {entity, name, icon}",
  },
  cs: {
    title: "Světla",
    ed_columns_helper: "Minikarta: sloupce přiblíženého zobrazení",
    on: "Zapnuto",
    off: "Vypnuto",
    all_off: "Vše vypnuto",
    on_one: "Zapnuto: {n}",
    on_many: "Zapnuto: {n}",
    no_lights: "Žádná světla",
    ed_navigation_path_helper: "Ovládací panel otevřený klepnutím na název, např. /light",
    ed_only_on: "Skrýt vypnutá světla",
    ed_only_on_helper: "Viditelná zůstanou jen zapnutá světla",
    ed_hide_when_off: "Skrýt kartu, když je vše vypnuto",
    ed_hide_when_off_helper: "Karta se zobrazí jen tehdy, když svítí nějaké světlo",
    ed_show_brightness: "Zobrazit a nastavit jas",
    ed_show_brightness_helper: "Přetažením světla do strany nastavíte jeho jas",
    ed_all_off_button_helper: "Klepnutí na indikátor stavu vypne všechna světla na kartě",
    ed_include: "Světla k přidání",
    ed_include_helper: "Z jiné místnosti nebo bez místnosti",
    ed_exclude: "Vynechaná světla",
    scenes: "Scény",
    activate_scene: "Aktivovat {name}",
    ed_show_scenes: "Zobrazit scény místnosti",
    ed_show_scenes_helper: "Scény místnosti (i Philips Hue), aktivované jedním klepnutím",
    ed_scenes: "Zobrazené scény (YAML)",
    ed_scenes_helper: "Nahrazuje scény místnosti: ID scén nebo {entity, name, icon}",
  },
  sl: {
    title: "Luči",
    ed_columns_helper: "Mini kartica: stolpci povečanega pogleda",
    on: "Vklopljeno",
    off: "Izklopljeno",
    all_off: "Vse izklopljeno",
    on_one: "Vklopljeno: {n}",
    on_many: "Vklopljeno: {n}",
    no_lights: "Ni luči",
    ed_navigation_path_helper: "Nadzorna plošča, ki se odpre ob dotiku naslova, npr. /light",
    ed_only_on: "Skrij izklopljene luči",
    ed_only_on_helper: "Vidne ostanejo samo prižgane luči",
    ed_hide_when_off: "Skrij kartico, ko je vse izklopljeno",
    ed_hide_when_off_helper: "Kartica se prikaže samo, ko kakšna luč sveti",
    ed_show_brightness: "Prikaži in nastavi svetlost",
    ed_show_brightness_helper: "Povlecite luč vstran, da nastavite njeno svetlost",
    ed_all_off_button_helper: "Dotik indikatorja stanja izklopi vse luči na kartici",
    ed_include: "Luči za dodajanje",
    ed_include_helper: "Iz drugega prostora ali brez prostora",
    ed_exclude: "Izpuščene luči",
    scenes: "Scene",
    activate_scene: "Aktiviraj {name}",
    ed_show_scenes: "Prikaži scene prostora",
    ed_show_scenes_helper: "Scene prostora (tudi Philips Hue), aktivirane z enim dotikom",
    ed_scenes: "Prikazane scene (YAML)",
    ed_scenes_helper: "Nadomesti scene prostora: ID-ji scen ali {entity, name, icon}",
  },
  lv: {
    title: "Gaismas",
    ed_columns_helper: "Mini karte: palielinātā skata kolonnas",
    on: "Ieslēgts",
    off: "Izslēgts",
    all_off: "Viss izslēgts",
    on_one: "Ieslēgti: {n}",
    on_many: "Ieslēgti: {n}",
    no_lights: "Nav gaismekļu",
    ed_navigation_path_helper: "Informācijas panelis, kas tiek atvērts, pieskaroties virsrakstam, piem., /light",
    ed_only_on: "Paslēpt izslēgtos gaismekļus",
    ed_only_on_helper: "Redzami paliek tikai ieslēgtie gaismekļi",
    ed_hide_when_off: "Paslēpt karti, kad viss ir izslēgts",
    ed_hide_when_off_helper: "Karte parādās tikai tad, kad kāds gaismeklis ir ieslēgts",
    ed_show_brightness: "Rādīt un regulēt spilgtumu",
    ed_show_brightness_helper: "Velciet gaismekli uz sāniem, lai iestatītu tā spilgtumu",
    ed_all_off_button_helper: "Pieskaroties statusa indikatoram, tiek izslēgti visi kartes gaismekļi",
    ed_include: "Pievienojamie gaismekļi",
    ed_include_helper: "No citas telpas vai bez telpas",
    ed_exclude: "Izslēdzamie gaismekļi",
    scenes: "Ainas",
    activate_scene: "Aktivizēt {name}",
    ed_show_scenes: "Rādīt telpas ainas",
    ed_show_scenes_helper: "Telpas ainas (arī Philips Hue), aktivizējamas ar vienu pieskārienu",
    ed_scenes: "Rādāmās ainas (YAML)",
    ed_scenes_helper: "Aizstāj telpas ainas: ainu ID vai {entity, name, icon}",
  },
  el: {
    title: "Φώτα",
    ed_columns_helper: "Μίνι κάρτα: στήλες της μεγεθυμένης προβολής",
    on: "Αναμμένο",
    off: "Σβηστό",
    all_off: "Όλα σβηστά",
    on_one: "{n} αναμμένο",
    on_many: "{n} αναμμένα",
    no_lights: "Κανένα φως",
    ed_navigation_path_helper: "Πίνακας ελέγχου που ανοίγει με πάτημα στον τίτλο, π.χ. /light",
    ed_only_on: "Απόκρυψη σβηστών φώτων",
    ed_only_on_helper: "Μένουν ορατά μόνο τα αναμμένα φώτα",
    ed_hide_when_off: "Απόκρυψη της κάρτας όταν όλα είναι σβηστά",
    ed_hide_when_off_helper: "Η κάρτα εμφανίζεται μόνο όταν ένα φως είναι αναμμένο",
    ed_show_brightness: "Εμφάνιση και ρύθμιση φωτεινότητας",
    ed_show_brightness_helper: "Σύρετε ένα φως στο πλάι για να ρυθμίσετε τη φωτεινότητά του",
    ed_all_off_button_helper: "Το πάτημα της ένδειξης κατάστασης σβήνει όλα τα φώτα της κάρτας",
    ed_include: "Φώτα προς προσθήκη",
    ed_include_helper: "Από άλλο δωμάτιο ή χωρίς δωμάτιο",
    ed_exclude: "Φώτα προς εξαίρεση",
    scenes: "Σκηνές",
    activate_scene: "Ενεργοποίηση {name}",
    ed_show_scenes: "Εμφάνιση των σκηνών του δωματίου",
    ed_show_scenes_helper: "Οι σκηνές του δωματίου (και Philips Hue), ενεργοποιούνται με ένα πάτημα",
    ed_scenes: "Σκηνές προς εμφάνιση (YAML)",
    ed_scenes_helper: "Αντικαθιστά τις σκηνές του δωματίου: ID σκηνών ή {entity, name, icon}",
  },
};

// "Lumière Canapé" → "Canapé", "Séjour Veilleuse" in Séjour → "Veilleuse"
const RL_PREFIX = /^(lumi[eè]re|lampe|light|lamp)\s+/i;
const RL_SUFFIX = /$^/;
// Keyboard dimming: the light is called this long after the last ←/→ step.
const RL_KEY_MS = 300;

// Scenes: "Scène Lecture" → "Lecture"; a Hue scene also loses its Hue room's name ("Séjour Lecture" → "Lecture").
const RL_SCENE_PREFIX = /^(sc[eè]ne|scene)\s+/i;

// Brightness can be set unless the light only supports on/off.
const rlDimmable = (st) =>
  st.entity_id.startsWith("light.") && (st.attributes.supported_color_modes || []).some((m) => m !== "onoff");

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomLightsCard extends RcToggleCard {
  static tag = "room-lights-card";
  static i18n = RL_I18N;
  static needsArea = true;
  static includeDomains = ["light", "switch"];
  static headIcons = ["mdi:lightbulb-group", "mdi:lightbulb-group-off-outline"];
  static emptyKey = "no_lights";
  static defaults = {
    columns: 2,
    layout: "compact",
    only_on: false,
    hide_when_off: false,
    show_brightness: true,
    all_off_button: true,
    show_scenes: true,
    exclude: [],
  };

  constructor() {
    super();
    // A click anywhere else folds the scenes back.
    this._onScenesOutside = (ev) => {
      if (this._scenesOpen && rcOutside(this, ev)) this._foldScenes();
    };
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._scenesWatch ??= watchOutside(this, this._onScenesOutside);
    this._scenesWatch.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._scenesWatch?.off();
    // Left (another dashboard view, a conditional card hidden): folded again.
    this._scenesOpen = false;
    this._sig = null;
  }

  _foldScenes() {
    this._scenesOpen = false;
    this._sig = null;
    this._render();
  }

  _candidate(id) {
    return rcMatchLight(this._hass, id);
  }

  // The room's scenes: `scenes` when given (IDs or {entity, name, icon}), else the scene entities of the area, and
  // the Philips Hue scenes of the Hue room named like it (they often have no area of their own). None with
  // `show_scenes: false`. Sorted by name.
  _scenes() {
    const h = this._hass;
    const c = this._config;
    if (c.show_scenes === false) return [];
    const areaName = this._areaName();
    const list = c.scenes?.length
      ? c.scenes.map((e) => (typeof e === "string" ? { entity: e } : e)).filter((e) => e?.entity && h.states[e.entity])
      : c.area
        ? Object.keys(h.entities || {})
            .filter((id) => id.startsWith("scene.") && h.states[id] && !h.entities[id].hidden && !(c.exclude || []).includes(id))
            .filter((id) => {
              if (this._areaOf(id) === c.area) return true;
              const group = h.states[id].attributes.group_name;
              return !this._areaOf(id) && h.entities[id].platform === "hue" && !!areaName && String(group || "").toLowerCase() === areaName.toLowerCase();
            })
            .map((entity) => ({ entity }))
        : [];
    return list
      .map((e) => {
        const st = h.states[e.entity];
        const group = st.attributes.group_name;
        let name = e.name ?? rcCleanName(st.attributes.friendly_name || e.entity, areaName, RL_SCENE_PREFIX, /$^/);
        if (!e.name && group && group !== areaName) name = rcCleanName(name, group, /$^/, /$^/);
        return {
          id: e.entity,
          name,
          icon: e.icon ?? h.entities?.[e.entity]?.icon ?? st.attributes.icon ?? "mdi:palette-outline",
          dynamic: h.entities?.[e.entity]?.platform === "hue" && st.attributes.is_dynamic === true,
          unavailable: rcUnavailable(st),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // The scenes and whether their section is open count as something shown: a change redraws the card.
  _changed(parts) {
    this._sceneItems = this._scenes();
    return super._changed([...parts, this._scenesOpen === true, this._sceneItems.map((x) => [x.id, x.name, x.icon, x.dynamic, x.unavailable])]);
  }

  // Under the lights: a "Scenes" section, folded (chevron right) until its title is tapped (chevron down), then one
  // chip per scene. A tap activates it: scene.turn_on, or hue.activate_scene for a dynamic Hue scene (its colours
  // keep moving).
  _afterGrid() {
    const scenes = this._sceneItems || [];
    if (!scenes.length) return "";
    const open = this._scenesOpen === true;
    const chips = open
      ? `<div class="scenes">${scenes
          .map(
            (x) =>
              `<button class="scene${x.unavailable ? " na" : ""}" data-scene="${rcEsc(x.id)}" title="${rcEsc(this._t("activate_scene", { name: x.name }))}"${
                x.unavailable ? " disabled" : ""
              }><ha-icon icon="${rcEsc(x.icon)}"></ha-icon><span>${rcEsc(x.name)}</span></button>`,
          )
          .join("")}</div>`
      : "";
    return `<div class="section">
        <button class="section-title" aria-expanded="${open}"><ha-icon icon="mdi:palette-outline"></ha-icon><span>${rcEsc(
          this._t("scenes"),
        )}</span><span class="count">${scenes.length}</span><ha-icon class="chev" icon="${open ? "mdi:chevron-down" : "mdi:chevron-right"}"></ha-icon></button>
        ${chips}
      </div>`;
  }

  _bindAfter(root) {
    root.querySelector(".section-title")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this._scenesOpen = !this._scenesOpen;
      this._sig = null;
      this._render();
      // From the keyboard (Enter / Space: no click count), the new title keeps the focus.
      if (ev.detail === 0) this.shadowRoot.querySelector(".section-title")?.focus({ preventScroll: true });
    });
    for (const el of root.querySelectorAll(".scene")) el.addEventListener("click", (ev) => this._activateScene(ev, el.dataset.scene));
  }

  _activateScene(ev, id) {
    ev?.stopPropagation?.();
    const x = (this._sceneItems || []).find((i) => i.id === id);
    if (!x || x.unavailable) return;
    if (x.dynamic) rcCall(this._hass, "hue", "activate_scene", { entity_id: id, dynamic: true });
    else rcCall(this._hass, "scene", "turn_on", { entity_id: id });
  }

  _collect() {
    const h = this._hass;
    const areaName = this._areaName();
    return this._entries()
      .map((e) => {
        const st = h.states[e.entity];
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        const pct = on && st.attributes.brightness != null ? Math.round((st.attributes.brightness / 255) * 100) : null;
        const rgb = on ? st.attributes.rgb_color : null;
        const item = {
          id: e.entity,
          on,
          unavailable,
          dimmable: rlDimmable(st),
          pct,
          color: rgb ? `rgb(${rgb.join(",")})` : null,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RL_PREFIX, RL_SUFFIX),
          icon:
            e.icon ?? h.entities?.[e.entity]?.icon ?? st.attributes.icon ?? (on ? "mdi:lightbulb" : "mdi:lightbulb-outline"),
        };
        item.state = this._stateText(item);
        return item;
      })
      .sort((a, b) => b.on - a.on || a.name.localeCompare(b.name));
  }

  _stateText(i) {
    if (i.unavailable) return this._t("unavailable");
    if (!i.on) return this._t("off");
    return i.pct != null ? `${this._t("on")} · ${i.pct} %` : this._t("on");
  }

  _sigOf(i) {
    return [i.id, i.on, i.unavailable, i.pct, i.color, i.name, i.icon];
  }

  _tileOf(i) {
    return this._tile(i, {
      style: i.color ? `--t:${i.color}` : "",
      extra:
        this._config.show_brightness && i.dimmable && i.on
          ? `<span class="bar" style="width:${i.pct ?? 100}%"></span>`
          : "",
      state: rcEsc(i.state),
    });
  }

  // Tap: toggle · hold: more-info · horizontal drag on a dimmable light: brightness (←/→ from the keyboard: ±10 %).
  _bindTile(el, item) {
    const pctAt = (x) => {
      const r = el.getBoundingClientRect();
      return Math.min(100, Math.max(1, Math.round(((x - r.left) / r.width) * 100)));
    };
    const show = (pct) => {
      let bar = el.querySelector(".bar");
      if (!bar) {
        bar = document.createElement("span");
        bar.className = "bar";
        el.prepend(bar);
      }
      bar.style.width = `${pct}%`;
      el.querySelector(".state").textContent = `${this._t("on")} · ${pct} %`;
    };
    // Brightness the keyboard steps from: the light's, until it reports the new one (the tile is then redrawn).
    let level = item?.on ? (item.pct ?? 100) : 0;
    // The keyboard steps show at once; the light gets one call, RL_KEY_MS after the last step (or on the key's release).
    // Updates wait meanwhile, like during a drag, so a redraw does not bring the old level back.
    let pending = null;
    const send = () => {
      if (!pending) return;
      clearTimeout(pending);
      pending = null;
      rcCall(this._hass, "light", "turn_on", { entity_id: item.id, brightness_pct: level });
      this._sig = null;
      this._released(false);
    };
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: item.id }),
      onHold: () => rcMoreInfo(this, item.id),
      drag:
        this._config.show_brightness && item?.dimmable
          ? {
              move: (x) => show(pctAt(x)),
              end: (x) => rcCall(this._hass, "light", "turn_on", { entity_id: item.id, brightness_pct: pctAt(x) }),
              step: (delta) => {
                const pct = Math.min(100, Math.max(1, level + delta));
                if (item.unavailable || pct === level || (!level && delta < 0)) return;
                level = pct;
                show(pct);
                this._pressing = true;
                clearTimeout(pending);
                pending = setTimeout(send, RL_KEY_MS);
              },
              flush: send,
            }
          : null,
    });
  }

  static styles = `
    ha-card.lvl-on  { --c: var(--rc-light); }
    ha-card.lvl-off { --c: var(--rc-idle); }
    .tile { --t: var(--rc-light); }
    .tile.off { --t: var(--rc-idle); }
    .tile.off .ic { background: color-mix(in srgb, var(--t) 12%, transparent); }
    .bar { position: absolute; inset: 0 auto 0 0; pointer-events: none;
           background: color-mix(in srgb, var(--t) 14%, transparent); transition: width .2s; }
    .tile.dragging .bar { transition: none; }
    @media (prefers-reduced-motion: reduce) { .bar { transition: none; } }
    .section { margin-top: 8px; }
    .section-title { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 6px; cursor: pointer;
                     font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--secondary-text-color);
                     padding: 4px 2px; border-radius: 6px; }
    .section-title:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .section-title ha-icon { --mdc-icon-size: 16px; flex: none; }
    .section-title span:first-of-type { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .section-title .count { font-size: 11px; font-weight: 500; padding: 0 6px; border-radius: 999px;
                            background: color-mix(in srgb, var(--rc-light) 14%, transparent); color: var(--rc-light); }
    .scenes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .scene { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
             padding: 4px 10px 4px 6px; border-radius: 999px; font-size: 12px; font-weight: 500; color: var(--primary-text-color);
             background: color-mix(in srgb, var(--rc-light) 9%, var(--secondary-background-color, transparent));
             border: 1px solid color-mix(in srgb, var(--rc-light) 22%, transparent); }
    .scene span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scene ha-icon { --mdc-icon-size: 16px; color: var(--rc-light); flex: none; }
    .scene:hover { background: color-mix(in srgb, var(--rc-light) 16%, var(--secondary-background-color, transparent)); }
    .scene:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .scene.na { opacity: .6; cursor: default; }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomLightsCardEditor = rcEditor({
  card: RoomLightsCard,
  helpers: ["title", "navigation_path", "layout", "only_on", "hide_when_off", "show_brightness", "all_off_button", "show_scenes", "scenes", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RL_I18N, lang),
    ...rcBooleans("show_title", "only_on", "hide_when_off", "show_brightness", "all_off_button", "show_scenes"),
    ...rcIncludeField(RoomLightsCard, hass, config),
    ...rcExcludeField(RoomLightsCard, hass, config),
    ...rcAdvanced(RL_I18N, lang, "entities", "scenes", "language"),
  ],
});

rcRegister(
  RoomLightsCard,
  RoomLightsCardEditor,
  "Room Lights Card",
  "Lights of a room: tap to toggle, drag to dim, turn everything off from the header",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status (*2/4 on*, with the button turning every light off), then a
// pill tinted with its colour for each light that is on, the icon alone for the others. The zoom button switches to
// the full Lights card (tap to toggle, drag to dim, the scenes) and back. `columns`, `show_brightness` and the scenes
// only shape the zoomed-in view.
class RoomLightsMiniCard extends rcToggleMini(RoomLightsCard, "room-lights-mini-card", ".r.on { --t: var(--rc-light); }") {}

const RoomLightsMiniCardEditor = rcEditor({
  card: RoomLightsMiniCard,
  helpers: ["title", "navigation_path", "layout", "columns", "only_on", "hide_when_off", "show_brightness", "all_off_button", "zoom", "show_scenes", "scenes", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RL_I18N, lang),
    ...rcBooleans("show_title", "only_on", "hide_when_off", "all_off_button", "zoom", "show_brightness", "show_scenes"),
    ...rcIncludeField(RoomLightsMiniCard, hass, config),
    ...rcExcludeField(RoomLightsMiniCard, hass, config),
    ...rcAdvanced(RL_I18N, lang, "entities", "scenes", "language"),
  ],
});

rcRegister(
  RoomLightsMiniCard,
  RoomLightsMiniCardEditor,
  "Room Lights Mini Card",
  "The lights of a room on two lines: how many are on, a button to turn them all off, and a zoom to the full card",
);
