import { Link } from 'react-router-dom';
import { getCompetitions, formatWeight } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Fish, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function FishFund() {
  const competitions = getCompetitions();

  const rows = competitions.map(comp => {
    const entryFee = comp.entryFee ?? 0;
    const calculatedPot = entryFee * comp.participants.length;
    const prizePot = comp.customPrizePot ?? calculatedPot;
    const fishPct = comp.fishFundPercentage ?? 25;
    const fishAmount = prizePot * (fishPct / 100);
    return { comp, prizePot, fishPct, fishAmount };
  });

  const total = rows.reduce((sum, r) => sum + r.fishAmount, 0);
  const completedTotal = rows
    .filter(r => r.comp.status === 'completed')
    .reduce((sum, r) => sum + r.fishAmount, 0);

  const statusLabel: Record<string, string> = {
    upcoming: 'Gepland',
    active: 'Actief',
    completed: 'Afgelopen',
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Fish className="h-6 w-6 text-primary" />
          Visfonds
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overzicht van de bijdrage per wedstrijd voor aankoop vis voor de vijver.
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Totaal visfonds (alle wedstrijden)</p>
            <p className="text-3xl font-bold font-mono text-primary">€{total.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Bevestigd (afgeronde wedstrijden)</p>
            <p className="text-3xl font-bold font-mono">€{completedTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Historie per wedstrijd
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">Nog geen wedstrijden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wedstrijd</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Prijzenpot</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Visfonds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ comp, prizePot, fishPct, fishAmount }) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <Link to={`/competitions/${comp.id}`} className="font-medium hover:underline">
                        {comp.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={comp.status === 'completed' ? 'outline' : comp.status === 'active' ? 'default' : 'secondary'}>
                        {statusLabel[comp.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">€{prizePot.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{fishPct}%</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary">€{fishAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell colSpan={4} className="font-semibold">Totaal</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">€{total.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
