
import React, { useState, useEffect } from 'react';
import { EmailMessage } from '../types';
import { marked } from 'marked';

interface HeaderProps {
  onLogout?: () => void;
  userEmail?: string;
  emails: EmailMessage[];
  onMarkAsRead: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, userEmail, emails, onMarkAsRead }) => {
  const [activeModal, setActiveModal] = useState<'scientific' | 'privacy' | 'support' | 'inbox' | null>(null);
  const [selectedSupportItem, setSelectedSupportItem] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [hasNewMail, setHasNewMail] = useState(false);

  useEffect(() => {
    const unreadCount = emails.filter(e => !e.isRead).length;
    setHasNewMail(unreadCount > 0);
  }, [emails]);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedSupportItem(null);
    setSelectedEmail(null);
  };

  const supportContent: Record<string, { desc: string; action: string; icon: React.ReactNode }> = {
    'Inaccurate Calorie Calculation': {
      desc: "Our engine uses the Mifflin-St Jeor equation for baseline calculations. If your clinical data suggests a different TDEE, use the 'Advanced Calibration' section in the form to manually override the target.",
      action: "Return to form and use 'Override Calorie Target'",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    },
    'Food Allergy Substitution': {
      desc: "The AI filters ingredients based on your 'Known Allergies' input. If a suggestion still contains a conflict, mention it to the Clinical Assistant chat for an immediate alternative.",
      action: "Update 'Allergies' field or use Chat Assistant",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    },
    'System Navigation Help': {
      desc: "1. Bio-Profile: Enter stats. 2. Calibration: Set specific goals. 3. Protocol: Review meals. 4. Validation: Use Chat to refine the plan.",
      action: "Standard Workflow Verified",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    },
    'Technical Support': {
      desc: "For API timeouts or UI rendering issues, please clear your browser cache or contact our technical triage unit directly.",
      action: "Email: triage@nutriplan-clinical.ai",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
    }
  };

  const Modal = ({ title, children, icon, subtitle = "Verified Documentation" }: { title: string; children?: React.ReactNode; icon: React.ReactNode; subtitle?: string }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal} />
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900 p-8 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{title}</h3>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {(selectedSupportItem || selectedEmail) ? (
            <button 
              onClick={() => { setSelectedSupportItem(null); setSelectedEmail(null); }}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              Return to List
            </button>
          ) : <div></div>}
          <button onClick={closeModal} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-[100] px-6">
        <header className="max-w-7xl mx-auto glass rounded-2xl h-16 flex items-center justify-between px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 rotate-3 transition-transform hover:rotate-0 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">NutriPlan <span className="text-emerald-600">AI</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Terminal 4.0</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveModal('scientific')}
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-colors outline-none"
            >
              Scientific
            </button>
            <button 
              onClick={() => setActiveModal('support')}
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-colors outline-none"
            >
              Support
            </button>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-4">
              {/* Clinical Inbox Button */}
              <button 
                onClick={() => setActiveModal('inbox')}
                className={`relative p-2.5 rounded-xl transition-all ${hasNewMail ? 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                title="Clinical Inbox"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {hasNewMail && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
              </button>

              {userEmail && (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Practitioner</span>
                    <span className="text-[11px] font-bold text-slate-900 truncate max-w-[120px]">{userEmail}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="bg-slate-100 p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Terminate Session"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </header>
      </div>

      {activeModal === 'inbox' && (
        <Modal title="Clinical Inbox" subtitle="Secure Messaging Node" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
          {!selectedEmail ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {emails.length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No transmissions found</p>
                </div>
              ) : (
                emails.map((email) => (
                  <button 
                    key={email.id} 
                    onClick={() => { setSelectedEmail(email); onMarkAsRead(email.id); }}
                    className={`w-full p-6 border rounded-3xl flex items-start gap-5 group transition-all text-left ${email.isRead ? 'bg-white border-slate-100 opacity-60' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${email.isRead ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{email.sender}</span>
                        <span className="text-[9px] font-bold text-slate-400">{new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{email.subject}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 font-medium">{email.content.replace(/[#*]/g, '').slice(0, 100)}...</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="border-b border-slate-100 pb-8 mb-8">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-2xl font-black text-slate-900 leading-tight">{selectedEmail.subject}</h4>
                  <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">Secure Dispatch</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black text-white">NP</div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{selectedEmail.sender}</p>
                    <p className="text-[10px] font-bold text-slate-400">To: {userEmail}</p>
                  </div>
                </div>
              </div>
              <div 
                className="prose-chat prose-slate max-w-none text-sm font-medium leading-relaxed text-slate-600"
                dangerouslySetInnerHTML={{ __html: marked.parse(selectedEmail.content) }}
              />
            </div>
          )}
        </Modal>
      )}

      {activeModal === 'scientific' && (
        <Modal title="Scientific Basis" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.515 1.282l-2.857.477a2 2 0 01-1.92-1.341l-.544-1.632a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.515 1.282l-2.857.477a2 2 0 01-1.92-1.341l-.544-1.632z" /></svg>}>
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">01. Metabolic Equations</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                NutriPlan AI primarily utilizes the <span className="text-emerald-600 font-bold">Mifflin-St Jeor Equation</span> to calculate Basal Metabolic Rate (BMR), recognized as the most accurate standard for modern lifestyles. 
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">02. Clinical Grounding</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                All nutritional suggestions are verified against current <span className="text-emerald-600 font-bold">WHO and USDA guidelines</span>. The system cross-references clinical databases to ensure macro-nutrient ratios align with the specified health goal.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'support' && (
        <Modal title="Clinical Support Hub" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}>
          {!selectedSupportItem ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-8">
                <p className="text-sm font-bold text-slate-500">How can we assist your clinical journey?</p>
              </div>
              {Object.keys(supportContent).map((item) => (
                <button 
                  key={item} 
                  onClick={() => setSelectedSupportItem(item)}
                  className="w-full p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-emerald-500 hover:shadow-lg transition-all"
                >
                  <span className="text-sm font-black text-slate-700 group-hover:text-emerald-700">{item}</span>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-emerald-400 shadow-xl">
                  {supportContent[selectedSupportItem].icon}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{selectedSupportItem}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Status: High Priority</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resolution Path</h5>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {supportContent[selectedSupportItem].desc}
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default Header;
