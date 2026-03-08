// Gebruik environment variable voor flexibiliteit (ontwikkel/productie)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

// Helper om token aan request toe te voegen
export function authHeaders(): HeadersInit {  // <-- voeg export toe
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ========== Authenticatie ==========
export async function login(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  if (!res.ok) throw new Error('Login mislukt');
  return res.json();
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Registratie mislukt');
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Ophalen gebruiker mislukt');
  return res.json();
}

export async function fetchCompetitions() {
  const res = await fetch(`${API_BASE_URL}/competitions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Ophalen competities mislukt');
  return res.json();
}


export async function fetchCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    headers: authHeaders(),
  });
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
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Aanmaken mislukt');
  return res.json();
}

export async function updateCompetition(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Updaten mislukt');
  return res.json();
}

export async function deleteCompetition(id: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Verwijderen mislukt');
  return res.json();
}

export async function updateCompetitionStatus(id: number, status: string) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Status wijzigen mislukt');
  return res.json();
}

// ========== Deelnemers ==========
export async function addParticipant(competitionId: number, name: string, number?: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, number }),
  });
  if (!res.ok) throw new Error('Deelnemer toevoegen mislukt');
  return res.json();
}

export async function updateParticipant(participantId: number, name: string, number?: number) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, number }),
  });
  if (!res.ok) throw new Error('Deelnemer updaten mislukt');
  return res.json();
}

export async function deleteParticipant(participantId: number) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Deelnemer verwijderen mislukt');
  return res.json();
}

// ========== Vangsten ==========
export async function addCatch(participantId: number, catchData: { species: string; weight: number; time?: string }) {
  const res = await fetch(`${API_BASE_URL}/participants/${participantId}/catches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(catchData),
  });
  if (!res.ok) throw new Error('Vangst toevoegen mislukt');
  return res.json();
}

export async function updateCatch(catchId: number, catchData: { species: string; weight: number; time?: string }) {
  const res = await fetch(`${API_BASE_URL}/catches/${catchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(catchData),
  });
  if (!res.ok) throw new Error('Vangst updaten mislukt');
  return res.json();
}

export async function deleteCatch(catchId: number) {
  const res = await fetch(`${API_BASE_URL}/catches/${catchId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Vangst verwijderen mislukt');
  return res.json();
}

// ========== Hulpfuncties ==========
export async function assignNumbersRandomly(competitionId: number) {
  const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/assign-numbers`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Nummer toewijzen mislukt');
  return res.json();
}

export async function patchCompetition(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Updaten mislukt');
  return res.json();
}
