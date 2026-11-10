/**
 * room-environment-card — temperature, humidity, air quality, noise and light level of a Home Assistant area.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RE_I18N = {
  en: {
    ed_columns_helper: "Mini card: columns of the zoomed-in view",
    title: "Environment",
    no_sensors: "No sensor",
    comfortable: "Comfortable",
    k_temperature: "Temperature",
    k_humidity: "Humidity",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Air quality",
    k_noise: "Noise",
    k_illuminance: "Light",
    b_temperature: ["Cold", "Cool", "Comfortable", "Warm", "Hot"],
    b_humidity: ["Very dry", "Dry", "Comfortable", "Humid", "Very humid"],
    b_air: ["", "", "Good", "Moderate", "Poor"],
    b_noise: ["", "", "Quiet", "Noisy", "Very noisy"],
    b_illuminance: ["Dark", "Dim", "Bright"],
    i_temperature: ["Too cold", "Too hot"],
    i_humidity: ["Too dry", "Too humid"],
    i_co2: ["", "Ventilate"],
    i_air: ["", "Poor air"],
    i_noise: ["", "Noisy"],
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /dashboard-home/living-room",
    ed_only_alerts: "Hide comfortable readings",
    ed_only_alerts_helper: "Only the readings outside the comfort range stay visible",
    ed_show_gauge: "Show gauges",
    ed_show_gauge_helper: "A thin bar under each reading, coloured by its level",
    ed_show_history: "Show 24 h curves",
    ed_show_history_helper: "The last 24 hours of each reading, drawn behind it",
    ed_include: "Sensors to add",
    ed_include_helper: "From another room or without one",
    ed_exclude: "Sensors to exclude",
  },
  fr: {
    ed_columns_helper: "Mini-carte : colonnes de la vue zoomée",
    title: "Environnement",
    no_sensors: "Aucun capteur",
    comfortable: "Confortable",
    k_temperature: "Température",
    k_humidity: "Humidité",
    k_co2: "CO2",
    k_pm25: "PM2,5",
    k_pm10: "PM10",
    k_voc: "COV",
    k_aqi: "Qualité de l'air",
    k_noise: "Bruit",
    k_illuminance: "Luminosité",
    b_temperature: ["Froid", "Frais", "Confortable", "Chaud", "Très chaud"],
    b_humidity: ["Très sec", "Sec", "Confortable", "Humide", "Très humide"],
    b_air: ["", "", "Bon", "Moyen", "Mauvais"],
    b_noise: ["", "", "Calme", "Bruyant", "Très bruyant"],
    b_illuminance: ["Sombre", "Tamisé", "Lumineux"],
    i_temperature: ["Trop froid", "Trop chaud"],
    i_humidity: ["Trop sec", "Trop humide"],
    i_co2: ["", "Aérer"],
    i_air: ["", "Air pollué"],
    i_noise: ["", "Bruyant"],
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /dashboard-maison/salon",
    ed_only_alerts: "Masquer les mesures confortables",
    ed_only_alerts_helper: "Seules les mesures hors de la plage de confort restent affichées",
    ed_show_gauge: "Afficher les jauges",
    ed_show_gauge_helper: "Une fine barre sous chaque mesure, colorée selon son niveau",
    ed_show_history: "Afficher les courbes 24 h",
    ed_show_history_helper: "Les dernières 24 heures de chaque mesure, dessinées derrière elle",
    ed_include: "Capteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce",
    ed_exclude: "Capteurs à exclure",
  },
  de: {
    ed_columns_helper: "Mini-Karte: Spalten der vergrößerten Ansicht",
    title: "Umgebung",
    no_sensors: "Kein Sensor",
    comfortable: "Angenehm",
    k_temperature: "Temperatur",
    k_humidity: "Luftfeuchtigkeit",
    k_co2: "CO2",
    k_pm25: "PM2,5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Luftqualität",
    k_noise: "Lärm",
    k_illuminance: "Helligkeit",
    b_temperature: ["Kalt", "Kühl", "Angenehm", "Warm", "Heiß"],
    b_humidity: ["Sehr trocken", "Trocken", "Angenehm", "Feucht", "Sehr feucht"],
    b_air: ["", "", "Gut", "Mäßig", "Schlecht"],
    b_noise: ["", "", "Ruhig", "Laut", "Sehr laut"],
    b_illuminance: ["Dunkel", "Gedämpft", "Hell"],
    i_temperature: ["Zu kalt", "Zu warm"],
    i_humidity: ["Zu trocken", "Zu feucht"],
    i_co2: ["", "Lüften"],
    i_air: ["", "Schlechte Luft"],
    i_noise: ["", "Laut"],
    ed_navigation_path_helper: "Dashboard, das beim Tippen auf den Titel geöffnet wird, z. B. /dashboard-home/living-room",
    ed_only_alerts: "Angenehme Messwerte ausblenden",
    ed_only_alerts_helper: "Nur Messwerte außerhalb des Komfortbereichs bleiben sichtbar",
    ed_show_gauge: "Balken anzeigen",
    ed_show_gauge_helper: "Ein dünner Balken unter jedem Messwert, nach seinem Niveau eingefärbt",
    ed_show_history: "24-h-Kurven anzeigen",
    ed_show_history_helper: "Die letzten 24 Stunden jedes Messwerts, dahinter gezeichnet",
    ed_include: "Hinzuzufügende Sensoren",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum",
    ed_exclude: "Auszuschließende Sensoren",
  },
  es: {
    ed_columns_helper: "Minitarjeta: columnas de la vista ampliada",
    title: "Ambiente",
    no_sensors: "Ningún sensor",
    comfortable: "Confortable",
    k_temperature: "Temperatura",
    k_humidity: "Humedad",
    k_co2: "CO2",
    k_pm25: "PM2,5",
    k_pm10: "PM10",
    k_voc: "COV",
    k_aqi: "Calidad del aire",
    k_noise: "Ruido",
    k_illuminance: "Luminosidad",
    b_temperature: ["Frío", "Fresco", "Confortable", "Cálido", "Caluroso"],
    b_humidity: ["Muy seco", "Seco", "Confortable", "Húmedo", "Muy húmedo"],
    b_air: ["", "", "Buena", "Moderada", "Mala"],
    b_noise: ["", "", "Tranquilo", "Ruidoso", "Muy ruidoso"],
    b_illuminance: ["Oscuro", "Tenue", "Luminoso"],
    i_temperature: ["Demasiado frío", "Demasiado calor"],
    i_humidity: ["Demasiado seco", "Demasiado húmedo"],
    i_co2: ["", "Ventilar"],
    i_air: ["", "Aire contaminado"],
    i_noise: ["", "Ruidoso"],
    ed_navigation_path_helper: "Panel que se abre al tocar el título, p. ej. /dashboard-home/living-room",
    ed_only_alerts: "Ocultar las lecturas confortables",
    ed_only_alerts_helper: "Solo quedan visibles las lecturas fuera del rango de confort",
    ed_show_gauge: "Mostrar indicadores",
    ed_show_gauge_helper: "Una barra fina bajo cada lectura, coloreada según su nivel",
    ed_show_history: "Mostrar curvas de 24 h",
    ed_show_history_helper: "Las últimas 24 horas de cada lectura, dibujadas detrás",
    ed_include: "Sensores a añadir",
    ed_include_helper: "De otra habitación o sin habitación",
    ed_exclude: "Sensores a excluir",
  },
  sr: {
    ed_columns_helper: "Мини картица: колоне у увећаном приказу",
    title: "Амбијент",
    no_sensors: "Нема сензора",
    comfortable: "Комфорно",
    k_temperature: "Температура",
    k_humidity: "Влажност",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Квалитет ваздуха",
    k_noise: "Бука",
    k_illuminance: "Осветљеност",
    b_temperature: ["Хладно", "Свеже", "Комфорно", "Топло", "Вруће"],
    b_humidity: ["Веома суво", "Суво", "Комфорно", "Влажно", "Веома влажно"],
    b_air: ["", "", "Добар", "Умерен", "Лош"],
    b_noise: ["", "", "Тихо", "Бучно", "Веома бучно"],
    b_illuminance: ["Тамно", "Пригушено", "Светло"],
    i_temperature: ["Превише хладно", "Превише топло"],
    i_humidity: ["Превише суво", "Превише влажно"],
    i_co2: ["", "Проветрити"],
    i_air: ["", "Лош ваздух"],
    i_noise: ["", "Бучно"],
    ed_navigation_path_helper: "Контролна табла која се отвара додиром на наслов, нпр. /dashboard-home/living-room",
    ed_only_alerts: "Сакриј комфорна очитавања",
    ed_only_alerts_helper: "Остаће видљива само очитавања ван опсега комфора",
    ed_show_gauge: "Прикажи индикаторе",
    ed_show_gauge_helper: "Танка линија испод сваког очитавања, обојена у зависности од нивоа",
    ed_show_history: "Прикажи криве за 24 ч",
    ed_show_history_helper: "Последња 24 сата сваког очитавања, исцртана иза њега",
    ed_include: "Сензори за додавање",
    ed_include_helper: "Из друге просторије или без ње",
    ed_exclude: "Изостави сензоре",
  },
  "sr-Latn": {
    ed_columns_helper: "Mini kartica: kolone u uvećanom prikazu",
    title: "Ambijent",
    no_sensors: "Nema senzora",
    comfortable: "Komforno",
    k_temperature: "Temperatura",
    k_humidity: "Vlažnost",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Kvalitet vazduha",
    k_noise: "Buka",
    k_illuminance: "Osvetljenost",
    b_temperature: ["Hladno", "Sveže", "Komforno", "Toplo", "Vruće"],
    b_humidity: ["Veoma suvo", "Suvo", "Komforno", "Vlažno", "Veoma vlažno"],
    b_air: ["", "", "Dobar", "Umeren", "Loš"],
    b_noise: ["", "", "Tiho", "Bučno", "Veoma bučno"],
    b_illuminance: ["Tamno", "Prigušeno", "Svetlo"],
    i_temperature: ["Previše hladno", "Previše toplo"],
    i_humidity: ["Previše suvo", "Previše vlažno"],
    i_co2: ["", "Provetriti"],
    i_air: ["", "Loš vazduh"],
    i_noise: ["", "Bučno"],
    ed_navigation_path_helper: "Kontrolna tabla koja se otvara dodirom na naslov, npr. /dashboard-home/living-room",
    ed_only_alerts: "Sakrij komforna očitavanja",
    ed_only_alerts_helper: "Ostaće vidljiva samo očitavanja van opsega komfora",
    ed_show_gauge: "Prikaži indikatore",
    ed_show_gauge_helper: "Tanka linija ispod svakog očitavanja, obojena u zavisnosti od nivoa",
    ed_show_history: "Prikaži krive za 24 č",
    ed_show_history_helper: "Poslednja 24 sata svakog očitavanja, iscrtana iza njega",
    ed_include: "Senzori za dodavanje",
    ed_include_helper: "Iz druge prostorije ili bez nje",
    ed_exclude: "Izostavi senzore",
  },
  it: {
    ed_columns_helper: "Mini scheda: colonne della vista ingrandita",
    title: "Ambiente",
    no_sensors: "Nessun sensore",
    comfortable: "Confortevole",
    k_temperature: "Temperatura",
    k_humidity: "Umidità",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "COV",
    k_aqi: "Qualità dell'aria",
    k_noise: "Rumore",
    k_illuminance: "Luminosità",
    b_temperature: ["Freddo", "Fresco", "Confortevole", "Caldo", "Molto caldo"],
    b_humidity: ["Molto secco", "Secco", "Confortevole", "Umido", "Molto umido"],
    b_air: ["", "", "Buona", "Moderata", "Scarsa"],
    b_noise: ["", "", "Silenzioso", "Rumoroso", "Molto rumoroso"],
    b_illuminance: ["Buio", "Soffuso", "Luminoso"],
    i_temperature: ["Troppo freddo", "Troppo caldo"],
    i_humidity: ["Troppo secco", "Troppo umido"],
    i_co2: ["", "Arieggiare"],
    i_air: ["", "Aria scadente"],
    i_noise: ["", "Rumoroso"],
    ed_navigation_path_helper: "Plancia aperta toccando il titolo, ad es. /dashboard-home/living-room",
    ed_only_alerts: "Nascondi le misure confortevoli",
    ed_only_alerts_helper: "Restano visibili solo le misure fuori dall'intervallo di comfort",
    ed_show_gauge: "Mostra gli indicatori",
    ed_show_gauge_helper: "Una barra sottile sotto ogni misura, colorata in base al livello",
    ed_show_history: "Mostra le curve di 24 h",
    ed_show_history_helper: "Le ultime 24 ore di ogni lettura, disegnate dietro",
    ed_include: "Sensori da aggiungere",
    ed_include_helper: "Da un'altra stanza o senza stanza",
    ed_exclude: "Sensori da escludere",
  },
  nl: {
    ed_columns_helper: "Minikaart: kolommen van de vergrote weergave",
    title: "Omgeving",
    no_sensors: "Geen sensoren",
    comfortable: "Comfortabel",
    k_temperature: "Temperatuur",
    k_humidity: "Luchtvochtigheid",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOS",
    k_aqi: "Luchtkwaliteit",
    k_noise: "Geluid",
    k_illuminance: "Licht",
    b_temperature: ["Koud", "Fris", "Comfortabel", "Warm", "Heet"],
    b_humidity: ["Zeer droog", "Droog", "Comfortabel", "Vochtig", "Zeer vochtig"],
    b_air: ["", "", "Goed", "Matig", "Slecht"],
    b_noise: ["", "", "Stil", "Luid", "Zeer luid"],
    b_illuminance: ["Donker", "Gedimd", "Helder"],
    i_temperature: ["Te koud", "Te warm"],
    i_humidity: ["Te droog", "Te vochtig"],
    i_co2: ["", "Ventileren"],
    i_air: ["", "Slechte lucht"],
    i_noise: ["", "Luid"],
    ed_navigation_path_helper: "Dashboard dat opent bij een tik op de titel, bijv. /dashboard-home/living-room",
    ed_only_alerts: "Comfortabele metingen verbergen",
    ed_only_alerts_helper: "Alleen metingen buiten het comfortbereik blijven zichtbaar",
    ed_show_gauge: "Meters tonen",
    ed_show_gauge_helper: "Een dunne balk onder elke meting, gekleurd naar het niveau",
    ed_show_history: "24-uurscurves tonen",
    ed_show_history_helper: "De laatste 24 uur van elke meting, erachter getekend",
    ed_include: "Toe te voegen sensoren",
    ed_include_helper: "Uit een andere ruimte of zonder ruimte",
    ed_exclude: "Uit te sluiten sensoren",
  },
  pt: {
    ed_columns_helper: "Minicartão: colunas da vista ampliada",
    title: "Ambiente",
    no_sensors: "Nenhum sensor",
    comfortable: "Confortável",
    k_temperature: "Temperatura",
    k_humidity: "Humidade",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "COV",
    k_aqi: "Qualidade do ar",
    k_noise: "Ruído",
    k_illuminance: "Luminosidade",
    b_temperature: ["Frio", "Fresco", "Confortável", "Quente", "Muito quente"],
    b_humidity: ["Muito seco", "Seco", "Confortável", "Húmido", "Muito húmido"],
    b_air: ["", "", "Bom", "Moderado", "Mau"],
    b_noise: ["", "", "Silencioso", "Ruidoso", "Muito ruidoso"],
    b_illuminance: ["Escuro", "Penumbra", "Claro"],
    i_temperature: ["Demasiado frio", "Demasiado quente"],
    i_humidity: ["Demasiado seco", "Demasiado húmido"],
    i_co2: ["", "Arejar"],
    i_air: ["", "Ar poluído"],
    i_noise: ["", "Ruidoso"],
    ed_navigation_path_helper: "Painel aberto ao tocar no título, p. ex. /dashboard-home/living-room",
    ed_only_alerts: "Ocultar as medições confortáveis",
    ed_only_alerts_helper: "Só ficam visíveis as medições fora do intervalo de conforto",
    ed_show_gauge: "Mostrar os medidores",
    ed_show_gauge_helper: "Uma barra fina sob cada medição, colorida conforme o nível",
    ed_show_history: "Mostrar curvas de 24 h",
    ed_show_history_helper: "As últimas 24 horas de cada leitura, desenhadas por trás",
    ed_include: "Sensores a adicionar",
    ed_include_helper: "De outra divisão ou sem divisão",
    ed_exclude: "Sensores a excluir",
  },
  pl: {
    ed_columns_helper: "Minikarta: kolumny widoku powiększonego",
    title: "Środowisko",
    no_sensors: "Brak czujników",
    comfortable: "Komfortowo",
    k_temperature: "Temperatura",
    k_humidity: "Wilgotność",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "LZO",
    k_aqi: "Jakość powietrza",
    k_noise: "Hałas",
    k_illuminance: "Oświetlenie",
    b_temperature: ["Zimno", "Chłodno", "Komfortowo", "Ciepło", "Gorąco"],
    b_humidity: ["Bardzo sucho", "Sucho", "Komfortowo", "Wilgotno", "Bardzo wilgotno"],
    b_air: ["", "", "Dobre", "Umiarkowane", "Złe"],
    b_noise: ["", "", "Cicho", "Głośno", "Bardzo głośno"],
    b_illuminance: ["Ciemno", "Półmrok", "Jasno"],
    i_temperature: ["Za zimno", "Za gorąco"],
    i_humidity: ["Za sucho", "Za wilgotno"],
    i_co2: ["", "Przewietrz"],
    i_air: ["", "Złe powietrze"],
    i_noise: ["", "Głośno"],
    ed_navigation_path_helper: "Dashboard otwierany po dotknięciu tytułu, np. /dashboard-home/living-room",
    ed_only_alerts: "Ukryj komfortowe odczyty",
    ed_only_alerts_helper: "Widoczne pozostają tylko odczyty poza zakresem komfortu",
    ed_show_gauge: "Pokaż wskaźniki",
    ed_show_gauge_helper: "Cienki pasek pod każdym odczytem, zabarwiony według poziomu",
    ed_show_history: "Pokaż krzywe 24 h",
    ed_show_history_helper: "Ostatnie 24 godziny każdego odczytu, narysowane za nim",
    ed_include: "Czujniki do dodania",
    ed_include_helper: "Z innego pomieszczenia lub bez pomieszczenia",
    ed_exclude: "Czujniki do wykluczenia",
  },
  ro: {
    ed_columns_helper: "Mini-card: coloanele vizualizării mărite",
    title: "Mediu ambiant",
    no_sensors: "Niciun senzor",
    comfortable: "Confortabil",
    k_temperature: "Temperatură",
    k_humidity: "Umiditate",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "COV",
    k_aqi: "Calitatea aerului",
    k_noise: "Zgomot",
    k_illuminance: "Lumină",
    b_temperature: ["Frig", "Răcoare", "Confortabil", "Cald", "Foarte cald"],
    b_humidity: ["Foarte uscat", "Uscat", "Confortabil", "Umed", "Foarte umed"],
    b_air: ["", "", "Bună", "Moderată", "Proastă"],
    b_noise: ["", "", "Liniștit", "Zgomotos", "Foarte zgomotos"],
    b_illuminance: ["Întuneric", "Lumină slabă", "Luminos"],
    i_temperature: ["Prea frig", "Prea cald"],
    i_humidity: ["Prea uscat", "Prea umed"],
    i_co2: ["", "Aerisește"],
    i_air: ["", "Aer poluat"],
    i_noise: ["", "Zgomotos"],
    ed_navigation_path_helper: "Tablou de bord deschis la atingerea titlului, de ex. /dashboard-home/living-room",
    ed_only_alerts: "Ascunde valorile confortabile",
    ed_only_alerts_helper: "Rămân vizibile doar valorile din afara intervalului de confort",
    ed_show_gauge: "Afișează indicatoarele",
    ed_show_gauge_helper: "O bară subțire sub fiecare valoare, colorată după nivelul ei",
    ed_show_history: "Afișează curbele de 24 h",
    ed_show_history_helper: "Ultimele 24 de ore ale fiecărei citiri, desenate în spate",
    ed_include: "Senzori de adăugat",
    ed_include_helper: "Din altă cameră sau fără cameră",
    ed_exclude: "Senzori excluși",
  },
  da: {
    ed_columns_helper: "Minikort: kolonner i den forstørrede visning",
    title: "Miljø",
    no_sensors: "Ingen sensorer",
    comfortable: "Behageligt",
    k_temperature: "Temperatur",
    k_humidity: "Luftfugtighed",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Luftkvalitet",
    k_noise: "Støj",
    k_illuminance: "Lys",
    b_temperature: ["Koldt", "Køligt", "Behageligt", "Varmt", "Hedt"],
    b_humidity: ["Meget tørt", "Tørt", "Behageligt", "Fugtigt", "Meget fugtigt"],
    b_air: ["", "", "God", "Middel", "Dårlig"],
    b_noise: ["", "", "Stille", "Støjende", "Meget støjende"],
    b_illuminance: ["Mørkt", "Dæmpet", "Lyst"],
    i_temperature: ["For koldt", "For varmt"],
    i_humidity: ["For tørt", "For fugtigt"],
    i_co2: ["", "Luft ud"],
    i_air: ["", "Dårlig luft"],
    i_noise: ["", "Støjende"],
    ed_navigation_path_helper: "Dashboard, der åbnes ved tryk på titlen, f.eks. /dashboard-home/living-room",
    ed_only_alerts: "Skjul behagelige målinger",
    ed_only_alerts_helper: "Kun målinger uden for komfortområdet forbliver synlige",
    ed_show_gauge: "Vis målere",
    ed_show_gauge_helper: "En tynd bjælke under hver måling, farvet efter niveau",
    ed_show_history: "Vis 24-timers kurver",
    ed_show_history_helper: "De seneste 24 timer af hver måling, tegnet bagved",
    ed_include: "Sensorer, der tilføjes",
    ed_include_helper: "Fra et andet rum eller uden rum",
    ed_exclude: "Sensorer, der udelades",
  },
  sv: {
    ed_columns_helper: "Minikort: kolumner i inzoomad vy",
    title: "Miljö",
    no_sensors: "Inga sensorer",
    comfortable: "Behagligt",
    k_temperature: "Temperatur",
    k_humidity: "Luftfuktighet",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Luftkvalitet",
    k_noise: "Buller",
    k_illuminance: "Ljus",
    b_temperature: ["Kallt", "Svalt", "Behagligt", "Varmt", "Hett"],
    b_humidity: ["Mycket torrt", "Torrt", "Behagligt", "Fuktigt", "Mycket fuktigt"],
    b_air: ["", "", "Bra", "Måttlig", "Dålig"],
    b_noise: ["", "", "Tyst", "Bullrigt", "Mycket bullrigt"],
    b_illuminance: ["Mörkt", "Dämpat", "Ljust"],
    i_temperature: ["För kallt", "För varmt"],
    i_humidity: ["För torrt", "För fuktigt"],
    i_co2: ["", "Vädra"],
    i_air: ["", "Dålig luft"],
    i_noise: ["", "Bullrigt"],
    ed_navigation_path_helper: "Instrumentpanel som öppnas vid tryck på titeln, t.ex. /dashboard-home/living-room",
    ed_only_alerts: "Dölj behagliga mätvärden",
    ed_only_alerts_helper: "Bara mätvärden utanför komfortintervallet förblir synliga",
    ed_show_gauge: "Visa mätare",
    ed_show_gauge_helper: "En tunn stapel under varje mätvärde, färgad efter nivå",
    ed_show_history: "Visa 24-timmarskurvor",
    ed_show_history_helper: "De senaste 24 timmarna av varje mätning, ritade bakom",
    ed_include: "Sensorer att lägga till",
    ed_include_helper: "Från ett annat rum eller utan rum",
    ed_exclude: "Sensorer att utesluta",
  },
  bg: {
    ed_columns_helper: "Мини карта: колони в увеличения изглед",
    title: "Среда",
    no_sensors: "Няма сензори",
    comfortable: "Комфортно",
    k_temperature: "Температура",
    k_humidity: "Влажност",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "ЛОС",
    k_aqi: "Качество на въздуха",
    k_noise: "Шум",
    k_illuminance: "Осветеност",
    b_temperature: ["Студено", "Хладно", "Комфортно", "Топло", "Горещо"],
    b_humidity: ["Много сухо", "Сухо", "Комфортно", "Влажно", "Много влажно"],
    b_air: ["", "", "Добро", "Умерено", "Лошо"],
    b_noise: ["", "", "Тихо", "Шумно", "Много шумно"],
    b_illuminance: ["Тъмно", "Полумрак", "Светло"],
    i_temperature: ["Твърде студено", "Твърде горещо"],
    i_humidity: ["Твърде сухо", "Твърде влажно"],
    i_co2: ["", "Проветрете"],
    i_air: ["", "Лош въздух"],
    i_noise: ["", "Шумно"],
    ed_navigation_path_helper: "Табло, което се отваря с докосване на заглавието, напр. /dashboard-home/living-room",
    ed_only_alerts: "Скрий комфортните стойности",
    ed_only_alerts_helper: "Остават видими само стойностите извън диапазона на комфорт",
    ed_show_gauge: "Показвай индикатори",
    ed_show_gauge_helper: "Тънка лента под всяка стойност, оцветена според нивото ѝ",
    ed_show_history: "Показване на криви за 24 ч",
    ed_show_history_helper: "Последните 24 часа на всяко отчитане, изобразени зад него",
    ed_include: "Сензори за добавяне",
    ed_include_helper: "От друга стая или без стая",
    ed_exclude: "Сензори за пропускане",
  },
  ru: {
    ed_columns_helper: "Мини-карточка: столбцы развёрнутого вида",
    title: "Микроклимат",
    no_sensors: "Нет датчиков",
    comfortable: "Комфортно",
    k_temperature: "Температура",
    k_humidity: "Влажность",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "ЛОС",
    k_aqi: "Качество воздуха",
    k_noise: "Шум",
    k_illuminance: "Свет",
    b_temperature: ["Холодно", "Прохладно", "Комфортно", "Тепло", "Жарко"],
    b_humidity: ["Очень сухо", "Сухо", "Комфортно", "Влажно", "Очень влажно"],
    b_air: ["", "", "Хорошее", "Среднее", "Плохое"],
    b_noise: ["", "", "Тихо", "Шумно", "Очень шумно"],
    b_illuminance: ["Темно", "Полумрак", "Светло"],
    i_temperature: ["Слишком холодно", "Слишком жарко"],
    i_humidity: ["Слишком сухо", "Слишком влажно"],
    i_co2: ["", "Проветрите"],
    i_air: ["", "Плохой воздух"],
    i_noise: ["", "Шумно"],
    ed_navigation_path_helper: "Панель, открываемая нажатием на заголовок, например /dashboard-home/living-room",
    ed_only_alerts: "Скрыть комфортные показания",
    ed_only_alerts_helper: "Видны только показания вне диапазона комфорта",
    ed_show_gauge: "Показывать шкалы",
    ed_show_gauge_helper: "Тонкая полоска под каждым показанием, окрашенная по его уровню",
    ed_show_history: "Показывать графики за 24 ч",
    ed_show_history_helper: "Последние 24 часа каждого показания, нарисованные за ним",
    ed_include: "Добавить датчики",
    ed_include_helper: "Из другой комнаты или без комнаты",
    ed_exclude: "Исключить датчики",
  },
  uk: {
    ed_columns_helper: "Міні-картка: стовпці розгорнутого вигляду",
    title: "Мікроклімат",
    no_sensors: "Немає датчиків",
    comfortable: "Комфортно",
    k_temperature: "Температура",
    k_humidity: "Вологість",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "ЛОС",
    k_aqi: "Якість повітря",
    k_noise: "Шум",
    k_illuminance: "Освітленість",
    b_temperature: ["Холодно", "Прохолодно", "Комфортно", "Тепло", "Спекотно"],
    b_humidity: ["Дуже сухо", "Сухо", "Комфортно", "Волого", "Дуже волого"],
    b_air: ["", "", "Добра", "Помірна", "Погана"],
    b_noise: ["", "", "Тихо", "Шумно", "Дуже шумно"],
    b_illuminance: ["Темно", "Сутінки", "Світло"],
    i_temperature: ["Занадто холодно", "Занадто спекотно"],
    i_humidity: ["Занадто сухо", "Занадто волого"],
    i_co2: ["", "Провітріть"],
    i_air: ["", "Погане повітря"],
    i_noise: ["", "Шумно"],
    ed_navigation_path_helper: "Панель, що відкривається натисканням на заголовок, наприклад /dashboard-home/living-room",
    ed_only_alerts: "Приховати комфортні показники",
    ed_only_alerts_helper: "Видимими залишаються лише показники поза діапазоном комфорту",
    ed_show_gauge: "Показувати шкали",
    ed_show_gauge_helper: "Тонка смужка під кожним показником, забарвлена відповідно до рівня",
    ed_show_history: "Показувати графіки за 24 год",
    ed_show_history_helper: "Останні 24 години кожного показника, намальовані за ним",
    ed_include: "Додати датчики",
    ed_include_helper: "З іншої кімнати або без кімнати",
    ed_exclude: "Виключити датчики",
  },
  hu: {
    ed_columns_helper: "Mini kártya: a nagyított nézet oszlopai",
    title: "Környezet",
    no_sensors: "Nincs érzékelő",
    comfortable: "Kellemes",
    k_temperature: "Hőmérséklet",
    k_humidity: "Páratartalom",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Levegőminőség",
    k_noise: "Zaj",
    k_illuminance: "Fény",
    b_temperature: ["Hideg", "Hűvös", "Kellemes", "Meleg", "Forró"],
    b_humidity: ["Nagyon száraz", "Száraz", "Kellemes", "Párás", "Nagyon párás"],
    b_air: ["", "", "Jó", "Közepes", "Rossz"],
    b_noise: ["", "", "Csendes", "Zajos", "Nagyon zajos"],
    b_illuminance: ["Sötét", "Félhomály", "Világos"],
    i_temperature: ["Túl hideg", "Túl meleg"],
    i_humidity: ["Túl száraz", "Túl párás"],
    i_co2: ["", "Szellőztess"],
    i_air: ["", "Rossz levegő"],
    i_noise: ["", "Zajos"],
    ed_navigation_path_helper: "A címre koppintva megnyíló irányítópult, pl. /dashboard-home/living-room",
    ed_only_alerts: "Kellemes értékek elrejtése",
    ed_only_alerts_helper: "Csak a komforttartományon kívüli értékek maradnak láthatók",
    ed_show_gauge: "Mérősávok megjelenítése",
    ed_show_gauge_helper: "Vékony sáv minden érték alatt, a szintjének megfelelő színnel",
    ed_show_history: "24 órás görbék megjelenítése",
    ed_show_history_helper: "Minden mérés utolsó 24 órája, mögé rajzolva",
    ed_include: "Hozzáadandó érzékelők",
    ed_include_helper: "Másik helyiségből vagy helyiség nélkül",
    ed_exclude: "Kihagyott érzékelők",
  },
  sk: {
    ed_columns_helper: "Minikarta: stĺpce priblíženého zobrazenia",
    title: "Prostredie",
    no_sensors: "Žiadne senzory",
    comfortable: "Príjemne",
    k_temperature: "Teplota",
    k_humidity: "Vlhkosť",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Kvalita vzduchu",
    k_noise: "Hluk",
    k_illuminance: "Osvetlenie",
    b_temperature: ["Zima", "Chladno", "Príjemne", "Teplo", "Horúco"],
    b_humidity: ["Veľmi sucho", "Sucho", "Príjemne", "Vlhko", "Veľmi vlhko"],
    b_air: ["", "", "Dobrá", "Priemerná", "Zlá"],
    b_noise: ["", "", "Ticho", "Hlučno", "Veľmi hlučno"],
    b_illuminance: ["Tma", "Šero", "Svetlo"],
    i_temperature: ["Príliš chladno", "Príliš horúco"],
    i_humidity: ["Príliš sucho", "Príliš vlhko"],
    i_co2: ["", "Vyvetrajte"],
    i_air: ["", "Zlý vzduch"],
    i_noise: ["", "Hlučno"],
    ed_navigation_path_helper: "Ovládací panel otvorený ťuknutím na názov, napr. /dashboard-home/living-room",
    ed_only_alerts: "Skryť príjemné hodnoty",
    ed_only_alerts_helper: "Viditeľné zostanú len hodnoty mimo rozsahu komfortu",
    ed_show_gauge: "Zobraziť ukazovatele",
    ed_show_gauge_helper: "Tenký pruh pod každou hodnotou, zafarbený podľa jej úrovne",
    ed_show_history: "Zobraziť 24 h krivky",
    ed_show_history_helper: "Posledných 24 hodín každého merania, nakreslených za ním",
    ed_include: "Senzory na pridanie",
    ed_include_helper: "Z inej miestnosti alebo bez miestnosti",
    ed_exclude: "Vynechané senzory",
  },
  cs: {
    ed_columns_helper: "Minikarta: sloupce přiblíženého zobrazení",
    title: "Prostředí",
    no_sensors: "Žádné senzory",
    comfortable: "Příjemně",
    k_temperature: "Teplota",
    k_humidity: "Vlhkost",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Kvalita vzduchu",
    k_noise: "Hluk",
    k_illuminance: "Osvětlení",
    b_temperature: ["Zima", "Chladno", "Příjemně", "Teplo", "Horko"],
    b_humidity: ["Velmi sucho", "Sucho", "Příjemně", "Vlhko", "Velmi vlhko"],
    b_air: ["", "", "Dobrá", "Průměrná", "Špatná"],
    b_noise: ["", "", "Ticho", "Hlučno", "Velmi hlučno"],
    b_illuminance: ["Tma", "Šero", "Světlo"],
    i_temperature: ["Příliš chladno", "Příliš horko"],
    i_humidity: ["Příliš sucho", "Příliš vlhko"],
    i_co2: ["", "Vyvětrejte"],
    i_air: ["", "Špatný vzduch"],
    i_noise: ["", "Hlučno"],
    ed_navigation_path_helper: "Ovládací panel otevřený klepnutím na název, např. /dashboard-home/living-room",
    ed_only_alerts: "Skrýt příjemné hodnoty",
    ed_only_alerts_helper: "Viditelné zůstanou jen hodnoty mimo rozsah komfortu",
    ed_show_gauge: "Zobrazit ukazatele",
    ed_show_gauge_helper: "Tenký pruh pod každou hodnotou, zbarvený podle její úrovně",
    ed_show_history: "Zobrazit 24h křivky",
    ed_show_history_helper: "Posledních 24 hodin každého měření, nakreslených za ním",
    ed_include: "Senzory k přidání",
    ed_include_helper: "Z jiné místnosti nebo bez místnosti",
    ed_exclude: "Vynechané senzory",
  },
  sl: {
    ed_columns_helper: "Mini kartica: stolpci povečanega pogleda",
    title: "Okolje",
    no_sensors: "Ni senzorjev",
    comfortable: "Prijetno",
    k_temperature: "Temperatura",
    k_humidity: "Vlažnost",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "HOS",
    k_aqi: "Kakovost zraka",
    k_noise: "Hrup",
    k_illuminance: "Svetloba",
    b_temperature: ["Mrzlo", "Hladno", "Prijetno", "Toplo", "Vroče"],
    b_humidity: ["Zelo suho", "Suho", "Prijetno", "Vlažno", "Zelo vlažno"],
    b_air: ["", "", "Dobra", "Zmerna", "Slaba"],
    b_noise: ["", "", "Tiho", "Hrupno", "Zelo hrupno"],
    b_illuminance: ["Temno", "Somrak", "Svetlo"],
    i_temperature: ["Premrzlo", "Prevroče"],
    i_humidity: ["Presuho", "Prevlažno"],
    i_co2: ["", "Prezračite"],
    i_air: ["", "Slab zrak"],
    i_noise: ["", "Hrupno"],
    ed_navigation_path_helper: "Nadzorna plošča, ki se odpre ob dotiku naslova, npr. /dashboard-home/living-room",
    ed_only_alerts: "Skrij prijetne vrednosti",
    ed_only_alerts_helper: "Vidne ostanejo samo vrednosti zunaj območja udobja",
    ed_show_gauge: "Prikaži merilnike",
    ed_show_gauge_helper: "Tanka vrstica pod vsako vrednostjo, obarvana glede na njeno raven",
    ed_show_history: "Prikaži 24-urne krivulje",
    ed_show_history_helper: "Zadnjih 24 ur vsake meritve, narisanih za njo",
    ed_include: "Senzorji za dodajanje",
    ed_include_helper: "Iz drugega prostora ali brez prostora",
    ed_exclude: "Izpuščeni senzorji",
  },
  lv: {
    ed_columns_helper: "Mini karte: palielinātā skata kolonnas",
    title: "Vide",
    no_sensors: "Nav sensoru",
    comfortable: "Komfortabli",
    k_temperature: "Temperatūra",
    k_humidity: "Mitrums",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "GOS",
    k_aqi: "Gaisa kvalitāte",
    k_noise: "Troksnis",
    k_illuminance: "Gaisma",
    b_temperature: ["Auksti", "Vēsi", "Komfortabli", "Silti", "Karsti"],
    b_humidity: ["Ļoti sauss", "Sauss", "Komfortabli", "Mitrs", "Ļoti mitrs"],
    b_air: ["", "", "Laba", "Vidēja", "Slikta"],
    b_noise: ["", "", "Klusi", "Trokšņaini", "Ļoti trokšņaini"],
    b_illuminance: ["Tumšs", "Krēsla", "Gaišs"],
    i_temperature: ["Pārāk auksti", "Pārāk karsti"],
    i_humidity: ["Pārāk sauss", "Pārāk mitrs"],
    i_co2: ["", "Izvēdiniet"],
    i_air: ["", "Slikts gaiss"],
    i_noise: ["", "Trokšņaini"],
    ed_navigation_path_helper: "Informācijas panelis, kas tiek atvērts, pieskaroties virsrakstam, piem., /dashboard-home/living-room",
    ed_only_alerts: "Paslēpt komfortablos rādījumus",
    ed_only_alerts_helper: "Redzami paliek tikai rādījumi ārpus komforta diapazona",
    ed_show_gauge: "Rādīt mērjoslas",
    ed_show_gauge_helper: "Plāna josla zem katra rādījuma, iekrāsota atbilstoši tā līmenim",
    ed_show_history: "Rādīt 24 h līknes",
    ed_show_history_helper: "Katra mērījuma pēdējās 24 stundas, uzzīmētas aiz tā",
    ed_include: "Pievienojamie sensori",
    ed_include_helper: "No citas telpas vai bez telpas",
    ed_exclude: "Izslēdzamie sensori",
  },
  el: {
    ed_columns_helper: "Μίνι κάρτα: στήλες της μεγεθυμένης προβολής",
    title: "Περιβάλλον",
    no_sensors: "Κανένας αισθητήρας",
    comfortable: "Άνετα",
    k_temperature: "Θερμοκρασία",
    k_humidity: "Υγρασία",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "ΠΟΕ",
    k_aqi: "Ποιότητα αέρα",
    k_noise: "Θόρυβος",
    k_illuminance: "Φως",
    b_temperature: ["Κρύο", "Δροσερό", "Άνετα", "Ζεστό", "Πολύ ζεστό"],
    b_humidity: ["Πολύ ξηρό", "Ξηρό", "Άνετα", "Υγρό", "Πολύ υγρό"],
    b_air: ["", "", "Καλή", "Μέτρια", "Κακή"],
    b_noise: ["", "", "Ήσυχο", "Θορυβώδες", "Πολύ θορυβώδες"],
    b_illuminance: ["Σκοτεινό", "Χαμηλός φωτισμός", "Φωτεινό"],
    i_temperature: ["Υπερβολικό κρύο", "Υπερβολική ζέστη"],
    i_humidity: ["Υπερβολικά ξηρό", "Υπερβολικά υγρό"],
    i_co2: ["", "Αερίστε"],
    i_air: ["", "Κακός αέρας"],
    i_noise: ["", "Θόρυβος"],
    ed_navigation_path_helper: "Πίνακας ελέγχου που ανοίγει με πάτημα στον τίτλο, π.χ. /dashboard-home/living-room",
    ed_only_alerts: "Απόκρυψη άνετων μετρήσεων",
    ed_only_alerts_helper: "Μένουν ορατές μόνο οι μετρήσεις εκτός του εύρους άνεσης",
    ed_show_gauge: "Εμφάνιση δεικτών",
    ed_show_gauge_helper: "Μια λεπτή μπάρα κάτω από κάθε μέτρηση, χρωματισμένη ανάλογα με το επίπεδό της",
    ed_show_history: "Εμφάνιση καμπυλών 24 ωρών",
    ed_show_history_helper: "Οι τελευταίες 24 ώρες κάθε μέτρησης, σχεδιασμένες πίσω της",
    ed_include: "Αισθητήρες προς προσθήκη",
    ed_include_helper: "Από άλλο δωμάτιο ή χωρίς δωμάτιο",
    ed_exclude: "Αισθητήρες προς εξαίρεση",
  },
};

// ── Sensor kinds ─────────────────────────────────────────────────────────────
// `dc`: device classes · `scale`: [alert low, warn low, warn high, alert high] in `unit` (null: no low side)
// · `gauge`: range of the bar · `words` / `issue`: label families (b_* / i_*) · `sev`: severity of the five bands
// · `cold`: bands tinted blue. A kind without `scale` (light level) is information only.
const RE_SEV = ["alert", "warn", "ok", "warn", "alert"];
const RE_KINDS = {
  temperature: {
    dc: ["temperature"],
    unit: "°C",
    scale: [16, 18, 25, 28],
    gauge: [10, 35],
    digits: 1,
    words: "temperature",
    issue: "temperature",
    sev: ["warn", "info", "ok", "warn", "alert"],
    cold: [0, 1],
    icon: "mdi:thermometer",
    icons: ["mdi:snowflake-thermometer", "mdi:thermometer-low", "mdi:thermometer", "mdi:thermometer-high", "mdi:thermometer-alert"],
  },
  humidity: {
    dc: ["humidity"],
    unit: "%",
    scale: [25, 35, 60, 70],
    gauge: [0, 100],
    digits: 0,
    words: "humidity",
    issue: "humidity",
    icon: "mdi:water-percent",
    icons: ["mdi:water-percent-alert", "mdi:water-percent", "mdi:water-percent", "mdi:water-percent", "mdi:water-percent-alert"],
  },
  co2: {
    dc: ["carbon_dioxide"],
    unit: "ppm",
    scale: [null, null, 1000, 1500],
    gauge: [400, 2000],
    digits: 0,
    words: "air",
    issue: "co2",
    icon: "mdi:molecule-co2",
  },
  pm25: { dc: ["pm25"], unit: "µg/m³", scale: [null, null, 15, 35], gauge: [0, 75], digits: 0, words: "air", issue: "air", icon: "mdi:blur" },
  pm10: { dc: ["pm10"], unit: "µg/m³", scale: [null, null, 45, 100], gauge: [0, 150], digits: 0, words: "air", issue: "air", icon: "mdi:blur-radial" },
  voc: {
    dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
    unit: "µg/m³",
    scale: [null, null, 300, 1000],
    gauge: [0, 1500],
    // Same levels in parts: 220 / 660 ppb.
    units: { ppb: [220, 660, 1000], ppm: [0.22, 0.66, 1] },
    digits: 0,
    words: "air",
    issue: "air",
    icon: "mdi:scent",
  },
  aqi: { dc: ["aqi"], unit: "", scale: [null, null, 100, 150], gauge: [0, 300], digits: 0, words: "air", issue: "air", icon: "mdi:air-filter" },
  noise: {
    dc: ["sound_pressure"],
    unit: "dB",
    // Noisy from 70 dB (vacuum, loud TV), very noisy from 85 dB (the level where long exposure harms hearing):
    // conversation and everyday sounds (40 to 65 dB) stay quiet.
    scale: [null, null, 70, 85],
    gauge: [20, 100],
    digits: 0,
    words: "noise",
    issue: "noise",
    icon: "mdi:volume-medium",
    icons: [null, null, "mdi:volume-low", "mdi:volume-high", "mdi:volume-high"],
  },
  illuminance: {
    dc: ["illuminance"],
    unit: "lx",
    // Dark below 10 lx, dim below 200 lx.
    steps: [10, 200],
    gauge: [0, 1000],
    digits: 0,
    words: "illuminance",
    icon: "mdi:brightness-5",
    icons: ["mdi:brightness-3", "mdi:brightness-5", "mdi:brightness-7"],
  },
};
const RE_ORDER = Object.keys(RE_KINDS);
const RE_DC = Object.fromEntries(RE_ORDER.flatMap((k) => RE_KINDS[k].dc.map((dc) => [dc, k])));
const RE_RANK = { ok: 0, info: 1, warn: 2, alert: 3 };

const reKindOf = (st) => RE_DC[st?.attributes.device_class];
// A sensor that reports a number: unavailable, unknown and other states give no reading.
const reValid = (st) => !rcUnavailable(st) && Number.isFinite(Number.parseFloat(st.state));

// Environment sensors of the card: a known device class, configuration and diagnostic entities excepted
// (a battery or a CPU temperature, say).
const reMatch = (hass, id) =>
  id.startsWith("sensor.") && !hass.entities?.[id]?.entity_category && !!reKindOf(hass.states[id]);

// Wet rooms (bathroom, shower room, laundry) live with more humidity: 70 % is a warning there, 80 % an alert.
const RE_WET_ROOM = /salle (de )?bains?|salle d.eau|douche|bath|shower|buanderie|laundry/i;
const RE_WET_HUMIDITY = [25, 35, 70, 80];

// Outdoor areas (terrace, garden, balcony…): their temperature, humidity and noise are the weather and the street, not
// a comfort issue, so they are information only, unless the user set thresholds for them.
const RE_OUTDOOR_ROOM = /terrasse|jardin|balcon|patio|ext[ée]rieur|cour\b|garden|terrace|balcony|outdoor|outside|yard/i;
const RE_OUTDOOR_KINDS = ["temperature", "humidity", "noise"];
const reOutdoorInfo = (kind, room) =>
  RE_OUTDOOR_KINDS.includes(kind) && !room.thresholds?.[kind] && RE_OUTDOOR_ROOM.test(room.name || "");

// Thresholds of `kind` for a room: the room's own, then the card's, then the wet-room humidity, then the defaults.
const reCustom = (kind, room) =>
  room.thresholds?.[kind] ?? (kind === "humidity" && RE_WET_ROOM.test(room.name || "") ? RE_WET_HUMIDITY : undefined);

// Thresholds and gauge of `kind` in the sensor's unit: °F and parts per billion are converted, custom thresholds
// (`thresholds: { co2: [800, 1200] }`, two values for a one-sided kind, four otherwise) are used as they are.
const reScale = (kind, unit, custom) => {
  const k = RE_KINDS[kind];
  if (Array.isArray(custom) && custom.length) {
    const scale = custom.length === 2 ? [null, null, ...custom] : custom;
    if (scale.length === 4 && scale.every((v) => v === null || Number.isFinite(Number(v)))) {
      return { scale: scale.map((v) => (v === null ? null : Number(v))), gauge: k.gauge };
    }
  }
  if (kind === "temperature" && /F$/.test(unit || "")) {
    const f = (c) => (c === null ? null : (c * 9) / 5 + 32);
    return { scale: k.scale.map(f), gauge: k.gauge.map(f) };
  }
  const parts = k.units?.[unit];
  if (parts) return { scale: [null, null, parts[0], parts[1]], gauge: [0, parts[2] * 1.5] };
  return { scale: k.scale, gauge: k.gauge };
};

// `value` of `kind` from unit `from` to unit `to`: only temperatures convert (°C ⇄ °F), other kinds are grouped
// by unit before any mean.
const reConvert = (kind, value, from, to) => {
  if (kind !== "temperature") return value;
  const f = (u) => /F$/.test(u || "");
  if (f(from) === f(to)) return value;
  return f(to) ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
};

// Band of a value: 0 alert low, 1 warn low, 2 comfortable, 3 warn high, 4 alert high.
const reBand = (v, [al, wl, wh, ah]) => {
  if (al !== null && v < al) return 0;
  if (wl !== null && v < wl) return 1;
  if (ah !== null && v >= ah) return 4;
  if (wh !== null && v >= wh) return 3;
  return 2;
};

// ── Card ─────────────────────────────────────────────────────────────────────
// The last 24 hours behind a tile: area and line of the 5-minute means, scaled to their own range.
const RE_HIST_WINDOW = 24 * 3600000;
function reSpark(points, end) {
  if (!points || points.length < 2) return "";
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = hi - lo || 1;
  const x = (t) => Math.max(0, Math.min(100, (100 * (t - (end - RE_HIST_WINDOW))) / RE_HIST_WINDOW)).toFixed(2);
  const y = (v) => (28 - ((v - lo) / span) * 24).toFixed(2);
  const line = `M${points.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}`;
  const area = `M${x(points[0].t)},30L${points.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}L${x(points.at(-1).t)},30Z`;
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="${area}"/><path class="spark-l" d="${line}"/></svg>`;
}

// Lowest and highest of the curve's points, or null without a curve.
function reRange(points) {
  if (!points || points.length < 2) return null;
  const vs = points.map((p) => p.v);
  return { lo: Math.min(...vs), hi: Math.max(...vs) };
}

class RoomEnvironmentCard extends RcCard {
  static tag = "room-environment-card";
  static i18n = RE_I18N;
  static needsArea = true;
  static includeDomains = ["sensor"];
  static includeMatch = (hass, id) => !!reKindOf(hass.states[id]);
  static defaults = { columns: 2, only_alerts: false, show_gauge: true, show_history: true, exclude: [] };

  _candidate(id) {
    return reMatch(this._hass, id);
  }

  _words(family) {
    const w = RE_I18N[this._lang()]?.[`b_${family}`] ?? RE_I18N.en[`b_${family}`];
    return w;
  }

  // The value as Home Assistant shows it (number format, display precision), or formatted here for an older HA.
  _format(st, kind) {
    if (typeof this._hass.formatEntityState === "function") return this._hass.formatEntityState(st);
    const digits = this._hass.entities?.[st.entity_id]?.display_precision ?? RE_KINDS[kind].digits;
    return this._formatNumber(Number.parseFloat(st.state), digits, st.attributes.unit_of_measurement);
  }

  _formatNumber(value, digits, unit) {
    // HA's full locale (pt-BR, de-CH) when it is the card's language, else the card's resolved language. HA's `pt`
    // is European Portuguese, which Intl reads as Brazilian: it becomes `pt-PT`.
    const lang = this._lang();
    const ha = this._hass?.locale?.language || this._hass?.language;
    const full = !lang.includes("-") && ha?.split("-")[0] === lang ? ha : lang;
    const locale = full === "pt" ? "pt-PT" : full;
    const n = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    return unit ? `${n} ${unit}` : n;
  }

  // One reading per kind: the mean of the sensors of that kind that report a number, unavailable and unknown ones
  // ignored (a kind with none left is not shown). A single sensor keeps Home Assistant's formatting and its
  // `name` / `icon` overrides; a mean is formatted with the kind's precision.
  _reading(kind, members, room) {
    const k = RE_KINDS[kind];
    const [first] = members;
    const single = members.length === 1;
    const unit = first.st.attributes.unit_of_measurement;
    const values = members.map((m) => reConvert(kind, Number.parseFloat(m.st.state), m.st.attributes.unit_of_measurement, unit));
    const value = values.reduce((t, v) => t + v, 0) / values.length;
    const item = {
      id: first.e.entity,
      ids: members.map((m) => m.e.entity),
      kind,
      name: (single && first.e.name) || this._t(`k_${kind}`),
      on: true,
      sev: "ok",
      cold: false,
      num: value,
      unit,
    };
    let band;
    let gauge;
    if (k.steps) {
      band = value < k.steps[0] ? 0 : value < k.steps[1] ? 1 : 2;
      gauge = k.gauge;
      item.light = band > 0;
    } else {
      const sc = reScale(kind, unit, reCustom(kind, room));
      band = reBand(value, sc.scale);
      gauge = sc.gauge;
      if (!reOutdoorInfo(kind, room)) {
        item.sev = (k.sev ?? RE_SEV)[band];
        item.cold = !!k.cold?.includes(band);
      }
    }
    const text = single ? this._format(first.st, kind) : this._formatNumber(value, k.digits, unit);
    const word = this._words(k.words)[band];
    return {
      ...item,
      band,
      value: text,
      word,
      state: word ? `${text} · ${word}` : text,
      icon: (single && first.e.icon) || k.icons?.[band] || k.icon,
      pct: Math.round(Math.min(1, Math.max(0, (value - gauge[0]) / (gauge[1] - gauge[0]))) * 100),
    };
  }

  _collect() {
    const entries = this._entries();
    // Sensors of a known kind that report no number (unavailable, unknown): no reading, but a muted *N unavailable*.
    this._na = entries
      .map((e) => e.entity)
      .filter((id) => {
        const st = this._hass.states[id];
        return reKindOf(st) && !reValid(st);
      });
    return this._itemsOf(entries, { name: this._areaName(), thresholds: this._config.thresholds });
  }

  // The readings of `entries`, one per kind, in kind order; also used by the overview, room by room.
  // `room`: { name, thresholds } of the room, for its comfort limits.
  _itemsOf(entries, room) {
    const byKind = {};
    for (const e of entries) {
      const st = this._hass.states[e.entity];
      const kind = reKindOf(st);
      if (kind && reValid(st)) (byKind[kind] ||= []).push({ e, st });
    }
    // A mean only makes sense in one unit: temperatures are converted to the first sensor's unit (°C / °F), other
    // kinds are split by unit (VOC in µg/m³ and in ppb cannot be converted), one reading per unit.
    return RE_ORDER.filter((kind) => byKind[kind]).flatMap((kind) => {
      const byUnit = new Map();
      for (const m of byKind[kind]) {
        const unit = kind === "temperature" ? "" : (m.st.attributes.unit_of_measurement ?? "");
        if (!byUnit.has(unit)) byUnit.set(unit, []);
        byUnit.get(unit).push(m);
      }
      return [...byUnit.values()].map((members) => this._reading(kind, members, room));
    });
  }

  // Number in full, unit small and muted ("°" for a temperature) to keep the chips short.
  _chipValue(i) {
    if (i.value == null) return "<span>—</span>";
    const unit = i.unit || "";
    const num = unit && i.value.endsWith(unit) ? i.value.slice(0, -unit.length).trim() : i.value;
    const short = /^°[CF]$/.test(unit) ? "°" : unit;
    return `<span>${rcEsc(num)}</span>${short && num !== i.value ? `<small>${rcEsc(short)}</small>` : ""}`;
  }

  // The reading that needs a look first: the highest severity, then the kind order.
  _worst(items) {
    return items.reduce((w, i) => (RE_RANK[i.sev] > RE_RANK[w?.sev ?? "ok"] ? i : w), null);
  }

  _status(items, worst) {
    if (!items.length) return this._na?.length ? this._tn("unavail", this._na.length) : this._t("no_sensors");
    if (!worst) return this._t("comfortable");
    if (worst.sev === "info") return worst.word;
    const issues = items.filter((i) => RE_RANK[i.sev] >= RE_RANK.warn).length;
    const family = RE_KINDS[worst.kind].issue;
    const text = (RE_I18N[this._lang()]?.[`i_${family}`] ?? RE_I18N.en[`i_${family}`])[worst.band > 2 ? 1 : 0];
    return issues > 1 ? `${text} +${issues - 1}` : text;
  }

  _headIcon(worst) {
    if (!worst) return "mdi:home-thermometer-outline";
    if (worst.kind === "pm25" || worst.kind === "pm10" || worst.kind === "voc") return "mdi:air-filter";
    return worst.icon;
  }

  // 24 h of 5-minute means of the readings (their first sensor), from the recorder's statistics: one query, again
  // every 5 minutes; drawn behind the tiles once it has come.
  _history(ids) {
    const key = ids.join(",");
    if (!key || !this._hass.callWS || this._config.show_history === false) return null;
    if (this._histKey !== key || Date.now() - (this._histAt || 0) > 300000) {
      const end = Date.now();
      this._histKey = key;
      this._histAt = end;
      this._hass
        .callWS({ type: "recorder/statistics_during_period", start_time: new Date(end - RE_HIST_WINDOW).toISOString(), statistic_ids: ids, period: "5minute", types: ["mean"] })
        .then((r) => {
          if (this._histKey !== key) return;
          this._hist = { end, points: Object.fromEntries(ids.map((id) => [id, (r?.[id] || []).map((p) => ({ t: typeof p.start === "number" ? p.start : Date.parse(p.start), v: p.mean })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))])) };
          this._histVer = (this._histVer || 0) + 1;
          if (this._lastItems) this._draw(this._lastItems);
        })
        .catch(() => {
          this._histAt = Date.now() - 240000;
        });
    }
    return this._histKey === key ? this._hist : null;
  }

  _rangeTitle(i, hist) {
    const r = hist && reRange(hist.points[i.id]);
    if (!r) return `${i.name} — ${i.state}`;
    const digits = RE_KINDS[i.kind]?.digits ?? 1;
    return `${i.name} — ${i.state} · 24 h ${this._formatNumber(r.lo, digits, i.unit)} – ${this._formatNumber(r.hi, digits, i.unit)}`;
  }

  _draw(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold ? "cold" : worst.sev) : "ok";
    this._lastItems = items;
    const hist = this._history(items.filter((i) => !i.unavailable && i.id).map((i) => i.id));

    const na = this._naItem();
    if (!this._changed([items.map((i) => [i.id, i.name, i.icon, i.state, i.sev, i.cold, i.pct]), na?.name, na?.state, this._histVer]))
      return;

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok") : items;
    this._shown = shown.length + (na ? 1 : 0);
    const tiles = shown
      .map((i) =>
        this._tile(i, {
          cls: ` k-${i.kind} s-${i.sev}${i.cold ? " cold" : ""}${i.light ? " lit" : ""}`,
          extra:
            (hist ? reSpark(hist.points[i.id], hist.end) : "") +
            (c.show_gauge && i.pct != null ? `<span class="gauge"><span style="width:${i.pct}%"></span></span>` : ""),
          // The comfort word only when the reading needs a look (and for the light level): shorter tiles.
          // The curve has no scale: its lowest and highest values of the 24 hours in the tooltip.
          title: this._rangeTitle(i, hist),
          state: i.word && (i.sev !== "ok" || i.kind === "illuminance")
            ? `<span class="val">${rcEsc(i.value)}</span> · ${rcEsc(i.word)}`
            : `<span class="val">${rcEsc(i.value ?? i.state)}</span>`,
        }),
      )
      .join("");
    const naTile = na ? this._tile(na, { cls: " k-na", state: rcEsc(na.state) }) : "";
    const head = this._head({
      icon: this._headIcon(worst),
      title: c.title || this._areaName() || this._t("title"),
      status: this._status(items, worst),
    });
    this._paint(level === "info" ? "cold" : level, head, tiles + naTile);
  }

  // The unavailable sensors as one muted tile or chip (*2 unavailable*, their names below): a tap opens the first one.
  _naItem() {
    const na = this._na ?? [];
    if (!na.length) return null;
    return {
      id: na[0],
      unavailable: true,
      name: this._tn("unavail", na.length),
      icon: "mdi:alert-circle-outline",
      state: na.map((id) => this._hass.states[id]?.attributes.friendly_name || id).join(", "),
    };
  }

  // A tap opens the details (history graph): a reading cannot be toggled.
  _bindTile(el) {
    el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
  }

  static styles = `
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-cold  { --c: var(--rc-info); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }
    .tile { --t: var(--rc-ok); }
    .tile.s-warn  { --t: var(--rc-warn); }
    .tile.s-alert { --t: var(--rc-alert); }
    .tile.cold    { --t: var(--rc-info); }
    .tile.k-illuminance     { --t: var(--rc-idle); }
    .tile.k-illuminance.lit { --t: var(--rc-light); }
    /* The unavailable sensors' names on one line: the tooltip lists them all. */
    .tile.k-na .state { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Only what needs a look is tinted: comfortable readings and the light level stay neutral. */
    .tile.s-ok { background: var(--secondary-background-color, transparent); border-color: transparent; }
    .val { color: var(--primary-text-color); font-weight: 600; }
    .tile.s-warn .state, .tile.s-alert .state, .tile.cold .state { color: var(--t); }
    .tile.s-warn .val, .tile.s-alert .val, .tile.cold .val { color: inherit; }
    /* The last 24 hours behind the reading, in its level's colour, discreet. */
    /* The lower half of the tile: under the value and gauge, clear of the name and icon. */
    .spark { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 50%; pointer-events: none; border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; }
    .spark-a { fill: color-mix(in srgb, var(--t) 8%, transparent); }
    .spark-l { fill: none; stroke: color-mix(in srgb, var(--t) 35%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
    .tile > :not(.spark):not(.gauge) { position: relative; }
    /* Drawn in the bottom padding of the tile: no extra height. */
    .gauge { position: absolute; inset: auto 8px 2px 41px; height: 2px; border-radius: 1px; pointer-events: none;
             background: color-mix(in srgb, var(--t) 16%, transparent); }
    .gauge > span { display: block; height: 100%; border-radius: inherit; background: var(--t); transition: width .4s; }
    @media (prefers-reduced-motion: reduce) { .gauge > span { transition: none; } }
    /* Very narrow card (a phone, 6 columns: one tile per row of ~130 px): the reading wins the room of the tile's icon. */
    @container (max-width: 200px) {
      .tile { padding-left: 8px; }
      .tile .ic { display: none; }
      .gauge { left: 8px; }
    }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomEnvironmentCardEditor = rcEditor({
  card: RoomEnvironmentCard,
  helpers: ["title", "navigation_path", "only_alerts", "show_gauge", "show_history", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_alerts", "show_gauge", "show_history"),
    ...rcIncludeField(RoomEnvironmentCard, hass, config),
    ...rcExcludeField(RoomEnvironmentCard, hass, config),
    ...rcAdvanced(RE_I18N, lang, "thresholds", "entities", "language"),
  ],
});

rcRegister(
  RoomEnvironmentCard,
  RoomEnvironmentCardEditor,
  "Room Environment Card",
  "Temperature, humidity, air quality, noise and light level of a room, coloured by comfort",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then one chip per reading (icon and value), tinted only when
// the reading needs a look. The zoom button switches to the full Environment card (tiles and gauges) and back.
// `columns` and `show_gauge` only shape the zoomed-in view.
class RoomEnvironmentMiniCard extends rcMini(
  RoomEnvironmentCard,
  "room-environment-mini-card",
  `
    .r small { font-size: 10px; font-weight: 400; opacity: .7; margin-left: 1px; }
    .r.s-warn  { --t: var(--rc-warn); }
    .r.s-alert { --t: var(--rc-alert); }
    .r.cold    { --t: var(--rc-info); }
    .r.k-illuminance     { --t: var(--rc-idle); }
    .r.k-illuminance.lit { --t: var(--rc-light); }
    .r.na { --t: var(--rc-na); opacity: .7; }
  `,
) {
  _drawMini(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok";
    const na = this._naItem();
    if (!this._changed(["mini", items.map((i) => [i.id, i.icon, i.state, i.sev, i.cold]), na?.name, na?.state])) return;

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok") : items;
    this._shown = shown.length;
    // Comfortable readings stay plain; the ones needing a look get a tinted pill, cool ones in blue.
    const pill = (i) => i.sev === "warn" || i.sev === "alert" || (i.cold && i.sev !== "ok");
    const chips = shown
      .map(
        (i) => `
        <button class="r s-${i.sev}${i.cold ? " cold" : ""}${i.light ? " lit" : ""}${pill(i) ? " pill" : ""} k-${i.kind}"
                data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
          <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${this._chipValue(i)}
        </button>`,
      )
      .join("");
    const naChip = na
      ? `<button class="r na" data-id="${rcEsc(na.id)}" title="${rcEsc(na.name)} — ${rcEsc(na.state)}">
          <ha-icon icon="${rcEsc(na.icon)}"></ha-icon><span>${rcEsc(na.name)}</span>
        </button>`
      : "";
    this._paintMini({ level, icon: this._headIcon(worst), status: this._status(items, worst), chips: chips + naChip });
  }
}

const RoomEnvironmentMiniCardEditor = rcEditor({
  card: RoomEnvironmentMiniCard,
  helpers: ["title", "navigation_path", "columns", "only_alerts", "show_gauge", "zoom", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_alerts", "zoom", "show_gauge", "show_history"),
    ...rcIncludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcExcludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcAdvanced(RE_I18N, lang, "thresholds", "entities", "language"),
  ],
});

rcRegister(
  RoomEnvironmentMiniCard,
  RoomEnvironmentMiniCardEditor,
  "Room Environment Mini Card",
  "The environment readings of a room on a single line: one chip per reading, tinted when it needs a look",
);

// ── Overview card ────────────────────────────────────────────────────────────
// Every room with environment sensors, one tile per room: its status and its main readings. Tap a room to unfold
// its Environment card.
const REO_I18N = {
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
    ed_sort_state: "Rooms needing a look first",
    ed_exclude_helper: "Left out of the tiles, the averages and the room details",
    ed_rooms_helper: "Order and overrides: a list of {area, name, icon, navigation_path, thresholds}, thresholds applying to that room only",
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
    ed_sort_state: "Pièces à surveiller en premier",
    ed_exclude_helper: "Ignorés dans les tuiles, les moyennes et le détail des pièces",
    ed_rooms_helper: "Ordre et personnalisation : une liste de {area, name, icon, navigation_path, thresholds}, thresholds ne valant que pour cette pièce",
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
    ed_sort_state: "Räume, die Aufmerksamkeit brauchen, zuerst",
    ed_exclude_helper: "Bei den Kacheln, den Durchschnitten und den Raumdetails nicht berücksichtigt",
    ed_rooms_helper: "Reihenfolge und Anpassungen: eine Liste von {area, name, icon, navigation_path, thresholds}, wobei thresholds nur für diesen Raum gilt",
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
    ed_sort_state: "Primero las habitaciones que requieren atención",
    ed_exclude_helper: "Se ignoran en los mosaicos, las medias y el detalle de las habitaciones",
    ed_rooms_helper: "Orden y personalización: una lista de {area, name, icon, navigation_path, thresholds}, aplicándose thresholds solo a esa habitación",
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
    ed_sort_state: "Прво просторије које захтевају пажњу",
    ed_exclude_helper: "Изостављено из плочица, просека и детаља просторије",
    ed_rooms_helper:
      "Редослед и измене: листа са {area, name, icon, navigation_path, thresholds}, при чему thresholds важи само за ту просторију",
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
    ed_sort_state: "Prvo prostorije koje zahtevaju pažnju",
    ed_exclude_helper: "Izostavljeno iz pločica, proseka i detalja prostorije",
    ed_rooms_helper:
      "Redosled i izmene: lista sa {area, name, icon, navigation_path, thresholds}, pri čemu thresholds važi samo za tu prostoriju",
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
    ed_sort_state: "Prima le stanze da controllare",
    ed_exclude_helper: "Ignorati nei riquadri, nelle medie e nei dettagli delle stanze",
    ed_rooms_helper: "Ordine e personalizzazioni: un elenco di {area, name, icon, navigation_path, thresholds}, dove thresholds vale solo per quella stanza",
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
    ed_sort_state: "Ruimtes die aandacht nodig hebben eerst",
    ed_exclude_helper: "Niet meegeteld in de tegels, de gemiddelden en de ruimtedetails",
    ed_rooms_helper: "Volgorde en aanpassingen: een lijst van {area, name, icon, navigation_path, thresholds}, waarbij thresholds alleen voor die ruimte geldt",
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
    ed_sort_state: "Primeiro as divisões que precisam de atenção",
    ed_exclude_helper: "Ignorados nos mosaicos, nas médias e no detalhe das divisões",
    ed_rooms_helper: "Ordem e personalização: uma lista de {area, name, icon, navigation_path, thresholds}, aplicando-se thresholds apenas a essa divisão",
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
    ed_sort_state: "Najpierw pomieszczenia wymagające uwagi",
    ed_exclude_helper: "Pomijane w kafelkach, średnich i szczegółach pomieszczeń",
    ed_rooms_helper: "Kolejność i nadpisania: lista {area, name, icon, navigation_path, thresholds}, przy czym thresholds dotyczy tylko tego pomieszczenia",
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
    ed_sort_state: "Întâi camerele care necesită atenție",
    ed_exclude_helper: "Ignorați în dale, în medii și în detaliile camerelor",
    ed_rooms_helper: "Ordine și personalizări: o listă de {area, name, icon, navigation_path, thresholds}, thresholds aplicându-se doar acelei camere",
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
    ed_sort_state: "Rum, der kræver opmærksomhed, først",
    ed_exclude_helper: "Udelades fra felterne, gennemsnittene og rummenes detaljer",
    ed_rooms_helper: "Rækkefølge og tilpasninger: en liste med {area, name, icon, navigation_path, thresholds}, hvor thresholds kun gælder for det rum",
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
    ed_sort_state: "Rum som behöver ses över först",
    ed_exclude_helper: "Utelämnas från rutorna, medelvärdena och rummens detaljer",
    ed_rooms_helper: "Ordning och anpassningar: en lista med {area, name, icon, navigation_path, thresholds}, där thresholds bara gäller det rummet",
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
    ed_sort_state: "Първо стаите, които изискват внимание",
    ed_exclude_helper: "Пропускат се в плочките, средните стойности и подробностите за стаите",
    ed_rooms_helper: "Ред и персонализиране: списък от {area, name, icon, navigation_path, thresholds}, като thresholds важи само за тази стая",
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
    ed_sort_state: "Сначала комнаты, требующие внимания",
    ed_exclude_helper: "Не учитываются в плитках, средних значениях и подробностях комнат",
    ed_rooms_helper: "Порядок и настройки: список {area, name, icon, navigation_path, thresholds}, где thresholds действует только для этой комнаты",
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
    ed_sort_state: "Спершу кімнати, що потребують уваги",
    ed_exclude_helper: "Не враховуються в плитках, середніх значеннях і подробицях кімнат",
    ed_rooms_helper: "Порядок і налаштування: список {area, name, icon, navigation_path, thresholds}, де thresholds діє лише для цієї кімнати",
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
    ed_sort_state: "Elöl a figyelmet igénylő helyiségek",
    ed_exclude_helper: "Kimaradnak a csempékből, az átlagokból és a helyiségek részleteiből",
    ed_rooms_helper: "Sorrend és testreszabás: {area, name, icon, navigation_path, thresholds} elemek listája, ahol a thresholds csak az adott helyiségre vonatkozik",
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
    ed_sort_state: "Najprv miestnosti vyžadujúce pozornosť",
    ed_exclude_helper: "Vynechané z dlaždíc, priemerov a podrobností miestností",
    ed_rooms_helper: "Poradie a úpravy: zoznam {area, name, icon, navigation_path, thresholds}, pričom thresholds platí len pre danú miestnosť",
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
    ed_sort_state: "Nejprve místnosti vyžadující pozornost",
    ed_exclude_helper: "Vynechané z dlaždic, průměrů a podrobností místností",
    ed_rooms_helper: "Pořadí a úpravy: seznam {area, name, icon, navigation_path, thresholds}, přičemž thresholds platí jen pro danou místnost",
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
    ed_sort_state: "Najprej prostori, ki potrebujejo pozornost",
    ed_exclude_helper: "Izpuščeni iz ploščic, povprečij in podrobnosti prostorov",
    ed_rooms_helper: "Vrstni red in prilagoditve: seznam {area, name, icon, navigation_path, thresholds}, pri čemer thresholds velja samo za ta prostor",
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
    ed_sort_state: "Vispirms telpas, kurām jāpievērš uzmanība",
    ed_exclude_helper: "Netiek ņemti vērā flīzēs, vidējās vērtībās un telpu detaļās",
    ed_rooms_helper: "Secība un pielāgojumi: saraksts ar {area, name, icon, navigation_path, thresholds}, kur thresholds attiecas tikai uz šo telpu",
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
    ed_sort_state: "Πρώτα τα δωμάτια που χρειάζονται έλεγχο",
    ed_exclude_helper: "Παραλείπονται από τα πλακίδια, τους μέσους όρους και τις λεπτομέρειες των δωματίων",
    ed_rooms_helper: "Σειρά και προσαρμογές: μια λίστα με {area, name, icon, navigation_path, thresholds}, όπου το thresholds ισχύει μόνο για εκείνο το δωμάτιο",
  },
};

// Readings always shown on a room tile; the others only when they need a look.
const REO_MAIN = ["temperature", "humidity", "co2"];

class RoomEnvironmentOverviewCard extends rcRoomsPanel(RoomEnvironmentCard) {
  static tag = "room-environment-overview-card";
  static i18n = REO_I18N;
  static needsArea = false;
  static defaults = { zoom: true, sort: "name", exclude_areas: [], exclude: [], rooms: [] };

  static getStubConfig() {
    return {};
  }

  set hass(hass) {
    super.hass = hass;
    if (this._detail) this._detail.hass = hass;
  }

  getCardSize() {
    return 1 + Math.ceil((this._items?.length || 1) / 3);
  }

  _collect() {
    const h = this._hass;
    const c = this._config;
    const excluded = new Set(c.exclude_areas || []);
    const overrides = Object.fromEntries((c.rooms || []).map((x) => [x.area, x]));
    const byArea = {};
    for (const [id, aid] of rcByArea(this, (id) => id.startsWith("sensor."))) (byArea[aid] ||= []).push(id);
    const rooms = [];
    for (const [aid, ids] of Object.entries(byArea)) {
      const area = h.areas?.[aid];
      const entries = ids.filter((id) => h.states[id] && reMatch(h, id)).map((entity) => ({ entity }));
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

    if (!this.shadowRoot.querySelector("ha-card")) {
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${RoomEnvironmentOverviewCard.styles}</style>
        <ha-card><div class="head"></div><div class="panel" hidden></div><div class="grid"></div></ha-card>`;
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
    card.querySelector(".head").innerHTML = `
      <div class="badge"><ha-icon icon="${this._headIcon(worst)}"></ha-icon></div>
      <div class="title">${rcEsc(c.title || this._t("title"))}</div>
      ${avg}
      <div class="pill" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></div>
      ${rcZoomButton(this)}`;

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
      exclude: c.exclude || [],
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

const RoomEnvironmentOverviewCardEditor = rcEditor({
  card: RoomEnvironmentOverviewCard,
  helpers: ["title", "columns", "zoom", "exclude", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => {
    const probe = hass && rcProbe(RoomEnvironmentOverviewCard, hass, { ...config, exclude_areas: [], exclude: [], zoom: false });
    const rooms = probe ? probe._collect() : [];
    const ids = rooms.flatMap((x) => x.items.flatMap((i) => i.ids));
    for (const id of config?.exclude || []) if (!ids.includes(id)) ids.push(id);
    return [
      ...rcOverviewFields(REO_I18N, lang),
      ...rcBooleans("zoom"),
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
