const concentrations = [
  [
    'Arts',
    [
      'Art, Film, and Visual Studies',
      'English (with a focus on Creative Writing offerings)',
      'Music',
      'Theater, Dance, and Media',
    ],
  ],
  [
    'Engineering',
    [
      'Biomedical Engineering',
      'Electrical Engineering',
      'Engineering Sciences',
      'Environmental Science and Engineering',
      'Mathematics',
      'Mechanical Engineering',
    ],
  ],
  [
    'History',
    [
      'Anthropology: Archaeology',
      'Classics',
      'Comparative Study of Religion',
      'East Asian Studies',
      'History',
      'History and Literature',
      'History and Science',
      'History of Art and Architecture',
      'Near Eastern Languages and Civilizations',
      'Philosophy',
      'South Asian Studies',
    ],
  ],
  [
    'Languages and Literatures',
    [
      'Classics',
      'Comparative Literature',
      'Comparative Study of Religion',
      'East Asian Studies',
      'English',
      'Folklore and Mythology',
      'Germanic Languages and Literatures',
      'History and Literature',
      'Linguistics',
      'Near Eastern Languages and Civilizations',
      'Philosophy',
      'Romance Languages and Literatures',
      'Slavic Languages and Literatures',
      'South Asian Studies',
    ],
  ],
  [
    'Life Sciences',
    [
      'Biomedical Engineering',
      'Chemical and Physical Biology',
      'Human Developmental and Regenerative Biology',
      'Human Evolutionary Biology',
      'Integrative Biology',
      'Molecular and Cellular Biology',
      'Neuroscience',
      'Psychology',
    ],
  ],
  [
    'Math and Computation',
    [
      'Applied Math',
      'Computer Science',
      'Mathematics',
      'Statistics',
    ],
  ],
  [
    'Physical Sciences',
    [
      'Astrophysics',
      'Chemistry',
      'Chemistry and Physics',
      'Earth and Planetary Sciences',
      'Environmental Science and Public Policy',
      'Mathematics',
      'Physics',
    ],
  ],
  [
    'Qualitative Social Sciences',
    [
      'African and African American Studies',
      'Anthropology: Social Anthropology',
      'Comparative Study of Religion',
      'Government',
      'History and Literature',
      'Linguistics',
      'Philosophy',
      'Social Studies',
      'Sociology',
      'Studies of Women, Gender, and Sexuality (WGS)',
    ],
  ],
  [
    'Quantitative Social Sciences',
    [
      'Applied Math',
      'Economics',
      'Environmental Science and Public Policy',
      'Government',
      'Psychology',
      'Sociology',
      'Statistics',
    ],
  ],
] as const;

export default concentrations;

export type Concentration = typeof concentrations[number][1][number];
