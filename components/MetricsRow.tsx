import React from 'react';
import { Metric } from '../types';

interface MetricsRowProps {
  metrics: Metric[];
}

const MetricsRow: React.FC<MetricsRowProps> = ({ metrics }) => {
  return (
    <div className="flex items-center h-12 px-6 gap-8 backdrop-blur-sm transition-colors duration-200">
      <div className="text-[10px] font-bold uppercase tracking-widest mr-2 select-none dark:text-gray-600 text-graphite/80">
        Telemetry
      </div>
      
      {metrics.map((metric, index) => {
        const isError = metric.label === 'Errors';
        const isLatency = metric.label.includes('Latency');

        return (
          <div key={index} className="flex items-baseline gap-2.5 group cursor-default">
            <span className={`text-xs font-semibold transition-colors ${
              isError 
                ? 'text-sunset-orange' 
                : 'text-graphite dark:text-gray-400'
            }`}>
              {metric.label}
            </span>
            <span className={`text-sm font-bold font-mono ${
              isError ? 'text-sunset-orange drop-shadow-[0_0_8px_rgba(222,75,46,0.4)]' : 'text-slate-ink dark:text-gray-200'
            }`}>
              {metric.value.toLocaleString()}
              {isLatency && (
                <span className="text-[11px] text-gray-400 dark:text-gray-600 ml-0.5 font-medium">ms</span>
              )}
            </span>
            
            {/* Vertical Divider (except last item) */}
            {index < metrics.length - 1 && (
              <div className="h-3 w-px bg-grid-lines dark:bg-white/10 ml-6 rotate-12"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetricsRow;