import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { generateKeyPair, storePrivateKey, getStoredPrivateKey } from '@/lib/crypto';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  privateKey: string | null;
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  claimAdmin: () => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const HEARTBEAT_MS = 15000;
const STALE_MS = 45000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});

  const refreshPresence = useCallback(async () => {
    const cutoff = new Date(Date.now() - STALE_MS).toISOString();
    const { data } = await supabase
      .from('presence')
      .select('user_id, last_seen');
    if (data) {
      const online = new Set<string>();
      const seen: Record<string, string> = {};
      for (const r of data as { user_id: string; last_seen: string }[]) {
        seen[r.user_id] = r.last_seen;
        if (r.last_seen > cutoff) online.add(r.user_id);
      }
      setOnlineUserIds(online);
      setLastSeenMap(seen);
    }
  }, []);

  const sendHeartbeat = useCallback(async (uid: string) => {
    await supabase.from('presence').upsert({
      user_id: uid,
      last_seen: new Date().toISOString(),
      is_online: true,
    });
  }, []);

  const markOffline = useCallback(async (uid: string) => {
    await supabase.from('presence').update({
      is_online: false,
      last_seen: new Date().toISOString(),
    }).eq('user_id', uid);
  }, []);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    const p = data as Profile | null;
    setProfile(p);

    // Ensure user has an E2E key pair
    if (p) {
      const stored = getStoredPrivateKey(uid);
      if (stored) {
        setPrivateKey(stored);
      } else if (!p.public_key) {
        const { publicKey, privateKey: priv } = await generateKeyPair();
        storePrivateKey(uid, priv);
        setPrivateKey(priv);
        await supabase.from('profiles').update({ public_key: publicKey }).eq('id', uid);
      } else {
        // Public key exists but private key not in localStorage — user may have switched devices
        // We still set privateKey to null; encryption will be skipped for this session
        setPrivateKey(null);
      }
    }
  }

  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    let currentUid: string | null = null;
    let currentAccessToken: string | null = null;

    function startIntervals() {
      if (heartbeatTimer || !currentUid) return;
      heartbeatTimer = setInterval(() => {
        if (currentUid) sendHeartbeat(currentUid);
      }, HEARTBEAT_MS);

      refreshTimer = setInterval(async () => {
        await supabase.rpc('cleanup_stale_presence');
        refreshPresence();
      }, HEARTBEAT_MS);
    }

    function stopIntervals() {
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = undefined; }
      if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = undefined; }
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        currentUid = data.session.user.id;
        currentAccessToken = data.session.access_token ?? null;
        loadProfile(data.session.user.id).finally(() => setLoading(false));
        sendHeartbeat(currentUid);
        refreshPresence();
        startIntervals();
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        currentUid = newSession.user.id;
        currentAccessToken = newSession.access_token ?? null;
        loadProfile(newSession.user.id).finally(() => setLoading(false));
        sendHeartbeat(currentUid);
        refreshPresence();
        startIntervals();
      } else {
        currentUid = null;
        currentAccessToken = null;
        stopIntervals();
        setProfile(null);
        setOnlineUserIds(new Set());
        setLoading(false);
      }
    });

    // Also run cleanup + refresh on window focus/visibilitychange
    // so stale users are caught quickly when someone returns to the tab
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && currentUid) {
        sendHeartbeat(currentUid);
        supabase.rpc('cleanup_stale_presence').then(() => refreshPresence());
      }
    };
    document.addEventListener('visibilitychange', handleVisible);

    const presenceChannel = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence' },
        () => refreshPresence()
      )
      .subscribe();

    const handleUnload = () => {
      if (currentUid) {
        const body = JSON.stringify({
          user_id: currentUid,
          last_seen: new Date().toISOString(),
          is_online: false,
        });
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/presence?on_conflict=user_id`;
        // sendBeacon can't set custom headers, so use fetch with keepalive
        try {
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              ...(currentAccessToken ? { 'Authorization': `Bearer ${currentAccessToken}` } : {}),
              'Prefer': 'resolution=merge-duplicates',
            },
            body,
            keepalive: true,
          }).catch(() => {});
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      stopIntervals();
      supabase.removeChannel(presenceChannel);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisible);
      authListener.subscription.unsubscribe();
    };
  }, [sendHeartbeat, refreshPresence]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await loadProfile(data.user.id);
    }
    return { error: null };
  }

  async function signOut() {
    if (user) {
      await markOffline(user.id);
    }
    await supabase.auth.signOut();
    setProfile(null);
    setOnlineUserIds(new Set());
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  async function claimAdmin() {
    const { data, error } = await supabase.rpc('claim_first_admin');
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'An admin already exists.' };
    await refreshProfile();
    return { success: true, error: null };
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, privateKey, isOnline: (uid: string) => onlineUserIds.has(uid), getLastSeen: (uid: string) => lastSeenMap[uid] ?? null, signIn, signUp, signOut, refreshProfile, claimAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
