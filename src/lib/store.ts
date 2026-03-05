import { Competition, Participant, Catch } from './types';

const STORAGE_KEY = 'hengelsport-competitions';

const sampleData: Competition[] = [
  {
    id: '1',
    name: 'Voorjaarswedstrijd Amstel',
    date: '2026-03-15',
    location: 'Amstel, Amsterdam',
    status: 'upcoming',
    participants: [
      { id: 'p1', name: 'Jan de Vries', catches: [] },
      { id: 'p2', name: 'Piet Jansen', catches: [] },
      { id: 'p3', name: 'Klaas Bakker', catches: [] },
    ],
  },
  {
    id: '2',
    name: 'Clubkampioenschap 2026',
    date: '2026-02-20',
    location: 'Vinkeveense Plassen',
    status: 'completed',
    participants: [
      {
        id: 'p4', name: 'Willem Smit', catches: [
          { id: 'c1', species: 'Karper', weight: 4200, time: '09:30' },
          { id: 'c2', species: 'Brasem', weight: 1800, time: '11:15' },
        ]
      },
      {
        id: 'p5', name: 'Henk Mulder', catches: [
          { id: 'c3', species: 'Snoek', weight: 5100, time: '10:00' },
        ]
      },
      {
        id: 'p6', name: 'Bas van Dijk', catches: [
          { id: 'c4', species: 'Baars', weight: 800, time: '08:45' },
          { id: 'c5', species: 'Karper', weight: 3500, time: '12:00' },
          { id: 'c6', species: 'Brasem', weight: 1200, time: '13:30' },
        ]
      },
    ],
  },
  {
    id: '3',
    name: 'Nachtvisserij Challenge',
    date: '2026-03-02',
    location: 'Loosdrechtse Plassen',
    status: 'active',
    participants: [
      {
        id: 'p7', name: 'Tom Visser', catches: [
          { id: 'c7', species: 'Meerval', weight: 8200, time: '22:15' },
        ]
      },
      {
        id: 'p8', name: 'Erik de Boer', catches: [
          { id: 'c8', species: 'Karper', weight: 6100, time: '23:00' },
          { id: 'c9', species: 'Karper', weight: 3800, time: '01:30' },
        ]
      },
    ],
  },
];

function loadCompetitions(): Competition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  saveCompetitions(sampleData);
  return sampleData;
}

function saveCompetitions(competitions: Competition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(competitions));
}

export function getCompetitions(): Competition[] {
  return loadCompetitions();
}

export function getCompetition(id: string): Competition | undefined {
  return loadCompetitions().find(c => c.id === id);
}

export function addCompetition(data: { name: string; date: string; location: string; entryFee?: number; availableNumbers?: number[] }): Competition {
  const competitions = loadCompetitions();
  const comp: Competition = {
    id: Date.now().toString(),
    ...data,
    status: 'upcoming',
    participants: [],
  };
  competitions.push(comp);
  saveCompetitions(competitions);
  return comp;
}

export function updateCompetition(id: string, data: Partial<Pick<Competition, 'entryFee' | 'customPrizePot' | 'availableNumbers' | 'prizeDistribution' | 'prizePercentages' | 'fishFundPercentage'>>) {
  const competitions = loadCompetitions();
  const comp = competitions.find(c => c.id === id);
  if (comp) {
    Object.assign(comp, data);
    saveCompetitions(competitions);
  }
}

export function randomAssignNumbers(competitionId: string): boolean {
  const competitions = loadCompetitions();
  const comp = competitions.find(c => c.id === competitionId);
  if (!comp || !comp.availableNumbers || comp.availableNumbers.length < comp.participants.length) return false;
  const shuffled = [...comp.availableNumbers].sort(() => Math.random() - 0.5);
  comp.participants.forEach((p, i) => {
    p.number = shuffled[i];
  });
  saveCompetitions(competitions);
  return true;
}

export function addParticipant(competitionId: string, name: string, number?: number): Participant | null {
  const competitions = loadCompetitions();
  const comp = competitions.find(c => c.id === competitionId);
  if (!comp) return null;
  const participant: Participant = { id: Date.now().toString(), name, number, catches: [] };
  comp.participants.push(participant);
  saveCompetitions(competitions);
  return participant;
}

export function assignNumbers(competitionId: string, numbers: number[]) {
  const competitions = loadCompetitions();
  const comp = competitions.find(c => c.id === competitionId);
  if (!comp) return;
  // Assign numbers sequentially to participants
  comp.participants.forEach((p, i) => {
    p.number = numbers[i] ?? undefined;
  });
  saveCompetitions(competitions);
}

export function addCatch(competitionId: string, participantId: string, catchData: Omit<Catch, 'id'>): Catch | null {
  const competitions = loadCompetitions();
  const comp = competitions.find(c => c.id === competitionId);
  if (!comp) return null;
  const participant = comp.participants.find(p => p.id === participantId);
  if (!participant) return null;
  const newCatch: Catch = { id: Date.now().toString(), ...catchData };
  participant.catches.push(newCatch);
  saveCompetitions(competitions);
  return newCatch;
}

export function deleteCompetition(id: string) {
  const competitions = loadCompetitions().filter(c => c.id !== id);
  saveCompetitions(competitions);
}

export function updateCompetitionStatus(id: string, status: Competition['status']) {
  const competitions = loadCompetitions();
  const comp = competitions.find(c => c.id === id);
  if (comp) {
    comp.status = status;
    saveCompetitions(competitions);
  }
}

export function getTotalWeight(participant: Participant): number {
  return participant.catches.reduce((sum, c) => sum + c.weight, 0);
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}
