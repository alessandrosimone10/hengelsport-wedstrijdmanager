// lib/api.ts
import { API_BASE_URL } from './config';

// Auth headers (pas aan als nodig)
export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// --- Wedstrijd endpoints ---

export async function fetchCompetitions() {
  const res = await fetch(`${API_BASE_URL}/competitions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Kon wedstrijden niet ophalen');
  return res.json();
}

export async function fetchCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Kon wedstrijd niet ophalen');
  return res.json();
}

export async function updateCompetitionStatus(id: number, status: string) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Kon status niet bijwerken');
  return res.json();
}

// Delete competitie met checks
export async function deleteCompetition(id: number) {
  // Eerst competition ophalen om deelnemers en status te checken
  const competition = await fetchCompetition(id);
  if (competition.participants.length > 0) {
    throw new Error('Wedstrijd kan niet verwijderd worden: er zijn al deelnemers.');
  }
  if (competition.status === 'active' || competition.status === 'completed') {
    throw new Error('Wedstrijd kan alleen verwijderd worden als deze nog gepland is.');
  }

  // DELETE request
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kon wedstrijd niet verwijderen: ${text || res.status}`);
  }
  return true;
}

// --- Deelnemers ---
export async function addParticipant(competitionId: number, name: string, number?: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, number }),
  });
  if (!res.ok) throw new Error('Kon deelnemer niet toevoegen');
  return res.json();
}

// --- Vangsten ---
export async function addCatch(participantId: number, catchData: { species: string; weight: number; time?: string }) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}/catches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(catchData),
  });
  if (!res.ok) throw new Error('Kon vangst niet registreren');
  return res.json();
}

// --- Random nummer toewijzen ---
export async function assignNumbersRandomly(competitionId: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/assign-numbers`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Kon nummers niet willekeurig verdelen');
  return res.json();
}

// --- Wedstrijd patchen ---
export async function patchCompetition(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Kon wedstrijd niet bijwerken');
  return res.json();
}

// --- Weer endpoint ---
export async function fetchWeatherForCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}/weather`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Kon weer niet ophalen');
  return res.json();
}
