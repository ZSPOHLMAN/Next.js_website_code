"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username },
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-screen", className)} {...props}>
      {/* Fonts and Styles */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .rim-light {
            box-shadow: inset 0 0 0 1px rgba(0, 220, 229, 0.1), 0 0 15px rgba(0, 220, 229, 0.05);
          }
          .input-focus-glow:focus {
            box-shadow: 0 0 10px 2px rgba(254, 107, 0, 0.2);
            border-color: #fe6b00 !important;
          }
          .glass-panel {
            background: rgba(29, 32, 38, 0.8);
            backdrop-filter: blur(12px);
          }
          .bg-grid {
            background-image: linear-gradient(rgba(45, 51, 59, 0.1) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(45, 51, 59, 0.1) 1px, transparent 1px);
            background-size: 32px 32px;
          }
          @media (max-width: 768px) {
            .bg-grid {
              background-size: 24px 24px;
            }
          }
          @media (max-width: 640px) {
            .bg-grid {
              background-size: 16px 16px;
            }
          }
        `
      }} />
      
      <div className="flex-1 bg-grid overflow-auto">
        {/* TopAppBar */}
        <header className="w-full bg-[#1a1e26] border-b border-gray-800 flex items-center justify-between px-8 md:px-6 sm:px-4 h-20 md:h-16 sm:h-14 z-50 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-500 text-3xl md:text-2xl sm:text-xl">
              sports_handball
            </span>
            <h1 className="font-extrabold tracking-tighter text-orange-500 text-2xl md:text-xl sm:text-base">
              handball.ai
            </h1>
          </div>
          <div className="flex items-center gap-8 lg:gap-6 md:gap-4">
            <Link
              className="text-base lg:text-sm md:text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors tracking-wide touch-manipulation"
              href="/auth/login"
            >
              LOGIN
            </Link>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex items-center justify-center relative px-8 md:px-6 sm:px-4 py-12 md:py-8 sm:py-6 min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-3.5rem)]">
          {/* Visual Backdrop Decor */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 md:w-80 sm:w-64 bg-orange-500/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-96 md:w-80 sm:w-64 bg-cyan-500/20 rounded-full blur-[100px]" />
          </div>
          
          {/* Center-aligned Card */}
          <div className="w-full max-w-[700px] lg:max-w-[600px] md:max-w-[550px] sm:max-w-[90%] bg-gray-900/80 border border-gray-700/50 overflow-hidden rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl">
            <div className="p-10 lg:p-8 md:p-8 sm:p-5">
              {/* Header */}
              <div className="mb-12 lg:mb-10 md:mb-10 sm:mb-6">
                <h1 className="text-5xl lg:text-4xl md:text-4xl font-bold text-white mb-3 sm:text-2xl" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Create Your Account
                </h1>
                <p className="text-lg lg:text-base md:text-base text-gray-400 sm:text-sm" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
                  Register your credentials to access the analytics dashboard.
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-8 lg:space-y-6 md:space-y-6 sm:space-y-4">
                {/* Username Field */}
                <div className="group">
                  <label className="block text-sm lg:text-xs md:text-xs font-bold text-cyan-400 mb-3 lg:mb-2 md:mb-2 sm:mb-1.5 uppercase tracking-tight" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-gray-950 border-b-2 border-gray-700 text-white py-5 lg:py-4 md:py-4 sm:py-3 px-5 lg:px-4 md:px-4 sm:px-3 focus:outline-none input-focus-glow transition-all rounded-t-lg text-lg lg:text-base md:text-base sm:text-sm touch-manipulation"
                      id="username"
                      type="text"
                      placeholder=""
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="material-symbols-outlined absolute right-5 lg:right-4 md:right-4 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600 text-3xl lg:text-2xl md:text-2xl sm:text-xl">
                      person
                    </span>
                  </div>
                </div>
                
                {/* Email Field */}
                <div className="group">
                  <label className="block text-sm lg:text-xs md:text-xs font-bold text-cyan-400 mb-3 lg:mb-2 md:mb-2 sm:mb-1.5 uppercase tracking-tight" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-gray-950 border-b-2 border-gray-700 text-white py-5 lg:py-4 md:py-4 sm:py-3 px-5 lg:px-4 md:px-4 sm:px-3 focus:outline-none input-focus-glow transition-all rounded-t-lg text-lg lg:text-base md:text-base sm:text-sm touch-manipulation"
                      id="email"
                      type="email"
                      placeholder=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="material-symbols-outlined absolute right-5 lg:right-4 md:right-4 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600 text-3xl lg:text-2xl md:text-2xl sm:text-xl">
                      mail
                    </span>
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="group">
                  <label className="block text-sm lg:text-xs md:text-xs font-bold text-cyan-400 mb-3 lg:mb-2 md:mb-2 sm:mb-1.5 uppercase tracking-tight" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-gray-950 border-b-2 border-gray-700 text-white py-5 lg:py-4 md:py-4 sm:py-3 px-5 lg:px-4 md:px-4 sm:px-3 focus:outline-none input-focus-glow transition-all rounded-t-lg text-lg lg:text-base md:text-base sm:text-sm touch-manipulation"
                      id="password"
                      type="password"
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="material-symbols-outlined absolute right-5 lg:right-4 md:right-4 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600 text-3xl lg:text-2xl md:text-2xl sm:text-xl">
                      lock
                    </span>
                  </div>
                </div>
                
                {/* Repeat Password Field */}
                <div className="group">
                  <label className="block text-sm lg:text-xs md:text-xs font-bold text-cyan-400 mb-3 lg:mb-2 md:mb-2 sm:mb-1.5 uppercase tracking-tight" htmlFor="repeat-password">
                    Repeat Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-gray-950 border-b-2 border-gray-700 text-white py-5 lg:py-4 md:py-4 sm:py-3 px-5 lg:px-4 md:px-4 sm:px-3 focus:outline-none input-focus-glow transition-all rounded-t-lg text-lg lg:text-base md:text-base sm:text-sm touch-manipulation"
                      id="repeat-password"
                      type="password"
                      placeholder=""
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      required
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="material-symbols-outlined absolute right-5 lg:right-4 md:right-4 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600 text-3xl lg:text-2xl md:text-2xl sm:text-xl">
                      lock
                    </span>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && <p className="text-base lg:text-sm md:text-sm sm:text-xs text-red-500">{error}</p>}
                
                {/* Submit Button */}
                <div className="pt-6 lg:pt-4 md:pt-4 sm:pt-3">
                  <button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 lg:py-5 md:py-5 sm:py-4 rounded-lg active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed text-lg lg:text-base md:text-base sm:text-sm touch-manipulation min-h-[44px]"
                    type="submit"
                    disabled={isLoading}
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {isLoading ? "Creating an account..." : "Sign Up"}
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1 text-3xl lg:text-2xl md:text-2xl sm:text-xl">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
              
              {/* Login Link */}
              <div className="mt-14 lg:mt-12 md:mt-12 pt-10 lg:pt-8 md:pt-8 sm:mt-8 sm:pt-6 border-t border-gray-700/30 text-center">
                <p className="text-lg lg:text-base md:text-base text-gray-400 sm:text-sm">
                  Already have an account?
                  <Link href="/auth/login" className="text-orange-500 font-bold hover:underline ml-1 touch-manipulation">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="text-center py-8 lg:py-6 md:py-6 sm:py-4">
          <div className="flex items-center justify-center gap-6 lg:gap-4 md:gap-4 sm:gap-2 opacity-40 flex-wrap px-4">
            <span className="font-bold text-xs lg:text-[10px] md:text-[10px] sm:text-[8px] uppercase tracking-[0.25em] lg:tracking-[0.2em] md:tracking-[0.2em] sm:tracking-[0.15em] text-gray-500">
              Secure Transmission
            </span>
            <div className="w-1.5 h-1.5 lg:w-1 lg:h-1 md:w-1 md:h-1 sm:w-0.5 sm:h-0.5 bg-gray-600 rounded-full" />
            <span className="font-bold text-xs lg:text-[10px] md:text-[10px] sm:text-[8px] uppercase tracking-[0.25em] lg:tracking-[0.2em] md:tracking-[0.2em] sm:tracking-[0.15em] text-gray-500">
              v4.2.0-ALFA
            </span>
            <div className="w-1.5 h-1.5 lg:w-1 lg:h-1 md:w-1 md:h-1 sm:w-0.5 sm:h-0.5 bg-gray-600 rounded-full" />
            <span className="font-bold text-xs lg:text-[10px] md:text-[10px] sm:text-[8px] uppercase tracking-[0.25em] lg:tracking-[0.2em] md:tracking-[0.2em] sm:tracking-[0.15em] text-gray-500">
              Global Sync Enabled
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}