import React, { useState } from 'react';
import { API_BASE } from '../utils/apiConfig';

interface AIGlazingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const AIGlazingAssistantModal: React.FC<AIGlazingAssistantModalProps> = ({
  isOpen,
  onClose,
  embedded = false,
}) => {
  const [patientRx, setPatientRx] = useState({
    odSph: '-3.50',
    odCyl: '-1.25',
    odAxis: '85',
    odAdd: '+0.00',
    odPd: '31.5',
    osSph: '-3.25',
    osCyl: '-1.00',
    osAxis: '95',
    osAdd: '+0.00',
    osPd: '32.0',
  });

  const [frameType, setFrameType] = useState('Full Metal Aviator (Ray-Ban 3025)');
  const [lensMaterial, setLensMaterial] = useState('1.61 High-Index MR-8 (Essilor Crizal)');
  const [edgerMachine, setEdgerMachine] = useState('Essilor Delta 200 Auto Edger');
  const [queryPrompt, setQueryPrompt] = useState(
    'Verify ISO 21987 axis tolerance, calculated edge thickness at 85°, and recommend Delta 200 bevel placement for Ray-Ban 3025 metal groove.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [engineModel, setEngineModel] = useState<string>('OptiVision Precision Clinical Glazing Engine');
  const [engineNotice, setEngineNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setEngineNotice(null);

    try {
      const res = await fetch(`${API_BASE}/api/gemini/thinking-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryPrompt,
          patientRx,
          frameSpecs: {
            frameType,
            edgerMachine,
          },
          lensMaterial,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete analysis');
      }

      setAnalysisResult(data.text);
      if (data.model) setEngineModel(data.model);
      if (data.notice) setEngineNotice(data.notice);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during thinking analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (type: 'farhana' | 'progressive' | 'rimless') => {
    if (type === 'farhana') {
      setPatientRx({
        odSph: '-3.50',
        odCyl: '-1.25',
        odAxis: '85',
        odAdd: '+0.00',
        odPd: '31.5',
        osSph: '-3.25',
        osCyl: '-1.00',
        osAxis: '95',
        osAdd: '+0.00',
        osPd: '32.0',
      });
      setFrameType('Ray-Ban 3025 Aviator Metal');
      setLensMaterial('Essilor Crizal 1.61 BlueCut');
      setQueryPrompt('Verify ISO 21987 axis tolerance (allowed ±2° for >1.00D cyl), check decentration in 58mm lens shape, and compute edge thickness at thinnest/thickest meridian.');
    } else if (type === 'progressive') {
      setPatientRx({
        odSph: '+1.50',
        odCyl: '-0.75',
        odAxis: '180',
        odAdd: '+2.25',
        odPd: '32.5',
        osSph: '+1.75',
        osCyl: '-0.50',
        osAxis: '175',
        osAdd: '+2.25',
        osPd: '32.0',
      });
      setFrameType('Silhouette Rimless Titan TMA');
      setLensMaterial('Rodenstock Impression 1.67 Freeform');
      setQueryPrompt('Calculate corridor length (14mm vs 17mm) for B-measurement of 34mm, verify drill coordinate security, and recommend minimum center thickness.');
    } else {
      setPatientRx({
        odSph: '-1.75',
        odCyl: '-1.50',
        odAxis: '85',
        odAdd: '+1.25',
        odPd: '33.0',
        osSph: '-2.00',
        osCyl: '-1.25',
        osAxis: '90',
        osAdd: '+1.25',
        osPd: '33.0',
      });
      setFrameType('Semi-Rimless Metal Supra (Nylon Thread)');
      setLensMaterial('1.60 MR-8 High Tensile');
      setQueryPrompt('Evaluate nylon groove depth (0.6mm vs 0.8mm) and minimum edge safety thickness (must be ≥2.0mm) to prevent chipping on supra mount.');
    }
  };

  const content = (
    <div className={`bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full ${embedded ? 'shadow-sm max-w-none' : 'max-w-4xl max-h-[90vh]'} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
      {/* Modal Header */}
      <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-headline-sm font-bold text-on-surface">
                AI Clinical Refraction &amp; Glazing Specialist
              </h2>
              <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full text-[10px] font-bold uppercase tracking-wider">
                Thinking Mode: HIGH
              </span>
              <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-full text-[10px] font-bold font-data-rx">
                gemini-3.1-pro-preview
              </span>
            </div>
            <p className="text-[12px] text-outline">
              Step-by-step ophthalmic reasoning, ISO 21987 axis validation, and automatic edger calibration
            </p>
          </div>
        </div>
        {embedded ? (
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Conveyor</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Modal Body */}
      <div className={`p-6 ${embedded ? '' : 'overflow-y-auto max-h-[75vh]'} flex-1 flex flex-col gap-5`}>
          {/* Quick Presets */}
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-semibold text-outline">Load Clinical Presets:</span>
            <button
              onClick={() => loadPreset('farhana')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant font-medium cursor-pointer"
            >
              Tray #B-14 (Farhana -3.50 / -1.25x85)
            </button>
            <button
              onClick={() => loadPreset('progressive')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant font-medium cursor-pointer"
            >
              Tray #A-03 (Dr. Mahbubul Progressive)
            </button>
            <button
              onClick={() => loadPreset('rimless')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant font-medium cursor-pointer"
            >
              Tray #A-11 (Nylon Supra Axis 85°/90°)
            </button>
          </div>

          {/* Prescription Matrix Form */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/70 flex flex-col gap-3">
            <span className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
              Prescription Refraction Matrix (OD / OS)
            </span>

            <div className="grid grid-cols-1 gap-2">
              {/* OD Matrix */}
              <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
                <div className="text-[12px] font-bold text-on-surface pb-1 border-b border-surface-container mb-2 flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-surface-container rounded text-[11px] font-data-rx font-bold">
                    OD (Right Eye)
                  </span>
                  <span className="text-[10px] text-outline">Oculus Dexter</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center font-data-rx text-[12px]">
                  <div>
                    <span className="text-[10px] text-outline block">SPH</span>
                    <input
                      type="text"
                      value={patientRx.odSph}
                      onChange={(e) => setPatientRx({ ...patientRx, odSph: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded font-semibold text-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">CYL</span>
                    <input
                      type="text"
                      value={patientRx.odCyl}
                      onChange={(e) => setPatientRx({ ...patientRx, odCyl: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded font-semibold text-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">AXIS</span>
                    <input
                      type="text"
                      value={patientRx.odAxis}
                      onChange={(e) => setPatientRx({ ...patientRx, odAxis: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded font-semibold text-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">ADD</span>
                    <input
                      type="text"
                      value={patientRx.odAdd}
                      onChange={(e) => setPatientRx({ ...patientRx, odAdd: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded text-on-surface"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">PD</span>
                    <input
                      type="text"
                      value={patientRx.odPd}
                      onChange={(e) => setPatientRx({ ...patientRx, odPd: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded text-on-surface"
                    />
                  </div>
                </div>
              </div>

              {/* OS Matrix */}
              <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
                <div className="text-[12px] font-bold text-on-surface pb-1 border-b border-surface-container mb-2 flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded text-[11px] font-data-rx font-bold">
                    OS (Left Eye)
                  </span>
                  <span className="text-[10px] text-outline">Oculus Sinister</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center font-data-rx text-[12px]">
                  <div>
                    <span className="text-[10px] text-outline block">SPH</span>
                    <input
                      type="text"
                      value={patientRx.osSph}
                      onChange={(e) => setPatientRx({ ...patientRx, osSph: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded font-semibold text-secondary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">CYL</span>
                    <input
                      type="text"
                      value={patientRx.osCyl}
                      onChange={(e) => setPatientRx({ ...patientRx, osCyl: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded font-semibold text-secondary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">AXIS</span>
                    <input
                      type="text"
                      value={patientRx.osAxis}
                      onChange={(e) => setPatientRx({ ...patientRx, osAxis: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded font-semibold text-secondary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">ADD</span>
                    <input
                      type="text"
                      value={patientRx.osAdd}
                      onChange={(e) => setPatientRx({ ...patientRx, osAdd: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded text-on-surface"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">PD</span>
                    <input
                      type="text"
                      value={patientRx.osPd}
                      onChange={(e) => setPatientRx({ ...patientRx, osPd: e.target.value })}
                      className="w-full h-8 text-center bg-surface-container-low border border-outline-variant rounded text-on-surface"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Machine & Material Config */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">
                Frame &amp; Mount Chassis
              </label>
              <input
                type="text"
                value={frameType}
                onChange={(e) => setFrameType(e.target.value)}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">
                Lens Material &amp; Coating
              </label>
              <input
                type="text"
                value={lensMaterial}
                onChange={(e) => setLensMaterial(e.target.value)}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">
                Active Automatic Edger
              </label>
              <input
                type="text"
                value={edgerMachine}
                onChange={(e) => setEdgerMachine(e.target.value)}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              />
            </div>
          </div>

          {/* Query Prompt */}
          <div>
            <label className="text-[11px] font-semibold text-outline block mb-1">
              Clinical &amp; Edging Inquiry (High Reasoning)
            </label>
            <textarea
              rows={3}
              value={queryPrompt}
              onChange={(e) => setQueryPrompt(e.target.value)}
              className="w-full p-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>

          {/* Execute CTA */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-outline flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">model_training</span>
              <span>Engaging High Thinking Engine (Extended CoT Reasoning)</span>
            </div>
            <button
              disabled={isLoading}
              onClick={handleRunAnalysis}
              className="px-5 py-2.5 bg-secondary text-on-secondary hover:bg-secondary/90 disabled:opacity-50 rounded-xl text-label-md font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Deep Reasoning in Progress...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Run High-Thinking Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg border border-tertiary/20 text-[12px]">
              <strong>Analysis Error:</strong> {errorMsg}
            </div>
          )}

          {/* Results Display */}
          {analysisResult && (
            <div className="p-4 bg-surface-container-low border border-secondary/30 rounded-xl text-on-surface">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60 mb-3">
                <span className="text-label-md font-bold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Optical Lab &amp; Clinical Reasoning Result
                </span>
                <span className="text-[11px] font-data-rx bg-secondary-fixed text-on-secondary-fixed px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  {engineModel}
                </span>
              </div>
              {engineNotice && (
                <div className="mb-3 px-3 py-1.5 bg-secondary-fixed/50 border border-secondary/20 rounded-lg text-[11px] text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span>{engineNotice}</span>
                </div>
              )}
              <div className="prose prose-sm max-w-none text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
      {content}
    </div>
  );
};
