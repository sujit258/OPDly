import React, { createContext, useContext, useMemo } from 'react';
import { IAppRepositories, appRepositories } from '../services/localRepository';
import {
  HttpPatientRepository,
  HttpConsultationRepository,
  HttpBillingRepository,
  HttpReportsRepository,
  HttpClinicRepository,
} from '../services/httpRepository';
import {
  IBillingRepository,
  IClinicRepository,
  IConsultationRepository,
  IPatientRepository,
  IReportsRepository,
} from '../types';

export const httpRepositories: IAppRepositories = {
  patient: new HttpPatientRepository(),
  consultation: new HttpConsultationRepository(),
  billing: new HttpBillingRepository(),
  reports: new HttpReportsRepository(),
  clinic: new HttpClinicRepository(),
};

interface RepositoryContextType {
  repos: IAppRepositories;
  patientRepo: IPatientRepository;
  consultationRepo: IConsultationRepository;
  billingRepo: IBillingRepository;
  reportsRepo: IReportsRepository;
  clinicRepo: IClinicRepository;
  isRemote: boolean;
}

const RepositoryContext = createContext<RepositoryContextType | null>(null);

export const RepositoryProvider: React.FC<{
  repositories?: IAppRepositories;
  children: React.ReactNode;
}> = ({ repositories, children }) => {
  const isRemote = import.meta.env.VITE_API_MODE === 'remote';
  const defaultRepos = isRemote ? httpRepositories : appRepositories;
  const activeRepos = repositories || defaultRepos;

  const value = useMemo(
    () => ({
      repos: activeRepos,
      patientRepo: activeRepos.patient,
      consultationRepo: activeRepos.consultation,
      billingRepo: activeRepos.billing,
      reportsRepo: activeRepos.reports,
      clinicRepo: activeRepos.clinic,
      isRemote,
    }),
    [activeRepos, isRemote]
  );

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
};

export const useRepositories = (): RepositoryContextType => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
};

export const usePatientRepo = (): IPatientRepository => useRepositories().patientRepo;
export const useConsultationRepo = (): IConsultationRepository => useRepositories().consultationRepo;
export const useBillingRepo = (): IBillingRepository => useRepositories().billingRepo;
export const useReportsRepo = (): IReportsRepository => useRepositories().reportsRepo;
export const useClinicRepo = (): IClinicRepository => useRepositories().clinicRepo;
