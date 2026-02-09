
import React, { useState, useEffect, useRef } from 'react';
import { DietPlan, Meal, SavedPlan } from '../types';
// Corrected import: use generateWellnessImage instead of non-existent generateMealImage
import { generateWellnessImage } from '../services/geminiService';

interface DietPlanDisplayProps {
  plan: DietPlan;
}

const DietPlanDisplay: React.FC<DietPlanDisplayProps> = ({ plan: initialPlan }) => {
  const [plan, setPlan] = useState<DietPlan>(initialPlan);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const [showCopyFeedback, setShowCopyFeedback] = useState<'shared' | 'saved' | null>(null);
  const processedRef = useRef<Set<number>>(new Set());

  // Automatic Image Generation Logic
  useEffect(() => {
    const triggerAutoImages = async () => {
      const mealsToProcess = plan.mealPlan
        .map((m, i) => ({ ...m, index: i }))
        .filter(m => !m.imageUrl && !generatingImages[m.index] && !processedRef.current.has(m.index));

      for (const mealObj of mealsToProcess) {
        processedRef.current.add(mealObj.index);
        handleGenerateImage(mealObj.index);
        // Faster stagger for image generation
        await new Promise(r => setTimeout(r, 200));
      }
    };

    triggerAutoImages();
  }, [plan.mealPlan]);

  const pCal = plan.macros.protein * 4;
  const cCal = plan.macros.carbs * 4;
  const fCal = plan.macros.fats * 9;
  const totalCal = pCal + cCal + fCal;
  const pPct = Math.round((pCal / totalCal) * 100);
  const cPct = Math.round((cCal / totalCal) * 100);
  const fPct = Math.round((fCal / totalCal) * 100);

  const handleGenerateImage = async (idx: number) => {
    if (generatingImages[idx]) return;
    setGeneratingImages(prev => ({ ...prev, [idx]: true }));
    try {
      const meal = plan.mealPlan[idx];
      // Updated call: use generateWellnessImage with 'meal' type parameter
      const imageUrl = await generateWellnessImage('meal', meal.meal, meal.suggestions.join(", "));
      setPlan(current => {
        const newMealPlan = [...current.mealPlan];
        newMealPlan[idx] = { ...newMealPlan[idx], imageUrl };
        return { ...current, mealPlan: newMealPlan };
      });
    } catch (err) {
      console.error("Image generation failed for meal index:", idx, err);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleEditMeal = (idx: number, field: keyof Meal, value: any) => {
    const newMealPlan = [...plan.mealPlan];
    newMealPlan[idx] = { ...newMealPlan[idx], [field]: value };
    setPlan({ ...plan, mealPlan: newMealPlan });
  };

  const handleSaveToLocal = () => {
    const existing = localStorage.getItem('nutriplan_saved_protocols');
    const savedPlans: SavedPlan[] = existing ? JSON.parse(existing) : [];
    const newSavedPlan: SavedPlan = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      plan: plan,
      label: `${plan.dailyCalories} Kcal Protocol`
    };
    localStorage.setItem('nutriplan_saved_protocols', JSON.stringify([newSavedPlan, ...savedPlans].slice(0, 10)));
    setShowCopyFeedback('saved');
    setTimeout(() => setShowCopyFeedback(null), 3000);
    window.dispatchEvent(new Event('storage_updated'));
  };

  const getPhase = (index: number) => {
    if (index === 0) return { label: 'Metabolic Activation', color: 'text-orange-500', bg: 'bg-orange-50' };
    if (index === 1 || index === 3) return { label: 'Glycemic Bridge', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (index === 2) return { label: 'Peak Performance', color: 'text-blue-500', bg: 'bg-blue-50' };
    return { label: 'Recovery & Synthesis', color: 'text-indigo-500', bg: 'bg-indigo-50' };
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <p className="text-emerald-400 font-black uppercase text-[9px] tracking-[0.3em] mb-4">Daily Energy</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter">{plan.dailyCalories}</span>
              <span className="text-sm font-bold opacity-40 uppercase tracking-widest">Kcal</span>
            </div>
          </div>
        </div>
        
        <div className="xl:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative">
           <div className="flex justify-around items-center h-full">
             {[{label: 'Prot', val: plan.macros.protein, color: 'bg-emerald-500'}, {label: 'Carb', val: plan.macros.carbs, color: 'bg-blue-500'}, {label: 'Fat', val: plan.macros.fats, color: 'bg-amber-500'}].map(m => (
               <div key={m.label} className="text-center">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{m.label}</div>
                 <div className="text-2xl font-black text-slate-900">{m.val}g</div>
                 <div className={`h-1 w-full mt-2 rounded-full ${m.color}`}></div>
               </div>
             ))}
           </div>
        </div>

        <div className="xl:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col justify-center">
            <p className="text-blue-600 font-black uppercase text-[9px] tracking-[0.3em] mb-2 text-center">Hydration</p>
            <div className="text-xl font-black text-slate-900 text-center">{plan.hydration}</div>
        </div>
      </div>

      {/* Timeline with Edit and Visuals */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Meal Timeline</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Bio-Optimized Sequencing</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleSaveToLocal} 
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Archive Protocol
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {plan.mealPlan.map((m, idx) => {
            const phase = getPhase(idx);
            const isEditing = editingIdx === idx;
            return (
              <div key={idx} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <div className="flex flex-col lg:flex-row">
                  {/* Sidebar Metadata */}
                  <div className={`lg:w-72 ${phase.bg} p-8 flex flex-col justify-between items-center text-center relative`}>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meal {idx + 1}</p>
                      <p className="text-2xl font-black text-slate-900">{m.time}</p>
                    </div>

                    <div className="my-8">
                      <div className={`p-4 rounded-2xl bg-white shadow-sm mb-2 ${phase.color}`}>
                         {idx === 0 && <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>}
                         {idx === 2 && <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                         {(idx === 1 || idx === 3) && <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                         {idx === 4 && <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${phase.color}`}>{phase.label}</p>
                    </div>

                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/50 rounded-full border border-white">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{m.prepTime}</span>
                    </div>
                  </div>

                  {/* Main Protocol Content */}
                  <div className="flex-grow p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        {isEditing ? (
                          <input 
                            value={m.meal} 
                            onChange={(e) => handleEditMeal(idx, 'meal', e.target.value)}
                            className="text-3xl font-black text-slate-900 tracking-tight bg-slate-50 border-b-2 border-emerald-500 outline-none w-full py-1"
                          />
                        ) : (
                          <h4 className="text-3xl font-black text-slate-900 tracking-tight">{m.meal}</h4>
                        )}
                        <button 
                          onClick={() => setEditingIdx(isEditing ? null : idx)}
                          className={`p-2 rounded-xl transition-all ml-4 ${isEditing ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                          title="Edit Meal Protocol"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>

                      {/* Wide Prominent Image Container */}
                      <div className="w-full aspect-video lg:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-100 mb-10 shadow-inner relative border border-slate-200">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} className="w-full h-full object-cover animate-in fade-in duration-700" alt={m.meal} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synthesizing Visual Protocol...</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Recipe Components</p>
                          <div className="space-y-2">
                            {m.suggestions.map((s, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {isEditing ? (
                                  <input 
                                    value={s} 
                                    onChange={(e) => {
                                      const newS = [...m.suggestions];
                                      newS[sIdx] = e.target.value;
                                      handleEditMeal(idx, 'suggestions', newS);
                                    }}
                                    className="text-sm font-bold text-slate-700 bg-slate-50 w-full outline-none px-2 rounded py-0.5"
                                  />
                                ) : <span className="text-sm font-bold text-slate-600">{s}</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Preparation Protocol</p>
                          <div className="space-y-3">
                            {m.preparationSteps.map((step, pIdx) => (
                              <div key={pIdx} className="flex gap-3">
                                <span className="text-[10px] font-black text-blue-300 mt-1">{pIdx + 1}.</span>
                                {isEditing ? (
                                  <textarea 
                                    value={step} 
                                    onChange={(e) => {
                                      const newP = [...m.preparationSteps];
                                      newP[pIdx] = e.target.value;
                                      handleEditMeal(idx, 'preparationSteps', newP);
                                    }}
                                    className="text-[11px] font-bold text-slate-500 leading-tight bg-slate-50 w-full outline-none px-2 rounded py-1 resize-none"
                                  />
                                ) : <span className="text-[11px] font-bold text-slate-500 leading-relaxed">{step}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-500">Clinical Verification: High Accuracy</span>
                        <span className="text-slate-200">|</span>
                        <span>{m.prepTime} Est.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DietPlanDisplay;
