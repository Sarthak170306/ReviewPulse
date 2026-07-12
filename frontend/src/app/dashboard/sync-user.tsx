"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

// Sync user state with backend once
export default function SyncUser() {
  const { user, isLoaded } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasSynced.current) {
      hasSynced.current = true;
      
      const payload = {
        id: user.id,
        name: user.fullName || user.username || "CodePulse User",
        email: user.primaryEmailAddress?.emailAddress || ""
      };

      console.log("[SyncUser] Syncing user with backend...", payload);

      fetch("http://localhost:5000/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Status: ${res.status}`);
          const data = await res.json();
          console.log("[SyncUser] Sync success:", data);
        })
        .catch((err) => {
          console.error("[SyncUser] Sync failed:", err.message);
          hasSynced.current = false;
        });
    }
  }, [isLoaded, user]);

  return null;
}