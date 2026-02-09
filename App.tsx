
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DietForm from './components/DietForm';
import WellnessDashboard from './components/WellnessDashboard';
import NutritionChat from './components/NutritionChat';
import LoginPage from './components/LoginPage';
import { UserProfile, DietPlan, SavedPlan, EmailMessage } from './types';
import { generateWellnessProtocol, generateWelcomeEmail } from './services/geminiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; clinicalId?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [wellnessPlan, setWellnessPlan] = useState<DietPlan | null>(null);
  const [savedProtocols, setSavedProtocols] = useState<SavedPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'archive'>('generate');
  const [emails, setEmails] = useState<EmailMessage[]>([]);

  useEffect(() => {
    // Session persistence logic
    const savedSession = localStorage.getItem('nutriplan_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
        loadEmails(parsed.email);
      } catch (e) {
        localStorage.removeItem('nutriplan_session');
      }
    }
    loadHistory();
    window.addEventListener('storage_updated', loadHistory);
    return () => window.removeEventListener('storage_updated', loadHistory);
  }, []);

  const loadHistory = () => {
    const existing = localStorage.getItem('nutriplan_saved_protocols');
    if (existing) {
      setSavedProtocols(JSON.parse(existing));
    }
  };

  const loadEmails = (userEmail: string) => {
    const saved = localStorage.getItem(`emails_${userEmail.toLowerCase()}`);
    if (saved) {
      setEmails(JSON.parse(saved));
    }
  };

  const handleLogin = (userData: { email: string; name: string; clinicalId?: string }, isNewRegistration?: boolean) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('nutriplan_session', JSON.stringify(userData));
    loadEmails(userData.email);

    if (isNewRegistration && userData.clinicalId) {
      // Generate the welcome email via AI with the Clinical ID
      generateWelcomeEmail(userData.name, userData.email, userData.clinicalId).then(content => {
        const newEmail: EmailMessage = {
          id: crypto.randomUUID(),
          sender: 'Automated Onboarding Node',
          subject: 'Welcome to your Clinical Wellness Ecosystem',
          content: content,
          timestamp: Date.now(),
          isRead: false
        };
        const updated = [newEmail, ...emails];
        setEmails(updated);
        localStorage.setItem(`emails_${userData.email.toLowerCase()}`, JSON.stringify(updated));
        // Trigger a custom event for the header to pulse
        window.dispatchEvent(new CustomEvent('new_clinical_mail', { detail: newEmail }));
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('nutriplan_session');
    setWellnessPlan(null);
    setEmails([]);
    setActiveTab('generate');
  };

  const handleSubmit = async (profile: UserProfile) => {
    setLoading(true);
    setError(null);
    try {
      const plan = await generateWellnessProtocol(profile);
      setWellnessPlan(plan);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError({ title: "Analysis Error", message: "Failed to compute protocol. Check biometric inputs." });
    } finally {
      setLoading(false);
    }
  };

  const handleRecallPlan = (saved: SavedPlan) => {
    setWellnessPlan(saved.plan);
    setActiveTab('generate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProtocols.filter(p => p.id !== id);
    setSavedProtocols(updated);
    localStorage.setItem('nutriplan_saved_protocols', JSON.stringify(updated));
  };

  const markEmailAsRead = (id: string) => {
    const updated = emails.map(e => e.id === id ? { ...e, isRead: true } : e);
    setEmails(updated);
    if (currentUser) {
      localStorage.setItem(`emails_${currentUser.email.toLowerCase()}`, JSON.stringify(updated));
    }
  };

  // Guard clause for authentication
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header 
        onLogout={handleLogout} 
        userEmail={currentUser?.email} 
        emails={emails}
        onMarkAsRead={markEmailAsRead}
      />
      
      <main className="flex-grow max-w-[1600px] mx-auto px-6 lg:px-10 pt-32 pb-24 w-full">
        {/* Main Tab Controller */}
        <div className="flex gap-4 mb-10 px-2 animate-in slide-in-from-left duration-700">
           <button 
             onClick={() => setActiveTab('generate')}
             className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
           >
             Protocol Builder
           </button>
           <button 
             onClick={() => setActiveTab('archive')}
             className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
           >
             Protocol Archive
             {savedProtocols.length > 0 && <span className="bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]">{savedProtocols.length}</span>}
           </button>
        </div>

        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
            <div className="lg:col-span-5 xl:col-span-4 space-y-10">
              <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]" />
                <div className="relative z-10 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Practitioner Verified: {currentUser?.name}
                    {currentUser?.clinicalId && <span className="ml-2 opacity-40">[{currentUser.clinicalId}]</span>}
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">Biometric <span className="text-emerald-400">Synthesis</span></h2>
                  <p className="text-sm font-bold text-slate-400 leading-relaxed">AI-driven coordinated Wellness Protocol for clinical-grade health management.</p>
                </div>
              </section>

              <DietForm onSubmit={handleSubmit} isLoading={loading} />
              
              {wellnessPlan && <NutritionChat />}
            </div>

            <div className="lg:col-span-7 xl:col-span-8">
              {wellnessPlan ? (
                <WellnessDashboard plan={wellnessPlan} />
              ) : (
                <div className="h-full min-h-[650px] border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center text-center p-12 bg-white/40 backdrop-blur-sm animate-in fade-in duration-1000">
                  <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex items-center justify-center text-slate-100 mb-10 rotate-3 border border-slate-100">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">System Ready for Mapping</h3>
                  <p className="text-slate-500 font-bold max-w-sm leading-relaxed">Input the practitioner's biological metrics on the left to initialize the wellness synthesis engine.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            {savedProtocols.length === 0 ? (
              <div className="text-center py-48 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Clinical archive is currently synchronized and empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {savedProtocols.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => handleRecallPlan(item)}
                    className="group bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-emerald-500 hover:-translate-y-1 transition-all cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSaved(item.id, e)} 
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{item.label}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-slate-900 py-16 text-center border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4">NutriPlan AI Systems</p>
            <p className="text-[10px] font-bold text-slate-600 max-w-lg mx-auto leading-relaxed">Advanced biometric synthesis node. Clinical precision protocols verified. All rights reserved &copy; {new Date().getFullYear()}.</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
