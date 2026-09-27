// The ten rulers in reign order. Hooks follow the corrected history in
// research_original_kings_review.md, not the claims in the current chapters.

export const TITLE = 'Blood and Thrones';
export const SUBTITLE = 'A history in ten lives';

export type King = {
  id: string;
  name: string;
  realm: string;
  reign: string;
  year: number;
  place: string;
  hook: string;
};

export const kings: King[] = [
  {
    id: 'vidyadhara', name: 'Vidyadhara', realm: 'Chandela · Jejakabhukti', reign: 'c. 1003–1035', year: 1003, place: 'kalinjar',
    hook: 'Had the king of Kannauj killed for running from Mahmud of Ghazni. Then bought his own peace with three hundred elephants and a poem.',
  },
  {
    id: 'bhoja', name: 'Bhoja', realm: 'Paramara · Malwa', reign: 'c. 1010–1055', year: 1010, place: 'dhara',
    hook: 'A king credited with books on poetry, temples and machines. He lost his last war, and won his name.',
  },
  {
    id: 'simhana', name: 'Simhana II', realm: 'Yadava · Devagiri', reign: 'c. 1210–1246', year: 1210, place: 'devagiri',
    hook: 'Made Devagiri the prize of the Deccan. Fifty years after his death, its gold bought a sultan his throne.',
  },
  {
    id: 'jatavarman', name: 'Jatavarman Sundara Pandyan', realm: 'Pandya · Madurai', reign: '1251–1268', year: 1251, place: 'madurai',
    hook: 'Took tribute from Lanka, killed a Hoysala king, and had himself weighed against gold at Srirangam.',
  },
  {
    id: 'balban', name: 'Ghiyas ud din Balban', realm: 'Delhi Sultanate', reign: '1266–1287', year: 1266, place: 'delhi',
    hook: 'A slave who became sultan and made the lords of Delhi kiss his feet. In public, he never laughed.',
  },
  {
    id: 'alauddin', name: 'Alauddin Khilji', realm: 'Delhi Sultanate', reign: '1296–1316', year: 1296, place: 'delhi',
    hook: 'Fixed the price of grain to pay the army that beat the Mongols. Then massacred the Mongols who had fought for him.',
  },
  {
    id: 'bukka', name: 'Bukka Raya I', realm: 'Vijayanagara', reign: '1356–1377', year: 1356, place: 'vijayanagara',
    hook: 'A founder of Vijayanagara who styled himself “Sultan among Hindu kings”.',
  },
  {
    id: 'kapilendra', name: 'Kapilendra Deva', realm: 'Gajapati · Odisha', reign: 'c. 1434–1467', year: 1434, place: 'cuttack',
    hook: 'Seized a throne and carried it from the Ganga to the Kaveri. His sons tore it apart.',
  },
  {
    id: 'lachit', name: 'Lachit Borphukan', realm: 'Ahom · Assam', reign: 'Saraighat, 1671', year: 1671, place: 'saraighat',
    hook: 'Gravely ill, he had himself carried onto a boat and turned back the Mughal fleet.',
  },
  {
    id: 'marthanda', name: 'Marthanda Varma', realm: 'Travancore', reign: '1729–1758', year: 1729, place: 'padmanabhapuram',
    hook: 'Beat the Dutch, made their captured officer his general, then gave his kingdom to a god.',
  },
];

export type MapEvent =
  | {kind: 'king'; year: number; king: number; caption: string}
  | {kind: 'arc'; year: number; from: string; to: string; bend: number; caption: string};

export const events: MapEvent[] = [
  {kind: 'king', year: 1003, king: 0, caption: 'Vidyadhara rules the Chandela kingdom'},
  {kind: 'king', year: 1010, king: 1, caption: 'Bhoja rules Malwa from Dhara'},
  {kind: 'arc', year: 1019, from: 'ghazni', to: 'kalinjar', bend: 0.15, caption: 'Mahmud of Ghazni marches on the Chandelas'},
  {kind: 'king', year: 1210, king: 2, caption: 'Simhana II rules from Devagiri'},
  {kind: 'king', year: 1251, king: 3, caption: 'Jatavarman Sundara Pandyan rules Madurai'},
  {kind: 'king', year: 1266, king: 4, caption: 'Balban becomes sultan of Delhi'},
  {kind: 'arc', year: 1296, from: 'kara', to: 'devagiri', bend: -0.18, caption: 'From Kara, Alauddin raids Devagiri'},
  {kind: 'king', year: 1296, king: 5, caption: 'Its gold buys him the throne of Delhi'},
  {kind: 'arc', year: 1311, from: 'delhi', to: 'madurai', bend: -0.2, caption: 'Malik Kafur reaches Madurai'},
  {kind: 'arc', year: 1327, from: 'devagiri', to: 'kampili', bend: 0.2, caption: 'A Tughluq army sacks Kampili'},
  {kind: 'king', year: 1356, king: 6, caption: 'Bukka Raya I rules Vijayanagara'},
  {kind: 'king', year: 1434, king: 7, caption: 'Kapilendra seizes the throne of Odisha'},
  {kind: 'king', year: 1671, king: 8, caption: 'Lachit Borphukan meets the Mughal fleet at Saraighat'},
  {kind: 'king', year: 1729, king: 9, caption: 'Marthanda Varma takes the throne of Travancore'},
  {kind: 'arc', year: 1741, from: 'colombo', to: 'padmanabhapuram', bend: -0.35, caption: 'A Dutch force from Ceylon is beaten at Colachel'},
];

export const ORIGINS = new Set(['ghazni', 'colombo', 'kara']);

// Place labels on the map: offset and anchor.
export const labels: Record<string, {text: string; dx: number; dy: number; anchor: 'start' | 'end'}> = {
  kalinjar: {text: 'Kalinjar', dx: 16, dy: 6, anchor: 'start'},
  dhara: {text: 'Dhara', dx: -16, dy: 6, anchor: 'end'},
  devagiri: {text: 'Devagiri', dx: -16, dy: 6, anchor: 'end'},
  madurai: {text: 'Madurai', dx: 16, dy: 6, anchor: 'start'},
  delhi: {text: 'Delhi', dx: 16, dy: -6, anchor: 'start'},
  vijayanagara: {text: 'Vijayanagara', dx: -16, dy: 6, anchor: 'end'},
  cuttack: {text: 'Cuttack', dx: 16, dy: 6, anchor: 'start'},
  saraighat: {text: 'Saraighat', dx: 16, dy: 6, anchor: 'start'},
  padmanabhapuram: {text: 'Padmanabhapuram', dx: -16, dy: 6, anchor: 'end'},
  ghazni: {text: 'Ghazni', dx: 16, dy: 6, anchor: 'start'},
  colombo: {text: 'Colombo', dx: 16, dy: 6, anchor: 'start'},
  kara: {text: 'Kara', dx: 14, dy: -12, anchor: 'start'},
};
