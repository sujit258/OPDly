import {
  Bill,
  Clinic,
  ConsultationDraft,
  Doctor,
  IBillingRepository,
  IClinicRepository,
  IConsultationRepository,
  IPatientRepository,
  IReportsRepository,
  Patient,
  Prescription,
  PrescriptionMedicine,
  PrescriptionTemplate,
  ReportsData,
  ReportTimeRange,
  Visit,
  VisitInvestigation,
  VisitSymptom,
  Vital,
  Diagnosis,
  PaymentMethod,
} from '../types';
import { ApiClient, defaultApiClient } from './apiClient';

// =============================================================
// HTTP PATIENT REPOSITORY
// =============================================================
export class HttpPatientRepository implements IPatientRepository {
  constructor(private client: ApiClient = defaultApiClient) {}

  async getAll(): Promise<Patient[]> {
    return this.client.get<Patient[]>('/patients');
  }

  async search(query: string, filter: 'Recent' | 'All' | 'Favorites' = 'All'): Promise<Patient[]> {
    const params = new URLSearchParams({ q: query, filter });
    return this.client.get<Patient[]>(`/patients/search?${params.toString()}`);
  }

  async getById(id: string): Promise<Patient | null> {
    try {
      return await this.client.get<Patient>(`/patients/${id}`);
    } catch {
      return null;
    }
  }

  async getByMobile(mobile: string): Promise<Patient | null> {
    try {
      const clean = mobile.replace(/\s+/g, '');
      return await this.client.get<Patient>(`/patients/by-mobile/${clean}`);
    } catch {
      return null;
    }
  }

  async create(
    patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'totalVisitsCount'>
  ): Promise<Patient> {
    return this.client.post<Patient>('/patients', patient);
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    return this.client.patch<Patient>(`/patients/${id}`, data);
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const res = await this.client.post<{ isFavorite: boolean }>(`/patients/${id}/toggle-favorite`);
    return res.isFavorite;
  }

  async getRecent(limit = 5): Promise<Patient[]> {
    return this.client.get<Patient[]>(`/patients/recent?limit=${limit}`);
  }
}

// =============================================================
// HTTP CONSULTATION REPOSITORY
// =============================================================
export class HttpConsultationRepository implements IConsultationRepository {
  constructor(private client: ApiClient = defaultApiClient) {}

  async getVisitsByPatient(patientId: string): Promise<Visit[]> {
    return this.client.get<Visit[]>(`/consultations/patients/${patientId}/visits`);
  }

  async getVisitById(visitId: string): Promise<Visit | null> {
    try {
      return await this.client.get<Visit>(`/consultations/visits/${visitId}`);
    } catch {
      return null;
    }
  }

  async getPreviousPrescription(patientId: string): Promise<Prescription | null> {
    try {
      return await this.client.get<Prescription | null>(
        `/consultations/patients/${patientId}/previous-prescription`
      );
    } catch {
      return null;
    }
  }

  async saveDraft(draft: ConsultationDraft): Promise<void> {
    await this.client.put('/consultations/draft', draft);
  }

  async getDraft(): Promise<ConsultationDraft | null> {
    try {
      return await this.client.get<ConsultationDraft | null>('/consultations/draft');
    } catch {
      return null;
    }
  }

  async clearDraft(): Promise<void> {
    try {
      await this.client.delete('/consultations/draft');
    } catch {
      // Ignored
    }
  }

  async completeVisit(data: {
    patientId: string;
    symptoms: VisitSymptom[];
    clinicalNotes?: string;
    vitals?: Vital;
    diagnoses: Diagnosis[];
    medicines: PrescriptionMedicine[];
    investigations: VisitInvestigation[];
    advices: string[];
    followUp: string;
    consultationFee: number;
    discount: number;
    paymentMethod: PaymentMethod;
    markAsPaid: boolean;
    billingNotes?: string;
  }): Promise<Visit> {
    return this.client.post<Visit>('/consultations/complete', data);
  }

  async getAllCompletedVisits(): Promise<Visit[]> {
    return this.client.get<Visit[]>('/consultations/visits');
  }
}

// =============================================================
// HTTP BILLING REPOSITORY
// =============================================================
export class HttpBillingRepository implements IBillingRepository {
  constructor(private client: ApiClient = defaultApiClient) {}

  async getBillById(billId: string): Promise<Bill | null> {
    try {
      return await this.client.get<Bill>(`/billing/bills/${billId}`);
    } catch {
      return null;
    }
  }

  async getBillsByPatient(patientId: string): Promise<Bill[]> {
    return this.client.get<Bill[]>(`/billing/patients/${patientId}/bills`);
  }

  async getDailySummary(dateStr: string): Promise<{
    totalRevenue: number;
    completedCount: number;
    cashAmount: number;
    upiAmount: number;
    cardAmount: number;
  }> {
    return this.client.get<{
      totalRevenue: number;
      completedCount: number;
      cashAmount: number;
      upiAmount: number;
      cardAmount: number;
    }>(`/billing/daily-summary?date=${dateStr}`);
  }
}

// =============================================================
// HTTP REPORTS REPOSITORY
// =============================================================
export class HttpReportsRepository implements IReportsRepository {
  constructor(private client: ApiClient = defaultApiClient) {}

  async getReports(range: ReportTimeRange): Promise<ReportsData> {
    return this.client.get<ReportsData>(`/reports?range=${range}`);
  }
}

// =============================================================
// HTTP CLINIC REPOSITORY
// =============================================================
export class HttpClinicRepository implements IClinicRepository {
  constructor(private client: ApiClient = defaultApiClient) {}

  async getDoctor(): Promise<Doctor> {
    return this.client.get<Doctor>('/clinic/doctor');
  }

  async updateDoctor(data: Partial<Doctor>): Promise<Doctor> {
    return this.client.patch<Doctor>('/clinic/doctor', data);
  }

  async getClinic(): Promise<Clinic> {
    return this.client.get<Clinic>('/clinic/profile');
  }

  async updateClinic(data: Partial<Clinic>): Promise<Clinic> {
    return this.client.patch<Clinic>('/clinic/profile', data);
  }

  async getTemplates(): Promise<PrescriptionTemplate[]> {
    return this.client.get<PrescriptionTemplate[]>('/clinic/templates');
  }

  async createTemplate(
    template: Omit<PrescriptionTemplate, 'id'>
  ): Promise<PrescriptionTemplate> {
    return this.client.post<PrescriptionTemplate>('/clinic/templates', template);
  }

  async updateTemplate(
    id: string,
    data: Partial<PrescriptionTemplate>
  ): Promise<PrescriptionTemplate> {
    return this.client.patch<PrescriptionTemplate>(`/clinic/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const res = await this.client.delete<{ success: boolean }>(`/clinic/templates/${id}`);
    return res.success ?? true;
  }

  async exportData(): Promise<string> {
    const res = await this.client.get<Record<string, unknown>>('/clinic/export');
    return JSON.stringify(res, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
    const parsed = JSON.parse(jsonData);
    const res = await this.client.post<{ success: boolean }>('/clinic/import', parsed);
    return res.success ?? true;
  }

  async resetToDemoSeed(): Promise<void> {
    // Reset call if implemented on backend
  }
}
