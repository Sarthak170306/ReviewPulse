"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

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

      console.log("[SyncUser] Syncing user with backend database...", payload);

      fetch("http://localhost:5000/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Sync failed with status: ${res.status}`);
          }
          const data = await res.json();
          console.log("[SyncUser] Backend user sync success:", data);
        })
        .catch((err) => {
          console.error("[SyncUser] Backend user sync failed:", err.message);
          // Set to false to allow retrying if it failed
          hasSynced.current = false;
        });
    }
  }, [isLoaded, user]);

  return null;
}
