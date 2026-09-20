import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, UserPlus, UserCheck } from 'lucide-react';
import { useReportsRepo } from '../../context/RepositoryContext';
import { ReportsData, ReportTimeRange } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/EmptyState';

export const ReportsScreen: React.FC = () => {
  const reportsRepo = useReportsRepo();
  const [timeRange, setTimeRange] = useState<ReportTimeRange>('Today');
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const res = await reportsRepo.getReports(timeRange);
        setData(res);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [timeRange, reportsRepo]);

  if (isLoading || !data) {
    return <LoadingState message="Calculating OPD insights..." />;
  }

  const newPatientPct =
    data.totalPatients > 0 ? Math.round((data.newPatients / data.totalPatients) * 100) : 0;
  const followUpPct = 100 - newPatientPct;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER & TIME FILTER PILLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">OPD Reports & Insights</h2>
          <p className="text-xs text-slate-500">
            Lightweight clinical practice summary and patient metrics
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl">
          {(['Today', 'Week', 'Month'] as ReportTimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-4 py-1.5 rounded-xl text-xs font-bold transition-all select-none
                ${
                  timeRange === range
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* METRICS 4-CARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Patients"
          value={data.totalPatients}
          sublabel={`${timeRange}'s consultations`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="New Patients"
          value={data.newPatients}
          sublabel="First-time registrations"
          icon={<UserPlus className="w-5 h-5" />}
        />
        <StatCard
          label="Follow-ups"
          value={data.followUpPatients}
          sublabel="Returning consultations"
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          label="Revenue"
          value={`₹${data.totalRevenue.toLocaleString('en-IN')}`}
          highlight
          sublabel="Collected fees"
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      {/* DESKTOP 2-COLUMN SECTION: DIAGNOSES BREAKDOWN & PATIENT RATIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COMMON INSIGHTS / TOP DIAGNOSES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Top Diagnoses ({timeRange})</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Occurrences</span>
          </div>

          <div className="space-y-3">
            {data.topDiagnoses.map((diag, index) => {
              const maxCount = data.topDiagnoses[0]?.count || 1;
              const barWidth = Math.max(15, Math.round((diag.count / maxCount) * 100));

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {index + 1}. {diag.name}
                    </span>
                    <span className="font-bold text-teal-700">{diag.count} patients</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NEW VS RETURNING PATIENT MIX */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Patient Distribution</span>
          </h3>

          <div className="space-y-4 pt-2">
            {/* Split Visual Progress Bar */}
            <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="bg-teal-600 transition-all duration-500"
                style={{ width: `${newPatientPct}%` }}
                title={`New: ${newPatientPct}%`}
              />
              <div
                className="bg-teal-200 transition-all duration-500"
                style={{ width: `${followUpPct}%` }}
                title={`Follow-up: ${followUpPct}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100">
                <span className="text-[11px] font-bold text-teal-800 uppercase">New Patients</span>
                <div className="text-xl font-black text-teal-900 mt-1">
                  {newPatientPct}%
                </div>
                <p className="text-[11px] text-teal-600 mt-0.5">{data.newPatients} patients</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Follow-up</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {followUpPct}%
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{data.followUpPatients} patients</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-2">
              Metrics automatically computed from completed visits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
