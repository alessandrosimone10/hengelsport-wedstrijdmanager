import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function CheckStatus() {
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['my-applications', searchEmail],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/public/my-applications?email=${encodeURIComponent(searchEmail)}`);
      if (!res.ok) throw new Error('Ophalen mislukt');
      return res.json();
    },
    enabled: searchEmail.length > 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(email);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">In afwachting</Badge>;
      case 'approved': return <Badge variant="default">Goedgekeurd</Badge>;
      case 'rejected': return <Badge variant="destructive">Afgewezen</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Status van je aanmeldingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <Input
              type="email"
              placeholder="Voer je e-mailadres in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit">Check status</Button>
          </form>

          {searchEmail && isLoading && <p className="text-center">Laden...</p>}
          {error && <p className="text-red-500">Fout bij ophalen: {error.message}</p>}

          {applications && applications.length === 0 && (
            <p className="text-muted-foreground">Geen aanmeldingen gevonden voor dit e‑mailadres.</p>
          )}

          {applications && applications.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wedstrijd</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aangemeld op</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.competition_name}</TableCell>
                    <TableCell>
                      {app.competition_date ? new Date(app.competition_date).toLocaleDateString('nl-NL') : '-'}
                    </TableCell>
                    <TableCell>{statusBadge(app.status)}</TableCell>
                    <TableCell>
                      {app.created_at ? new Date(app.created_at).toLocaleDateString('nl-NL') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
