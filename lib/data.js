/* ============ ALL SITE CONTENT LIVES HERE: edit this file to update the website ============ */
export const FEST = { name: 'SAAYA', year: 2026, date: '2026-10-23T09:00:00' }; // countdown target

// Home page: six event categories
export const EVENT_CARDS = [
  ['Performing Arts', 'Dance', '#5e1414', '/images/Crimson Dance Beneath Golden Arches.png'],
  ['Performing Arts', 'Music', '#1c1412', '/images/Crimson Ribbons Around a Grand Piano.png'],
  ['Performing Arts', 'Theatre', '#7a1c1c', '/images/Golden Masks and Crimson Curtain.png'],
  ['Literary Arts', 'Literature', '#2a1a18', '/images/Enchanted Library with Flying Pages.png'],
  ['Visual Arts', 'Fine Arts', '#6e1616', '/images/baroque-artists-studio.png'],
  ['Lifestyle', 'Fashion', '#3a1210', '/images/Opulent Ruby Couture Atelier.png'],
];

// Home page: "Main Events" spotlight  [name, description, colour, category, image (optional)]
export const MAIN = [
  ['Oppana', 'An amazing showcase of artistic talent.', '#7a1c1c', 'Performing Arts', '/images/Oppana-25102019110845.jpg'],
  ['Duff Muttu', 'Traditional rhythmic percussion and coordinated folk performance.', '#4a1a14', 'Folk Arts', '/images/Duffmuttu _ Kerala Arts.jpg'],
  ['Group Dance', 'Synchronized choreography, electrifying beats, and team stage drama.', '#5e1414', 'Performing Arts', '/images/group-dance.jpg'],
  ['Pencil Drawing', 'Expressive sketches, live shading, and fine pencil artistry competition.', '#2e1612', 'Visual Arts', '/images/pencil-drawing.jpg'],
  ['Live Music', 'Electrifying live band performances, soulful vocals, and acoustic rhythms.', '#3a1210', 'Performing Arts', '/images/live-music.jpg'],
];

// Events page.  Each event: [name, day (0-4), time, venue (optional)]
export const DAYS = [
  'October 23, 2026',
  'October 24, 2026',
  'October 13, 2026 (Day 1)',
  'October 14, 2026 (Day 2)',
  'October 15, 2026 (Day 3)',
];
export const EV = {
  'On Stage': [
    ['Thiruvathirakali', 0, '09:00 AM - 10:00 AM'], ['Solo Dance Boys', 0, '10:00 AM - 10:30 AM'], ['Spot Dance', 0, '10:30 AM - 11:00 AM'],
    ['Mime', 0, '11:00 AM - 11:30 AM'], ['Video Choreography Boys', 0, '11:30 AM - 12:00 PM'], ['Solo Dance Girls', 0, '01:00 PM - 01:30 PM'],
    ['Kolkali', 0, '01:30 PM - 02:30 PM'], ['Synchronisation Dance Girls', 1, '09:30 AM - 10:00 AM'], ['Synchronisation Dance Boys', 1, '10:00 AM - 10:30 AM'],
    ['Vattapattu', 1, '10:30 AM - 11:15 AM'], ['Oppana', 1, '11:15 AM - 12:00 PM'], ['Video Choreography Girls', 1, '01:30 PM - 02:00 PM'],
    ['Duffmuttu', 1, '02:00 PM - 02:30 PM'], ['Karaoke', 1, '02:30 PM - 03:15 PM'],
  ],
  'Off Stage': [
    // Day 1 - 13/10/26
    ['Spot Photography', 2, '12:00 PM - 12:30 PM', 'Seminar Hall'],
    ['Poem Writing English', 2, '01:30 PM - 02:00 PM', 'Seminar Hall'],
    ['Poem Writing Malayalam', 2, '02:00 PM - 02:30 PM', 'Seminar Hall'],
    ['Poem Writing Hindi', 2, '02:30 PM - 03:00 PM', 'Seminar Hall'],
    ['Pencil Drawing', 2, '03:00 PM - 03:30 PM', 'Seminar Hall'],

    // Day 2 - 14/10/26
    ['Story Writing English', 3, '09:30 AM - 10:00 AM', 'Seminar Hall'],
    ['Story Writing Malayalam', 3, '10:00 AM - 10:30 AM', 'Seminar Hall'],
    ['Story Writing Hindi', 3, '10:30 AM - 11:00 AM', 'Seminar Hall'],
    ['Cartoon Drawing', 3, '11:00 AM - 11:30 AM', 'Seminar Hall'],
    ['Mehandi', 3, '01:30 PM - 02:45 PM', 'Seminar Hall'],
    ['Nail Art', 3, '03:30 PM - 04:00 PM', 'Seminar Hall'],
  ],
  'Pre Stage': [
    // Day 1 - 13/10/26
    ['Instruments', 2, '09:30 AM - 10:30 AM', 'Seminar Hall'],
    ['Mimicry', 2, '10:30 AM - 11:30 AM', 'Seminar Hall'],
    ['Mono Act', 2, '10:30 AM - 11:30 AM', 'Seminar Hall'],
    ['Light Music', 2, '11:30 AM - 12:00 PM', 'Seminar Hall'],
    ['Rap (English, Malayalam)', 2, '03:30 PM - 04:00 PM', 'Seminar Hall'],

    // Day 2 - 14/10/26
    ['Mappila Pattu Boys', 3, '11:30 AM - 12:30 PM', 'Seminar Hall'],
    ['Mappila Pattu Girls', 3, '12:30 PM - 01:30 PM', 'Seminar Hall'],
    ['Patriotic Song', 3, '02:45 PM - 03:30 PM', 'Seminar Hall'],

    // Day 3 - 15/10/26
    ['Poem Recitation English', 4, '09:30 AM - 10:00 AM', 'Seminar Hall'],
    ['Poem Recitation Malayalam', 4, '10:00 AM - 10:30 AM', 'Seminar Hall'],
    ['Poem Recitation Hindi', 4, '10:30 AM - 11:00 AM', 'Seminar Hall'],
    ['Classical Music', 4, '11:00 AM - 11:30 AM', 'Seminar Hall'],
    ['Nadan Pattu', 4, '11:30 AM - 12:30 PM', 'Seminar Hall'],
    ['Elocution English', 4, '01:30 PM - 02:15 PM', 'Seminar Hall'],
    ['Elocution Malayalam', 4, '02:15 PM - 03:00 PM', 'Seminar Hall'],
    ['Group Song Western', 4, '03:00 PM - 04:00 PM', 'Seminar Hall'],
  ],
};
export const EVENT_COUNT = Object.values(EV).reduce((a, l) => a + l.length, 0);

// Squads (department -> squad) and Results / Hall of Fame
export const SQ = {
  Targaryen: { d: ['ME', 'AD', 'ECE'], c: '#e0453b', banner: '/images/Targaryen Three-Headed Dragon Banner.png' },
  Stark: { d: ['EEE', 'CE', 'MCA'], c: '#8fa8c4', banner: '/images/Stark Direwolf Winter Crest.png' },
  Lannister: { d: ['CSE'], c: '#e0b030', banner: '/images/Lannister Lion Heraldic Banner.png' },
};
export const SQN = Object.keys(SQ);
export const MED = ['1st', '2nd', '3rd'];
// Published winners and gallery photos are loaded from Supabase.

// About page
export const ED = [
  {
    year: '2026',
    title: 'Saaya 2026',
    date: 'FEB 5-6, 2026',
    desc: 'The current grand edition of AWH Engineering College Arts Fest, celebrating passion, creativity, and artistic excellence.',
    img: '/images/editions/saaya-2026.jpg',
  },
  {
    year: '2025',
    title: 'Saaya 2025',
    date: 'FEB 6-7, 2025',
    desc: 'The previous grand edition, promising to be bigger and better with new events and energy.',
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
  ['Faculty Coordinators', [
    ['Rohith', '', '/coordinates/Rohith sir.jpg'],
    ['Divya M', '', '/coordinates/Divya M.jpeg'],
    ['Sudheela Mol M S', '', '/coordinates/SUDHEELAMOL MS.jpg'],
    ['Ameena', '', '/coordinates/Ameena photo.PNG']
  ]],
  ['Student Coordinators', [
    ['Shadin', '', '/coordinates/Shadin.jpeg'],
    ['Neharin', '', '/coordinates/neharin.jpg'],
    ['Finsha', '', '/coordinates/FIn.png'],
    ['Siraj', '', '/coordinates/Siraj.JPG'],
    ['Ramzi', '', '/coordinates/Ramzi.jpg'],
    ['Akshay RT', ''],
    ['Nahla M', '', '/coordinates/Nahla.jpeg'],
    ['Hiba', '', '/coordinates/IMG_4585.jpg'],
    ['Mufaz', '', '/coordinates/IMG_1787.jpg'],
    ['Sandra', '', '/coordinates/Sandra.jpg'],
    ['Sherin', '', '/coordinates/sherin.jpg'],
    ['Paapi', '', '/coordinates/paapi.jpeg'],
    ['Abdu', '', '/coordinates/IMG_4765.jpg'],
    ['Aleesha', '', '/coordinates/Aleesha K K.jpg'],
    ['Abhiraj', '', '/coordinates/Abhiraj (1).jpg'],
    ['Hridhya', '', '/coordinates/Image to PDF 20261012 10.28.58_page-0001.jpg'],
  ]],
  ['Tech Team', [
    ['Aman Hussain', '', '/coordinates/Aman.jpg'],
    ['Adhil', '', '/coordinates/WhatsApp Image 2026-10-12 at 12.27.56 PM.jpeg'],
    ['Abhiraj', '', '/coordinates/Abhiraj (1).jpg'],
    ['Misriya kp', '', '/coordinates/IMG_2052.WEBP'],
  ]],
  ['Media Team', [
    ['Nabeel kk', '', '/coordinates/Nabeel.jpg'],
    ['Sabri', ''],
    ['Anand', '', '/coordinates/anand.jpg'],
    ['Mishab (S5)', ''],
    ['Jamnas', '', '/coordinates/jamnas.jpg'],
  ]],
];

