
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase, isConfigured } from './supabase';
import { User, Bet, GameResult, AppConfig, GameMode, RechargeRequest, WithdrawRequest, Language, BetColor } from './types';
import { INITIAL_CONFIG, COLOR_MAP, BIG_SMALL_MAP, MULTIPLIERS } from './constants';
import { translations } from './translations';
import Home from './pages/Home';
import Aviator from './pages/Aviator';
import Login from './pages/Login';
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import Referral from './pages/Referral';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';

interface AppState {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  bets: Bet[];
  setBets: React.Dispatch<React.SetStateAction<Bet[]>>;
  results: Record<GameMode, GameResult[]>;
  setResults: React.Dispatch<React.SetStateAction<Record<GameMode, GameResult[]>>>;
  rechargeRequests: RechargeRequest[];
  setRechargeRequests: React.Dispatch<React.SetStateAction<RechargeRequest[]>>;
  withdrawRequests: WithdrawRequest[];
  setWithdrawRequests: React.Dispatch<React.SetStateAction<WithdrawRequest[]>>;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  t: (key: keyof typeof translations.EN) => string;
  refreshUserData: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('cp_lang') as Language) || 'HI');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('cp_isAdmin') === 'true');
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [bets, setBets] = useState<Bet[]>([]);
  const [results, setResults] = useState<Record<GameMode, GameResult[]>>({ '30s': [], '1m': [], '3m': [], '5m': [], 'aviator': [] });
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);

  const t = (key: keyof typeof translations.EN) => (translations[language] as any)[key] || key;

  const refreshUserData = useCallback(async () => {
    const savedUserId = localStorage.getItem('cp_user_id');
    if (!savedUserId) return;
    const { data } = await supabase.from('users').select('*').eq('id', savedUserId).single();
    if (data) setUser(data);
  }, []);

  const fetchRequests = useCallback(async () => {
    const savedUserId = localStorage.getItem('cp_user_id');
    if (!savedUserId && !isAdmin) return;

    try {
      let betsQuery = supabase.from('bets').select('*').order('createdAt', { ascending: false });
      let rechargesQuery = supabase.from('recharges').select('*').order('createdAt', { ascending: false });
      let withdrawalsQuery = supabase.from('withdrawals').select('*').order('createdAt', { ascending: false });

      if (!isAdmin && savedUserId) {
        betsQuery = betsQuery.eq('userId', savedUserId);
        rechargesQuery = rechargesQuery.eq('userId', savedUserId);
        withdrawalsQuery = withdrawalsQuery.eq('userId', savedUserId);
      }

      const [betsRes, rechargesRes, withdrawalsRes] = await Promise.all([
        betsQuery.limit(isAdmin ? 200 : 50),
        rechargesQuery.limit(isAdmin ? 200 : 50),
        withdrawalsQuery.limit(isAdmin ? 200 : 50)
      ]);

      if (betsRes.data) setBets(betsRes.data);
      if (rechargesRes.data) setRechargeRequests(rechargesRes.data);
      if (withdrawalsRes.data) setWithdrawRequests(withdrawalsRes.data);
    } catch (err) {}
  }, [isAdmin]);

  const fetchResults = useCallback(async () => {
    const { data } = await supabase.from('results').select('*').order('timestamp', { ascending: false }).limit(200);
    if (data) {
      const grouped: any = { '30s': [], '1m': [], '3m': [], '5m': [], 'aviator': [] };
      data.forEach(r => { if (grouped[r.mode]) grouped[r.mode].push(r); });
      setResults(grouped);
    }
  }, []);

  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isConfigured) return;

    supabase.from('config').select('*').limit(1).then(({ data }) => {
      if (data && data[0]) setConfig(data[0]);
    });
    
    supabase.channel('config-changes').on('postgres_changes', { event: '*', table: 'config' }, p => {
      if (p.new) setConfig(p.new as AppConfig);
    }).subscribe();

    const savedUserId = localStorage.getItem('cp_user_id');
    if (savedUserId && !isAdmin) {
      refreshUserData();
      supabase.channel('user-sync').on('postgres_changes', { 
        event: 'UPDATE', 
        table: 'users', 
        filter: `id=eq.${savedUserId}` 
      }, p => {
        if (p.new) setUser(p.new as User);
      }).subscribe();
    }

    fetchResults();
    supabase.channel('results-sync').on('postgres_changes', { event: 'INSERT', table: 'results' }, () => fetchResults()).subscribe();

    const processResultsGlobally = async () => {
      if (isAdmin) return;
      const modes: GameMode[] = ['30s', '1m', '3m', '5m'];
      const now = Date.now();

      for (const mode of modes) {
        const duration = { '30s': 30, '1m': 60, '3m': 180, '5m': 300 }[mode];
        const secondsInPeriod = Math.floor((now % (duration * 1000)) / 1000);
        
        if (secondsInPeriod === 0 || secondsInPeriod === 1) {
          fetchRequests();
        }
      }
    };

    globalTimerRef.current = setInterval(processResultsGlobally, 1000);
    fetchRequests();
    
    const updatesChannel = supabase.channel('scoped-updates')
      .on('postgres_changes', { event: '*', table: 'bets' }, () => fetchRequests())
      .on('postgres_changes', { event: '*', table: 'recharges' }, () => fetchRequests())
      .on('postgres_changes', { event: '*', table: 'withdrawals' }, () => fetchRequests())
      .subscribe();

    if (isAdmin) {
      supabase.from('users').select('*').then(({ data }) => { if (data) setUsers(data); });
      supabase.channel('admin-users').on('postgres_changes', { event: '*', table: 'users' }, () => {
        supabase.from('users').select('*').then(({ data }) => { if (data) setUsers(data); });
      }).subscribe();
    }

    return () => { 
      supabase.removeAllChannels(); 
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, [isAdmin, fetchRequests, fetchResults, refreshUserData]);

  useEffect(() => {
    localStorage.setItem('cp_isAdmin', isAdmin.toString());
    localStorage.setItem('cp_lang', language);
    if (user) localStorage.setItem('cp_user_id', user.id);
  }, [isAdmin, language, user]);

  return (
    <AppContext.Provider value={{ 
      user, setUser, users, setUsers, isAdmin, setIsAdmin, config, setConfig, 
      bets, setBets, results, setResults, rechargeRequests, setRechargeRequests,
      withdrawRequests, setWithdrawRequests, language, setLanguage, t, refreshUserData
    }}>
      {children}
    </AppContext.Provider>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useApp();
  if (isAdmin) return <Navigate to="/admin" />;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useApp();
  return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

// Global Notice Overlay Component
const NoticeOverlay = () => {
  const { user, setUser } = useApp();
  const [clearing, setClearing] = useState(false);

  if (!user || !user.specialNotice) return null;

  const handleClear = async () => {
    setClearing(true);
    await supabase.from('users').update({ specialNotice: null }).eq('id', user.id);
    setUser({ ...user, specialNotice: undefined });
    setClearing(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
       <div className="bg-slate-900 w-full max-w-xs p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
             <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </div>
          <h2 className="text-lg font-black uppercase text-white tracking-widest italic">System Notice</h2>
          <p className="text-sm font-bold text-slate-300 leading-relaxed">{user.specialNotice}</p>
          <button 
            onClick={handleClear}
            disabled={clearing}
            className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl border-b-4 border-indigo-800 active:scale-95 transition-all"
          >
            {clearing ? 'Syncing...' : 'Confirm'}
          </button>
       </div>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const { config } = useApp();
  if (!isConfigured || config.minRecharge === 0) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[0.5em]">Syncing...</div>;
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAuthPath = location.pathname === '/login' || location.pathname === '/register';
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 flex flex-col relative pb-20 shadow-2xl overflow-hidden text-slate-100">
      <NoticeOverlay />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/aviator" element={<PrivateRoute><Aviator /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="/referral" element={<PrivateRoute><Referral /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Routes>
      {!isAuthPath && !isAdminPath && <BottomNav />}
    </div>
  );
};

export default function App() {
  return <AppProvider><Router><AppContent /></Router></AppProvider>;
}
