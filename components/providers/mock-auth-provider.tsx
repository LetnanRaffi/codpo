"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { MOCK_USER } from "@/lib/mock/data";
import type { MockUser } from "@/lib/types";

interface MockAuthState {
  user: MockUser | null;
  toggle: () => void;
}

const MockAuthContext = createContext<MockAuthState | null>(null);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const toggle = useCallback(() => setUser((u) => (u ? null : MOCK_USER)), []);
  const value = useMemo(() => ({ user, toggle }), [user, toggle]);

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) {
    throw new Error("useMockAuth harus dipakai di dalam MockAuthProvider");
  }
  return ctx;
}
