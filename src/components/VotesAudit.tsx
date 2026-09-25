import React, { useState, useMemo } from 'react';
import { SupporterVote, Player, MatchInfo } from '../types';
import {
  ListChecks,
  Search,
  Download,
  Trash2,
  Clock,
  ShieldCheck,
  MessageSquare,
  FileText,
  Lock,
  Eye,
} from 'lucide-react';

interface VotesAuditProps {
  votes: SupporterVote[];
  players: Player[];
  match: MatchInfo;
  onDeleteVote: (voteId: string) => void;
}

export const VotesAudit: React.FC<VotesAuditProps> = ({
  votes,
  players,
  match,
  onDeleteVote,
}) => {
  const [search, setSearch] = useState('');

  const getPlayer = (id: string) => {
    return players.find((p) => p.id === id);
  };

  const filteredVotes = useMemo(() => {
    return votes
      .filter((v) => v.matchId === match.id)
      .filter((v) => {
        const p1 = getPlayer(v.choices.first3ptPlayerId)?.name || '';
        const p2 = getPlayer(v.choices.second2ptPlayerId)?.name || '';
        const p3 = getPlayer(v.choices.third1ptPlayerId)?.name || '';
        const query = search.toLowerCase();

        return (
          v.anonymousId.toLowerCase().includes(query) ||
          v.receiptCode.toLowerCase().includes(query) ||
          p1.toLowerCase().includes(query) ||
          p2.toLowerCase().includes(query) ||
          p3.toLowerCase().includes(query) ||
          (v.supporterNote && v.supporterNote.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [votes, match.id, players, search]);

  const handleExportCSV = () => {
    const rows = [
      ['Tijdstip', 'Anonieme Supporter', 'Ontvangstbewijs', '3 Punten (Goud)', '2 Punten (Zilver)', '1 Punt (Brons)', 'Opmerking'],
    ];

    filteredVotes.forEach((v) => {
      const p1 = getPlayer(v.choices.first3ptPlayerId);
      const p2 = getPlayer(v.choices.second2ptPlayerId);
      const p3 = getPlayer(v.choices.third1ptPlayerId);
      const dateStr = new Date(v.timestamp).toLocaleString('nl-BE');

      rows.push([
        dateStr,
        `"${v.anonymousId}"`,
        `"${v.receiptCode}"`,
        `"#${p1?.number || ''} ${p1?.name || ''}"`,
        `"#${p2?.number || ''} ${p2?.name || ''}"`,
        `"#${p3?.number || ''} ${p3?.name || ''}"`,
        `"${(v.supporterNote || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `anonieme_stemmen_${match.homeTeam.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Anoniem Stemmenregister
            </h2>
            <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Anoniem & Veilig</span>
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Transparant controleoverzicht van de <strong>{filteredVotes.length}</strong> uitgebrachte stemmen. De identiteit van de supporters blijft volledig geheim tegenover speelsters en supporters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold px-3 py-2 rounded-xl shadow-sm">
            <Eye className="w-4 h-4 text-[#003B7A]" />
            <span>Stempagina geopend: <strong>{match.votingPageViews ?? 0}x</strong></span>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredVotes.length === 0}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporteer als CSV</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Zoek op ontvangstcode (bv. MVP-8A19), supporter nr of speelster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Votes list */}
      {filteredVotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Geen stemmen gevonden</h3>
          <p className="text-sm text-slate-500">
            {search ? 'Geen resultaten voor je zoekopdracht.' : 'Er zijn nog geen stemmen geregistreerd voor deze match.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVotes.map((v) => {
            const p1 = getPlayer(v.choices.first3ptPlayerId);
            const p2 = getPlayer(v.choices.second2ptPlayerId);
            const p3 = getPlayer(v.choices.third1ptPlayerId);
            const timeStr = new Date(v.timestamp).toLocaleTimeString('nl-BE', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(v.timestamp).toLocaleDateString('nl-BE', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={v.id}
                id={`vote-card-${v.id}`}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {v.anonymousId}
                        </span>
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {v.receiptCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr} om {timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Stem met code "${v.receiptCode}" verwijderen?`)) {
                        onDeleteVote(v.id);
                      }
                    }}
                    title="Stem verwijderen"
                    className="self-end sm:self-auto text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Player Choices Pills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {/* 3pt */}
                  <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">
                        #{p1?.number} {p1?.name || 'Onbekend'}
                      </div>
                      <div className="text-[10px] text-amber-800 font-medium">
                        1ste plaats (3 punten)
                      </div>
                    </div>
                  </div>

                  {/* 2pt */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-[10px] shrink-0">
                      2
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">
                        #{p2?.number} {p2?.name || 'Onbekend'}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium">
                        2de plaats (2 punten)
                      </div>
                    </div>
                  </div>

                  {/* 1pt */}
                  <div className="bg-amber-900/5 rounded-xl p-2.5 border border-amber-800/20 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-800 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                      1
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">
                        #{p3?.number} {p3?.name || 'Onbekend'}
                      </div>
                      <div className="text-[10px] text-amber-900 font-medium">
                        3de plaats (1 punt)
                      </div>
                    </div>
                  </div>
                </div>

                {v.supporterNote && (
                  <div className="mt-3 pt-2 text-xs text-slate-600 flex items-start gap-1.5 italic bg-slate-50/70 p-2 rounded-lg">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>"{v.supporterNote}"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
