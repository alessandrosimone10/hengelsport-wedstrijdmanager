import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL;

export default function PublicRegister() {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/public/competitions/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Inschrijven mislukt');
      }
      setSubmitted(true);
      toast.success('Aanmelding ontvangen! Je hoort snel iets.');
    } catch (err) {
      toast.error('Er ging iets mis. Probeer het later opnieuw.');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-lg">✅ Bedankt voor je aanmelding!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Je ontvangt binnenkort bericht of je bent goedgekeurd.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Schrijf je in voor deze wedstrijd</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Je naam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Je e-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">Verstuur aanmelding</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
