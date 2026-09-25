import React, { useState, useMemo, useRef } from 'react';
import { Player, VolleyballPosition, PlaceholderConfig, PlaceholderStyleId } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { getPlaceholderConfig, savePlaceholderConfig } from '../utils/storage';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Shield,
  Star,
  Download,
  Upload,
  Check,
  X,
  AlertTriangle,
  ArrowUpDown,
  RotateCcw,
  LogOut,
  Lock,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Palette,
  FileImage,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PlayerAdminProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  homeTeamName: string;
  onLogout?: () => void;
}

const POSITIONS: VolleyballPosition[] = [
  'Passer-Loper',
  'Spelverdeler',
  'Middenblokker',
  'Hoofdaanvaller',
  'Libero',
  'Universeel',
];

interface PlaceholderPreset {
  id: PlaceholderStyleId;
  name: string;
  badge: string;
  description: string;
  previewBg: string;
}

const PLACEHOLDER_PRESETS: PlaceholderPreset[] = [
  {
    id: 'blue_number',
    name: 'Klassiek Knack Blauw',
    badge: 'Standaard',
    description: 'Koninklijk Knack-blauw met wit rugnummer',
    previewBg: 'bg-gradient-to-br from-[#003B7A] to-[#0A2550]',
  },
  {
    id: 'silhouette_navy',
    name: 'Knack Volley Club Silhouet',
    badge: 'Club Karakter',
    description: 'Donkerblauw met volleybalspeler & watermerk',
    previewBg: 'bg-gradient-to-b from-[#071C3D] via-[#003B7A] to-[#0A2550]',
  },
  {
    id: 'jersey_stripes',
    name: 'Knack Uitrusting / Jersey',
    badge: 'Wedstrijdtenue',
    description: 'Vector-uitrusting met rode & gouden clubstrepen',
    previewBg: 'bg-[#003B7A]',
  },
  {
    id: 'action_spike',
    name: 'Dynamische Smash Actie',
    badge: 'Aanval & Glow',
    description: 'Smash silhouet met energieke cyaan gloed',
    previewBg: 'bg-gradient-to-br from-[#0A2550] via-[#0284C7] to-[#071C3D]',
  },
  {
    id: 'golden_mvp',
    name: 'Gouden MVP Laureaat',
    badge: 'Exclusief',
    description: 'Goud/brons verloop met laureaat accenten',
    previewBg: 'bg-gradient-to-br from-[#78350F] via-[#D97706] to-[#451A03]',
  },
  {
    id: 'custom_uploaded',
    name: 'Eigen Geüploade Placeholder',
    badge: 'Eigen Afbeelding',
    description: 'Upload een eigen clublogo, foto of custom visual',
    previewBg: 'bg-slate-800',
  },
];

export const PlayerAdmin: React.FC<PlayerAdminProps> = ({
  players,
  onUpdatePlayers,
  homeTeamName,
  onLogout,
}) => {
  // Global Placeholder Settings
  const [placeholderConfig, setPlaceholderConfig] = useState<PlaceholderConfig>(getPlaceholderConfig);
  const [isPlaceholderPanelOpen, setIsPlaceholderPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'position'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Add Player State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState<VolleyballPosition>('Passer-Loper');
  const [newIsCaptain, setNewIsCaptain] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Player State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState<VolleyballPosition>('Passer-Loper');
  const [editIsCaptain, setEditIsCaptain] = useState(false);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Success Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stats calculation
  const totalCount = players.length;
  const activeCount = players.filter((p) => p.active).length;
  const captain = players.find((p) => p.isCaptain);

  // Filtered & Sorted Players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchesQuery =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.number.toString().includes(search) ||
          p.position.toLowerCase().includes(search.toLowerCase());

        const matchesPosition =
          positionFilter === 'all' || p.position === positionFilter;

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && p.active) ||
          (statusFilter === 'inactive' && !p.active);

        return matchesQuery && matchesPosition && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'number') {
          comparison = a.number - b.number;
        } else if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'position') {
          comparison = a.position.localeCompare(b.position);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [players, search, positionFilter, statusFilter, sortBy, sortOrder]);

  // Handle Placeholder Style Change
  const handleSelectPlaceholderStyle = (styleId: PlaceholderStyleId) => {
    const newConfig: PlaceholderConfig = {
      ...placeholderConfig,
      style: styleId,
    };
    setPlaceholderConfig(newConfig);
    savePlaceholderConfig(newConfig);

    const presetName = PLACEHOLDER_PRESETS.find((p) => p.id === styleId)?.name || styleId;
    showToast(`Placeholderstijl gewijzigd naar: "${presetName}"`);
  };

  // Handle Upload of Custom Global Placeholder Image
  const handleCustomPlaceholderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Kies een geldig afbeeldingsbestand (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Afbeelding is te groot (maximum 5MB toegestaan).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newConfig: PlaceholderConfig = {
        style: 'custom_uploaded',
        customImageDataUrl: dataUrl,
        customImageName: file.name,
      };
      setPlaceholderConfig(newConfig);
      savePlaceholderConfig(newConfig);
      showToast(`Custom placeholder afbeelding "${file.name}" succesvol geüpload!`);
    };
    reader.onerror = () => {
      showToast('Fout bij het inlezen van de afbeelding.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Remove Custom Placeholder
  const handleRemoveCustomPlaceholder = () => {
    const newConfig: PlaceholderConfig = {
      style: 'blue_number',
      customImageDataUrl: null,
      customImageName: null,
    };
    setPlaceholderConfig(newConfig);
    savePlaceholderConfig(newConfig);
    showToast('Geüploade placeholder verwijderd en hersteld naar klassiek blauw.');
  };

  // Toggle Single Player Active Status
  const handleToggleActive = (id: string) => {
    const updated = players.map((p) => {
      if (p.id === id) {
        const newStatus = !p.active;
        showToast(
          `${p.name} is nu ${newStatus ? 'actief' : 'inactief'} in de match`
        );
        return { ...p, active: newStatus };
      }
      return p;
    });
    onUpdatePlayers(updated);
  };

  // Toggle Captain Status
  const handleSetCaptain = (id: string) => {
    const updated = players.map((p) => ({
      ...p,
      isCaptain: p.id === id ? !p.isCaptain : false,
    }));
    const newCaptain = updated.find((p) => p.id === id && p.isCaptain);
    showToast(
      newCaptain
        ? `${newCaptain.name} is aangeduid als kapitein (C)`
        : 'Kapitein verwijderd'
    );
    onUpdatePlayers(updated);
  };

  // Bulk: Activate all or deactivate all
  const handleBulkToggle = (active: boolean) => {
    const updated = players.map((p) => ({ ...p, active }));
    onUpdatePlayers(updated);
    showToast(
      active
        ? 'Alle spelers geactiveerd voor de match'
        : 'Alle spelers op inactief gezet'
    );
  };

  // Delete Player
  const handleDeletePlayer = (player: Player) => {
    if (
      window.confirm(
        `Weet je zeker dat je #${player.number} ${player.name} wilt verwijderen uit de spelerslijst?`
      )
    ) {
      const updated = players.filter((p) => p.id !== player.id);
      onUpdatePlayers(updated);
      showToast(`${player.name} is verwijderd`);
    }
  };

  // Upload Individual Player Photo
  const handlePlayerPhotoFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Kies een geldig afbeeldingsbestand (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Afbeelding is te groot (maximum 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        setEditPhotoUrl(dataUrl);
      } else {
        setNewPhotoUrl(dataUrl);
      }
      showToast('Foto geselecteerd voor speler.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add Player Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const num = parseInt(newNumber, 10);
    if (isNaN(num) || num < 1 || num > 99) {
      setAddError('Kies een geldig rugnummer tussen 1 en 99.');
      return;
    }

    if (!newName.trim()) {
      setAddError('Vul de naam van de speler in.');
      return;
    }

    // Check duplicate jersey number
    const duplicate = players.find((p) => p.number === num);
    if (duplicate) {
      setAddError(
        `Rugnummer #${num} is al in gebruik door ${duplicate.name}. Kies een uniek rugnummer.`
      );
      return;
    }

    const newPlayer: Player = {
      id: 'p-' + Date.now(),
      number: num,
      name: newName.trim(),
      position: newPosition,
      active: true,
      isCaptain: newIsCaptain,
      photoUrl: newPhotoUrl.trim() || undefined,
      avatarColor: 'from-amber-500 to-orange-600',
    };

    let updated = [...players, newPlayer];
    // If new player is captain, unset captain on others
    if (newIsCaptain) {
      updated = updated.map((p) =>
        p.id === newPlayer.id ? p : { ...p, isCaptain: false }
      );
    }

    onUpdatePlayers(updated);
    showToast(`#${num} ${newName.trim()} toegevoegd aan de spelerslijst!`);

    // Reset form
    setNewNumber('');
    setNewName('');
    setNewPhotoUrl('');
    setNewIsCaptain(false);
    setIsAddOpen(false);
  };

  // Start Edit
  const handleStartEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditNumber(player.number.toString());
    setEditName(player.name);
    setEditPosition(player.position);
    setEditIsCaptain(Boolean(player.isCaptain));
    setEditPhotoUrl(player.photoUrl || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setEditError(null);

    const num = parseInt(editNumber, 10);
    if (isNaN(num) || num < 1 || num > 99) {
      setEditError('Kies een geldig rugnummer tussen 1 en 99.');
      return;
    }

    if (!editName.trim()) {
      setEditError('Vul een geldige naam in.');
      return;
    }

    // Check duplicate number with other players
    const duplicate = players.find(
      (p) => p.number === num && p.id !== editingPlayer.id
    );
    if (duplicate) {
      setEditError(
        `Rugnummer #${num} is al in gebruik door ${duplicate.name}.`
      );
      return;
    }

    let updated = players.map((p) => {
      if (p.id === editingPlayer.id) {
        return {
          ...p,
          number: num,
          name: editName.trim(),
          position: editPosition,
          isCaptain: editIsCaptain,
          photoUrl: editPhotoUrl.trim() || undefined,
        };
      }
      return editIsCaptain ? { ...p, isCaptain: false } : p;
    });

    onUpdatePlayers(updated);
    showToast(`Gegevens van #${num} ${editName.trim()} succesvol bijgewerkt!`);
    setEditingPlayer(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [['Rugnummer', 'Naam', 'Positie', 'Ploegkapitein', 'Actief in match']];
    players.forEach((p) => {
      rows.push([
        p.number.toString(),
        `"${p.name.replace(/"/g, '""')}"`,
        p.position,
        p.isCaptain ? 'Ja' : 'Nee',
        p.active ? 'Ja' : 'Nee',
      ]);
    });
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `spelerslijst_${homeTeamName.toLowerCase().replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spelerslijst geëxporteerd naar CSV');
  };

  // Quick text roster import
  const handleImportTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    const lines = importText.split('\n');
    const parsedPlayers: Player[] = [];

    lines.forEach((line) => {
      const clean = line.trim();
      if (!clean) return;

      const match = clean.match(/^#?(\d+)[,\s\-]+([^,\-]+?)(?:[,\s\-]+([A-Za-z\-]+))?$/);
      if (match) {
        const num = parseInt(match[1], 10);
        const name = match[2].trim();
        const rawPos = (match[3] || '').trim();

        const matchedPos =
          POSITIONS.find(
            (p) => p.toLowerCase() === rawPos.toLowerCase()
          ) || 'Passer-Loper';

        parsedPlayers.push({
          id: 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          number: num,
          name,
          position: matchedPos,
          active: true,
          avatarColor: 'from-blue-600 to-indigo-800',
        });
      }
    });

    if (parsedPlayers.length === 0) {
      showToast('Geen geldige regels gevonden in de geplakte tekst.');
      return;
    }

    onUpdatePlayers(parsedPlayers);
    setIsImportOpen(false);
    setImportText('');
    showToast(`${parsedPlayers.length} spelers succesvol geïmporteerd!`);
  };

  // Dummy player used for live preview in placeholder selector
  const previewDummyPlayer: Player = {
    id: 'preview-dummy',
    number: 8,
    name: 'Stijn D’Hulst',
    position: 'Spelverdeler',
    active: true,
    photoUrl: undefined, // ensure placeholder renderer runs
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Spelerslijst Beheer
            </h2>
            <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-1 rounded-full border border-amber-300">
              {homeTeamName}
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Beheer de officiële selectie van Knack Volley Roeselare, upload spelersfoto's en selecteer/upload een custom placeholder als alternatief voor de standaard achtergrond.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onLogout && (
            <button
              id="btn-playeradmin-lock"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold px-3 py-2.5 rounded-xl border border-slate-300 hover:border-rose-300 shadow-sm text-xs transition-colors cursor-pointer"
              title="Spelerskern vergrendelen en administrator uitloggen"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Vergrendel Beheer</span>
            </button>
          )}

          {/* Toggle Placeholder Manager Panel Button */}
          <button
            id="btn-toggle-placeholder-panel"
            onClick={() => setIsPlaceholderPanelOpen((prev) => !prev)}
            className={`inline-flex items-center gap-2 font-black px-4 py-2.5 rounded-xl border shadow-sm text-xs transition-all cursor-pointer ${
              isPlaceholderPanelOpen
                ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-700" />
            <span>Foto & Placeholder Instellen</span>
            {isPlaceholderPanelOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            id="btn-add-player-modal"
            onClick={() => {
              setIsAddOpen(true);
              setAddError(null);
            }}
            className="inline-flex items-center gap-2 bg-[#003B7A] hover:bg-[#0A2550] text-white font-black px-4 py-2.5 rounded-xl shadow-md shadow-blue-900/20 active:scale-95 transition-transform text-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Nieuwe Speler Toevoegen</span>
          </button>

          <button
            id="btn-quick-import"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 shadow-sm text-xs transition-colors cursor-pointer"
            title="Importeer een lijst speelsters via tekst"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Snelle Import</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 shadow-sm text-xs transition-colors cursor-pointer"
            title="Download selectie als CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* DEDICATED PLACEHOLDER & SPELERSFOTO BEHEER PANEL */}
      <div
        className={`mb-6 transition-all duration-300 ease-in-out ${
          isPlaceholderPanelOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="bg-gradient-to-br from-slate-900 via-[#071C3D] to-[#0A2550] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-400/40 relative overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider mb-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Spelersfoto & Placeholder Configuratie</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Selecteer of Upload een Spelersfoto Placeholder
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                    Kies een stijlvol alternatief voor de standaard blauwe achtergrond wanneer een speler geen officiële portretfoto heeft, of upload een custom clublogo/placeholder.
                  </p>
                </div>
              </div>

              {/* Current Active Badge */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                    Actieve Stijl
                  </div>
                  <div className="text-xs font-black text-amber-300">
                    {PLACEHOLDER_PRESETS.find((p) => p.id === placeholderConfig.style)?.name || 'Klassiek Blauw'}
                  </div>
                </div>
                <PlayerAvatar
                  player={previewDummyPlayer}
                  size="sm"
                  overridePlaceholderStyle={placeholderConfig.style}
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
              {PLACEHOLDER_PRESETS.map((preset) => {
                const isSelected = placeholderConfig.style === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPlaceholderStyle(preset.id)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 group ${
                      isSelected
                        ? 'bg-white/15 border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25'
                    }`}
                  >
                    {/* Live Thumbnail Preview */}
                    <div className="shrink-0">
                      <PlayerAvatar
                        player={previewDummyPlayer}
                        size="md"
                        overridePlaceholderStyle={preset.id}
                        className="shadow-md ring-2 ring-white/20"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-black text-sm text-white group-hover:text-amber-300 transition-colors">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                            Actief ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-200 leading-snug">
                        {preset.description}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-amber-300/80 bg-black/20 px-2 py-0.5 rounded">
                        {preset.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Placeholder Upload Card */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Eigen Custom Placeholder Uploaden (Logo / Portret / Grafiek)
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Upload een clubembleem, sponsorlogo of specifieke volleybal-visual (PNG, JPG, SVG, WebP tot 5MB).
                  </p>
                  {placeholderConfig.customImageName && (
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md text-[11px] font-mono">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Huidig bestand: {placeholderConfig.customImageName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleCustomPlaceholderUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 text-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Kies Bestand & Upload</span>
                </button>

                {placeholderConfig.customImageDataUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomPlaceholder}
                    className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Verwijder geüploade placeholder"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Verwijder</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Totale Selectie
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalCount} <span className="text-xs font-normal text-slate-500">spelers</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Actief in Match
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {activeCount} <span className="text-xs font-normal text-slate-500">/ {totalCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ploegkapitein (C)
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5 truncate max-w-[140px]">
              {captain ? `#${captain.number} ${captain.name}` : 'Geen aangeduid'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Snel Matchselectie
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => handleBulkToggle(true)}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
              >
                Alles Actief
              </button>
              <button
                type="button"
                onClick={() => handleBulkToggle(false)}
                className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
              >
                Alles Uit
              </button>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Zoek op speler, rugnummer of positie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Alle status</option>
            <option value="active">Alleen Actief (Stembaar)</option>
            <option value="inactive">Alleen Inactief (Niet stembaar)</option>
          </select>

          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Alle posities ({totalCount})</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => {
                if (sortBy === 'number') {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortBy('number');
                  setSortOrder('asc');
                }
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                sortBy === 'number'
                  ? 'bg-white shadow-xs text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Rugnr</span>
              {sortBy === 'number' && (
                <ArrowUpDown className="w-3 h-3 text-amber-500" />
              )}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-white shadow-xs text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Naam</span>
              {sortBy === 'name' && (
                <ArrowUpDown className="w-3 h-3 text-amber-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Players List Grid / Table */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Geen spelers gevonden
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            {search || positionFilter !== 'all' || statusFilter !== 'all'
              ? 'Probeer een andere zoekterm of wis je filters.'
              : 'Er staan nog geen spelers in de spelerslijst.'}
          </p>
          <button
            onClick={() => {
              setSearch('');
              setPositionFilter('all');
              setStatusFilter('all');
            }}
            className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
          >
            Filters herstellen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm">
                Selectie ({filteredPlayers.length} spelers)
              </h3>
              <span className="text-[11px] text-slate-500">
                • Vink aan/uit wie er meespeelt
              </span>
            </div>
            <button
              onClick={() => setIsPlaceholderPanelOpen(true)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Placeholder aanpassen</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                id={`admin-player-row-${player.id}`}
                className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  player.active ? 'hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-75'
                }`}
              >
                {/* Left: Player Avatar (Photo or Placeholder), Name, Position, Captain */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Photo or Placeholder Avatar */}
                  <PlayerAvatar
                    player={player}
                    size="md"
                    showNumberBadge={true}
                    className="shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-base">
                        #{player.number} {player.name}
                      </span>

                      {player.isCaptain && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          <span>Kapitein (C)</span>
                        </span>
                      )}

                      {!player.active && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Inactief voor deze match
                        </span>
                      )}

                      {player.photoUrl ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Eigen foto
                        </span>
                      ) : (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Placeholder actief
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-600">
                        {player.position}
                      </span>
                      <span>&bull;</span>
                      <span className={player.active ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                        {player.active ? '✓ Beschikbaar in stemformulier' : 'Niet zichtbaar voor supporters'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Status Toggles */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Active / Inactive match toggle button */}
                  <button
                    type="button"
                    id={`btn-toggle-active-${player.id}`}
                    onClick={() => handleToggleActive(player.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      player.active
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    title={
                      player.active
                        ? 'Klik om speler inactief te maken voor deze match'
                        : 'Klik om speler actief te maken'
                    }
                  >
                    {player.active ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Actief in match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inactief</span>
                      </>
                    )}
                  </button>

                  {/* Make / Unmake Captain */}
                  <button
                    type="button"
                    id={`btn-captain-${player.id}`}
                    onClick={() => handleSetCaptain(player.id)}
                    className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      player.isCaptain
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200'
                    }`}
                    title={
                      player.isCaptain
                        ? 'Verwijder kapiteinsband'
                        : 'Duid aan als ploegkapitein (C)'
                    }
                  >
                    <Star
                      className={`w-4 h-4 ${
                        player.isCaptain ? 'fill-amber-500 text-amber-600' : ''
                      }`}
                    />
                  </button>

                  {/* Edit Player Button */}
                  <button
                    type="button"
                    id={`btn-edit-player-${player.id}`}
                    onClick={() => handleStartEdit(player)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Gegevens & foto bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Player Button */}
                  <button
                    type="button"
                    id={`btn-delete-player-${player.id}`}
                    onClick={() => handleDeletePlayer(player)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                    title="Verwijder speler uit de selectie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Add Player */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Nieuwe Speler Toevoegen
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {addError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rugnummer *
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  placeholder="Bv. 8"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Volledige Naam *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Voornaam + Achternaam"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Positie
                </label>
                <select
                  value={newPosition}
                  onChange={(e) =>
                    setNewPosition(e.target.value as VolleyballPosition)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Spelersfoto Upload Section in Add Modal */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Spelersfoto (Optioneel)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={newFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePlayerPhotoFile(e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Upload Spelersfoto</span>
                  </button>

                  {newPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setNewPhotoUrl('')}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Wis foto (gebruik placeholder)
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Als je geen foto uploadt, wordt automatisch de ingestelde placeholder getoond.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={newIsCaptain}
                    onChange={(e) => setNewIsCaptain(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Aanduiden als ploegkapitein (C)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  id="btn-confirm-add-player"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md cursor-pointer"
                >
                  Speler Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Player */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Speler Bewerken
                </h3>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Photo Preview & Upload in Edit Modal */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4">
                <PlayerAvatar
                  player={{
                    ...editingPlayer,
                    number: parseInt(editNumber, 10) || editingPlayer.number,
                    name: editName || editingPlayer.name,
                    photoUrl: editPhotoUrl || undefined,
                  }}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 mb-1">
                    Spelersfoto / Placeholder
                  </div>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePlayerPhotoFile(e, true)}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Foto</span>
                    </button>
                    {editPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditPhotoUrl('')}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Gebruik Placeholder
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rugnummer *
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Naam Speler *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Positie
                </label>
                <select
                  value={editPosition}
                  onChange={(e) =>
                    setEditPosition(e.target.value as VolleyballPosition)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={editIsCaptain}
                    onChange={(e) => setEditIsCaptain(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Aanduiden als ploegkapitein (C)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  id="btn-confirm-save-player"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Wijzigingen Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Quick Text Import */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Snelle Selectie Import
                </h3>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportTextSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                Plak hieronder meerdere spelers (één per regel) met rugnummer, naam en optioneel positie:
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] font-mono text-slate-600">
                8 Stijn D'Hulst - Spelverdeler<br />
                11 Matthijs Verhanneman - Passer-Loper<br />
                7 Pieter Coolman - Middenblokker
              </div>

              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="8 Stijn D'Hulst - Spelverdeler..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Importeer Spelers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
