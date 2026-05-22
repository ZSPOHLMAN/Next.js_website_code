'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// --- Types ---
interface JoinRequest {
  id: string;
  role: 'player' | 'coach';
  created_at: string;
  user_id: string;
  team_id: string;
  team_name: string;
  username: string;
}

const POSITIONS = [
  'Goalkeeper',
  'Left Wing',
  'Left Back',
  'Center Back',
  'Pivot',
  'Right Back',
  'Right Wing',
];

// --- Toast ---
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border shadow-2xl text-sm flex items-center gap-2"
      style={{ background: '#272a31', borderColor: '#43474f', color: '#e1e2eb', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      <span className="material-symbols-outlined text-base" style={{ color: '#00dce5' }}>check_circle</span>
      {message}
    </div>
  );
}

// --- Accept Modal ---
function AcceptModal({
  request,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  error,
}: {
  request: JoinRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, jerseyNumber: number | null, position: string | null, userId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState('');
  const [jersey, setJersey] = useState('');
  const [position, setPosition] = useState('');

  // Reset fields when a new request is loaded
  useEffect(() => {
    if (request) {
      setName(request.username);
      setJersey('');
      setPosition('');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onConfirm(
      name.trim(),
      jersey ? parseInt(jersey) : null,
      position || null,
      request.user_id,
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl w-full max-w-md p-6 shadow-2xl"
        style={{ background: '#191c22', borderColor: '#43474f' }}>
        <div className="flex justify-between items-center mb-2">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 600, color: '#e1e2eb' }}>
            Accept Request
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors"
            style={{ color: '#c3c6d0' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Who is requesting */}
        <p className="text-sm mb-6" style={{ color: '#8d919a', fontFamily: 'Hanken Grotesk, sans-serif' }}>
          Setting up roster slot for{' '}
          <strong style={{ color: '#e1e2eb' }}>{request.username}</strong>{' '}
          joining{' '}
          <strong style={{ color: '#e1e2eb' }}>{request.team_name}</strong>{' '}
          as{' '}
          <span style={{ color: request.role === 'coach' ? '#fe6b00' : '#00dce5', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            {request.role.toUpperCase()}
          </span>
        </p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#8d919a', fontFamily: 'JetBrains Mono, monospace' }}>
              Player Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full border rounded-lg px-4 py-3 outline-none transition-colors"
              style={{ background: '#1d2026', borderColor: '#43474f', color: '#e1e2eb', fontFamily: 'Hanken Grotesk, sans-serif' }}
            />
          </div>

          {/* Jersey */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#8d919a', fontFamily: 'JetBrains Mono, monospace' }}>
              Jersey Number
            </label>
            <input
              type="number"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              placeholder="e.g., 10"
              min={1}
              max={99}
              className="w-full border rounded-lg px-4 py-3 outline-none transition-colors"
              style={{ background: '#1d2026', borderColor: '#43474f', color: '#e1e2eb', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#8d919a', fontFamily: 'JetBrains Mono, monospace' }}>
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 outline-none transition-colors appearance-none"
              style={{ background: '#1d2026', borderColor: '#43474f', color: position ? '#e1e2eb' : '#8d919a', fontFamily: 'Hanken Grotesk, sans-serif' }}
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
              className="flex-1 px-4 py-3 rounded-lg border text-sm transition-all"
              style={{ borderColor: '#43474f', color: '#c3c6d0', fontFamily: 'Sora, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#a5c8ff', color: '#00315f', fontFamily: 'Sora, sans-serif' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#00315f', borderTopColor: 'transparent' }} />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Accept & Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Request Card ---
function RequestCard({
  request,
  onAccept,
  onReject,
  isLoading,
}: {
  request: JoinRequest;
  onAccept: (request: JoinRequest) => void;
  onReject: (id: string) => Promise<void>;
  isLoading: boolean;
}) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <div className="border rounded-xl p-5 rim-light flex flex-col gap-4 transition-all"
      style={{ background: '#1d2026', borderColor: '#43474f' }}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border"
          style={{ background: '#272a31', borderColor: '#43474f' }}>
          <span className="material-symbols-outlined" style={{ color: '#a5c8ff', fontSize: 22 }}>person</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-on-surface truncate" style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, color: '#e1e2eb' }}>
              {request.username}
            </p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: request.role === 'coach' ? 'rgba(254,107,0,0.15)' : 'rgba(0,220,229,0.15)',
                color: request.role === 'coach' ? '#fe6b00' : '#00dce5',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
              {request.role.toUpperCase()}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: '#c3c6d0', fontFamily: 'Hanken Grotesk, sans-serif' }}>
            wants to join <strong style={{ color: '#e1e2eb' }}>{request.team_name}</strong>
          </p>
        </div>
        <p className="text-xs flex-shrink-0" style={{ color: '#8d919a', fontFamily: 'JetBrains Mono, monospace' }}>
          {timeAgo(request.created_at)}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onReject(request.id)}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-lg border font-bold text-sm transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          style={{ borderColor: '#43474f', color: '#c3c6d0', fontFamily: 'Sora, sans-serif' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#ffb4ab';
            (e.currentTarget as HTMLElement).style.color = '#ffb4ab';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#43474f';
            (e.currentTarget as HTMLElement).style.color = '#c3c6d0';
          }}
        >
          <span className="material-symbols-outlined text-base">close</span>
          Decline
        </button>
        <button
          onClick={() => onAccept(request)}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          style={{ background: '#a5c8ff', color: '#00315f', fontFamily: 'Sora, sans-serif' }}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#00315f', borderTopColor: 'transparent' }} />
          ) : (
            <>
              <span className="material-symbols-outlined text-base">check</span>
              Accept
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---
const NotificationsInterface: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Accept modal state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [pendingAccept, setPendingAccept] = useState<JoinRequest | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const fetchRequests = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) { router.push('/auth/login'); return; }
      setUser(authUser);

      // 1. Find all teams where this user is an active coach
      const { data: coachTeams, error: coachError } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', authUser.id)
        .eq('role', 'coach')
        .eq('status', 'active');

      if (coachError) throw coachError;
      console.log('=== Coach Teams ===');
      console.log('Raw data:', coachTeams);
      const coachTeamIds = (coachTeams ?? []).map((t: any) => t.team_id);
      console.log('Coach team IDs:', coachTeamIds);

      const testTeamId = 'bb57647a-b334-4e4b-b9b3-d8cb10071cc6';

      const { data: testPending } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', testTeamId)
        .eq('status', 'pending');

      console.log('Test pending request:', testPending);
      
      if (coachTeamIds.length === 0) {
        setRequests([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch pending requests for those teams
      const { data: pendingRequests, error: requestsError } = await supabase
        .from('team_memberships')
        .select(`
          id,
          role,
          created_at,
          user_id,
          team_id,
          teams ( name ),
          users!team_memberships_user_id_fkey ( username )
        `)
        .in('team_id', coachTeamIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      console.log('=== Pending Requests ===');
      console.log('Raw data:', pendingRequests);
      console.log('Number of requests:', pendingRequests?.length || 0);

      const mapped: JoinRequest[] = (pendingRequests ?? []).map((row: any) => ({
        id: row.id,
        role: row.role,
        created_at: row.created_at,
        user_id: row.user_id,
        team_id: row.team_id,
        team_name: row.teams?.name ?? 'Unknown Team',
        username: row.users?.username ?? 'Unknown User',
      }));

      setRequests(mapped);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // --- Open accept modal ---
  const handleAccept = (request: JoinRequest) => {
    setPendingAccept(request);
    setAcceptError(null);
    setShowAcceptModal(true);
  };

  // --- Confirm accept with roster details ---
  const handleConfirmAccept = async (
    name: string,
    jerseyNumber: number | null,
    position: string | null,
    userId: string,
  ) => {
    if (!pendingAccept) return;
    setActionLoadingId(pendingAccept.id);
    setAcceptError(null);
    const supabase = createClient();

    try {
      // 1. Create player record
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ name, position })
        .select()
        .single();
      if (playerError) throw playerError;

      // 2. Get a tournament for this team
      const { data: tournaments } = await supabase
        .from('tournament_rosters')
        .select('tournament_id')
        .eq('team_id', pendingAccept.team_id)
        .limit(1);

      const tournamentId = tournaments?.[0]?.tournament_id;
      if (!tournamentId) throw new Error('No tournament found for this team. Have the coach join a tournament first.');

      // 3. Insert into tournament_rosters — already claimed since we know who it is
      const { error: rosterError } = await supabase
        .from('tournament_rosters')
        .insert({
          tournament_id: tournamentId,
          team_id: pendingAccept.team_id,
          player_id: player.id,
          jersey_number: jerseyNumber,
          claim_status: 'claimed',
          user_id: userId,
        });
      if (rosterError) throw rosterError;

      // 4. Activate the membership
      const { error: membershipError } = await supabase
        .from('team_memberships')
        .update({ status: 'active' })
        .eq('id', pendingAccept.id);
      if (membershipError) throw membershipError;

      setRequests((prev) => prev.filter((r) => r.id !== pendingAccept.id));
      setShowAcceptModal(false);
      setPendingAccept(null);
      setToast(`${name} added to roster`);
    } catch (err) {
      console.error('Accept error:', err);
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Reject request ---
  const handleReject = async (membershipId: string) => {
    setActionLoadingId(membershipId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;

      const rejected = requests.find((r) => r.id === membershipId);
      setRequests((prev) => prev.filter((r) => r.id !== membershipId));
      setToast(`${rejected?.username ?? 'User'} declined`);
    } catch (err) {
      console.error('Reject error:', err);
      setToast('Failed to decline request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen" style={{ background: '#0b0e14', color: '#e1e2eb', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .rim-light { box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05); }
        .court-texture {
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .text-on-surface { color: #e1e2eb; }
        .text-on-surface-variant { color: #c3c6d0; }
        .border-outline-variant { border-color: #43474f; }
      `}} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b flex items-center px-4 md:px-10 h-16"
        style={{ background: '#191c22', borderColor: '#43474f' }}>
        <div className="flex items-center gap-4 w-full max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors active:scale-95"
            style={{ color: '#a5c8ff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#32353c')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 600, color: '#e1e2eb', lineHeight: 1.3 }}>
              Notifications
            </h1>
            {!isLoading && (
              <p style={{ color: '#8d919a', fontSize: 13, fontFamily: 'Hanken Grotesk, sans-serif' }}>
                {requests.length > 0
                  ? `${requests.length} pending request${requests.length > 1 ? 's' : ''}`
                  : 'All caught up'}
              </p>
            )}
          </div>
          <div className="ml-auto">
            <span className="material-symbols-outlined" style={{ color: '#c3c6d0' }}>account_circle</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="court-texture min-h-screen pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-10 pt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#fe6b00', borderTopColor: 'transparent' }} />
              <p style={{ color: '#c3c6d0', fontFamily: 'Hanken Grotesk, sans-serif' }}>Loading notifications...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="material-symbols-outlined text-5xl" style={{ color: '#ffb4ab' }}>error</span>
              <p style={{ color: '#c3c6d0' }}>{loadError}</p>
              <button onClick={fetchRequests}
                className="px-4 py-2 rounded-lg border text-sm transition-all"
                style={{ borderColor: '#43474f', color: '#c3c6d0' }}>
                Try again
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-24 h-24 rounded-2xl border flex items-center justify-center"
                style={{ background: '#1d2026', borderColor: '#43474f' }}>
                <span className="material-symbols-outlined text-5xl" style={{ color: '#8d919a' }}>notifications_none</span>
              </div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 600, color: '#e1e2eb' }}>
                No pending requests
              </h3>
              <p style={{ color: '#8d919a', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: 14, maxWidth: 280 }}>
                When players request to join your teams, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Array.from(new Set(requests.map((r) => r.team_id))).map((teamId) => {
                const teamRequests = requests.filter((r) => r.team_id === teamId);
                const teamName = teamRequests[0].team_name;
                return (
                  <div key={teamId}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: '#8d919a', fontFamily: 'JetBrains Mono, monospace' }}>
                      {teamName}
                    </p>
                    <div className="flex flex-col gap-3">
                      {teamRequests.map((req) => (
                        <RequestCard
                          key={req.id}
                          request={req}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          isLoading={actionLoadingId === req.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Accept modal */}
      <AcceptModal
        request={pendingAccept}
        isOpen={showAcceptModal}
        onClose={() => { setShowAcceptModal(false); setPendingAccept(null); setAcceptError(null); }}
        onConfirm={handleConfirmAccept}
        isLoading={actionLoadingId !== null}
        error={acceptError}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default NotificationsInterface;