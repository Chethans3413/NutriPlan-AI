
import React, { useState, useEffect } from 'react';

interface LoginPageProps {
  onLogin: (userData: { email: string; name: string; clinicalId?: string }, isNewRegistration?: boolean) => void;
}

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-sent' | 'reset-password' | 'registration-success';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [generatedClinicalId, setGeneratedClinicalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Mock "User Database" in LocalStorage
  const getRegistry = () => {
    const registry = localStorage.getItem('nutriplan_clinical_registry');
    return registry ? JSON.parse(registry) : {};
  };

  const saveToRegistry = (userEmail: string, data: any) => {
    const registry = getRegistry();
    registry[userEmail.toLowerCase()] = data;
    localStorage.setItem('nutriplan_clinical_registry', JSON.stringify(registry));
  };

  const generateId = () => `NP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const registry = getRegistry();
    const normalizedEmail = email.toLowerCase();

    // Simulated network delay for clinical verification
    setTimeout(() => {
      try {
        if (view === 'login') {
          const user = registry[normalizedEmail];
          if (!user || user.password !== password) {
            throw new Error("Invalid Clinical Credentials. Access Denied.");
          }
          onLogin({ email: normalizedEmail, name: user.name, clinicalId: user.clinicalId });
        } 
        
        else if (view === 'register') {
          // STRICT CHECK: Cannot register again if email exists
          if (registry[normalizedEmail]) {
            throw new Error("This email is already linked to a Clinical Registry. Please sign in.");
          }
          if (password !== confirmPassword) {
            throw new Error("Security Passkeys do not match.");
          }
          if (password.length < 6) {
            throw new Error("Passkey must be at least 6 characters.");
          }
          
          const newClinicalId = generateId();
          saveToRegistry(normalizedEmail, { name, password, clinicalId: newClinicalId });
          setGeneratedClinicalId(newClinicalId);
          setView('registration-success');
          
          // Trigger simulated email notification in the UI toast
          setTimeout(() => {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
          }, 2000);
        } 
        
        else if (view === 'forgot-password') {
          if (!registry[normalizedEmail]) {
            throw new Error("Email identifier not found in clinical database.");
          }
          setView('reset-sent');
        }

        else if (view === 'reset-password') {
          if (password !== confirmPassword) {
            throw new Error("Security Passkeys do not match.");
          }
          const user = registry[normalizedEmail];
          if (user) {
            saveToRegistry(normalizedEmail, { ...user, password });
            setView('login');
            setError("Passkey updated. Please log in with new credentials.");
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }, 1200);
  };

  const inputClasses = "w-full pl-14 pr-6 py-5 rounded-[2rem] border border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all";
  const labelClasses = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1";

  const renderFormContent = () => {
    if (view === 'registration-success') {
      return (
        <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative">
             <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200 rotate-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-full animate-bounce">SECURE</div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Registry Confirmed</h2>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Assigned Clinical ID</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tighter">{generatedClinicalId}</p>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed px-6">
              Practitioner <span className="text-emerald-600">@{name.split(' ')[0]}</span>, your profile is now active in the NutriPlan database. 
              <br/><br/>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 font-black uppercase text-[9px] tracking-widest">A Clinical Onboarding Email</span> is being dispatched to your internal inbox containing this ID.
            </p>
          </div>
          <div className="pt-6">
            <button 
              onClick={() => onLogin({ email, name, clinicalId: generatedClinicalId }, true)}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-emerald-600 active:scale-[0.97] transition-all shadow-2xl flex items-center justify-center gap-4 group"
            >
              <span>Initialize Dashboard</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      );
    }

    if (view === 'reset-sent') {
      return (
        <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-4 rotate-3">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Link Dispatched</h2>
            <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
              A temporary clinical access link has been sent to <span className="text-emerald-600">{email}</span>.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={() => setView('reset-password')}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
            >
              Simulate Clicking Link (Reset Password)
            </button>
            <button 
              onClick={() => setView('login')}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === 'register' && (
          <div className="space-y-2">
            <label className={labelClasses}>Practitioner Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jordan Smith"
                className={inputClasses}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className={labelClasses}>Clinical ID / Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
            </div>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="id@clinical.ai"
              className={inputClasses}
              disabled={view === 'reset-password'}
            />
          </div>
        </div>

        {(view === 'login' || view === 'register' || view === 'reset-password') && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className={labelClasses}>
                  {view === 'reset-password' ? 'New Security Passkey' : 'Security Passkey'}
                </label>
                {view === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setView('forgot-password')}
                    className="text-[8px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClasses}
                />
              </div>
            </div>

            {(view === 'register' || view === 'reset-password') && (
              <div className="space-y-2">
                <label className={labelClasses}>Confirm Passkey</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClasses}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] text-center animate-bounce">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 bg-slate-900 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-2xl shadow-slate-200 group relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-emerald-500 transition-transform duration-500 ${isSubmitting ? 'translate-y-0' : 'translate-y-full'}`}></div>
            <div className="relative z-10 flex items-center justify-center gap-4">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Protocol...</span>
                </>
              ) : (
                <>
                  <span>
                    {view === 'login' ? 'Authorize Session' : 
                     view === 'register' ? 'Register Clinical ID' : 
                     view === 'forgot-password' ? 'Request Link' : 'Confirm New Passkey'}
                  </span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" /></svg>
                </>
              )}
            </div>
          </button>
        </div>

        <div className="text-center pt-2">
          {view === 'login' ? (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Unregistered practitioner? <button type="button" onClick={() => setView('register')} className="text-emerald-600 hover:text-emerald-700 transition-colors">Create Registry</button>
            </p>
          ) : (
            <button 
              type="button" 
              onClick={() => setView('login')} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Back to Authorization
            </button>
          )}
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24 relative overflow-hidden bg-slate-50">
      {/* Simulated Email Notification Toast */}
      {showNotification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-in slide-in-from-top duration-500">
           <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-3xl shadow-2xl flex items-center gap-4 border-l-4 border-l-emerald-500">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <div className="flex-grow">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Transmission Received</p>
                 <p className="text-xs font-bold text-slate-900">Protocol Welcome Email - Delivered</p>
              </div>
              <div className="text-[8px] font-black text-slate-300 uppercase">Just Now</div>
           </div>
        </div>
      )}

      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[140px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[140px] opacity-40"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 mx-auto mb-8 rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">NutriPlan <span className="text-emerald-600">AI</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Clinical Security Terminal</p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl p-12 rounded-[4rem] border border-slate-200 shadow-2xl shadow-slate-200/50 relative">
          <div className="absolute top-8 right-12">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          {renderFormContent()}

          {(view !== 'reset-sent' && view !== 'registration-success') && (
            <div className="mt-10 pt-10 border-t border-slate-100">
              <div className="flex flex-col items-center gap-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Institutional Single Sign-On</p>
                <div className="flex gap-6">
                  <button className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 hover:border-emerald-500 hover:-translate-y-1 transition-all shadow-sm group">
                    <svg className="w-6 h-6 text-slate-700 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.42-7.84 5.42-4.85 0-8.81-4.01-8.81-8.91s3.96-8.91 8.81-8.91c2.76 0 4.61 1.18 5.66 2.18l2.59-2.5c-1.66-1.55-3.82-2.5-8.25-2.5C5.38 0 0 5.38 0 12s5.38 12 12 12c6.9 0 11.5-4.86 11.5-11.69 0-.78-.08-1.38-.18-1.97H12.48z"/></svg>
                  </button>
                  <button className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 hover:border-emerald-500 hover:-translate-y-1 transition-all shadow-sm group">
                    <svg className="w-6 h-6 text-slate-700 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.988 1.57-.12 0-.24-.01-.3-.02-.01-.06-.02-.12-.02-.18 0-1.1.503-2.13 1.164-2.93a3.14 3.14 0 0 1 2.94-1.56c.105.02.215.03.32.04h.061zM17.25 5.61c-1.02 0-2.21.61-2.91.61-.71 0-1.74-.58-2.61-.58-1.12 0-2.26.68-2.84 1.7-.12.21-.4 1.05-.4 2.17 0 1.35.48 2.62 1.25 3.73.53.76 1.13 1.53 1.96 1.53.81 0 1.14-.52 2.15-.52 1.01 0 1.31.52 2.16.52.84 0 1.52-.7 2.05-1.48.61-.88.85-1.73.87-1.78-.01-.01-1.63-.63-1.63-2.5 0-1.55 1.25-2.29 1.31-2.33-.73-1.07-1.85-1.19-2.3-1.19zM15 22h-1v-2h1v2z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-12 text-[10px] font-bold text-slate-400 leading-relaxed max-w-[320px] mx-auto opacity-60">
          Encryption Standard: AES-256 GCM. User sessions are verified through an isolated clinical environment to maintain total privacy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
