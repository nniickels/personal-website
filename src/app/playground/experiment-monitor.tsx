import type { ReactNode } from "react";

export function ExperimentMonitor({ children, label }: { children: ReactNode; label: string }) {
  return <div className="experiment-monitor">
    <div className="experiment-monitor-heading" aria-hidden="true"><span>Observation display</span><i /></div>
    <div className="experiment-monitor-field">
      {children}
      <div className="experiment-monitor-reticle" aria-hidden="true"><i /><i /><i /><i /></div>
    </div>
    <div className="experiment-monitor-footer" aria-hidden="true"><span>{label} / simulation</span></div>
  </div>;
}
