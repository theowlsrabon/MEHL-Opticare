import { OpticalJob, StageAuditEntry } from '../types';

export const STAGE_CONFIG: Record<1 | 2 | 3 | 4 | 5, {
  name: string;
  shortName: string;
  station: string;
  defaultAction: string;
  defaultActor: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}> = {
  1: {
    name: 'Intake & Lens Pulling',
    shortName: 'Intake',
    station: 'Sorting Station & Lens Vault Rack 4A',
    defaultAction: 'Tray assigned to Intake & lens blank pulled from vault',
    defaultActor: 'Anis (Stock Tech)',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
    icon: 'inbox',
  },
  2: {
    name: 'Lens Cutting & Automated Edging',
    shortName: 'Cutting & Edging',
    station: 'Essilor Delta 200 Auto-Edger #02',
    defaultAction: 'Transferred to Edger machine for 3D bevel tracing & cutting',
    defaultActor: 'Master Ripon (Senior Glazier)',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-800 dark:text-amber-200',
    icon: 'precision_manufacturing',
  },
  3: {
    name: 'Mounting & Axis Check',
    shortName: 'Mounting & Axis',
    station: 'Optical Assembly Bench 03 & Axis Alignment Jig',
    defaultAction: 'Mounted into chassis, nylon cord / screw tension set, axis aligned',
    defaultActor: 'S. Hossain (Glazing Technician)',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-800 dark:text-blue-200',
    icon: 'tune',
  },
  4: {
    name: 'Focimeter & QC Check',
    shortName: 'Focimeter QC',
    station: 'Shin-Nippon Auto-Lensmeter Bench 01',
    defaultAction: 'Verified optical power, PD, prism, and cosmetic scratch inspection',
    defaultActor: 'Dr. R. Huq, OD (Chief Optometrist)',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    icon: 'verified',
  },
  5: {
    name: 'Ready for Handover',
    shortName: 'Ready for Handover',
    station: 'Dispensing Counter / Secure Storage Drawer',
    defaultAction: 'Packaged with premium hard case, microfiber cloth & staged in dispensing drawer',
    defaultActor: 'Dispensing Desk Operator',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    icon: 'check_circle',
  },
};

/**
 * Format current timestamp for audit logging (e.g. "Sep 10, 2026 • 05:24 PM")
 */
export function formatAuditTimestamp(date: Date = new Date()): string {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} • ${timeStr}`;
}

/**
 * Helper to generate a new StageAuditEntry when a tray transitions
 */
export function createStageTransitionEntry(
  job: OpticalJob,
  toStage: 1 | 2 | 3 | 4 | 5,
  options?: {
    actor?: string;
    customAction?: string;
    notes?: string;
    station?: string;
  }
): StageAuditEntry {
  const fromStage = job.stage;
  const targetConfig = STAGE_CONFIG[toStage];
  const fromConfig = STAGE_CONFIG[fromStage];

  let defaultNote = '';
  if (toStage === 2) {
    defaultNote = `Frame: ${job.frameName} • Lens: ${job.lensName} • Traced on Delta 200.`;
  } else if (toStage === 3) {
    defaultNote = `Bevel fit into eye-wire. Axis verified: OD ${job.odAxis || 'Within ISO'} / OS ${job.osAxis || 'Within ISO'}.`;
  } else if (toStage === 4) {
    defaultNote = `Power confirmed against prescription (${job.rxSummary}). Zero cosmetic flaws.`;
  } else if (toStage === 5) {
    defaultNote = `Stored in ${job.drawerLocation || 'Drawer A-04'}. Ready for patient collection.`;
  } else {
    defaultNote = `Assigned to tray ${job.trayNumber}. Prescription verified by ${job.refDoctor}.`;
  }

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: formatAuditTimestamp(),
    stageNumber: toStage,
    stageName: targetConfig.name,
    previousStageNumber: fromStage,
    previousStageName: fromConfig.name,
    trayNumber: job.trayNumber,
    actor: options?.actor || targetConfig.defaultActor,
    action: options?.customAction || `Advanced from Stage ${fromStage} (${fromConfig.shortName}) to Stage ${toStage} (${targetConfig.shortName})`,
    actionType: toStage > fromStage ? 'positive_advancement' : 'negative_adjustment',
    station: options?.station || targetConfig.station,
    notes: options?.notes || defaultNote,
  };
}

export type ActionClassification =
  | 'positive_advancement'
  | 'negative_adjustment'
  | 'security'
  | 'manual_override';

export interface ActionTypeInfo {
  type: ActionClassification;
  isCritical: boolean;
  variant: 'critical' | 'standard';
  label: string;
  subLabel: string;
  fullLabel: string;
  banglaLabel: string;
  trendIcon: string;
  trendDirection: 'up' | 'down' | 'security' | 'override';
  badgeClass: string;
  iconClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  cardBorderClass: string;
  cardBgClass: string;
}

export function classifyAuditAction(entry: StageAuditEntry): ActionTypeInfo {
  // 1. Explicit Critical actionTypes: security or manual_override
  if (
    entry.actionType === 'security' ||
    (!entry.actionType && entry.action && entry.action.toLowerCase().includes('security audit'))
  ) {
    return {
      type: 'security',
      isCritical: true,
      variant: 'critical',
      label: 'Security Check',
      subLabel: 'Critical Security',
      fullLabel: 'Critical: Security Authorization & Verification',
      banglaLabel: 'ক্রিটিক্যাল: সিকিউরিটি যাচাইকরণ',
      trendIcon: 'security',
      trendDirection: 'security',
      badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/40 ring-1 ring-red-500/30',
      iconClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-500/40',
      bgClass: 'bg-red-500/10 dark:bg-red-950/40',
      textClass: 'text-red-700 dark:text-red-300 font-bold',
      cardBorderClass: 'border-red-500/80 dark:border-red-500/70 border-l-[5px] border-l-red-600 shadow-sm shadow-red-500/10',
      cardBgClass: 'bg-red-500/[0.04] dark:bg-red-950/20',
    };
  }

  if (
    entry.actionType === 'manual_override' ||
    (!entry.actionType &&
      entry.action &&
      (entry.action.toLowerCase().includes('manual override') ||
        entry.action.toLowerCase().includes('supervisor override')))
  ) {
    return {
      type: 'manual_override',
      isCritical: true,
      variant: 'critical',
      label: 'Manual Override',
      subLabel: 'Critical Override',
      fullLabel: 'Critical: Manual Supervisor Override',
      banglaLabel: 'ক্রিটিক্যাল: ম্যানুয়াল ওভাররাইড',
      trendIcon: 'warning',
      trendDirection: 'override',
      badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/40 ring-1 ring-red-500/30',
      iconClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-500/40',
      bgClass: 'bg-red-500/10 dark:bg-red-950/40',
      textClass: 'text-red-700 dark:text-red-300 font-bold',
      cardBorderClass: 'border-red-500/80 dark:border-red-500/70 border-l-[5px] border-l-red-600 shadow-sm shadow-red-500/10',
      cardBgClass: 'bg-red-500/[0.04] dark:bg-red-950/20',
    };
  }

  // 2. Explicit negative_adjustment check
  if (entry.actionType === 'negative_adjustment') {
    return {
      type: 'negative_adjustment',
      isCritical: false,
      variant: 'standard',
      label: 'Manual Adjustment',
      subLabel: 'Note Added',
      fullLabel: 'Manual Adjustment (Note Added)',
      banglaLabel: 'ম্যানুয়াল সমন্বয় (নোট যুক্ত)',
      trendIcon: 'trending_down',
      trendDirection: 'down',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      iconClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30',
      textClass: 'text-amber-700 dark:text-amber-300',
      cardBorderClass: 'border-outline-variant/50 dark:border-[#252b38]',
      cardBgClass: 'bg-surface-container/40 dark:bg-[#1d222d]/60',
    };
  }
  if (entry.actionType === 'positive_advancement') {
    return {
      type: 'positive_advancement',
      isCritical: false,
      variant: 'standard',
      label: 'Positive Advancement',
      subLabel: 'Stage-Up',
      fullLabel: 'Positive Advancement (Stage-Up)',
      banglaLabel: 'পজিটিভ অগ্রগতি (স্টেজ আপ)',
      trendIcon: 'trending_up',
      trendDirection: 'up',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-emerald-500/30',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      cardBorderClass: 'border-outline-variant/50 dark:border-[#252b38]',
      cardBgClass: 'bg-surface-container/40 dark:bg-[#1d222d]/60',
    };
  }

  // 3. Check if previous stage was higher (demotion / rollback)
  if (entry.previousStageNumber && entry.stageNumber < entry.previousStageNumber) {
    return {
      type: 'negative_adjustment',
      isCritical: false,
      variant: 'standard',
      label: 'Manual Adjustment',
      subLabel: 'Stage Rollback',
      fullLabel: 'Manual Adjustment (Stage Rollback)',
      banglaLabel: 'স্টেজ রিভার্ট / ম্যানুয়াল সমন্বয়',
      trendIcon: 'trending_down',
      trendDirection: 'down',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30',
      iconClass: 'text-rose-600 dark:text-rose-400',
      borderClass: 'border-rose-500/30',
      bgClass: 'bg-rose-50 dark:bg-rose-950/30',
      textClass: 'text-rose-700 dark:text-rose-300',
      cardBorderClass: 'border-outline-variant/50 dark:border-[#252b38]',
      cardBgClass: 'bg-surface-container/40 dark:bg-[#1d222d]/60',
    };
  }

  // 4. Check action text or previousStageNumber === stageNumber or note added
  const actionLower = (entry.action || '').toLowerCase();
  const isAdjustmentOrNote =
    (entry.previousStageNumber !== undefined && entry.previousStageNumber === entry.stageNumber) ||
    actionLower.includes('note') ||
    actionLower.includes('checkpoint') ||
    actionLower.includes('inspection') ||
    actionLower.includes('adjustment') ||
    actionLower.includes('manual') ||
    actionLower.includes('calibrated') ||
    actionLower.includes('corrected');

  if (isAdjustmentOrNote) {
    return {
      type: 'negative_adjustment',
      isCritical: false,
      variant: 'standard',
      label: 'Manual Adjustment',
      subLabel: 'Note Added',
      fullLabel: 'Manual Adjustment (Note Added)',
      banglaLabel: 'ম্যানুয়াল সমন্বয় (নোট যুক্ত)',
      trendIcon: 'trending_down',
      trendDirection: 'down',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      iconClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30',
      textClass: 'text-amber-700 dark:text-amber-300',
      cardBorderClass: 'border-outline-variant/50 dark:border-[#252b38]',
      cardBgClass: 'bg-surface-container/40 dark:bg-[#1d222d]/60',
    };
  }

  // 5. Default: Positive advancement (stage-up)
  return {
    type: 'positive_advancement',
    isCritical: false,
    variant: 'standard',
    label: 'Positive Advancement',
    subLabel: 'Stage-Up',
    fullLabel: 'Positive Advancement (Stage-Up)',
    banglaLabel: 'পজিটিভ অগ্রগতি (স্টেজ আপ)',
    trendIcon: 'trending_up',
    trendDirection: 'up',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    cardBorderClass: 'border-outline-variant/50 dark:border-[#252b38]',
    cardBgClass: 'bg-surface-container/40 dark:bg-[#1d222d]/60',
  };
}

/**
 * Generates synthetic historical audit entries for initial mock data so each job
 * has a realistic audit trail matching its current stage.
 */
export function generateInitialAuditTrail(job: OpticalJob): StageAuditEntry[] {
  const entries: StageAuditEntry[] = [];
  const currentStage = job.stage;
  const todayDateStr = formatAuditTimestamp(new Date()).split(' • ')[0];

  // Base timestamps spread throughout the workday
  const times: Record<number, string> = {
    1: `${todayDateStr} • 09:15 AM`,
    2: `${todayDateStr} • 10:45 AM`,
    3: `${todayDateStr} • 01:20 PM`,
    4: `${todayDateStr} • 03:10 PM`,
    5: `${todayDateStr} • 04:30 PM`,
  };

  for (let s = 1; s <= currentStage; s++) {
    const stageNum = s as 1 | 2 | 3 | 4 | 5;
    const config = STAGE_CONFIG[stageNum];
    const prevNum = (s > 1 ? (s - 1) : undefined) as (1 | 2 | 3 | 4 | 5 | undefined);
    const prevConfig = prevNum ? STAGE_CONFIG[prevNum] : undefined;

    let action = '';
    let notes = '';

    if (s === 1) {
      action = `Tray ${job.trayNumber} incepted into laboratory intake`;
      notes = `Job #${job.jobCode} created for ${job.patientName}. Rx: ${job.rxSummary}. Frame: ${job.frameName}. Lenses pulled from vault.`;
    } else if (s === 2) {
      action = `Tray ${job.trayNumber} loaded onto Essilor Delta 200 Auto-Edger`;
      notes = `Lens blanks cut & grooved. Bevel type: ${job.bevelType || 'Standard V-Bevel 120°'}. Operator: Master Ripon.`;
    } else if (s === 3) {
      action = `Tray ${job.trayNumber} transferred to Mounting & Axis Station`;
      notes = `Eyewire assembled. Axis alignment verified: OD ${job.odAxis || '85° (Passed)'} / OS ${job.osAxis || '90° (Passed)'}.`;
    } else if (s === 4) {
      action = `Tray ${job.trayNumber} submitted to Shin-Nippon Focimeter QC Bench`;
      notes = `Spherical & cylindrical powers verified: ${job.rxSummary}. PD: ${job.pdValue || '64mm (Exact)'}. Zero surface scratches certified.`;
    } else if (s === 5) {
      action = `Tray ${job.trayNumber} completed & staged in Dispensing Drawer`;
      notes = `Placed in ${job.drawerLocation || 'Drawer A-04'} with hard case & microfiber cloth. Ready for patient collection.`;
    }

    entries.push({
      id: `audit-${job.id}-s${s}`,
      timestamp: times[s] || formatAuditTimestamp(),
      stageNumber: stageNum,
      stageName: config.name,
      previousStageNumber: prevNum,
      previousStageName: prevConfig ? prevConfig.name : undefined,
      trayNumber: job.trayNumber,
      actor: config.defaultActor,
      action,
      actionType: 'positive_advancement',
      station: config.station,
      notes,
    });
  }

  // Add realistic manual adjustment note for select jobs to showcase both action types
  if (job.stage >= 2 && (job.id === 'job-4' || job.id === 'job-5')) {
    entries.push({
      id: `audit-${job.id}-adj1`,
      timestamp: `${todayDateStr} • 11:20 AM`,
      stageNumber: 2,
      stageName: STAGE_CONFIG[2].name,
      previousStageNumber: 2,
      previousStageName: STAGE_CONFIG[2].name,
      trayNumber: job.trayNumber,
      actor: 'Master Ripon (Senior Glazier)',
      action: 'Manual Adjustment: Bevel groove curve adjusted & edge hand-polished',
      actionType: 'negative_adjustment',
      station: STAGE_CONFIG[2].station,
      notes: 'Calibrated wheel bevel depth by 0.2mm to accommodate acetate frame groove tolerance.',
    });
  }

  if (job.stage >= 3 && (job.id === 'job-7' || job.id === 'job-8')) {
    entries.push({
      id: `audit-${job.id}-adj2`,
      timestamp: `${todayDateStr} • 01:50 PM`,
      stageNumber: 3,
      stageName: STAGE_CONFIG[3].name,
      previousStageNumber: 3,
      previousStageName: STAGE_CONFIG[3].name,
      trayNumber: job.trayNumber,
      actor: 'S. Hossain (Glazing Technician)',
      action: 'Manual Adjustment: Axis angle corrected & rim screw tightened',
      actionType: 'negative_adjustment',
      station: STAGE_CONFIG[3].station,
      notes: 'Fine-tuned astigmatic cylinder axis by 1.5° against Shin-Nippon lensmeter reticle.',
    });
  }

  // Add realistic Critical style variant entries (security & manual_override)
  if (job.id === 'job-1' || job.id === 'job-3') {
    entries.push({
      id: `audit-${job.id}-sec`,
      timestamp: `${todayDateStr} • 09:35 AM`,
      stageNumber: 1,
      stageName: STAGE_CONFIG[1].name,
      previousStageNumber: 1,
      previousStageName: STAGE_CONFIG[1].name,
      trayNumber: job.trayNumber,
      actor: 'Dr. M. Rahman (Chief Optometrist & Security Officer)',
      action: 'Security Audit: High-index cylindrical Rx tamper-check & license authentication',
      actionType: 'security',
      station: 'Intake Vault / Security Bench',
      notes: 'Prescription verified against Bangladesh Optical Registry database. Tamper-evident barcode seal locked on tray.',
    });
  }

  if (job.stage >= 3 && (job.id === 'job-6' || job.id === 'job-7')) {
    entries.push({
      id: `audit-${job.id}-ovr`,
      timestamp: `${todayDateStr} • 02:15 PM`,
      stageNumber: 3,
      stageName: STAGE_CONFIG[3].name,
      previousStageNumber: 2,
      previousStageName: STAGE_CONFIG[2].name,
      trayNumber: job.trayNumber,
      actor: 'Engr. K. Al-Amin (Lab Operations Director)',
      action: 'Manual Override: Stage 3 cylinder axis tolerance bypass authorized by supervisor PIN',
      actionType: 'manual_override',
      station: 'Station 3: Mounting & Axis Verification',
      notes: 'Manual supervisor override executed under protocol ISO-OPT-88: Progressive corridor length adjusted for patient customized pupillary distance.',
    });
  }

  return entries;
}
