import { API_BASE_URL } from './config';

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  'Content-Type': 'application/json',
});

export async function fetchCompetitions() {
  const res = await fetch(`${API_BASE_URL}/competitions`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Kon wedstrijden niet ophalen');
  return res.json();
}

export async function fetchCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Kon wedstrijd niet ophalen');
  return res.json();
}

export async function deleteCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Kon wedstrijd niet verwijderen');
  return true;
}

export async function updateCompetitionStatus(id: number, status: string) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Kon status niet wijzigen');
  return res.json();
}

export async function addParticipant(competitionId: number, name: string, number?: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/participants`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, number }),
  });
  if (!res.ok) throw new Error('Kon deelnemer niet toevoegen');
  return res.json();
}

export async function addCatch(participantId: number, catchData: { species: string; weight: number; time?: string }) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}/catches`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(catchData),
  });
  if (!res.ok) throw new Error('Kon vangst niet toevoegen');
  return res.json();
}

export async function patchCompetition(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Kon wedstrijd niet bijwerken');
  return res.json();
}

export async function assignNumbersRandomly(competitionId: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/assign_numbers`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Kon nummers niet toewijzen');
  return res.json();
}
