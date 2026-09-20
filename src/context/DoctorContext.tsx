import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Clinic, Doctor } from '../types';
import { useClinicRepo } from './RepositoryContext';
import { defaultApiClient } from '../services/apiClient';

interface DoctorContextType {
  doctor: Doctor | null;
  clinic: Clinic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (mobile: string, pin?: string) => Promise<boolean>;
  logout: () => void;
  refreshDoctorProfile: () => Promise<void>;
  updateDoctor: (data: Partial<Doctor>) => Promise<Doctor>;
  updateClinic: (data: Partial<Clinic>) => Promise<Clinic>;
}

const DoctorContext = createContext<DoctorContextType | null>(null);

const DEMO_AUTH_KEY = 'opdly_demo_authenticated';

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clinicRepo = useClinicRepo();
  const isRemote = import.meta.env.VITE_API_MODE === 'remote';

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isRemote) return false;
    return localStorage.getItem(DEMO_AUTH_KEY) === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Handle unauthorized event across the application
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setDoctor(null);
      if (!isRemote) localStorage.removeItem(DEMO_AUTH_KEY);
    };

    window.addEventListener('opdly:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('opdly:unauthorized', handleUnauthorized);
  }, [isRemote]);

  const refreshDoctorProfile = useCallback(async () => {
    try {
      if (isRemote) {
        // Authenticate session server-side via same-origin HttpOnly cookie
        const authData = await defaultApiClient.get<{ doctor: Doctor; clinic: Clinic }>('/auth/me');
        if (authData && authData.doctor) {
          setDoctor(authData.doctor);
          setClinic(authData.clinic);
          setIsAuthenticated(true);
        }
      } else {
        const [doc, cln] = await Promise.all([clinicRepo.getDoctor(), clinicRepo.getClinic()]);
        setDoctor(doc);
        setClinic(cln);
      }
    } catch (err) {
      if (isRemote) {
        setIsAuthenticated(false);
      } else {
        console.error('Failed to load doctor/clinic profile:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [clinicRepo, isRemote]);

  useEffect(() => {
    refreshDoctorProfile();
  }, [refreshDoctorProfile]);

  const login = async (mobile: string, pin?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isRemote) {
        // Call remote API - server validates and sets HttpOnly session + CSRF cookie
        const res = await defaultApiClient.post<{ doctor: Doctor; clinic: Clinic }>(
          '/auth/login',
          { mobile, password: pin }
        );
        if (res && res.doctor) {
          setDoctor(res.doctor);
          setClinic(res.clinic);
          setIsAuthenticated(true);
          return true;
        }
        return false;
      } else {
        const currentDoc = await clinicRepo.getDoctor();
        if (mobile && mobile.replace(/\s+/g, '').length >= 4) {
          setIsAuthenticated(true);
          localStorage.setItem(DEMO_AUTH_KEY, 'true');
          setDoctor(currentDoc);
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (isRemote) {
      defaultApiClient.post('/auth/logout').catch(() => {});
    } else {
      localStorage.removeItem(DEMO_AUTH_KEY);
    }
    setIsAuthenticated(false);
    setDoctor(null);
  };

  const updateDoctor = async (data: Partial<Doctor>): Promise<Doctor> => {
    const updated = await clinicRepo.updateDoctor(data);
    setDoctor(updated);
    return updated;
  };

  const updateClinic = async (data: Partial<Clinic>): Promise<Clinic> => {
    const updated = await clinicRepo.updateClinic(data);
    setClinic(updated);
    return updated;
  };

  return (
    <DoctorContext.Provider
      value={{
        doctor,
        clinic,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshDoctorProfile,
        updateDoctor,
        updateClinic,
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = (): DoctorContextType => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};
