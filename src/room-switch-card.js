/**
 * room-switch-card — smart plugs of a Home Assistant area with their power draw.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RW_I18N = {
  en: {
    title: "Plugs",
    all_off: "All off",
    on_one: "{n} on",
    on_many: "{n} on",
    no_plugs: "No plug",
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /energy",
    ed_only_on: "Hide plugs that are off",
    ed_only_on_helper: "Only the plugs that are on stay visible",
    ed_hide_when_off: "Hide the card when everything is off",
    ed_hide_when_off_helper: "The card only appears when a plug is on",
    ed_show_power: "Show power draw",
    ed_show_power_helper: "Read from the power sensor of each plug",
    ed_all_off_button_helper: "Tapping the status pill turns every plug of the card off",
    ed_include: "Plugs and switches to add",
    ed_include_helper: "From another room or without one, or a switch not recognised as a plug",
    ed_exclude: "Plugs to exclude",
    ed_entities_helper: "Replaces the automatic discovery: entity IDs, or {entity, name, icon, power}, power being the entity of its power sensor",
  },
  fr: {
    title: "Prises",
    all_off: "Tout est éteint",
    on_one: "{n} allumée",
    on_many: "{n} allumées",
    no_plugs: "Aucune prise",
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /energy",
    ed_only_on: "Masquer les prises éteintes",
    ed_only_on_helper: "Seules les prises allumées restent affichées",
    ed_hide_when_off: "Masquer la carte quand tout est éteint",
    ed_hide_when_off_helper: "La carte n'apparaît que si une prise est allumée",
    ed_show_power: "Afficher la consommation",
    ed_show_power_helper: "Lue sur le capteur de puissance de chaque prise",
    ed_all_off_button_helper: "Un tap sur la pastille éteint toutes les prises de la carte",
    ed_include: "Prises et interrupteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce, ou un interrupteur non reconnu comme prise",
    ed_exclude: "Prises à exclure",
    ed_entities_helper: "Remplace la découverte automatique : des identifiants d'entités, ou {entity, name, icon, power}, power étant l'entité de son capteur de puissance",
  },
  de: {
    title: "Steckdosen",
    all_off: "Alles aus",
    on_one: "{n} an",
    on_many: "{n} an",
    no_plugs: "Keine Steckdose",
    ed_navigation_path_helper: "Dashboard, das beim Tippen auf den Titel geöffnet wird, z. B. /energy",
    ed_only_on: "Ausgeschaltete Steckdosen ausblenden",
    ed_only_on_helper: "Nur eingeschaltete Steckdosen bleiben sichtbar",
    ed_hide_when_off: "Karte ausblenden, wenn alles aus ist",
    ed_hide_when_off_helper: "Die Karte erscheint nur, wenn eine Steckdose an ist",
    ed_show_power: "Leistungsaufnahme anzeigen",
    ed_show_power_helper: "Vom Leistungssensor jeder Steckdose gelesen",
    ed_all_off_button_helper: "Tippen auf die Statusanzeige schaltet alle Steckdosen der Karte aus",
    ed_include: "Hinzuzufügende Steckdosen und Schalter",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum, oder ein Schalter, der nicht als Steckdose erkannt wird",
    ed_exclude: "Auszuschließende Steckdosen",
    ed_entities_helper: "Ersetzt die automatische Erkennung: Entitäts-IDs oder {entity, name, icon, power}, wobei power die Entität ihres Leistungssensors ist",
  },
  es: {
    title: "Enchufes",
    all_off: "Todo apagado",
    on_one: "{n} encendido",
    on_many: "{n} encendidos",
    no_plugs: "Ningún enchufe",
    ed_navigation_path_helper: "Panel que se abre al tocar el título, p. ej. /energy",
    ed_only_on: "Ocultar los enchufes apagados",
    ed_only_on_helper: "Solo quedan visibles los enchufes encendidos",
    ed_hide_when_off: "Ocultar la tarjeta cuando todo está apagado",
    ed_hide_when_off_helper: "La tarjeta solo aparece cuando hay un enchufe encendido",
    ed_show_power: "Mostrar el consumo",
    ed_show_power_helper: "Leído del sensor de potencia de cada enchufe",
    ed_all_off_button_helper: "Al tocar el indicador de estado se apagan todos los enchufes de la tarjeta",
    ed_include: "Enchufes e interruptores a añadir",
    ed_include_helper: "De otra habitación o sin habitación, o un interruptor no reconocido como enchufe",
    ed_exclude: "Enchufes a excluir",
    ed_entities_helper: "Sustituye la detección automática: IDs de entidad, o {entity, name, icon, power}, siendo power la entidad de su sensor de potencia",
  },
  sr: {
    title: "Утичнице",
    all_off: "Све искључено",
    on_one: "{n} укључена",
    on_many: "{n} укључено/их",
    no_plugs: "Нема утичница",
    ed_navigation_path_helper: "Контролна табла која се отвара додиром на наслов, нпр. /energy",
    ed_only_on: "Сакриј утичнице које су искључене",
    ed_only_on_helper: "Остаће видљиве само утичнице које су укључене",
    ed_hide_when_off: "Сакриј картицу када је све искључено",
    ed_hide_when_off_helper: "Картица се приказује само када је нека утичница укључена",
    ed_show_power: "Прикажи потрошњу енергије",
    ed_show_power_helper: "Очитава се са сензора снаге сваке утичнице",
    ed_all_off_button_helper: "Додир на статусну пилулу искључује све утичнице на картици",
    ed_include: "Утичнице и прекидачи за додавање",
    ed_include_helper: "Из друге просторије или без ње, или прекидач који није препознат као утичница",
    ed_exclude: "Утичнице за искључивање",
    ed_entities_helper:
      "Замењује аутоматско проналажење: ID-ови ентитета или {entity, name, icon, power}, где је power ентитет сензора снаге утичнице",
  },
  "sr-Latn": {
    title: "Utičnice",
    all_off: "Sve isključeno",
    on_one: "{n} uključena",
    on_many: "{n} uključeno/ih",
    no_plugs: "Nema utičnica",
    ed_navigation_path_helper: "Kontrolna tabla koja se otvara dodirom na naslov, npr. /energy",
    ed_only_on: "Sakrij utičnice koje su isključene",
    ed_only_on_helper: "Ostaće vidljive samo utičnice koje su uključene",
    ed_hide_when_off: "Sakrij karticu kada je sve isključeno",
    ed_hide_when_off_helper: "Kartica se prikazuje samo kada je neka utičnica uključena",
    ed_show_power: "Prikaži potrošnju energije",
    ed_show_power_helper: "Očitava se sa senzora snage svake utičnice",
    ed_all_off_button_helper: "Dodir na statusnu pilulu isključuje sve utičnice na kartici",
    ed_include: "Utičnice i prekidači za dodavanje",
    ed_include_helper: "Iz druge prostorije ili bez nje, ili prekidač koji nije prepoznat kao utičnica",
    ed_exclude: "Utičnice za isključivanje",
    ed_entities_helper:
      "Zamenjuje automatsko pronalaženje: ID-ovi entiteta ili {entity, name, icon, power}, gde je power entitet senzora snage utičnice",
  },
  it: {
    title: "Prese",
    all_off: "Tutto spento",
    on_one: "{n} accesa",
    on_many: "{n} accese",
    no_plugs: "Nessuna presa",
    ed_navigation_path_helper: "Plancia aperta toccando il titolo, ad es. /energy",
    ed_only_on: "Nascondi le prese spente",
    ed_only_on_helper: "Restano visibili solo le prese accese",
    ed_hide_when_off: "Nascondi la scheda quando tutto è spento",
    ed_hide_when_off_helper: "La scheda appare solo quando una presa è accesa",
    ed_show_power: "Mostra il consumo",
    ed_show_power_helper: "Letto dal sensore di potenza di ogni presa",
    ed_all_off_button_helper: "Toccando l'indicatore di stato si spengono tutte le prese della scheda",
    ed_include: "Prese e interruttori da aggiungere",
    ed_include_helper: "Da un'altra stanza o senza stanza, oppure un interruttore non riconosciuto come presa",
    ed_exclude: "Prese da escludere",
    ed_entities_helper: "Sostituisce il rilevamento automatico: ID entità o {entity, name, icon, power}, dove power è l'entità del suo sensore di potenza",
  },
  nl: {
    title: "Stekkers",
    all_off: "Alles uit",
    on_one: "{n} aan",
    on_many: "{n} aan",
    no_plugs: "Geen stekker",
    ed_navigation_path_helper: "Dashboard dat opent bij een tik op de titel, bijv. /energy",
    ed_only_on: "Uitgeschakelde stekkers verbergen",
    ed_only_on_helper: "Alleen ingeschakelde stekkers blijven zichtbaar",
    ed_hide_when_off: "Kaart verbergen als alles uit is",
    ed_hide_when_off_helper: "De kaart verschijnt alleen als er een stekker aan is",
    ed_show_power: "Stroomverbruik tonen",
    ed_show_power_helper: "Gelezen van de vermogenssensor van elke stekker",
    ed_all_off_button_helper: "Een tik op de statusindicator schakelt alle stekkers van de kaart uit",
    ed_include: "Toe te voegen stekkers en schakelaars",
    ed_include_helper: "Uit een andere ruimte of zonder ruimte, of een schakelaar die niet als stekker wordt herkend",
    ed_exclude: "Uit te sluiten stekkers",
    ed_entities_helper: "Vervangt de automatische detectie: entiteit-ID's of {entity, name, icon, power}, waarbij power de entiteit van de vermogenssensor is",
  },
  pt: {
    title: "Tomadas",
    all_off: "Tudo desligado",
    on_one: "{n} ligada",
    on_many: "{n} ligadas",
    no_plugs: "Nenhuma tomada",
    ed_navigation_path_helper: "Painel aberto ao tocar no título, p. ex. /energy",
    ed_only_on: "Ocultar as tomadas desligadas",
    ed_only_on_helper: "Só ficam visíveis as tomadas ligadas",
    ed_hide_when_off: "Ocultar o cartão quando está tudo desligado",
    ed_hide_when_off_helper: "O cartão só aparece quando há uma tomada ligada",
    ed_show_power: "Mostrar o consumo",
    ed_show_power_helper: "Lido do sensor de potência de cada tomada",
    ed_all_off_button_helper: "Tocar no indicador de estado desliga todas as tomadas do cartão",
    ed_include: "Tomadas e interruptores a adicionar",
    ed_include_helper: "De outra divisão ou sem divisão, ou um interruptor não reconhecido como tomada",
    ed_exclude: "Tomadas a excluir",
    ed_entities_helper: "Substitui a deteção automática: IDs de entidade, ou {entity, name, icon, power}, sendo power a entidade do seu sensor de potência",
  },
  pl: {
    title: "Gniazdka",
    all_off: "Wszystko wyłączone",
    on_one: "Włączone: {n}",
    on_many: "Włączone: {n}",
    no_plugs: "Brak gniazdek",
    ed_navigation_path_helper: "Dashboard otwierany po dotknięciu tytułu, np. /energy",
    ed_only_on: "Ukryj wyłączone gniazdka",
    ed_only_on_helper: "Widoczne pozostają tylko włączone gniazdka",
    ed_hide_when_off: "Ukryj kartę, gdy wszystko jest wyłączone",
    ed_hide_when_off_helper: "Karta pojawia się tylko, gdy jakieś gniazdko jest włączone",
    ed_show_power: "Pokaż pobór mocy",
    ed_show_power_helper: "Odczytywany z czujnika mocy każdego gniazdka",
    ed_all_off_button_helper: "Dotknięcie wskaźnika stanu wyłącza wszystkie gniazdka na karcie",
    ed_include: "Gniazdka i przełączniki do dodania",
    ed_include_helper: "Z innego pomieszczenia lub bez pomieszczenia albo przełącznik nierozpoznany jako gniazdko",
    ed_exclude: "Gniazdka do wykluczenia",
    ed_entities_helper: "Zastępuje automatyczne wykrywanie: identyfikatory encji lub {entity, name, icon, power}, gdzie power to encja czujnika mocy gniazdka",
  },
};

// "Prise Machine à café" → "Machine à café", "Coffee Machine Plug" → "Coffee Machine",
// "Prise Caméra Terrasse" in Terrasse → "Caméra"
const RW_PREFIX = /^(prise|multiprise|plug|smart plug|outlet)\s+/i;
const RW_SUFFIX = /\s+(prise|plug|smart plug|outlet|socket)$/i;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomSwitchCard extends RcToggleCard {
  static tag = "room-switch-card";
  static i18n = RW_I18N;
  static needsArea = true;
  static includeDomains = ["switch"];
  static headIcons = ["mdi:power-socket-fr", "mdi:power-plug-off-outline"];
  static emptyKey = "no_plugs";
  static defaults = {
    columns: 2,
    only_on: false,
    hide_when_off: false,
    show_power: true,
    all_off_button: false,
    exclude: [],
  };

  _candidate(id) {
    return rcMatchPlug(this._hass, id);
  }

  _collect() {
    const h = this._hass;
    const areaName = this._areaName();
    const power = rcPowerSensors(h);
    return this._entries()
      .map((e) => {
        const st = h.states[e.entity];
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        const watts = this._config.show_power ? rcWattsOf(h, e.power ?? power[h.entities?.[e.entity]?.device_id]) : null;
        const item = {
          id: e.entity,
          on,
          unavailable,
          watts,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RW_PREFIX, RW_SUFFIX),
          icon:
            e.icon ??
            h.entities?.[e.entity]?.icon ??
            st.attributes.icon ??
            (on ? "mdi:power-socket-fr" : "mdi:power-plug-off-outline"),
        };
        item.state = unavailable
          ? this._t("unavailable")
          : `${this._t(on ? "on" : "off")}${on && watts != null ? ` · ${rcWatts(watts)}` : ""}`;
        return item;
      })
      .sort((a, b) => b.on - a.on || (b.watts ?? -1) - (a.watts ?? -1) || a.name.localeCompare(b.name));
  }

  _sigOf(i) {
    return [i.id, i.on, i.unavailable, i.watts == null ? null : Math.round(i.watts), i.name, i.icon];
  }

  _tileOf(i) {
    return this._tile(i, { state: rcEsc(i.state) });
  }

  // Total power of the plugs that are on, when at least one of them reports it.
  _statusExtra(lit) {
    if (!lit.some((i) => i.watts != null)) return "";
    return ` · ${rcWatts(lit.reduce((t, i) => t + (i.watts ?? 0), 0))}`;
  }

  static styles = `
    ha-card.lvl-on  { --c: var(--rc-plug); }
    ha-card.lvl-off { --c: var(--rc-idle); }
    .tile { --t: var(--rc-plug); }
    .tile.off { --t: var(--rc-idle); }
    .tile.off .ic { background: color-mix(in srgb, var(--t) 12%, transparent); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomSwitchCardEditor = rcEditor({
  card: RoomSwitchCard,
  helpers: ["title", "navigation_path", "only_on", "hide_when_off", "show_power", "all_off_button", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_on", "hide_when_off", "show_power", "all_off_button"),
    ...rcIncludeField(RoomSwitchCard, hass, config),
    ...rcExcludeField(RoomSwitchCard, hass, config),
    ...rcAdvanced(RW_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomSwitchCard,
  RoomSwitchCardEditor,
  "Room Switch Card",
  "Smart plugs of a room with their power draw: tap to toggle, hold for details",
);
