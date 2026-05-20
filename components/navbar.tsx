"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js"; // Import the User type

export function Navbar() {
  const [user, setUser] = useState<User | null>(null); // Use the User type
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 border-b">
      <Link href="/" className="font-bold">My App</Link>
      <div className="flex gap-4">
        <Link href="/draw-route">Draw Routes</Link>
        {user ? (
          <button onClick={() => supabase.auth.signOut()}>Logout</button>
        ) : (
          <Link href="/auth/login">Login</Link>
        )}
      </div>
    </nav>
  );
}