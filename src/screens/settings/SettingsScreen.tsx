import React, { useState } from 'react';
import {
  Building2,
  User,
  DollarSign,
  FileText,
  PenTool,
  Download,
  Upload,
  RefreshCw,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';
import { useClinicRepo } from '../../context/RepositoryContext';
import { PrescriptionTemplate } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';

export const SettingsScreen: React.FC = () => {
  const { doctor, clinic, updateDoctor, updateClinic, logout } = useDoctor();
  const clinicRepo = useClinicRepo();

  // Active modal editor state
  const [activeModal, setActiveModal] = useState<
    'doctor' | 'clinic' | 'fee' | 'templates' | 'signature' | null
  >(null);

  // Form states for modal editing
  const [docName, setDocName] = useState(doctor?.name || '');
  const [docQual, setDocQual] = useState(doctor?.qualifications || '');
  const [docReg, setDocReg] = useState(doctor?.registrationNumber || '');
  const [docSpec, setDocSpec] = useState(doctor?.specialty || '');
  const [docPhone, setDocPhone] = useState(doctor?.phone || '');
  const [sigText, setSigText] = useState(doctor?.signatureText || '');

  const [clinicName, setClinicName] = useState(clinic?.name || '');
  const [clinicAddress, setClinicAddress] = useState(clinic?.address || '');
  const [clinicPhone, setClinicPhone] = useState(clinic?.phone || '');
  const [clinicTimings, setClinicTimings] = useState(clinic?.timings || '');
  const [consultFee, setConsultFee] = useState(clinic?.consultationFee || 500);
  const [followUpFee, setFollowUpFee] = useState(clinic?.followUpFee || 300);

  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const openDoctorModal = () => {
    setDocName(doctor?.name || '');
    setDocQual(doctor?.qualifications || '');
    setDocReg(doctor?.registrationNumber || '');
    setDocSpec(doctor?.specialty || '');
    setDocPhone(doctor?.phone || '');
    setActiveModal('doctor');
  };

  const openClinicModal = () => {
    setClinicName(clinic?.name || '');
    setClinicAddress(clinic?.address || '');
    setClinicPhone(clinic?.phone || '');
    setClinicTimings(clinic?.timings || '');
    setActiveModal('clinic');
  };

  const openFeeModal = () => {
    setConsultFee(clinic?.consultationFee || 500);
    setFollowUpFee(clinic?.followUpFee || 300);
    setActiveModal('fee');
  };

  const openTemplatesModal = async () => {
    const tpls = await clinicRepo.getTemplates();
    setTemplates(tpls);
    setActiveModal('templates');
  };

  const openSignatureModal = () => {
    setSigText(doctor?.signatureText || doctor?.name || '');
    setActiveModal('signature');
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoctor({
      name: docName,
      qualifications: docQual,
      registrationNumber: docReg,
      specialty: docSpec,
      phone: docPhone,
    });
    triggerSuccessToast('Doctor profile updated successfully!');
    setActiveModal(null);
  };

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateClinic({
      name: clinicName,
      address: clinicAddress,
      phone: clinicPhone,
      timings: clinicTimings,
    });
    triggerSuccessToast('Clinic details updated successfully!');
    setActiveModal(null);
  };

  const handleSaveFees = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateClinic({
      consultationFee: consultFee,
      followUpFee: followUpFee,
    });
    triggerSuccessToast('Consultation fees updated!');
    setActiveModal(null);
  };

  const handleSaveSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoctor({
      signatureText: sigText,
    });
    triggerSuccessToast('Digital signature updated!');
    setActiveModal(null);
  };

  const handleExportData = async () => {
    const jsonStr = await clinicRepo.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opdly-clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerSuccessToast('Clinic database exported successfully!');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const ok = await clinicRepo.importData(text);
        if (ok) {
          triggerSuccessToast('Data backup restored successfully!');
          window.location.reload();
        } else {
          alert('Failed to import data. Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleResetDemo = async () => {
    if (
      window.confirm(
        'Reset clinic, patient, and consultation records back to initial demo state?'
      )
    ) {
      await clinicRepo.resetToDemoSeed();
      triggerSuccessToast('Reset to demo seed completed!');
      window.location.reload();
    }
  };

  const triggerSuccessToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings & Clinic Setup</h2>
        <p className="text-xs text-slate-500">
          Configure doctor credentials, clinic letterhead, fees, and data backup
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2-COLUMN RESPONSIVE LAYOUT (Desktop: 2 columns, Mobile: 1 column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: PRACTICE & CLINICAL PROFILE */}
        <div className="space-y-6">
          {/* SECTION 1: CLINIC & DOCTOR PROFILE */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Clinic & Doctor Profile
            </h3>

            <div className="divide-y divide-slate-100">
          {/* Clinic Profile */}
          <button
            onClick={openClinicModal}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Clinic Profile</h4>
                <p className="text-xs text-slate-400">
                  {clinic?.name} · {clinic?.phone}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Doctor Profile */}
          <button
            onClick={openDoctorModal}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Doctor Profile</h4>
                <p className="text-xs text-slate-400">
                  {doctor?.name} ({doctor?.qualifications})
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Consultation Fee */}
          <button
            onClick={openFeeModal}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Consultation Fee</h4>
                <p className="text-xs text-slate-400">
                  General: ₹{clinic?.consultationFee} · Follow-up: ₹{clinic?.followUpFee}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Medicine Templates */}
          <button
            onClick={openTemplatesModal}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Prescription Templates</h4>
                <p className="text-xs text-slate-400">Manage 1-click clinical protocols</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Digital Signature */}
          <button
            onClick={openSignatureModal}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Digital Signature</h4>
                <p className="text-xs text-slate-400">
                  Signatory name on printable prescriptions
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
      </div>
      {/* End Left Column */}

      {/* RIGHT COLUMN: DATA & BACKUP + ACCOUNT */}
      <div className="space-y-6">
        {/* SECTION 2: DATA & BACKUP */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
          Data & Offline Storage
        </h3>

        <div className="divide-y divide-slate-100">
          {/* Export Data */}
          <button
            onClick={handleExportData}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Export All Data (JSON)</h4>
                <p className="text-xs text-slate-400">
                  Full offline backup of patients, visits, and bills
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Import Data */}
          <button
            onClick={handleImportData}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Import & Restore Data</h4>
                <p className="text-xs text-slate-400">Restore database from backup JSON file</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={handleResetDemo}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Reset Demo Data</h4>
                <p className="text-xs text-slate-400">Reload default prototype patients & doctor</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SECTION 3: ACCOUNT & LOGOUT */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
          Account
        </h3>

        <div className="divide-y divide-slate-100">
          <div className="w-full py-3 px-2 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Help & Support</h4>
                <p className="text-xs text-slate-400">Version 1.0.0 (Phase 1 Solo Doctor OPD)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              Active
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full py-3 px-2 flex items-center justify-between hover:bg-red-50 rounded-xl transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-600">Logout</h4>
                <p className="text-xs text-red-400">End active doctor session</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      </div>
      {/* End Right Column */}
    </div>
    {/* End 2-column grid */}

      {/* ============================================================== */}
      {/* MODALS FOR CONFIGURING DOCTOR, CLINIC, FEES, TEMPLATES         */}
      {/* ============================================================== */}

      {/* 1. DOCTOR MODAL */}
      <Modal
        isOpen={activeModal === 'doctor'}
        onClose={() => setActiveModal(null)}
        title="Edit Doctor Profile"
      >
        <form onSubmit={handleSaveDoctor} className="space-y-4">
          <Input
            label="Doctor Full Name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            required
          />
          <Input
            label="Qualifications"
            placeholder="e.g. MBBS, MD, BHMS"
            value={docQual}
            onChange={(e) => setDocQual(e.target.value)}
            required
          />
          <Input
            label="Registration Number"
            value={docReg}
            onChange={(e) => setDocReg(e.target.value)}
            required
          />
          <Input
            label="Specialty"
            value={docSpec}
            onChange={(e) => setDocSpec(e.target.value)}
          />
          <Input
            label="Phone Number"
            value={docPhone}
            onChange={(e) => setDocPhone(e.target.value)}
          />
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Save Doctor Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. CLINIC MODAL */}
      <Modal
        isOpen={activeModal === 'clinic'}
        onClose={() => setActiveModal(null)}
        title="Edit Clinic Profile"
      >
        <form onSubmit={handleSaveClinic} className="space-y-4">
          <Input
            label="Clinic Name"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            required
          />
          <Input
            label="Clinic Address"
            value={clinicAddress}
            onChange={(e) => setClinicAddress(e.target.value)}
            required
          />
          <Input
            label="Clinic Contact Phone"
            value={clinicPhone}
            onChange={(e) => setClinicPhone(e.target.value)}
            required
          />
          <Input
            label="Clinic Timings"
            value={clinicTimings}
            onChange={(e) => setClinicTimings(e.target.value)}
          />
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Save Clinic Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. FEES MODAL */}
      <Modal
        isOpen={activeModal === 'fee'}
        onClose={() => setActiveModal(null)}
        title="Set Consultation Fees"
      >
        <form onSubmit={handleSaveFees} className="space-y-4">
          <Input
            label="General Consultation Fee (₹)"
            type="number"
            value={consultFee}
            onChange={(e) => setConsultFee(Number(e.target.value) || 0)}
            required
          />
          <Input
            label="Follow-up Consultation Fee (₹)"
            type="number"
            value={followUpFee}
            onChange={(e) => setFollowUpFee(Number(e.target.value) || 0)}
            required
          />
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Save Fees
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. TEMPLATES MODAL */}
      <Modal
        isOpen={activeModal === 'templates'}
        onClose={() => setActiveModal(null)}
        title="Prescription Templates"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Templates allow the doctor to populate common regimens with a single tap.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">{tpl.name}</h4>
                  <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">
                    {tpl.medicines.length} medicines
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  {tpl.medicines.map((m, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-medium">{m.medicineName}</span>
                      <span>
                        {m.frequency} ({m.timing})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button variant="secondary" size="md" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. SIGNATURE MODAL */}
      <Modal
        isOpen={activeModal === 'signature'}
        onClose={() => setActiveModal(null)}
        title="Prescription Signatory"
      >
        <form onSubmit={handleSaveSignature} className="space-y-4">
          <Input
            label="Signatory Name / Signature Text"
            placeholder="e.g. Dr. Sujit Joshi, MD"
            value={sigText}
            onChange={(e) => setSigText(e.target.value)}
            required
            helperText="This text appears above the doctor stamp line on printable prescriptions."
          />
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Save Signature
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
