import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function PublicCompetitions() {
  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['public-competitions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/public/competitions`);
      if (!res.ok) throw new Error('Ophalen mislukt');
      return res.json();
    },
  });

  if (isLoading) return <div className="p-8 text-center">Laden...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Fout: {error.message}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Beschikbare wedstrijden</h1>
      {competitions.length === 0 ? (
        <p>Er zijn momenteel geen wedstrijden.</p>
      ) : (
        <div className="grid gap-4">
          {competitions.map((comp) => {
            const dateStr = new Date(comp.date).toLocaleDateString('nl-NL', {
              day: 'numeric', month: 'long', year: 'numeric'
            });
            const available = comp.max_participants ? comp.max_participants - comp.current_participants : null;
            return (
              <Card key={comp.id}>
                <CardHeader>
                  <CardTitle>{comp.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{comp.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{comp.current_participants} deelnemers</span>
                      {comp.max_participants && (
                        <span className="text-sm">(max {comp.max_participants})</span>
                      )}
                    </div>
                    {available !== null && available <= 0 ? (
                      <p className="text-sm text-red-500">Volzet</p>
                    ) : (
                      <Button asChild className="mt-2">
                        <Link to={`/meedoen/${comp.id}`}>Inschrijven</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
