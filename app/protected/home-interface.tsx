"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// --- TypeScript Interfaces ---
interface Team {
  id: string;
  name: string;
  role: "coach" | "player" | "analyst";
  lastActive: string;
  avatarUrl?: string | null;
}

interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

// --- Main Component ---
export function HomeInterface({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();

  // --- Fetch authenticated user and their teams ---
  const fetchUserAndTeams = async () => {
    const supabase = createClient();

    // 1. Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      router.push("/auth/login");
      return;
    }

    setUser({
      id: authUser.id,
      email: authUser.email || "",
      user_metadata: authUser.user_metadata,
    });

    // 2. Fetch this user's teams via team_memberships
    const { data: userTeams, error: teamsError } = await supabase
      .from("team_memberships")
      .select(`
        role,
        teams (
          id,
          name,
          created_at
        )
      `)
  .eq("user_id", authUser.id);
  

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      setIsLoadingTeams(false);
      return;
    }

    const mapped: Team[] = (userTeams ?? []).map((row: any) => ({
      id: row.teams.id,
      name: row.teams.name,
      role: row.role as Team["role"],
      lastActive: row.teams.updated_at,
    }));

    setTeams(mapped);
    setIsLoadingTeams(false);
  };

  useEffect(() => {
    fetchUserAndTeams();
  }, []);

  // --- Create Team ---
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setCreateError("Team name is required");
      return;
    }

    setIsCreatingTeam(true);
    setCreateError(null);

    try {
      const supabase = createClient();
    const { data: existing, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", newTeamName.trim())
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) throw new Error("A team with this name already exists");
      // 1. Insert the new team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name: newTeamName.trim() })
        .select("id, name, created_at, join_code")
        .single();

      if (teamError) throw teamError;

      // 2. Add current user as coach in team_memberships with active status
      const { error: membershipError } = await supabase
        .from("team_memberships")
        .insert({
          user_id: user?.id,
          team_id: team.id,
          role: "coach",
          status: "active",
        });

      if (membershipError) throw membershipError;

      // 3. Optimistically update local state
      setTeams((prev) => [
        ...prev,
        {
          id: team.id,
          name: team.name,
          role: "coach" as Team["role"],
          lastActive: team.created_at,
        },
    ]);

    setShowCreateModal(false);
    setNewTeamName("");
  } catch (error) {
    console.error("Create team error:", error);
    setCreateError(
      error instanceof Error ? error.message : "Failed to create team"
    );
  } finally {
    setIsCreatingTeam(false);
  }
};


  const navigateToTeam = (teamName: string) => {
    const slug = teamName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    router.push(`/protected/teams/${slug}`);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // --- Loading State ---
  if (isLoadingTeams) {
    return (
      <div className="min-h-screen bg-[#10131a] technical-grid flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className={cn("flex flex-col min-h-screen", className)} {...props}>
      {/* Fonts and Global Styles */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500&family=JetBrains+Mono:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          body {
            background-color: #10131a;
            color: #e1e2eb;
            font-family: 'Hanken Grotesk', sans-serif;
          }
          .technical-grid {
            background-image: radial-gradient(circle, #2d333b 1px, transparent 1px);
            background-size: 24px 24px;
          }
          .rim-light {
            box-shadow: inset 0 0 0 1px rgba(0, 220, 229, 0.1);
          }
          .active-glow:focus-within {
            box-shadow: 0 0 8px 2px rgba(254, 107, 0, 0.3);
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-in {
            animation: slideIn 0.3s ease-out;
          }
        `,
        }}
      />

      {/* Top App Bar */}
      <header className="w-full top-0 bg-[#1a1e26] border-b border-gray-800 flex items-center justify-between px-6 md:px-12 h-16 z-50 fixed">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500 text-2xl">
            sports_handball
          </span>
          <h1 className="font-extrabold tracking-tighter text-orange-500 text-xl">
            handball.ai
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/match" className="font-bold text-cyan-500 transition-colors">
            Match
          </Link>
          <Link
            href="/players"
            className="font-bold text-gray-400 hover:text-white transition-colors"
          >
            Players
          </Link>
          <Link
            href="/tactics"
            className="font-bold text-gray-400 hover:text-white transition-colors"
          >
            Tactics
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#13161f] px-3 py-1.5 rounded-full border border-gray-800">
            <span className="material-symbols-outlined text-cyan-500 text-sm">
              person
            </span>
            <span className="font-bold text-sm text-white">
              {user?.user_metadata?.display_name ||
                user?.email?.split("@")[0] ||
                "Coach"}
            </span>
          </div>
          <button
            onClick={() => router.push("/notifications")}
            className="material-symbols-outlined text-gray-400 hover:text-cyan-500 transition-colors"
          >
            notifications
          </button>
          <button
            onClick={handleSignOut}
            className="material-symbols-outlined text-gray-400 hover:text-orange-500 transition-colors"
          >
            logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-12 pt-32 pb-12 flex-grow">
        {/* Background blur elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        {teams.length === 0 ? (
          // --- Empty State ---
          <div className="w-full max-w-2xl mx-auto text-center z-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative inline-block mb-8">
              <div className="relative bg-[#1a1e26] border border-gray-800 w-40 h-40 md:w-56 md:h-56 rounded-xl flex items-center justify-center mx-auto shadow-2xl rim-light">
                <span className="material-symbols-outlined text-gray-500 text-7xl md:text-9xl">
                  groups
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                You have no teams yet
              </h2>
              <p className="text-lg text-gray-400 max-w-md mx-auto">
                Create or join a team to get started with analytics
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full md:w-64 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg text-lg"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Create a Team
              </button>
              <button
                onClick={() => router.push("/protected/join-team")}
                className="w-full md:w-64 border-2 border-gray-700 text-gray-300 font-semibold py-4 px-8 rounded-full flex items-center justify-center gap-2 hover:bg-gray-800/50 transition-all text-lg"
              >
                <span className="material-symbols-outlined">login</span>
                Join a Team
              </button>
            </div>
          </div>
        ) : (
          // --- Teams Dashboard ---
          <div className="max-w-6xl mx-auto animate-slide-in">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Your Teams
                </h1>
                <p className="text-gray-400 mt-1">
                  Select a team to view analytics, matches, and tactics
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/protected/join-team")}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800/50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">login</span>
                  Join Team
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  New Team
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => navigateToTeam(team.name)}
                  className="bg-[#1a1e26] border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-cyan-500 text-2xl">
                        sports_handball
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        team.role === "coach"
                          ? "bg-orange-500/20 text-orange-400"
                          : team.role === "player"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-purple-500/20 text-purple-400"
                      )}
                    >
                      {team.role.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-500 transition-colors">
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Last active:{" "}
                    {new Date(team.lastActive).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex items-center text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm">View Dashboard</span>
                    <span className="material-symbols-outlined text-sm ml-1">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1e26] border-t border-gray-800 flex justify-around py-3 z-50">
        <button className="flex flex-col items-center text-cyan-500">
          <span className="material-symbols-outlined">sports_handball</span>
          <span className="text-xs mt-1">Teams</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <span className="material-symbols-outlined">person</span>
          <span className="text-xs mt-1">Profile</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>

      {/* --- Create Team Modal --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1e26] border border-gray-800 rounded-xl max-w-md w-full p-6 animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Create a Team</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                  setNewTeamName("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  TEAM NAME
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                  placeholder="e.g., Thunder HC, Elite Academy"
                  className="w-full bg-[#13161f] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors"
                  autoFocus
                />
              </div>

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setNewTeamName("");
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={isCreatingTeam}
                  className="flex-1 px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingTeam ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Gradient Footer Divider */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-cyan-500 to-purple-500 opacity-30" />
    </div>
  );
}