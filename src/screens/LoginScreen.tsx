import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const LoginScreen: React.FC = () => {
  const { doctor, login, isLoading } = useDoctor();
  const [mobile, setMobile] = useState(doctor?.phone || '98765 43210');
  const [pin, setPin] = useState('1234');
  const [showPinInput, setShowPinInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!mobile.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    const success = await login(mobile, pin);
    if (!success) {
      setError('Unable to sign in. Please verify details.');
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    // Instant biometric / quick pin demo login
    await login(mobile || '98765 43210', '1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-slate-50 flex flex-col items-center justify-between p-6 sm:p-8">
      {/* Top spacing */}
      <div className="w-full max-w-sm pt-8 sm:pt-16 flex flex-col items-center text-center">
        {/* Brand App Icon */}
        <div className="w-24 h-24 rounded-3xl bg-white shadow-card border border-teal-100 flex items-center justify-center p-3 mb-6 relative group transition-transform duration-300 hover:scale-105">
          <img
            src="/brand/opdly-icon.svg"
            alt="OPDly Icon"
            className="w-full h-full object-contain"
          />
          <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-sm">
            Solo Doctor
          </div>
        </div>

        {/* Wordmark & Tagline */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          OPD<span className="text-teal-600">ly</span>
        </h1>
        <p className="text-sm font-semibold text-slate-500 mt-1.5">
          Simple OPD. For Solo Doctors.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Manage your patients anytime, anywhere.
        </p>
      </div>

      {/* Login Card Form */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-card border border-slate-100 p-6 sm:p-8 my-8">
        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            autoFocus
          />

          {showPinInput && (
            <Input
              label="4-Digit PIN"
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            />
          )}

          {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>

          {/* PIN / Biometric Option */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleBiometricLogin}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <Fingerprint className="w-4 h-4 text-teal-600" />
              <span>Use PIN / Biometric</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="w-full text-center text-[11px] text-teal-700 font-medium hover:underline"
            >
              {showPinInput ? 'Hide PIN Input' : 'Enter PIN manually'}
            </button>
          </div>
        </form>

        {/* Demo Preset Hint */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Demo account seeded: <span className="font-semibold text-slate-600">{doctor?.name || 'Dr. Sujit Joshi'}</span>
          </p>
        </div>
      </div>

      {/* Footer Trust Badge */}
      <div className="w-full max-w-sm text-center pb-4">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-subtle">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Secure. Private. Made for Doctors.</span>
        </div>
      </div>
    </div>
  );
};
