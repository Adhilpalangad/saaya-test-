/* ============ ALL SITE CONTENT LIVES HERE: edit this file to update the website ============ */
export const FEST = { name: 'SAAYA', year: 2026, date: '2026-10-23T09:00:00' }; // countdown target

// Home page: six event categories
export const EVENT_CARDS = [
  ['Performing Arts', 'Dance', '#5e1414'], ['Performing Arts', 'Music', '#1c1412'], ['Performing Arts', 'Theatre', '#7a1c1c'],
  ['Literary Arts', 'Literature', '#2a1a18'], ['Visual Arts', 'Fine Arts', '#6e1616'], ['Lifestyle', 'Fashion', '#3a1210'],
];

// Home page: "Main Events" spotlight  [name, description, colour, category]
export const MAIN = [
  ['Oppana', 'An amazing showcase of artistic talent.', '#7a1c1c', 'Performing Arts'],
  ['Duff Muttu', '', '#4a1a14', 'Folk Arts'], ['Group Dance', '', '#5e1414', 'Performing Arts'],
  ['Pencil Drawing', '', '#2e1612', 'Visual Arts'], ['Live Music', '', '#3a1210', 'Performing Arts'],
];

// Events page.  Each event: [name, day (0, 1 or 2 = date to be announced), time, venue (optional)]
export const DAYS = ['October 23, 2026', 'October 24, 2026', 'Date to be announced'];
const S = (n, t) => [n, 2, t, 'Seminar Hall'];
export const EV = {
  'On Stage': [
    ['Thiruvathirakali', 0, '09:00 AM - 10:00 AM'], ['Solo Dance Boys', 0, '10:00 AM - 10:30 AM'], ['Spot Dance', 0, '10:30 AM - 11:00 AM'],
    ['Mime', 0, '11:00 AM - 11:30 AM'], ['Video Choreography Boys', 0, '11:30 AM - 12:00 PM'], ['Solo Dance Girls', 0, '01:00 PM - 01:30 PM'],
    ['Kolkali', 0, '01:30 PM - 02:30 PM'], ['Synchronisation Dance Girls', 1, '09:30 AM - 10:00 AM'], ['Synchronisation Dance Boys', 1, '10:00 AM - 10:30 AM'],
    ['Vattapattu', 1, '10:30 AM - 11:15 AM'], ['Oppana', 1, '11:15 AM - 12:00 PM'], ['Video Choreography Girls', 1, '01:30 PM - 02:00 PM'],
    ['Duffmuttu', 1, '02:00 PM - 02:30 PM'], ['Karaoke', 1, '02:30 PM - 03:15 PM'],
  ],
  'Off Stage': [
    S('Story Writing English', '01:30 PM - 02:00 PM'), S('Story Writing Hindi', '02:00 PM - 02:30 PM'), S('Story Writing Malayalam', '02:30 PM - 03:00 PM'),
    S('Cartoon', '03:00 PM - 03:30 PM'), S('Pencil Drawing', '03:30 PM - 04:00 PM'), S('Poem Writing English', '09:30 AM - 10:00 AM'),
    S('Poem Writing Malayalam', '10:00 AM - 10:30 AM'), S('Poem Writing Hindi', '10:30 AM - 11:00 AM'), S('Essay Writing English', '11:00 AM - 11:30 AM'),
    S('Essay Writing Malayalam', '11:30 AM - 12:00 PM'), S('Essay Writing Hindi', '12:00 PM - 12:30 PM'), S('Spot Photography', '12:30 PM - 02:00 PM'),
    S('Debate', '03:00 PM - 04:00 PM'),
  ],
  'Pre Stage Event': [
    S('Elocution Malayalam', '02:00 PM - 02:30 PM'), S('Elocution English', '02:30 PM - 03:00 PM'), S('Classical Music', '09:30 AM - 10:00 AM'),
    S('Light Music', '10:00 AM - 10:30 AM'), S('Poem Recitation English', '10:30 AM - 11:00 AM'), S('Poem Recitation Malayalam', '10:30 AM - 11:00 AM'),
    S('Poem Recitation Hindi', '10:30 AM - 11:00 AM'), S('Mappila Pattu', '11:30 AM - 12:15 PM'), S('Group Song Western', '01:30 PM - 02:30 PM'),
    S('Nadan Pattu', '02:30 PM - 03:00 PM'), S('Rap English Malayalam', '03:00 PM - 03:30 PM'), S('Patriotic Song', '03:30 PM - 04:00 PM'),
    S('Instruments', '09:30 AM - 10:30 AM'), S('Mehandi', '10:30 AM - 11:30 AM'), S('Mono Act', '11:30 AM - 12:00 PM'), S('Mimicry', '11:30 AM - 12:00 PM'),
  ],
};
export const EVENT_COUNT = Object.values(EV).reduce((a, l) => a + l.length, 0);

// Squads (department -> squad) and Results / Hall of Fame
export const SQ = {
  Targaryen: { d: ['ME', 'AD', 'ECE'], c: '#e0453b', banner: '/images/Targaryen Three-Headed Dragon Banner.png' },
  Stark: { d: ['EEE', 'CE', 'MCA'], c: '#8fa8c4', banner: '/images/Stark Direwolf Winter Crest.png' },
  Lannister: { d: ['CSE'], c: '#e0b030' },
};
export const SQN = Object.keys(SQ);
export const MED = ['1st', '2nd', '3rd'];
const PT = [5, 3, 1];
const sqOf = (d) => SQN.find((q) => SQ[q].d.includes(d));

/* DUMMY winners are generated for every event. For real results, fill REAL like:
   REAL['Oppana'] = [['Winner name', 4, 'CSE'], ['2nd name', 2, 'ECE'], ['3rd name', 6, 'ME']]   (name, semester, department) */
const REAL = {};
let n = 0;
const RES = {};
Object.entries(EV).forEach(([type, list]) => list.forEach((e, ei) => {
  const h = ei + type.length;
  RES[e[0]] = [0, 1, 2].map((r) => {
    const q = SQN[(h + r * 2 + (r ? ei : 0)) % 3];
    const d = SQ[q].d[(h + r) % SQ[q].d.length];
    return ['Student ' + String(++n).padStart(2, '0'), [2, 4, 6, 8][(h * 3 + r * 5 + ei) % 4], d];
  });
}));
Object.assign(RES, REAL);
export const ROWS = [];
Object.entries(EV).forEach(([type, list]) => list.forEach((e) => {
  ROWS.push({ t: type, n: e[0], p: RES[e[0]].map((x) => ({ n: x[0], s: x[1], d: x[2], q: sqOf(x[2]) })) });
}));
export const POINTS = Object.fromEntries(SQN.map((q) => [q, 0]));
ROWS.forEach((r) => r.p.forEach((p, i) => { if (p.q) POINTS[p.q] += PT[i]; }));
// Home leaderboard, kept in step with the results
export const BOARD = SQN.slice().sort((a, b) => POINTS[b] - POINTS[a]).map((q) => [q, SQ[q].d.join(', '), POINTS[q]]);

// Gallery: add real photos with src '/images/gallery/photo1.jpg' (put files in /public/images/gallery)
const YR = [2025, 2024, 2023];
export const GAL = Array.from({ length: 18 }, (_, i) => ({ y: YR[i % 3], src: '', cap: `Saaya ${YR[i % 3]} \u00b7 Photo ${i + 1}` }));

// About page
export const ED = [
  {
    year: '2025',
    title: 'Saaya 2025',
    date: 'FEB 6-7, 2025',
    desc: 'The upcoming grand edition, promising to be bigger and better with new events and energy.',
    img: '/images/editions/saaya-2025.jpg',
  },
  {
    year: '2023',
    title: 'Saaya 2023',
    date: 'NOV 24-25, 2023',
    desc: 'A grand celebration of art and culture, featuring stunning performances and exhibitions.',
    img: '/images/editions/saaya-2023.jpg',
  },
  {
    year: '2022',
    title: 'Saaya 2022',
    date: 'NOV 31- DEC 13, 2022',
    desc: 'An immersive journey into creativity, with digital and traditional art showcases.',
    img: '/images/editions/saaya-2022-nov.jpg',
  },
  {
    year: '2022',
    title: 'Saaya 2022',
    date: 'MAY 20-22, 2022',
    desc: 'A virtual art fest that brought artists together despite the challenges of the pandemic.',
    img: '/images/editions/saaya-2022-may.jpg',
  },
  {
    year: '2019',
    title: 'Saaya 2019',
    date: 'NOV 29-30 , 2019',
    desc: 'A virtual art fest that brought artists together despite the challenges of the pandemic.',
    img: '/images/editions/saaya-2019.jpg',
  },
];
const CSE = 'Computer Science & Engineering', EEE = 'Electrical & Electronics Engineering', ME = 'Mechanical Engineering', CE = 'Civil Engineering';
export const TEAM = [
  ['Faculty Coordinators', [['Ms. Aparna K C', 'Electronics & Communication Engineering'], ['Mr. Nikhil K V', ME], ['Mr. Muhammed Musthafa M P', ME], ['Ms. Sudheela Mol M S', 'Applied Science'], ['Mr. Murali Krishnan K', EEE], ['Ms. Divya M', CSE], ['Ms. Anila S', CE]]],
  ['Student Coordinators', [['Athul Raj R', CSE], ['Sumayya Sherin', CE], ['Sooraj P M', CE], ['Vaishnav M', CSE], ['Aman Raza', CE], ['Anujith K', ME], ['Amrithjith K', ME], ['Nidhin', ME], ['Yahya Sulaim', CSE], ['Sooraj S', EEE], ['Nandu', EEE], ['Anshad', EEE]]],
  ['Tech Team', [['Nashu', CSE], ['Sabarish A V', CSE], ['Sreenandan K M', CSE], ['Shafah Muhammed', CSE], ['Natha Ameer', CSE]]],
  ['Media Team', [['Yahya Sulaim', CSE], ['Madhav M P', CSE]]],
];
