// Gebruik environment variable voor flexibiliteit (ontwikkel/productie)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
// ========== Competities ==========
export async function fetchCompetitions() {
  const res = await fetch(`${API_BASE_URL}/competitions`);
  if (!res.ok) throw new Error('Ophalen competities mislukt');
  return res.json();
}

export async function fetchCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`);
  if (!res.ok) throw new Error('Competitie niet gevonden');
  return res.json();
}
export async function createCompetition(data: {
  name: string;
  date: string;
  location: string;
  entry_fee?: number;
  available_numbers?: number[];
}) {
  const res = await fetch(`${API_BASE_URL}/competitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Aanmaken mislukt');
  return res.json();
}


export async function updateCompetition(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Updaten mislukt');
  return res.json();
}

export async function deleteCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Verwijderen mislukt');
  return res.json();
}

export async function updateCompetitionStatus(id: number, status: string) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}/status?status=${status}`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Status wijzigen mislukt');
  return res.json();
}

// ========== Deelnemers ==========
export async function addParticipant(competitionId: number, name: string, number?: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, number }),
  });
  if (!res.ok) throw new Error('Deelnemer toevoegen mislukt');
  return res.json();
}

export async function updateParticipant(participantId: number, name: string, number?: number) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, number }),
  });
  if (!res.ok) throw new Error('Deelnemer updaten mislukt');
  return res.json();
}

export async function deleteParticipant(participantId: number) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Deelnemer verwijderen mislukt');
  return res.json();
}

// ========== Vangsten ==========
export async function addCatch(participantId: number, catchData: { species: string; weight: number; time?: string }) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}/catches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(catchData),
  });
  if (!res.ok) throw new Error('Vangst toevoegen mislukt');
  return res.json();
}

export async function updateCatch(catchId: number, catchData: { species: string; weight: number; time?: string }) {
  const res = await fetch(`${API_BASE_URL}/catches/${catchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(catchData),
  });
  if (!res.ok) throw new Error('Vangst updaten mislukt');
  return res.json();
}

export async function deleteCatch(catchId: number) {
  const res = await fetch(`${API_BASE_URL}/catches/${catchId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Vangst verwijderen mislukt');
  return res.json();
}

// ========== Hulpfuncties (optioneel) ==========
export async function assignNumbersRandomly(competitionId: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/assign-numbers`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Nummer toewijzen mislukt');
  return res.json();
}

export async function patchCompetition(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Updaten mislukt');
  return res.json();
}