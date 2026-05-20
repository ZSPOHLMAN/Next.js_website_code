'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// --- Types ---
interface Team {
  id: string;
  name: string;
  join_code: string;
  logo_url?: string | null;
  created_at: string;
}

type Role = 'player' | 'coach';
type RequestStatus = 'idle' | 'pending' | 'success' | 'error';

interface CardState {
  role: Role;
  status: RequestStatus;
  error: string | null;
}

// --- TeamCard Component ---
const TeamCard: React.FC<{
  team: Team;
  cardState: CardState;
  onRoleChange: (teamId: string, role: Role) => void;
  onJoinRequest: (teamId: string) => void;
  onCancelRequest: (teamId: string) => void;
}> = ({ team, cardState, onRoleChange, onJoinRequest, onCancelRequest }) => {
  const initials = team.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="bg-surface-container border border-outline-variant rounded-xl p-6 rim-light flex flex-col justify-between hover:border-tertiary-fixed-dim transition-colors group relative overflow-hidden"
      style={cardState.status === 'success' ? { borderColor: '#00dce5' } : {}}
    >
      {/* Success Overlay */}
      {cardState.status === 'success' && (
        <div className="absolute inset-0 bg-surface-container-lowest/90 z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border"
            style={{ backgroundColor: 'rgba(0,59,62,0.2)', borderColor: 'rgba(0,220,229,0.3)' }}>
            <span
              className="material-symbols-outlined text-tertiary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1", color: '#00dce5' }}
            >
              check_circle
            </span>
          </div>
          <h4 className="font-headline-md text-headline-md text-on-surface mb-2">
            Request sent
          </h4>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Awaiting coach approval for {team.name}.
          </p>
          <button
            onClick={() => onCancelRequest(team.id)}
            className="mt-6 font-label-bold text-label-bold border-b pb-1 hover:opacity-80 transition-opacity"
            style={{ color: '#00dce5', borderColor: 'rgba(0,220,229,0.3)' }}
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* Card Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center border border-outline-variant overflow-hidden flex-shrink-0">
            {team.logo_url ? (
              <img src={team.logo_url} alt={`${team.name} logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary">sports_handball</span>
            )}
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
              {team.name}
            </h3>
            <p className="text-outline text-sm font-mono mt-1">Code: {team.join_code}</p>
          </div>
        </div>
      </div>

      {/* Role Selector + Join Button */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="font-label-bold text-label-bold text-outline uppercase tracking-wider text-[11px]">
            Select Role
          </span>
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            <button
              onClick={() => onRoleChange(team.id, 'player')}
              className={`flex-1 py-2 font-label-bold text-label-bold rounded-lg transition-all ${
                cardState.role === 'player'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Player
            </button>
            <button
              onClick={() => onRoleChange(team.id, 'coach')}
              className={`flex-1 py-2 font-label-bold text-label-bold rounded-lg transition-all ${
                cardState.role === 'coach'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Coach
            </button>
          </div>
        </div>

        {cardState.error && (
          <p className="text-sm" style={{ color: '#ffb4ab' }}>{cardState.error}</p>
        )}

        <button
          onClick={() => onJoinRequest(team.id)}
          disabled={cardState.status === 'pending'}
          className="w-full bg-primary text-on-primary font-headline-md py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cardState.status === 'pending' ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">person_add</span>
              Request to Join
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---
const JoinTeamInterface: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const router = useRouter();

  // --- Filtered teams by search ---
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    return teams.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, teams]);

  // --- Initialize card state when teams load ---
  const initCardStates = (teams: Team[]) => {
    const states: Record<string, CardState> = {};
    teams.forEach((t) => {
      states[t.id] = { role: 'player', status: 'idle', error: null };
    });
    setCardStates(states);
  };

  // --- Fetch user + available teams ---
  const fetchTeams = async () => {
    const supabase = createClient();
    setIsLoadingTeams(true);

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push('/auth/login');
        return;
      }
      setUser(authUser);

      // Get teams user is already in (any status)
      const { data: memberships } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', authUser.id);

      const existingIds = (memberships ?? []).map((m: any) => m.team_id);

      // Fetch all other teams
      let query = supabase
        .from('teams')
        .select('id, name, join_code, logo_url, created_at')
        .order('name');

      if (existingIds.length > 0) {
        query = query.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data: availableTeams, error: teamsError } = await query;
      if (teamsError) throw teamsError;

      setTeams(availableTeams ?? []);
      initCardStates(availableTeams ?? []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // --- Role toggle ---
  const handleRoleChange = (teamId: string, role: Role) => {
    setCardStates((prev) => ({
      ...prev,
      [teamId]: { ...prev[teamId], role },
    }));
  };

  // --- Submit join request ---
  const handleJoinRequest = async (teamId: string) => {
    const supabase = createClient();
    const state = cardStates[teamId];

    setCardStates((prev) => ({
      ...prev,
      [teamId]: { ...prev[teamId], status: 'pending', error: null },
    }));

    try {
      // Check for existing membership
      const { data: existing } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('user_id', user?.id)
        .eq('team_id', teamId)
        .maybeSingle();

      if (existing) throw new Error('You already have a pending or active membership for this team');

      const { error } = await supabase.from('team_memberships').insert({
        user_id: user?.id,
        team_id: teamId,
        role: state.role,
        status: 'pending',
      });

      if (error) throw error;

      setCardStates((prev) => ({
        ...prev,
        [teamId]: { ...prev[teamId], status: 'success', error: null },
      }));
    } catch (error) {
      console.error('Join request error:', error);
      setCardStates((prev) => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to send request',
        },
      }));
    }
  };

  // --- Cancel request ---
  const handleCancelRequest = async (teamId: string) => {
    const supabase = createClient();

    try {
      await supabase
        .from('team_memberships')
        .delete()
        .eq('user_id', user?.id)
        .eq('team_id', teamId)
        .eq('status', 'pending');

      setCardStates((prev) => ({
        ...prev,
        [teamId]: { role: 'player', status: 'idle', error: null },
      }));
    } catch (error) {
      console.error('Cancel request error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background court-grid">
      {/* Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .rim-light {
          box-shadow: inset 0 0 0 1px rgba(165, 200, 255, 0.1);
        }
        .court-grid {
          background-image: radial-gradient(rgba(141, 145, 154, 0.1) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .font-headline-md { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.3; }
        .text-headline-md { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.3; }
        .font-body-md { font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; font-weight: 400; }
        .text-body-md { font-size: 16px; line-height: 1.5; }
        .font-label-bold { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; }
        .text-label-bold { font-size: 14px; font-weight: 700; }
        .bg-background { background-color: #10131a; }
        .bg-surface { background-color: #10131a; }
        .bg-surface-container { background-color: #1d2026; }
        .bg-surface-container-low { background-color: #191c22; }
        .bg-surface-container-high { background-color: #272a31; }
        .bg-surface-container-lowest { background-color: #0b0e14; }
        .bg-surface-variant { background-color: #32353c; }
        .bg-primary { background-color: #a5c8ff; }
        .bg-primary-container { background-color: #003566; }
        .bg-secondary-container { background-color: #fe6b00; }
        .text-primary { color: #a5c8ff; }
        .text-on-primary { color: #00315f; }
        .text-on-secondary-container { color: #572000; }
        .text-on-surface { color: #e1e2eb; }
        .text-on-surface-variant { color: #c3c6d0; }
        .text-outline { color: #8d919a; }
        .text-outline-variant { color: #43474f; }
        .text-tertiary { color: #00dce5; }
        .text-on-primary-container { color: #7a9fd6; }
        .border-outline-variant { border-color: #43474f; }
        .border-outline { border-color: #8d919a; }
        .border-primary { border-color: #a5c8ff; }
        .border-tertiary-fixed-dim { border-color: #00dce5; }
        .placeholder-outline-variant::placeholder { color: #43474f; }
        .focus\:border-secondary-container:focus { border-color: #fe6b00; }
        .hover\:bg-surface-variant:hover { background-color: #32353c; }
        .bg-primary-container\/20 { background-color: rgba(0,53,102,0.2); }
        .border-primary\/30 { border-color: rgba(165,200,255,0.3); }
        .bg-tertiary-container\/20 { background-color: rgba(0,59,62,0.2); }
        .border-tertiary-fixed-dim\/30 { border-color: rgba(0,220,229,0.3); }
        .bg-surface-container-lowest\/90 { background-color: rgba(11,14,20,0.9); }
        .px-margin-mobile { padding-left: 16px; padding-right: 16px; }
        .gap-gutter-desktop { gap: 24px; }
        @media (min-width: 768px) {
          .md\:px-margin-desktop { padding-left: 40px; padding-right: 40px; }
        }
        .max-w-container-max { max-width: 1440px; }
      `}} />

      {/* TopAppBar */}
      <nav className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-margin-mobile h-14 z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-primary hover:bg-surface-variant transition-colors active:scale-95 duration-100 p-2 rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-primary">Join a Team</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-sm hidden sm:inline">{user?.email}</span>
          <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
        </div>
      </nav>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
        {/* Search */}
        <section className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-b-2 border-outline focus:border-secondary-container focus:ring-0 text-on-surface font-body-md py-4 pl-12 pr-4 transition-all duration-200 outline-none placeholder-outline-variant"
              placeholder="Find teams by name..."
              style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
            />
          </div>
        </section>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-desktop">
          {isLoadingTeams ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-4 text-on-surface-variant">Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-outline text-6xl block mb-4">
                  sports_handball
                </span>
                <h3 className="font-headline-md text-on-surface mb-2">
                  {searchQuery ? 'No teams found' : 'No teams available'}
                </h3>
                <p className="text-on-surface-variant mb-6 font-body-md">
                  {searchQuery
                    ? `No teams match "${searchQuery}"`
                    : "There aren't any teams you can join right now"}
                </p>
                <button
                  onClick={() => router.push('/protected')}
                  className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold hover:brightness-110 transition-all"
                >
                  Create Your Own Team
                </button>
              </div>
            </div>
          ) : (
            filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                cardState={cardStates[team.id] ?? { role: 'player', status: 'idle', error: null }}
                onRoleChange={handleRoleChange}
                onJoinRequest={handleJoinRequest}
                onCancelRequest={handleCancelRequest}
              />
            ))
          )}

          {/* Can't find your team bento */}
          {!isLoadingTeams && (
            <div className="md:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-8 flex flex-col items-start justify-center">
              <h2 className="font-headline-md text-primary mb-3">Can't find your team?</h2>
              <p className="text-on-surface-variant font-body-md mb-6">
                Register a new team and invite your players to join.
              </p>
              <button
                onClick={() => router.push('/protected')}
                className="bg-transparent border-2 text-secondary-container px-8 py-3 font-headline-md rounded-lg transition-all hover:brightness-110"
                style={{ borderColor: '#fe6b00', color: '#fe6b00' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fe6b00';
                  (e.currentTarget as HTMLButtonElement).style.color = '#561f00';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fe6b00';
                }}
              >
                Register New Team
              </button>
            </div>
          )}

          {/* Info banner */}
          {!isLoadingTeams && (
            <div className="bg-primary-container/20 border border-primary/30 p-6 rounded-xl flex items-start gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">info</span>
              <div className="font-body-md text-body-md text-on-primary-container">
                <strong>Note:</strong> Join requests are manually reviewed by team administrators.
                You will be notified once your status is updated.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JoinTeamInterface;