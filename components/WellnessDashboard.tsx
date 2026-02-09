
import React, { useState, useEffect, useRef } from 'react';
import { DietPlan, Meal, Exercise, YogaPose, DailyTasks, LoggedFood, NutritionSummary } from '../types';
import { generateWellnessImage, analyzeFoodIntake } from '../services/geminiService';

interface WellnessDashboardProps {
  plan: DietPlan;
}

const WellnessDashboard: React.FC<WellnessDashboardProps> = ({ plan: initialPlan }) => {
  const [activeView, setActiveView] = useState<'nutrition' | 'workout' | 'yoga' | 'tracker'>('nutrition');
  const [plan, setPlan] = useState<DietPlan>(initialPlan);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [foodInput, setFoodInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTasks>({
    date: new Date().toISOString().split('T')[0],
    tasks: {},
    loggedFoods: []
  });

  const processedRef = useRef<Set<string>>(new Set());
  const isGeneratingRef = useRef<boolean>(false);

  // Load tracker state from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`wellness_tracker_${today}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setDailyTasks({
        ...parsed,
        loggedFoods: parsed.loggedFoods || []
      });
    } else {
      setDailyTasks({ date: today, tasks: {}, loggedFoods: [] });
    }
  }, []);

  // Save tracker state to localStorage
  useEffect(() => {
    if (dailyTasks.date) {
      localStorage.setItem(`wellness_tracker_${dailyTasks.date}`, JSON.stringify(dailyTasks));
    }
  }, [dailyTasks]);

  // Automatic Image Generation
  useEffect(() => {
    const triggerImages = async () => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;

      const tasks: { type: 'meal' | 'workout' | 'yoga', idx: number, name: string, ctx: string, key: string }[] = [];

      plan.mealPlan.forEach((m, i) => {
        const key = `meal-${i}`;
        if (!m.imageUrl && !processedRef.current.has(key)) tasks.push({ type: 'meal', idx: i, name: m.meal, ctx: m.suggestions.slice(0, 3).join(', '), key });
      });
      plan.workoutPlan.forEach((w, i) => {
        const key = `workout-${i}`;
        if (!w.imageUrl && !processedRef.current.has(key)) tasks.push({ type: 'workout', idx: i, name: w.name, ctx: w.instructions.join(', '), key });
      });
      plan.yogaPlan.forEach((y, i) => {
        const key = `yoga-${i}`;
        if (!y.imageUrl && !processedRef.current.has(key)) tasks.push({ type: 'yoga', idx: i, name: y.name, ctx: y.instructions.join(', '), key });
      });

      for (const task of tasks) {
        if (processedRef.current.has(task.key)) continue;
        setGenerating(prev => ({ ...prev, [task.key]: true }));
        try {
          const url = await generateWellnessImage(task.type, task.name, task.ctx);
          setPlan(prev => {
            const newPlan = JSON.parse(JSON.stringify(prev));
            if (task.type === 'meal') newPlan.mealPlan[task.idx].imageUrl = url;
            if (task.type === 'workout') newPlan.workoutPlan[task.idx].imageUrl = url;
            if (task.type === 'yoga') newPlan.yogaPlan[task.idx].imageUrl = url;
            return newPlan;
          });
          processedRef.current.add(task.key);
        } catch (e) {
          console.error(`Image failed for ${task.key}, will retry later.`);
        } finally {
          setGenerating(prev => ({ ...prev, [task.key]: false }));
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      isGeneratingRef.current = false;
    };
    triggerImages();
  }, [plan]);

  const toggleTask = (key: string) => {
    setDailyTasks(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [key]: !prev.tasks[key] }
    }));
  };

  const addFoodLog = () => {
    if (!foodInput.trim()) return;
    const newFood: LoggedFood = {
      id: crypto.randomUUID(),
      name: foodInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setDailyTasks(prev => ({
      ...prev,
      loggedFoods: [...(prev.loggedFoods || []), newFood]
    }));
    setFoodInput('');
  };

  const removeFoodLog = (id: string) => {
    setDailyTasks(prev => ({
      ...prev,
      loggedFoods: (prev.loggedFoods || []).filter(f => f.id !== id)
    }));
  };

  const handleAnalyzeLogs = async () => {
    if (!dailyTasks.loggedFoods.length) return;
    setIsAnalyzing(true);
    try {
      const summary = await analyzeFoodIntake(dailyTasks.loggedFoods.map(f => f.name));
      setDailyTasks(prev => ({ ...prev, customNutrition: summary }));
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProgress = () => {
    const total = plan.mealPlan.length + plan.workoutPlan.length + plan.yogaPlan.length;
    if (total === 0) return 0;
    const completed = Object.entries(dailyTasks.tasks)
      .filter(([key, val]) => val && !key.includes('complete'))
      .length;
    return Math.round((completed / total) * 100);
  };

  const ProtocolCard = ({ title, meta, image, sectionOneTitle, sectionOneList, sectionTwoTitle, sectionTwoList, precautions, time, type, idx }: any) => {
    const key = `${type}-${idx}`;
    const isGenerating = generating[key];
    const isDone = dailyTasks.tasks[key];

    return (
      <div className={`bg-white rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-xl transition-all group animate-in fade-in slide-in-from-bottom-4 ${isDone ? 'border-emerald-200 ring-2 ring-emerald-500/5' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-80 bg-slate-50 p-8 flex flex-col justify-between items-center border-r border-slate-100">
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Protocol</p>
              <p className="text-xl font-black text-slate-900">{time}</p>
            </div>
            <div className="w-full aspect-square bg-slate-200 rounded-3xl my-6 overflow-hidden shadow-inner relative border-4 border-white">
              {image ? (
                <img src={image} className="w-full h-full object-cover animate-in fade-in duration-500" alt={title} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  {isGenerating ? (
                    <>
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Rendering High-Detail Visual...</p>
                    </>
                  ) : (
                    <div className="text-center">
                       <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Awaiting Visualization</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${image ? 'text-emerald-600' : 'text-slate-400'}`}>{image ? 'Visual Verified' : meta}</p>
          </div>
          <div className="flex-grow p-10">
            <div className="flex justify-between items-start mb-8">
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h4>
              <button 
                onClick={() => toggleTask(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isDone ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
              >
                {isDone ? (
                  <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Completed</>
                ) : 'Mark Task Done'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{sectionOneTitle}</p>
                <div className="space-y-3">
                  {sectionOneList.map((item: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span className="text-sm font-bold text-slate-600 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{sectionTwoTitle}</p>
                <div className="space-y-3">
                  {sectionTwoList.map((item: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-[10px] font-black text-emerald-500 mt-1">{i + 1}.</span>
                      <span className="text-sm font-bold text-slate-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {precautions && (
              <div className="mt-8 bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Medical Precaution</p>
                  <p className="text-[11px] font-bold text-orange-800 leading-relaxed italic">{precautions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Bio-Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l4.5 6 4.5-6h-2.939c.26-4.004 3.593-7.172 7.439-7.172 1.621 0 3.125.539 4.363 1.448l2.121-2.121c-1.801-1.428-4.053-2.327-6.484-2.327zm6.918 8.041l-2.121 2.121c1.428 1.801 2.327 4.053 2.327 6.484 0 5.621-4.443 10.211-10 10.475v3.025l-6-4.5 6-4.5v2.939c4.004-.26 7.172-3.593 7.172-7.439 0-1.621-.539-3.125-1.448-4.363l2.121-2.121c1.428 1.801 2.327 4.053 2.327 6.484z"/></svg>
          </div>
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 relative z-10">Daily Energy Budget</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-5xl font-black tracking-tighter">{plan.dailyCalories}</span>
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Kcal</span>
          </div>
        </div>
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center justify-around overflow-hidden relative group">
          <div className="flex-1 flex justify-around">
            {[{ l: 'Protein', v: plan.macros.protein }, { l: 'Carbs', v: plan.macros.carbs }, { l: 'Fats', v: plan.macros.fats }].map(m => (
              <div key={m.l} className="text-center group-hover:scale-105 transition-transform">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.l}</p>
                <p className="text-xl font-black text-slate-900">{m.v}g</p>
              </div>
            ))}
          </div>
          <div className="h-12 w-px bg-slate-100 mx-4"></div>
          <div className="text-center">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Compliance</p>
            <p className="text-2xl font-black text-slate-900">{getProgress()}%</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-2 rounded-3xl max-w-xl mx-auto overflow-x-auto no-scrollbar shadow-sm">
        {(['nutrition', 'workout', 'yoga', 'tracker'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveView(tab)}
            className={`flex-1 min-w-[120px] py-3.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab === 'tracker' ? 'Task Sheet' : tab}
          </button>
        ))}
      </div>

      {/* Dynamic Views */}
      <div className="space-y-8 min-h-[400px]">
        {activeView === 'nutrition' && plan.mealPlan.map((m, i) => (
          <ProtocolCard 
            key={i} 
            idx={i}
            type="meal"
            title={m.meal} 
            meta="Clinical Meal" 
            image={m.imageUrl} 
            sectionOneTitle="Ingredients & Portions" 
            sectionOneList={m.suggestions} 
            sectionTwoTitle="Step-by-Step Preparation"
            sectionTwoList={m.preparationSteps}
            time={m.time} 
          />
        ))}

        {activeView === 'workout' && plan.workoutPlan.map((w, i) => (
          <ProtocolCard 
            key={i} 
            idx={i}
            type="workout"
            title={w.name} 
            meta={`${w.sets} Sets • ${w.reps}`} 
            image={w.imageUrl} 
            sectionOneTitle="Parameters"
            sectionOneList={[`Target Reps: ${w.reps}`, `Target Sets: ${w.sets}`]}
            sectionTwoTitle="Performance Protocol" 
            sectionTwoList={w.instructions} 
            precautions={w.precautions} 
            time={`Exercise ${i+1}`}
          />
        ))}

        {activeView === 'yoga' && plan.yogaPlan.map((y, i) => (
          <ProtocolCard 
            key={i} 
            idx={i}
            type="yoga"
            title={y.name} 
            meta={`Focus Duration: ${y.duration}`} 
            image={y.imageUrl} 
            sectionOneTitle="Objective"
            sectionOneList={[`Hold Time: ${y.duration}`, "Focus: Mind-Body Breath"]}
            sectionTwoTitle="Pose Alignment" 
            sectionTwoList={y.instructions} 
            precautions={y.precautions} 
            time={`Pose ${i+1}`}
          />
        ))}

        {activeView === 'tracker' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Main Daily Tracker Card */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center mb-16 border-b border-slate-100 pb-10">
                 <div className="text-center md:text-left mb-6 md:mb-0">
                    <h3 className="text-4xl font-black text-slate-900 mb-2">Daily Protocol Tracker</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Integrated Bio-Mapping Verification • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 </div>
                 <div className="bg-slate-900 px-8 py-5 rounded-[2rem] text-center shadow-xl">
                    <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1">Today's Score</p>
                    <p className="text-white text-3xl font-black">{getProgress()}%</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Nutrition Protocols</h4>
                  </div>
                  <div className="space-y-4">
                    {plan.mealPlan.map((m, i) => (
                      <div 
                        key={i} 
                        onClick={() => toggleTask(`meal-${i}`)}
                        className={`flex items-center justify-between p-6 rounded-3xl border cursor-pointer transition-all hover:translate-x-1 ${dailyTasks.tasks[`meal-${i}`] ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}
                      >
                        <div className="flex gap-4 items-center">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${dailyTasks.tasks[`meal-${i}`] ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300'}`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className={`text-sm font-black ${dailyTasks.tasks[`meal-${i}`] ? 'text-emerald-900' : 'text-slate-800'}`}>{m.meal}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{m.time}</p>
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${dailyTasks.tasks[`meal-${i}`] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                          {dailyTasks.tasks[`meal-${i}`] && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Physical & Mindfulness</h4>
                    </div>
                    <div className="space-y-4">
                      {plan.workoutPlan.map((w, i) => (
                        <div 
                          key={i} 
                          onClick={() => toggleTask(`workout-${i}`)}
                          className={`flex items-center justify-between p-6 rounded-3xl border cursor-pointer transition-all hover:translate-x-1 ${dailyTasks.tasks[`workout-${i}`] ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}
                        >
                          <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${dailyTasks.tasks[`workout-${i}`] ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-300'}`}>
                              W{i + 1}
                            </div>
                            <div>
                              <p className={`text-sm font-black ${dailyTasks.tasks[`workout-${i}`] ? 'text-blue-900' : 'text-slate-800'}`}>{w.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Workout Protocol</p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${dailyTasks.tasks[`workout-${i}`] ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                            {dailyTasks.tasks[`workout-${i}`] && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                        </div>
                        </div>
                      ))}
                      {plan.yogaPlan.map((y, i) => (
                        <div 
                          key={i} 
                          onClick={() => toggleTask(`yoga-${i}`)}
                          className={`flex items-center justify-between p-6 rounded-3xl border cursor-pointer transition-all hover:translate-x-1 ${dailyTasks.tasks[`yoga-${i}`] ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}
                        >
                          <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${dailyTasks.tasks[`yoga-${i}`] ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300'}`}>
                              Y{i + 1}
                            </div>
                            <div>
                              <p className={`text-sm font-black ${dailyTasks.tasks[`yoga-${i}`] ? 'text-indigo-900' : 'text-slate-800'}`}>{y.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Yoga Protocol</p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${dailyTasks.tasks[`yoga-${i}`] ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200'}`}>
                            {dailyTasks.tasks[`yoga-${i}`] && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Food Intake Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
              </div>
              
              <div className="mb-10">
                <h4 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Food Intake Manual Log</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document unplanned nutritional events</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7">
                  <div className="flex gap-4 mb-8">
                    <input 
                      type="text" 
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFoodLog()}
                      placeholder="e.g. 1 Medium Apple, 250ml Coffee with Cream..." 
                      className="flex-grow px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                    />
                    <button 
                      onClick={addFoodLog}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                    >
                      Log Item
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {!dailyTasks.loggedFoods?.length && (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No manual logs for today</p>
                      </div>
                    )}
                    {dailyTasks.loggedFoods?.map((food) => (
                      <div key={food.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group/item">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                            {food.timestamp}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{food.name}</span>
                        </div>
                        <button 
                          onClick={() => removeFoodLog(food.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Logged Intake Summary</p>
                        <button 
                          onClick={handleAnalyzeLogs}
                          disabled={isAnalyzing || !dailyTasks.loggedFoods?.length}
                          className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-emerald-400 transition-colors disabled:opacity-30"
                        >
                          {isAnalyzing ? "Analyzing..." : "Refresh Summary"}
                        </button>
                      </div>

                      {dailyTasks.customNutrition ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                          <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Estimated Total Calories</p>
                            <p className="text-5xl font-black text-emerald-500 tracking-tighter">{dailyTasks.customNutrition.calories} <span className="text-xs font-bold opacity-30 tracking-widest">KCAL</span></p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
                            <div>
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Protein</p>
                              <p className="text-lg font-black">{dailyTasks.customNutrition.protein}g</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Carbs</p>
                              <p className="text-lg font-black">{dailyTasks.customNutrition.carbs}g</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Fats</p>
                              <p className="text-lg font-black">{dailyTasks.customNutrition.fats}g</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                          <p className="text-xs font-bold text-white/20">Log your consumption and sync for clinical nutritional estimation.</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5">
                       <p className="text-[9px] font-bold text-white/40 leading-relaxed italic">
                         Note: Estimates are generated using AI-driven clinical mapping and should be used as a behavioral guide rather than medical certainty.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WellnessDashboard;
