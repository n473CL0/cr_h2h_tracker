import React, { useState } from 'react';
import { Sparkles, Users, Swords, ArrowRight, Check } from 'lucide-react';
import { api } from '../api/clash';

const OnboardingWizard = ({ user, onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!user || user.onboarding_completed) return null;

  const steps = [
    {
      title: "Welcome to ClashFriends",
      desc: "The ultimate social hub for your Clash Royale rivalries.",
      icon: Sparkles,
      color: "text-yellow-400"
    },
    {
      title: "Track Your Rivals",
      desc: "See who your true nemesis is and who you dominate in friendly battles.",
      icon: Swords,
      color: "text-red-400"
    },
    {
      title: "Stay Connected",
      desc: "Follow your friends' progress and see their latest matches in the Feed.",
      icon: Users,
      color: "text-blue-400"
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setLoading(true);
      try {
        const updatedUser = await api.completeOnboarding();
        onComplete(updatedUser); // Update global user state to close modal
      } catch (err) {
        console.error("Onboarding Error", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-700 w-full">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 text-center flex flex-col items-center min-h-[300px]">
          <div className={`w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-6 ${steps[step].color}`}>
            <CurrentIcon className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {steps[step].title}
          </h2>
          <p className="text-slate-400 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            {steps[step].desc}
          </p>

          <div className="mt-auto w-full">
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Finishing...' : step === steps.length - 1 ? "Let's Go!" : "Next"}
              {!loading && (step === steps.length - 1 ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;