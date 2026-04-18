import { useState } from "react";

interface PatientVisitResultCardProps {
  subtitle?: string;
  title?: string;
}

export const PatientVisitResultCard = ({
  subtitle = "Rezultatele și recomandările rămân locale până la extinderea backend-ului pentru aceste câmpuri.",
  title = "Rezultate și observații",
}: PatientVisitResultCardProps): JSX.Element => {
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [investigationResults, setInvestigationResults] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [analyses, setAnalyses] = useState("");
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  return (
    <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 md:p-6">
      <div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
          Consultația de azi
        </span>
        <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rezultate și observații</p>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-symptoms">
                Simptome
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-symptoms" onChange={(event) => setSymptoms(event.target.value)} value={symptoms} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-diagnosis">
                Diagnostic
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-diagnosis" onChange={(event) => setDiagnosis(event.target.value)} value={diagnosis} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-observations">
                Observații
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-observations" onChange={(event) => setObservations(event.target.value)} value={observations} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-investigations">
                Rezultate investigații
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-investigations" onChange={(event) => setInvestigationResults(event.target.value)} value={investigationResults} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recomandări și follow-up</p>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-recommendations">
                Recomandări
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-recommendations" onChange={(event) => setRecommendations(event.target.value)} value={recommendations} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-treatment-plan">
                Plan de tratament
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-treatment-plan" onChange={(event) => setTreatmentPlan(event.target.value)} value={treatmentPlan} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-analyses">
                Analize / control ulterior
              </label>
              <textarea className="input-base min-h-24 resize-y" id="visit-analyses" onChange={(event) => setAnalyses(event.target.value)} value={analyses} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Follow-up</p>
                  <p className="mt-1 text-sm text-slate-500">Marchează dacă vrei un control ulterior planificat.</p>
                </div>
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${followUpEnabled ? "border-primary bg-primary text-white shadow-panel" : "border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"}`}
                  onClick={() => setFollowUpEnabled((currentValue) => !currentValue)}
                  type="button"
                >
                  {followUpEnabled ? "Follow-up activ" : "Setează follow-up"}
                </button>
              </div>
              {followUpEnabled ? (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="visit-follow-up-date">
                    Dată recomandată
                  </label>
                  <input className="input-base" id="visit-follow-up-date" onChange={(event) => setFollowUpDate(event.target.value)} type="datetime-local" value={followUpDate} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};