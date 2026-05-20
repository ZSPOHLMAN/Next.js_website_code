"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Add fonts and styles */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500&family=JetBrains+Mono:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      
      <style dangerouslySetInnerHTML={{
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
        `
      }} />
      
      <div className="min-h-screen bg-[#10131a] technical-grid">
        {/* TopAppBar */}
        <header className="w-full top-0 bg-[#1a1e26] border-b border-gray-800 flex items-center justify-between px-6 md:px-12 h-16 z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-2xl">
              sports_handball
            </span>
            <h1 className="font-extrabold tracking-tighter text-orange-500 text-xl">
              handball.ai
            </h1>
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center relative px-6 py-12">
          {/* Abstract Background Element */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>
          
          <section className="w-full max-w-[440px] z-10">
            {/* Sign In Card */}
            <div className="bg-[#1a1e26] border border-gray-800 rounded-xl p-8 md:p-10 relative overflow-hidden rim-light">
              {/* Visual Accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
              
              <header className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Welcome Back
                </h2>
                <p className="text-gray-400" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
                  Access your tactical dashboard and player analytics.
                </p>
              </header>
              
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2 active-glow group">
                  <label
                    className="text-xs font-bold text-gray-400 group-focus-within:text-cyan-500 transition-colors tracking-wide"
                    htmlFor="email"
                  >
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">
                      mail
                    </span>
                    <input
                      className="w-full bg-[#13161f] border-b-2 border-gray-700 focus:border-cyan-500 text-white py-3 pl-12 pr-4 outline-none transition-all placeholder:text-gray-600"
                      id="email"
                      type="email"
                      placeholder=""
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-2 active-glow group">
                  <div className="flex justify-between items-center">
                    <label
                      className="text-xs font-bold text-gray-400 group-focus-within:text-cyan-500 transition-colors tracking-wide"
                      htmlFor="password"
                    >
                      PASSWORD
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-bold text-purple-400 hover:underline"
                    >
                      FORGOT?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">
                      lock
                    </span>
                    <input
                      className="w-full bg-[#13161f] border-b-2 border-gray-700 focus:border-cyan-500 text-white py-3 pl-12 pr-4 outline-none transition-all placeholder:text-gray-600"
                      id="password"
                      type="password"
                      placeholder=""
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
                    />
                  </div>
                </div>
                
                {/* Error Message */}
                {error && <p className="text-sm text-red-500">{error}</p>}
                
                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
              
              <footer className="mt-8 pt-8 border-t border-gray-800 text-center">
                <p className="text-gray-400">
                  New to the sideline?
                  <Link
                    href="/auth/sign-up"
                    className="text-orange-500 font-bold hover:text-purple-400 transition-colors ml-1"
                  >
                    Create Account
                  </Link>
                </p>
              </footer>
            </div>
          </section>
        </main>
        
        {/* Visual Divider */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-cyan-500 to-purple-500 opacity-30" />
      </div>
    </div>
  );
}