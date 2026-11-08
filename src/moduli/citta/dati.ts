import type { VoceContenuto } from "../../core/indice";
import { COORDINATE } from "./coordinate";
import type { CategoriaSito, Collegamento } from "./tipi";

interface Testo {
  readonly it: string;
  readonly en: string;
}

// Definizione di un luogo con i suoi testi nelle due lingue. Gli identificativi sono neutri (per posizione): i NOMI stanno
// solo qui, in un punto, quindi cambiare un nome non tocca nient'altro.
export interface DefinizioneSito {
  readonly id: string;
  readonly categoria: CategoriaSito;
  readonly contesto: string;
  readonly nome: Testo;
  readonly descrizione: Testo;
  readonly collegamenti: readonly Collegamento[];
  // Solo porte: etichetta dell'uscita, e area oltre la porta (aperta) oppure messaggio (chiusa).
  readonly uscita?: Testo;
  readonly areaId?: string;
  readonly chiusa?: Testo;
  readonly livelloMin?: number;
  // Solo edifici: il luogo da cui si entra (la distanza sta nei collegamenti di quel luogo) e l'etichetta dell'ingresso.
  readonly ospite?: string;
  readonly ingresso?: Testo;
  // Solo edifici: la lettera con cui si entra dal luogo ospite (l'iniziale del nome, o la seconda se è occupata).
  readonly tasto?: string;
  // Direzione sulla mappa (porte e mura) e presenza possibile degli NPC.
  readonly direzione?: string;
  readonly ospitaNpc?: boolean;
  // "Dove": il luogo con la preposizione ("alla Locanda", "in Banca"), per le frasi di arrivo. Se manca si ricava dalla categoria.
  readonly dove?: Testo;
}

// Nomi delle direzioni nelle due lingue: servono al testo della mappa ("Porta Santa Maria (nord)") e agli indizi della locanda.
export const TESTI_DIREZIONE: Readonly<Record<string, Testo>> = {
  n: { it: "nord", en: "north" },
  ne: { it: "nord-est", en: "north-east" },
  e: { it: "est", en: "east" },
  s: { it: "sud", en: "south" },
  so: { it: "sud-ovest", en: "south-west" },
  no: { it: "nord-ovest", en: "north-west" },
};

// La direzione di una porta o di un tratto di mura si ricava dall'identificativo ("porta-ne" -> "ne").
const direzioneDa = (id: string): string => id.slice(id.indexOf("-") + 1);

const MURA_DESCRIZIONE: Testo = {
  it: "La passeggiata alberata in cima alle mura: da qui si vede tutta la città.",
  en: "The tree-lined walk on top of the walls: you can see the whole city from here.",
};

const porta = (id: string, nome: Testo, descrizione: Testo, collegamenti: readonly Collegamento[], uscita: Testo, resto: { areaId?: string; chiusa?: Testo; livelloMin?: number }): DefinizioneSito => ({
  id,
  categoria: "porta",
  contesto: `citta:${id}`,
  nome,
  descrizione,
  collegamenti,
  uscita,
  direzione: direzioneDa(id),
  ospitaNpc: true,
  ...resto,
});

const mura = (id: string, quartiere: Testo, collegamenti: readonly Collegamento[]): DefinizioneSito => ({
  id,
  categoria: "mura",
  contesto: `citta:${id}`,
  nome: { it: `Le Mura - ${quartiere.it}`, en: `The Walls - ${quartiere.en}` },
  descrizione: MURA_DESCRIZIONE,
  collegamenti,
  direzione: direzioneDa(id),
  ospitaNpc: true,
});

// Le sei porte di Lucca nell'ordine reale lungo le mura (da nord, in senso orario), con i nomi originali.
export const DEFINIZIONI_SITI: readonly DefinizioneSito[] = [
  porta(
    "porta-n",
    { it: "Porta Santa Maria", en: "Santa Maria Gate" },
    { it: "La porta nord della città, sulla piazza omonima. Da qui parte Via Fillungo verso il cuore di Lucca.", en: "The city's north gate, opening onto its square. Via Fillungo starts here and leads to the heart of the city." },
    [{ verso: "piazza-n", distanza: 6 }, { verso: "mura-n", distanza: 2 }],
    { it: "Esci dalla Porta Santa Maria", en: "Leave through Santa Maria Gate" },
    { chiusa: { it: "Oltre la porta si stendono le colline di Monte Pisano. Strada ancora da esplorare.", en: "Beyond the gate lie the hills of Monte Pisano. Road still to be explored." } },
  ),
  porta(
    "porta-ne",
    { it: "Porta San Jacopo alla Tomba", en: "San Jacopo alla Tomba Gate" },
    { it: "La porta più recente delle mura, aperta per i collegamenti con la valle del Serchio.", en: "The newest gate in the walls, opened to connect with the Serchio valley." },
    [{ verso: "piazza-n", distanza: 7 }, { verso: "mura-ne", distanza: 2 }],
    { it: "Esci dalla Porta San Jacopo", en: "Leave through San Jacopo Gate" },
    { chiusa: { it: "Oltre la porta scorre il Serchio, verso la Garfagnana. Strada ancora da esplorare.", en: "Beyond the gate flows the Serchio, towards the Garfagnana. Road still to be explored." } },
  ),
  porta(
    "porta-e",
    { it: "Porta Elisa", en: "Elisa Gate" },
    { it: "Dedicata a Elisa Baciocchi, sorella di Napoleone, che governò Lucca. Si apre sulla strada verso Firenze.", en: "Named after Elisa Baciocchi, Napoleon's sister, who ruled Lucca. It opens onto the road to Florence." },
    [{ verso: "piazza-c", distanza: 8 }, { verso: "mura-e", distanza: 2 }],
    { it: "Esci dalla Porta Elisa", en: "Leave through Elisa Gate" },
    { chiusa: { it: "Oltre la porta parte la strada per Firenze. Strada ancora da esplorare.", en: "Beyond the gate starts the road to Florence. Road still to be explored." } },
  ),
  porta(
    "porta-s",
    { it: "Porta San Pietro", en: "San Pietro Gate" },
    { it: "La porta a sud, verso la stazione e la via Francigena: da qui arrivano i pellegrini. Fuori si stende la foresta.", en: "The south gate, towards the station and the Via Francigena: pilgrims arrive here. The forest lies outside." },
    [{ verso: "piazza-s", distanza: 6 }, { verso: "mura-s", distanza: 2 }, { verso: "locanda", distanza: 2 }, { verso: "foresta", distanza: 0 }],
    { it: "Esci nella foresta", en: "Go out into the forest" },
    { areaId: "foresta" },
  ),
  porta(
    "porta-so",
    { it: "Porta Sant'Anna", en: "Sant'Anna Gate" },
    { it: "Si apre su piazzale Verdi, in origine si chiamava Porta Vittorio Emanuele.", en: "It opens onto Piazzale Verdi, originally called Vittorio Emanuele Gate." },
    [{ verso: "piazza-s", distanza: 7 }, { verso: "mura-so", distanza: 2 }, { verso: "paludi", distanza: 0 }],
    { it: "Esci dalla Porta Sant'Anna", en: "Leave through Sant'Anna Gate" },
    {
      areaId: "paludi",
      livelloMin: 4,
      chiusa: { it: "Oltre la porta si aprono le paludi del lago di Massaciuccoli e, nella nebbia, si indovinano croci e lapidi. È un luogo per chi ha già battuto il primo capogilda (livello 4): per ora la strada è chiusa.", en: "Beyond the gate spread the marshes of Lake Massaciuccoli and, in the mist, crosses and gravestones can be made out. It is a place for those who have beaten the first guildmaster (level 4): for now the road is closed." },
    },
  ),
  porta(
    "porta-no",
    { it: "Porta San Donato", en: "San Donato Gate" },
    { it: "La porta a nord-ovest, con la sua piazza.", en: "The north-west gate, with its square." },
    [{ verso: "piazza-c", distanza: 8 }, { verso: "mura-no", distanza: 2 }],
    { it: "Esci dalla Porta San Donato", en: "Leave through San Donato Gate" },
    { chiusa: { it: "Oltre la porta, verso il mare, si estendono campi e pinete. Strada ancora da esplorare.", en: "Beyond the gate, towards the sea, stretch fields and pine woods. Road still to be explored." } },
  ),
  // Le mura sono un anello: da ogni tratto si va solo verso il tratto vicino (7-7-9-6-5-8 movimenti da nord in senso orario).
  mura("mura-n", { it: "Santa Maria", en: "Santa Maria" }, [{ verso: "mura-ne", distanza: 7 }]),
  mura("mura-ne", { it: "San Jacopo", en: "San Jacopo" }, [{ verso: "mura-e", distanza: 7 }]),
  mura("mura-e", { it: "Elisa", en: "Elisa" }, [{ verso: "mura-s", distanza: 9 }]),
  mura("mura-s", { it: "San Pietro", en: "San Pietro" }, [{ verso: "mura-so", distanza: 6 }]),
  mura("mura-so", { it: "Sant'Anna", en: "Sant'Anna" }, [{ verso: "mura-no", distanza: 5 }]),
  mura("mura-no", { it: "San Donato", en: "San Donato" }, [{ verso: "mura-n", distanza: 8 }]),
  {
    id: "piazza-n",
    categoria: "piazza",
    ospitaNpc: true,
    contesto: "citta:piazza-n",
    nome: { it: "Piazza dell'Anfiteatro", en: "Amphitheatre Square" },
    descrizione: { it: "Una piazza ovale che segue la forma dell'antico anfiteatro romano, chiusa da case antiche e botteghe.", en: "An oval square that follows the shape of the old Roman amphitheatre, ringed by old houses and shops." },
    collegamenti: [{ verso: "piazza-c", distanza: 3 }, { verso: "sartoria", distanza: 2 }, { verso: "armeria", distanza: 3 }, { verso: "gilda-cavaliere", distanza: 2 }, { verso: "torre", distanza: 3 }],
  },
  {
    id: "piazza-c",
    categoria: "piazza",
    ospitaNpc: true,
    contesto: "citta:piazza-c",
    nome: { it: "Piazza San Michele", en: "San Michele Square" },
    descrizione: { it: "Il cuore della città: l'antico foro romano, con la chiesa di San Michele in Foro.", en: "The heart of the city: the old Roman forum, with the church of San Michele in Foro." },
    collegamenti: [{ verso: "piazza-s", distanza: 4 }, { verso: "banca", distanza: 2 }, { verso: "gilda-mistico", distanza: 2 }],
  },
  {
    id: "piazza-s",
    categoria: "piazza",
    ospitaNpc: true,
    contesto: "citta:piazza-s",
    nome: { it: "Piazza Napoleone", en: "Napoleon Square" },
    descrizione: { it: "Una grande piazza aperta voluta da Elisa Baciocchi, vicino alla cattedrale.", en: "A large open square created by Elisa Baciocchi, near the cathedral." },
    collegamenti: [{ verso: "guaritore", distanza: 2 }, { verso: "speziale", distanza: 2 }, { verso: "gilda-ladro", distanza: 2 }],
  },
  {
    id: "fillungo",
    dove: { it: "in Via Fillungo", en: "in Via Fillungo" },
    categoria: "piazza",
    contesto: "citta:fillungo",
    nome: { it: "Via Fillungo", en: "Via Fillungo" },
    descrizione: { it: "La via più lunga e animata della città: case alte e strette, botteghe una accanto all'altra e, più in là, la Torre delle Ore. Tra San Michele e l'Anfiteatro.", en: "The longest and busiest street in town: tall narrow houses, shops side by side and, further on, the Clock Tower. Between San Michele and the Amphitheatre." },
    collegamenti: [{ verso: "piazza-c", distanza: 2 }, { verso: "piazza-n", distanza: 2 }, { verso: "torre", distanza: 2 }, { verso: "stamperia", distanza: 2 }],
  },
  {
    id: "torre",
    dove: { it: "alla Torre Guinigi", en: "at the Guinigi Tower" },
    categoria: "piazza",
    contesto: "citta:torre",
    nome: { it: "Torre Guinigi", en: "Guinigi Tower" },
    descrizione: { it: "Una torre medievale con delle querce in cima: il simbolo della città. Un portoncino conduce ai gradini; ai suoi piedi c'è un uomo in mantello scuro.", en: "A medieval tower with oak trees on top: the symbol of the city. A small door leads to the steps; at its foot stands a man in a dark cloak." },
    collegamenti: [],
  },
  { id: "armeria", tasto: "A", dove: { it: "all'Armeria", en: "at the Armory" }, categoria: "edificio", ospite: "piazza-n", ingresso: { it: "Entra nell'Armeria", en: "Enter the Armory" }, contesto: "luogo:armeria", nome: { it: "Armeria", en: "Armory" }, descrizione: { it: "Il fabbro vende armi di ogni foggia.", en: "The smith sells weapons of every kind." }, collegamenti: [] },
  { id: "sartoria", tasto: "S", dove: { it: "alla Sartoria", en: "at the Tailor" }, categoria: "edificio", ospite: "piazza-n", ingresso: { it: "Entra nella Sartoria", en: "Enter the Tailor" }, contesto: "luogo:sartoria", nome: { it: "Sartoria", en: "Tailor" }, descrizione: { it: "La sarta cuce armature e vesti su misura.", en: "The tailor sews armour and clothes to measure." }, collegamenti: [] },
  { id: "banca", tasto: "B", dove: { it: "in Banca", en: "at the Bank" }, categoria: "edificio", ospite: "piazza-c", ingresso: { it: "Entra in Banca", en: "Enter the Bank" }, contesto: "luogo:banca", nome: { it: "Banca", en: "Bank" }, descrizione: { it: "Qui l'oro è al sicuro, anche dalla morte.", en: "Here your gold is safe, even from death." }, collegamenti: [] },
  { id: "guaritore", tasto: "U", dove: { it: "dal Guaritore", en: "at the Healer" }, categoria: "edificio", ospite: "piazza-s", ingresso: { it: "Vai dal Guaritore", en: "Visit the Healer" }, contesto: "luogo:guaritore", nome: { it: "Guaritore", en: "Healer" }, descrizione: { it: "Unguenti e infusi per curare ogni ferita.", en: "Salves and infusions to heal any wound." }, collegamenti: [] },
  { id: "speziale", tasto: "S", dove: { it: "dallo Speziale", en: "at the Apothecary" }, categoria: "edificio", ospite: "piazza-s", ingresso: { it: "Vai dallo Speziale", en: "Visit the Apothecary" }, contesto: "luogo:speziale", nome: { it: "Speziale", en: "Apothecary" }, descrizione: { it: "Boccette di ogni colore su scaffali fino al soffitto: pozioni, ma lo speziale ne ha poche al giorno.", en: "Bottles of every color on shelves up to the ceiling: potions, but the apothecary has few each day." }, collegamenti: [] },
  { id: "stamperia", tasto: "S", dove: { it: "alla Stamperia", en: "at the Print Shop" }, categoria: "edificio", ospite: "fillungo", ingresso: { it: "Entra nella Stamperia", en: "Enter the Print Shop" }, contesto: "luogo:stamperia", nome: { it: "Stamperia", en: "Print Shop" }, descrizione: { it: "Un torchio, fogli appesi ad asciugare e odore d'inchiostro: qui escono le Cronache della città.", en: "A press, sheets hung out to dry and the smell of ink: this is where the city's Chronicles come out." }, collegamenti: [] },
  { id: "locanda", tasto: "L", dove: { it: "alla Locanda", en: "at the Inn" }, categoria: "edificio", ospite: "porta-s", ingresso: { it: "Entra nella Locanda", en: "Enter the Inn" }, contesto: "luogo:locanda", nome: { it: "Locanda", en: "Inn" }, descrizione: { it: "Un fuoco acceso, un letto e un pasto caldo per i viaggiatori.", en: "A warm fire, a bed and a hot meal for travellers." }, collegamenti: [] },
  // Le gilde di classe (0.8.0): una per piazza. Ci si sale di livello solo nella propria; la logica sta nel modulo "gilde".
  { id: "gilda-cavaliere", tasto: "G", dove: { it: "alla Gilda dei Cavalieri", en: "at the Knights' Guild" }, categoria: "edificio", ospite: "piazza-n", ingresso: { it: "Entra nella Gilda dei Cavalieri", en: "Enter the Knights' Guild" }, contesto: "luogo:gilda-cavaliere", nome: { it: "Gilda dei Cavalieri", en: "Knights' Guild" }, descrizione: { it: "Stendardi, rastrelliere di spade e un manichino consumato dai colpi: qui si allenano i cavalieri di Lucca.", en: "Banners, sword racks and a dummy worn down by blows: the knights of Lucca train here." }, collegamenti: [] },
  { id: "gilda-mistico", tasto: "G", dove: { it: "alla Gilda dei Mistici", en: "at the Mystics' Guild" }, categoria: "edificio", ospite: "piazza-c", ingresso: { it: "Entra nella Gilda dei Mistici", en: "Enter the Mystics' Guild" }, contesto: "luogo:gilda-mistico", nome: { it: "Gilda dei Mistici", en: "Mystics' Guild" }, descrizione: { it: "Librerie fino al soffitto, una rosa dei venti stellata e una sfera di cristallo che non smette mai di brillare.", en: "Bookshelves to the ceiling, a starry compass rose and a crystal ball that never stops glowing." }, collegamenti: [] },
  { id: "gilda-ladro", tasto: "G", dove: { it: "alla Gilda dei Ladri", en: "at the Thieves' Guild" }, categoria: "edificio", ospite: "piazza-s", ingresso: { it: "Entra nella Gilda dei Ladri", en: "Enter the Thieves' Guild" }, contesto: "luogo:gilda-ladro", nome: { it: "Gilda dei Ladri", en: "Thieves' Guild" }, descrizione: { it: "Mantelli appesi, grimaldelli in fila e una lanterna che fa poca luce: nessuno vi dirà che esiste.", en: "Hanging cloaks, lockpicks in a row and a lantern that gives little light: nobody will admit this place exists." }, collegamenti: [] },
  // L'area fuori dalla Porta San Pietro: la foresta (la sua schermata sta nel modulo foresta).
  { id: "paludi", categoria: "area", contesto: "luogo:paludi", nome: { it: "Le Paludi", en: "The Marshes" }, dove: { it: "nelle paludi", en: "in the marshes" }, descrizione: { it: "Paludi e nebbia fuori dalle mura. Tra le canne affiorano croci e lapidi: un antico cimitero inghiottito dall'acqua.", en: "Marshes and mist outside the walls. Crosses and gravestones surface among the reeds: an ancient cemetery swallowed by the water." }, collegamenti: [] },
  { id: "foresta", categoria: "area", contesto: "luogo:foresta", nome: { it: "La Foresta", en: "The Forest" }, descrizione: { it: "Una foresta fitta fuori dalle mura.", en: "A dense forest outside the walls." }, collegamenti: [] },
];

export const chiaveNome = (id: string): string => `citta.sito.${id}`;
export const chiaveDescrizione = (id: string): string => `citta.sito.${id}.descrizione`;
export const chiaveUscita = (id: string): string => `citta.sito.${id}.uscita`;
export const chiaveChiusa = (id: string): string => `citta.sito.${id}.chiusa`;
export const chiaveIngresso = (id: string): string => `citta.sito.${id}.ingresso`;
// "Dove" con la preposizione ("Arrivi alla Locanda"), l'etichetta di uscita da un edificio e l'elenco degli edifici di un luogo.
export const chiaveDove = (id: string): string => `citta.sito.${id}.dove`;
export const chiaveEsci = (id: string): string => `citta.sito.${id}.esci`;
export const chiaveContiene = (id: string): string => `citta.sito.${id}.contiene`;

// "Dove" ricavato dalla categoria: "a Porta San Pietro", "sulle Mura - San Pietro", "in Piazza San Michele".
function doveDaCategoria(d: DefinizioneSito): Testo {
  if (d.categoria === "porta") return { it: `a ${d.nome.it}`, en: `at ${d.nome.en}` };
  if (d.categoria === "mura") return { it: `sulle ${d.nome.it.replace(/^Le /, "")}`, en: `on ${d.nome.en}` };
  return { it: `in ${d.nome.it}`, en: `in ${d.nome.en}` };
}
// Nome con la direzione, per la mappa: "Porta Santa Maria (nord)". Senza direzione vale il nome.
export const chiaveMappa = (id: string): string => `citta.sito.${id}.mappa`;
export const chiaveDirezione = (direzione: string): string => `citta.direzione.${direzione}`;

// I contenuti "sito" generati dalle definizioni.
export const SITI: readonly VoceContenuto[] = DEFINIZIONI_SITI.map((d) => {
  const mappa = COORDINATE[d.id];
  return {
    tipo: "sito",
    id: d.id,
    dati: {
      nomeChiave: chiaveNome(d.id),
      descrizioneChiave: chiaveDescrizione(d.id),
      categoria: d.categoria,
      contesto: d.contesto,
      collegamenti: d.collegamenti,
      ...(mappa ? { mappa } : {}),
      ...(d.uscita ? { uscitaChiave: chiaveUscita(d.id) } : {}),
      ...(d.areaId ? { areaId: d.areaId } : {}),
      ...(d.chiusa ? { chiusaChiave: chiaveChiusa(d.id) } : {}),
      ...(d.livelloMin !== undefined ? { livelloMin: d.livelloMin } : {}),
      ...(d.ospite ? { ospite: d.ospite } : {}),
      ...(d.tasto ? { tasto: d.tasto } : {}),
      ...(d.ingresso ? { ingressoChiave: chiaveIngresso(d.id) } : {}),
      ...(d.direzione ? { direzione: d.direzione } : {}),
      ...(d.ospitaNpc ? { ospitaNpc: true } : {}),
    },
  };
});

// Testi dei luoghi nelle due lingue.
export function testiSiti(): { readonly it: Record<string, string>; readonly en: Record<string, string> } {
  const it: Record<string, string> = {};
  const en: Record<string, string> = {};
  for (const d of DEFINIZIONI_SITI) {
    const aggiungi = (chiave: string, t: Testo): void => {
      it[chiave] = t.it;
      en[chiave] = t.en;
    };
    aggiungi(chiaveNome(d.id), d.nome);
    aggiungi(chiaveDescrizione(d.id), d.descrizione);
    if (d.uscita) aggiungi(chiaveUscita(d.id), d.uscita);
    if (d.chiusa) aggiungi(chiaveChiusa(d.id), d.chiusa);
    if (d.ingresso) aggiungi(chiaveIngresso(d.id), d.ingresso);
    const dir = d.direzione ? TESTI_DIREZIONE[d.direzione] : undefined;
    aggiungi(chiaveMappa(d.id), dir ? { it: `${d.nome.it} (${dir.it})`, en: `${d.nome.en} (${dir.en})` } : d.nome);
    aggiungi(chiaveDove(d.id), d.dove ?? doveDaCategoria(d));
    const ospite = d.ospite ? DEFINIZIONI_SITI.find((o) => o.id === d.ospite) : undefined;
    if (d.ospite) aggiungi(chiaveEsci(d.id), ospite?.categoria === "porta" ? { it: "Esci alla porta", en: "Go out to the gate" } : { it: "Esci in piazza", en: "Go out to the square" });
    const dentro = DEFINIZIONI_SITI.filter((e) => e.ospite === d.id);
    if (dentro.length > 0) aggiungi(chiaveContiene(d.id), { it: dentro.map((e) => e.nome.it).join(", "), en: dentro.map((e) => e.nome.en).join(", ") });
  }
  for (const [direzione, t] of Object.entries(TESTI_DIREZIONE)) {
    it[chiaveDirezione(direzione)] = t.it;
    en[chiaveDirezione(direzione)] = t.en;
  }
  return { it, en };
}
