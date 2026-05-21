'use client';
console.log('🔴 Component rendered - check where this appears')
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// --- Types ---
interface Player {
  id: string;
  name: string;
  position: string | null;
  jersey_number: number | null;
  claim_status: 'unclaimed' | 'pending' | 'claimed';
  user_id: string | null;
  roster_id: string;
}

interface Team {
  id: string;
  name: string;
  join_code: string;
  logo_url: string | null;
}

type DropdownAction = 'edit' | 'remove' | 'upload_logo' | 'copy_code';

const POSITIONS = [
  'Goalkeeper',
  'Left Wing',
  'Left Back',
  'Center Back',
  'Pivot',
  'Right Back',
  'Right Wing',
];

// --- Claim status badge ---
function ClaimBadge({ status }: { status: Player['claim_status'] }) {
  if (status === 'claimed') {
    return (
      <span className="px-3 py-1 rounded-full font-label-bold text-xs flex items-center gap-1 border"
        style={{ background: 'rgba(0,59,62,0.3)', color: '#00dce5', borderColor: 'rgba(0,220,229,0.2)' }}>
        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        CLAIMED
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="px-3 py-1 rounded-full font-label-bold text-xs flex items-center gap-1 border"
        style={{ background: '#003566', color: '#a5c8ff', borderColor: 'rgba(165,200,255,0.2)' }}>
        <span className="material-symbols-outlined text-xs">pending</span>
        PENDING
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full font-label-bold text-xs flex items-center gap-1 border"
      style={{ background: 'rgba(147,0,10,0.3)', color: '#ffb4ab', borderColor: 'rgba(255,180,171,0.2)' }}>
      <span className="material-symbols-outlined text-xs">warning</span>
      UNCLAIMED
    </span>
  );
}

// --- Player Card ---
function PlayerCard({
  player,
  onAction,
}: {
  player: Player;
  onAction: (action: DropdownAction, player: Player) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const jerseyDisplay = player.jersey_number !== null
    ? `#${String(player.jersey_number).padStart(2, '0')}`
    : '##';

  return (
    <div className="bg-surface-container-high border border-outline-variant p-5 rounded-xl flex items-center gap-5 hover:border-secondary-container transition-all group relative overflow-hidden rim-light">
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-6xl">sports_handball</span>
      </div>

      {/* Jersey number */}
      <div className="flex flex-col items-center justify-center min-w-[64px]">
        <span className="font-data-display text-4xl font-bold leading-none" style={{ color: '#fe6b00' }}>
          {jerseyDisplay}
        </span>
      </div>

      {/* Info */}
      <div className="flex-grow flex flex-col gap-1 min-w-0">
        <h3 className="font-headline-md text-lg text-on-surface truncate">{player.name}</h3>
        <div className="flex items-center gap-2">
          <span className="font-label-bold text-xs uppercase" style={{ color: '#00dce5' }}>
            {player.position ?? 'No Position'}
          </span>
        </div>
        <div className="mt-2 flex">
          <ClaimBadge status={player.claim_status} />
        </div>
      </div>

      {/* More menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-surface-container transition-colors z-10 relative"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-50 w-52 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => { onAction('edit', player); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-highest transition-colors font-body-md text-sm"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">edit</span>
              Edit player details
            </button>
            <button
              onClick={() => { onAction('upload_logo', player); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-highest transition-colors font-body-md text-sm"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">photo_camera</span>
              Upload team logo
            </button>
            <button
              onClick={() => { onAction('copy_code', player); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-highest transition-colors font-body-md text-sm"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">content_copy</span>
              Copy join code
            </button>
            <div className="h-px bg-outline-variant mx-4" />
            <button
              onClick={() => { onAction('remove', player); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-highest transition-colors font-body-md text-sm"
              style={{ color: '#ffb4ab' }}
            >
              <span className="material-symbols-outlined text-base" style={{ color: '#ffb4ab' }}>person_remove</span>
              Remove player
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// --- Join Tournament Modal ---
function JoinTournamentModal({
  isOpen,
  onClose,
  onJoinExisting,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onJoinExisting: (tournamentId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const [tournaments, setTournaments] = useState<{ id: string; name: string; start_date: string; end_date: string }[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTournaments = async () => {
      setLoadingTournaments(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date')
        .order('start_date', { ascending: false });
      setTournaments(data ?? []);
      setLoadingTournaments(false);
    };
    fetchTournaments();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 600, color: '#e1e2eb' }}>
            Join Tournament
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {loadingTournaments ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#fe6b00', borderTopColor: 'transparent' }} />
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-outline block mb-2">emoji_events</span>
              <p className="text-on-surface-variant font-body-md text-sm">No tournaments available yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="w-full text-left rounded-xl p-4 border transition-all"
                  style={{
                    background: selectedId === t.id ? 'rgba(254,107,0,0.1)' : '#1d2026',
                    borderColor: selectedId === t.id ? '#fe6b00' : '#43474f',
                  }}
                >
                  <p className="font-bold text-on-surface" style={{ fontFamily: 'Sora, sans-serif', fontSize: 15 }}>
                    {t.name}
                  </p>
                  <p className="text-on-surface-variant text-xs mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {t.start_date} → {t.end_date}
                  </p>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm" style={{ color: '#ffb4ab' }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedId && onJoinExisting(selectedId)}
              disabled={isLoading || !selectedId}
              className="flex-1 px-4 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#a5c8ff', color: '#00315f', fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#00315f', borderTopColor: 'transparent' }} />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">emoji_events</span>
                  Join
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- Add Player Modal ---
function AddPlayerModal({
  isOpen,
  onClose,
  onAdd,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, jerseyNumber: number | null, position: string | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState('');
  const [jersey, setJersey] = useState('');
  const [position, setPosition] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onAdd(name.trim(), jersey ? parseInt(jersey) : null, position || null);
    if (!error) {
      setName(''); setJersey(''); setPosition('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-md text-on-surface" style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 600 }}>
            Add Player
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Player Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marcus Nilsson"
              autoFocus
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-secondary-container outline-none transition-colors"
              style={{ fontFamily: 'Hanken Grotesk, sans-serif', background: '#1d2026', color: '#e1e2eb' }}
            />
          </div>

          {/* Jersey number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Jersey Number
            </label>
            <input
              type="number"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              placeholder="e.g., 10"
              min={1}
              max={99}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-secondary-container outline-none transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace', background: '#1d2026', color: '#e1e2eb' }}
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-secondary-container outline-none transition-colors appearance-none"
              style={{ background: '#1d2026', color: position ? '#e1e2eb' : '#8d919a', fontFamily: 'Hanken Grotesk, sans-serif' }}
            >
              <option value="" disabled>Select position...</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p} style={{ color: '#e1e2eb' }}>{p}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm" style={{ color: '#ffb4ab' }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all font-body-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#fe6b00', fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Add Player
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Edit Player Modal ---
function EditPlayerModal({
  player,
  isOpen,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rosterId: string, name: string, jerseyNumber: number | null, position: string | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState('');
  const [jersey, setJersey] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (player) {
      setName(player.name);
      setJersey(player.jersey_number !== null ? String(player.jersey_number) : '');
      setPosition(player.position ?? '');
    }
  }, [player]);

  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-md text-on-surface" style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 600 }}>
            Edit Player
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>Player Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-secondary-container outline-none transition-colors"
              style={{ background: '#1d2026', color: '#e1e2eb', fontFamily: 'Hanken Grotesk, sans-serif' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>Jersey Number</label>
            <input
              type="number"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              min={1} max={99}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-secondary-container outline-none transition-colors"
              style={{ background: '#1d2026', color: '#e1e2eb', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none transition-colors appearance-none"
              style={{ background: '#1d2026', color: '#e1e2eb', fontFamily: 'Hanken Grotesk, sans-serif' }}
            >
              <option value="">No position</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p} style={{ color: '#e1e2eb' }}>{p}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm" style={{ color: '#ffb4ab' }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all">
              Cancel
            </button>
            <button
              onClick={() => onSave(player.roster_id, name, jersey ? parseInt(jersey) : null, position || null)}
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#a5c8ff', color: '#00315f', fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Confirm Remove Modal ---
function ConfirmRemoveModal({
  player,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}) {
  if (!isOpen || !player) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(147,0,10,0.2)', border: '1px solid rgba(255,180,171,0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 28 }}>person_remove</span>
          </div>
          <h3 className="text-on-surface text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Remove Player</h3>
          <p className="text-on-surface-variant font-body-md text-sm">
            Are you sure you want to remove <strong className="text-on-surface">{player.name}</strong> from the roster? This cannot be undone.
          </p>
          <div className="flex gap-3 w-full pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#93000a', color: '#ffdad6', fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Logo Upload Modal ---
function LogoUploadModal({
  isOpen,
  onClose,
  onUpload,
  isLoading,
  error,
  currentLogoUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  currentLogoUrl: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    if (!error) { setPreview(null); setSelectedFile(null); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 600, color: '#e1e2eb' }}>
            Upload Team Logo
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Preview */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: preview ? '#fe6b00' : '#43474f', background: '#191c22' }}
          >
            {preview || currentLogoUrl ? (
              <img src={preview ?? currentLogoUrl!} alt="Logo preview" className="h-full w-full object-contain rounded-xl p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                <span className="font-body-md text-sm">Click to choose an image</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          {error && <p className="text-sm" style={{ color: '#ffb4ab' }}>{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedFile}
              className="flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#fe6b00', color: '#561f00', fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">upload</span>
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Toast ---
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border shadow-2xl font-body-md text-sm flex items-center gap-2"
      style={{ background: '#272a31', borderColor: '#43474f', color: '#e1e2eb' }}>
      <span className="material-symbols-outlined text-base" style={{ color: '#00dce5' }}>check_circle</span>
      {message}
    </div>
  );
}

// --- Main Component ---
const TeamEditInterface: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;//the team id will be the team name slug, we will fetch the team by name and get the id from there
  const slug = params?.slug as string;

  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [teamDBID, setTeamDBID] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [coaches, setCoaches] = useState<{ id: string; user_id: string; roster_id: string }[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Loading/error states for actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) { router.push('/auth/login'); return; }
      setUser(authUser);

      // 1. Resolve slug → team first
      const nameFromSlug = (slug as string).replace(/-/g, ' ');
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, join_code, logo_url')
        .ilike('name', nameFromSlug)
        .single();

      if (teamError || !teamData) {
        console.error('Team not found:', teamError);
        router.push('/protected');
        return; // Stop execution
      }
      setTeam(teamData);
      setTeamDBID(teamData.id);

      // 2. Now use teamData.id directly — don't rely on teamDbId state yet
      const { data: membership, error: membershipError } = await supabase
        .from('team_memberships')
        .select('role, status')
        .eq('user_id', authUser.id)
        .eq('team_id', teamData.id)  // ← teamData.id not teamDbId
        .eq('status', 'active')
        .single();
      console.log('Membership status:', membership?.status);
      console.log('membership:', membership, membershipError);
      
      if (!membership || membership.role !== 'coach') {
        router.push('/protected');
        return;
      }
      setIsCoach(true);


      //fetch coaches, to display up top


      // 3. Fetch roster using teamData.id
      const { data: rosterData, error: rosterError } = await supabase
        .from('tournament_rosters')
        .select(`
          id,
          jersey_number,
          claim_status,
          user_id,
          player_id,
          players:player_id(
            id,
            name,
            position
          )
        `)
        .eq('team_id', teamData.id)  // ← teamData.id not teamDbId
        .order('jersey_number', { ascending: true, nullsFirst: false });

      if (rosterError) throw rosterError;


      const coachRows = (rosterData ?? []).filter((row: any) => row.player_id === null);
      const unclaimedRows = (rosterData ?? []).filter((row: any) => row.player_id !== null && row.user_id === null);
      const claimedRows = (rosterData ?? []).filter((row: any) => row.player_id !== null && row.user_id !== null);
      
      

      const mappedCoaches = coachRows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        roster_id: row.id,
        claim_status: row.claim_status,
      }));
      setCoaches(mappedCoaches);

      const mappedUnclaimedPlayers: Player[] = unclaimedRows.map((row: any) => {
        // Access the players data through the relation
        const playerData = row.players;
        return {
          id: playerData?.id,
          name: playerData?.name ?? 'Unknown Player',
          position: playerData?.position ?? null,
          jersey_number: row.jersey_number,
          claim_status: row.claim_status,
          user_id: null,
          roster_id: row.id,
        };
      });


      const mappedClaimedPlayers: Player[] = claimedRows.map((row: any) => {
        const playerData = row.players;
        return {
          id: playerData?.id,
          name: playerData?.name ?? 'Unknown Player',
          position: playerData?.position ?? null,
          jersey_number: row.jersey_number,
          claim_status: row.claim_status,
          user_id: row.user_id,
          roster_id: row.id,
        };
      });



      const allPlayers = [...mappedClaimedPlayers, ...mappedUnclaimedPlayers];
      setPlayers(allPlayers); // empty array is fine — the UI handles it



      console.log('Coaches:', mappedCoaches.length);
      console.log('Unclaimed players:', mappedUnclaimedPlayers.length);
      console.log('Claimed players:', mappedClaimedPlayers.length);
    } catch (err) {
      console.error('Error loading team:', err);
    } finally {
      setIsLoading(false); // ← this always runs, so loading won't hang
    }
};

  useEffect(() => { if (slug) fetchData(); }, [slug]);



  const handleJoinExistingTournament = async (tournamentId: string) => {
    setActionLoading(true);
    setActionError(null);
    const supabase = createClient();

    try {
      // add the coach as the connection point for the team within tournament_rosters
      const {error: coacherror} = await supabase
        .from('tournament_rosters')
        .insert({
          tournament_id: tournamentId,
          team_id: teamDBID,
          player_id: null, // no player record for coach, just a placeholder entry to link team to tournament
          jersey_number: null,
          claim_status: 'claimed',
          user_id: user!.id,
        });
      if (coacherror) throw coacherror;


      const existingPlayers = players.map((p) => ({
        tournament_id: tournamentId,
        team_id: teamDBID,
        player_id: p.id,
        jersey_number: p.jersey_number,
        claim_status: p.claim_status,
        user_id: p.user_id,
      }));

      if (existingPlayers.length > 0) {
        const { error } = await supabase
          .from('tournament_rosters')
          .upsert(existingPlayers, { onConflict: 'tournament_id,team_id,player_id' });
        if (error) throw error;
      }

      setShowTournamentModal(false);
      setToast('Joined tournament');
    } catch (err) {
      console.error('Join existing tournament error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to join tournament');
    } finally {
      setActionLoading(false);
    }
  };



  // --- Add player ---
  const handleAddPlayer = async (name: string, jerseyNumber: number | null, position: string | null) => {
    setActionLoading(true);
    setActionError(null);
    const supabase = createClient();

    try {
      // 1. Create player record
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ name, position })
        .select()
        .single();
      if (playerError) throw playerError;

      // 2. Need a tournament to attach to — use latest for this team, or create standalone
      // For now we attach to team directly via tournament_rosters using first available tournament
      // You may want to add a tournament selector in future
      const { data: tournaments } = await supabase
        .from('tournament_rosters')
        .select('tournament_id')
        .eq('team_id', teamDBID)
        .limit(1);

      const tournamentId = tournaments?.[0]?.tournament_id;
      if (!tournamentId) throw new Error('No tournament found for this team. Add a tournament first.');

      const { error: rosterError } = await supabase
        .from('tournament_rosters')
        .insert({
          tournament_id: tournamentId,
          team_id: teamDBID,
          player_id: player.id,
          jersey_number: jerseyNumber,
          claim_status: 'unclaimed',
        });
      if (rosterError) throw rosterError;

      setShowAddModal(false);
      setToast(`${name} added to roster`);
      await fetchData();
    } catch (err) {
      console.error('Add player error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Edit player ---
  const handleEditPlayer = async (rosterId: string, name: string, jerseyNumber: number | null, position: string | null) => {
    setActionLoading(true);
    setActionError(null);
    const supabase = createClient();

    try {
      // Update player name/position
      const { error: playerError } = await supabase
        .from('players')
        .update({ name, position })
        .eq('id', selectedPlayer!.id);
      if (playerError) throw playerError;

      // Update jersey number on roster entry
      const { error: rosterError } = await supabase
        .from('tournament_rosters')
        .update({ jersey_number: jerseyNumber })
        .eq('id', rosterId);
      if (rosterError) throw rosterError;

      setShowEditModal(false);
      setSelectedPlayer(null);
      setToast('Player updated');
      await fetchData();
    } catch (err) {
      console.error('Edit player error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to update player');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Remove player ---
  const handleRemovePlayer = async () => {
    if (!selectedPlayer) return;
    setActionLoading(true);
    const supabase = createClient();

    try {
      // Remove from tournament_rosters
      await supabase.from('tournament_rosters').delete().eq('id', selectedPlayer.roster_id);
      setShowRemoveModal(false);
      setSelectedPlayer(null);
      setToast(`${selectedPlayer.name} removed from roster`);
      await fetchData();
    } catch (err) {
      console.error('Remove player error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Upload logo ---
  const handleLogoUpload = async (file: File) => {
    setActionLoading(true);
    setActionError(null);
    const supabase = createClient();

    try {
      const ext = file.name.split('.').pop();
      const path = `team-logos/${teamId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('team-assets')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('team-assets').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl })
        .eq('id', teamId);
      if (updateError) throw updateError;

      setShowLogoModal(false);
      setToast('Team logo updated');
      await fetchData();
    } catch (err) {
      console.error('Logo upload error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Copy join code ---
  const handleCopyCode = () => {
    if (!team?.join_code) return;
    navigator.clipboard.writeText(team.join_code);
    setToast(`Join code copied: ${team.join_code}`);
  };

  // --- Dropdown action dispatcher ---
  const handlePlayerAction = (action: DropdownAction, player: Player) => {
    setActionError(null);
    setSelectedPlayer(player);
    if (action === 'edit') setShowEditModal(true);
    if (action === 'remove') setShowRemoveModal(true);
    if (action === 'upload_logo') setShowLogoModal(true);
    if (action === 'copy_code') handleCopyCode();
  };

  // --- Stats ---
  const claimed = players.filter((p) => p.claim_status === 'claimed').length;
  const unclaimed = players.filter((p) => p.claim_status === 'unclaimed').length;
  const pending = players.filter((p) => p.claim_status === 'pending').length;

  // --- Render ---
  return (
    <div className="min-h-screen" style={{ background: '#0b0e14', color: '#e1e2eb', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .rim-light { box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05); }
        .court-texture {
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .bg-surface-container-low { background-color: #191c22; }
        .bg-surface-container { background-color: #1d2026; }
        .bg-surface-container-high { background-color: #272a31; }
        .bg-surface-container-highest { background-color: #32353c; }
        .bg-surface-container-lowest { background-color: #0b0e14; }
        .border-outline-variant { border-color: #43474f; }
        .border-secondary-container { border-color: #fe6b00; }
        .text-on-surface { color: #e1e2eb; }
        .text-on-surface-variant { color: #c3c6d0; }
        .text-outline { color: #8d919a; }
        .text-primary { color: #a5c8ff; }
        .font-data-display { font-family: 'JetBrains Mono', monospace; }
        .font-headline-md { font-family: 'Sora', sans-serif; font-weight: 600; }
        .font-body-md { font-family: 'Hanken Grotesk', sans-serif; }
        .font-label-bold { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
        .text-label-bold { font-size: 14px; font-weight: 700; }
        select option { background-color: #1d2026; }
      `}} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b flex items-center px-4 md:px-10 h-16"
        style={{ background: '#191c22', borderColor: '#43474f' }}>
        <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors active:scale-95"
            style={{ color: '#a5c8ff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#32353c')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Team logo */}
            {team?.logo_url ? (
              <img src={team.logo_url} alt="Team logo" className="w-9 h-9 rounded-lg object-cover border border-outline-variant" />
            ) : (
              <div className="w-9 h-9 rounded-lg border flex items-center justify-center"
                style={{ background: '#272a31', borderColor: '#43474f' }}>
                <span className="material-symbols-outlined text-sm" style={{ color: '#a5c8ff' }}>sports_handball</span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-md text-on-surface leading-tight truncate" style={{ fontSize: 20 }}>
                {isLoading ? 'Loading...' : team?.name ?? 'Roster'}
              </h1>
              <p className="text-on-surface-variant font-body-md text-sm">
                {players.length} players
              </p>
            </div>
          </div>
            <button
              onClick={() => { setActionError(null); setShowTournamentModal(true); }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors font-label-bold"
              style={{ borderColor: '#43474f', color: '#a5c8ff', fontFamily: 'JetBrains Mono, monospace' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#a5c8ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#43474f'; }}
            >
              <span className="material-symbols-outlined text-sm">emoji_events</span>
              Tournament
            </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              title={`Join code: ${team?.join_code}`}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors font-label-bold"
              style={{ borderColor: '#43474f', color: '#8d919a', fontFamily: 'JetBrains Mono, monospace' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#fe6b00'; (e.currentTarget as HTMLElement).style.color = '#fe6b00'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#43474f'; (e.currentTarget as HTMLElement).style.color = '#8d919a'; }}
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              {team?.join_code ?? '——'}
            </button>
            <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="court-texture pb-32 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-10 pt-8">

          {/* Stats strip */}
          {!isLoading && players.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total', value: players.length, color: '#a5c8ff' },
                { label: 'Claimed', value: claimed, color: '#00dce5' },
                { label: 'Unclaimed', value: unclaimed, color: '#ffb4ab' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-4 border rim-light"
                  style={{ background: '#1d2026', borderColor: '#43474f' }}>
                  <p className="text-on-surface-variant font-label-bold text-xs uppercase tracking-wider mb-1"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
                  <p className="font-bold text-3xl" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Roster grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fe6b00', borderTopColor: 'transparent' }} />
                <p className="text-on-surface-variant font-body-md">Loading roster...</p>
              </div>
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-24 h-24 rounded-2xl border flex items-center justify-center"
                style={{ background: '#1d2026', borderColor: '#43474f' }}>
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">group_add</span>
              </div>
              <h3 className="font-headline-md text-on-surface text-xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                No players yet
              </h3>
              <p className="text-on-surface-variant font-body-md text-sm max-w-xs">
                Add players to your roster. They can claim their slot later by joining with your team code.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <PlayerCard
                  key={player.roster_id}
                  player={player}
                  onAction={handlePlayerAction}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed footer — Add Player */}
      <footer className="fixed bottom-0 left-0 w-full p-4 md:p-8 flex justify-center items-end pointer-events-none"
        style={{ background: 'linear-gradient(to top, #0b0e14 40%, transparent)' }}>
        <button
          onClick={() => { setActionError(null); setShowAddModal(true); }}
          className="pointer-events-auto w-full max-w-md h-14 font-bold text-lg rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          style={{
            background: '#fe6b00',
            color: '#fff',
            fontFamily: 'Sora, sans-serif',
            boxShadow: '0 8px 30px rgba(254,107,0,0.4)',
          }}
        >
          <span className="material-symbols-outlined">person_add</span>
          Add Player
        </button>
      </footer>

      <JoinTournamentModal
        isOpen={showTournamentModal}
        onClose={() => { setShowTournamentModal(false); setActionError(null); }}
        onJoinExisting={handleJoinExistingTournament}
        isLoading={actionLoading}
        error={actionError}
      />
      <AddPlayerModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setActionError(null); }}
        onAdd={handleAddPlayer}
        isLoading={actionLoading}
        error={actionError}
      />
      <EditPlayerModal
        player={selectedPlayer}
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedPlayer(null); setActionError(null); }}
        onSave={handleEditPlayer}
        isLoading={actionLoading}
        error={actionError}
      />
      <ConfirmRemoveModal
        player={selectedPlayer}
        isOpen={showRemoveModal}
        onClose={() => { setShowRemoveModal(false); setSelectedPlayer(null); }}
        onConfirm={handleRemovePlayer}
        isLoading={actionLoading}
      />
      <LogoUploadModal
        isOpen={showLogoModal}
        onClose={() => { setShowLogoModal(false); setActionError(null); }}
        onUpload={handleLogoUpload}
        isLoading={actionLoading}
        error={actionError}
        currentLogoUrl={team?.logo_url ?? null}
      />

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default TeamEditInterface;