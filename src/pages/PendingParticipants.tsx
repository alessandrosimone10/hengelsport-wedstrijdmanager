import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchPending() {
  const res = await fetch(`${API_BASE_URL}/admin/pending-participants`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Ophalen mislukt');
  return res.json();
}

async function approve(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/pending-participants/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Goedkeuren mislukt');
  return res.json();
}

async function reject(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/pending-participants/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Afwijzen mislukt');
  return res.json();
}

export default function PendingParticipants() {
  const queryClient = useQueryClient();
  const { data: pendings, isLoading, error } = useQuery({
    queryKey: ['pending'],
    queryFn: fetchPending,
  });

  const approveMutation = useMutation({
    mutationFn: approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending'] });
      toast.success('Goedgekeurd');
    },
    onError: (err) => toast.error('Fout bij goedkeuren'),
  });

  const rejectMutation = useMutation({
    mutationFn: reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending'] });
      toast.success('Afgewezen');
    },
    onError: (err) => toast.error('Fout bij afwijzen'),
  });

  if (isLoading) return <div>Laden...</div>;
  if (error) return <div>Fout: {error.message}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Openstaande aanmeldingen</h1>
      {pendings?.length === 0 ? (
        <p>Geen aanmeldingen.</p>
      ) : (
        pendings?.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Email: {p.email}</p>
              <p>Wedstrijd ID: {p.competition_id}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => approveMutation.mutate(p.id)}>Goedkeuren</Button>
                <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(p.id)}>Afwijzen</Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
