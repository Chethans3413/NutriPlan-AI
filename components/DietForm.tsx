
import React, { useState } from 'react';
import { UserProfile, ActivityLevel, Goal, DietType, Persona } from '../types';

interface DietFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
}

const DietForm: React.FC<DietFormProps> = ({ onSubmit, isLoading }) => {
  const [profile, setProfile] = useState<any>({
    age: '25',
    gender: 'Male',
    weight: '70',
    height: '175',
    activityLevel: ActivityLevel.MODERATE,
    conditions: '',
    allergies: '',
    dietType: DietType.NON_VEG,
    persona: Persona.GENERAL,
    goal: Goal.MAINTENANCE,
    targetCalories: '',
    macroFocus: 'Balanced'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData: UserProfile = {
      ...profile,
      age: Number(profile.age) || 0,
      weight: Number(profile.weight) || 0,
      height: Number(profile.height) || 0,
      targetCalories: profile.targetCalories ? Number(profile.targetCalories) : undefined
    };
    onSubmit(submissionData);
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm";
  const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Section 1: Biometrics Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] group transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Biometric Profile</h2>
            <p className="text-xs font-bold text-slate-400">Essential physical measurements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className={labelClasses}>Current Age</label>
            <input type="number" name="age" value={profile.age} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Height (cm)</label>
            <input type="number" name="height" value={profile.height} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Weight (kg)</label>
            <input type="number" name="weight" value={profile.weight} onChange={handleChange} required className={inputClasses} />
          </div>
        </div>
      </div>

      {/* Section 2: Lifestyle Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <label className={labelClasses}>Dietary Preference</label>
          <select name="dietType" value={profile.dietType} onChange={handleChange} className={inputClasses}>
            {Object.values(DietType).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <p className="mt-3 text-[10px] text-slate-400 font-bold italic">Determines base ingredient pools</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <label className={labelClasses}>Activity Intensity</label>
          <select name="activityLevel" value={profile.activityLevel} onChange={handleChange} className={inputClasses}>
            {Object.values(ActivityLevel).map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
          <p className="mt-3 text-[10px] text-slate-400 font-bold italic">Critical for TDEE calculation</p>
        </div>
      </div>

      {/* Section 3: Advanced Calibration (New) */}
      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] shadow-inner">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Advanced Calibration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className={labelClasses}>Override Calorie Target</label>
            <input 
              type="number" 
              name="targetCalories" 
              value={profile.targetCalories} 
              onChange={handleChange} 
              placeholder="e.g. 2000 (Optional)" 
              className={inputClasses} 
            />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Macro focus</label>
            <select name="macroFocus" value={profile.macroFocus} onChange={handleChange} className={inputClasses}>
              {['Balanced', 'High Protein', 'Low Carb', 'High Fat', 'Ketogenic Ratio'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-4 text-[9px] text-emerald-600 font-bold uppercase tracking-widest text-center opacity-60 italic">Precision overrides will prioritize manual targets over standard TDEE calculations</p>
      </div>

      {/* Section 4: Objectives & Context */}
      <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.450.385c-.345.602-.614 1.028-.804 1.347a45.651 45.651 0 01-1.318 2.083C7.94 7.64 6.75 8.307 5.75 8.75s-2.03.75-2.75.75a1 1 0 000 2c.72 0 1.75.307 2.75.75s2.19 1.11 3.073 2.382c.228.326.494.752.804 1.347a1 1 0 001.45.385c.345-.602.614-1.028.804-1.347.228-.326.494-.752.804-1.347a1 1 0 00-1.45-.385 1 1 0 00-.804-1.347c-.228-.326-.494-.752-.804-1.347a1 1 0 00-1.45-.385c-.345.602-.614 1.028-.804 1.347z" clipRule="evenodd"/></svg>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Primary Health Goal</label>
            <select name="goal" value={profile.goal} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none focus:bg-white/20 transition-all text-sm">
              {Object.values(Goal).map(g => <option key={g} value={g} className="text-slate-900">{g}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Daily Persona</label>
            <select name="persona" value={profile.persona} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none focus:bg-white/20 transition-all text-sm">
              {Object.values(Persona).map(p => <option key={p} value={p} className="text-slate-900">{p}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8 space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Medical Observations & Conditions</label>
            <textarea name="conditions" value={profile.conditions} onChange={handleChange} placeholder="Detail any diagnosed conditions..." className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold placeholder:text-white/40 outline-none focus:bg-white/20 transition-all text-sm h-32 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Known Allergies / Intolerances</label>
            <input type="text" name="allergies" value={profile.allergies} onChange={handleChange} placeholder="Gluten, lactose, nuts..." className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold placeholder:text-white/40 outline-none focus:bg-white/20 transition-all text-sm" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl font-extrabold text-sm uppercase tracking-[0.2em] hover:shadow-[0_20px_40px_rgb(16,185,129,0.2)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4">
        {isLoading ? (
          <>
            <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
            Generating Protocol...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.515 1.282l-2.857.477a2 2 0 01-1.92-1.341l-.544-1.632a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.515 1.282l-2.857.477a2 2 0 01-1.92-1.341l-.544-1.632a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.515 1.282l-2.857.477a2 2 0 01-1.92-1.341l-.544-1.632z" /></svg>
            Compute Advanced Plan
          </>
        )}
      </button>
    </form>
  );
};

export default DietForm;
