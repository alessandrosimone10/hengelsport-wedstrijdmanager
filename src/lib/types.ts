export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
  entryFee?: number; // in euros
  customPrizePot?: number; // manually set prize pot
  availableNumbers?: number[]; // predefined peg numbers
  prizeDistribution?: number; // how many winners get a prize
  prizePercentages?: number[]; // custom % per position (e.g. [50, 30, 20])
  fishFundPercentage?: number; // % reserved for fish fund (default 25)
  participants: Participant[];
}

export interface Participant {
  id: string;
  name: string;
  number?: number;
  catches: Catch[];
}

export interface Catch {
  id: string;
  species: string;
  weight: number; // in grams
  time: string;
}

export interface CompetitionFormData {
  name: string;
  date: string;
  location: string;
}
