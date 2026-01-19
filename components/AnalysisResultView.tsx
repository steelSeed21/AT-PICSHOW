import React from 'react';
import { VisualAnalysisResult } from '../types';
import { Card } from './Card';

interface AnalysisResultViewProps {
  result: VisualAnalysisResult;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Executive Visual Analysis">
        <p className="text-slate-300 leading-relaxed text-lg">{result.analysis}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Detected Attributes">
          <div className="space-y-4">
            {Object.entries(result.detected_attributes).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center border-b border-slate-700 pb-2 last:border-0">
                <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className={`font-mono text-sm px-2 py-1 rounded ${
                  value === null || value === 'unknown' || value === 'UNKNOWN' 
                    ? 'bg-slate-700 text-slate-400' 
                    : 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Visual Suggestions">
          <div className="space-y-4">
            {result.visual_suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-4 border-l-4 border-amber-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-amber-500 text-xs tracking-wider uppercase">{suggestion.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    suggestion.risk_level === 'LOW' ? 'bg-green-900 text-green-300' :
                    suggestion.risk_level === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    RISK: {suggestion.risk_level}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={`p-4 rounded-lg flex items-center gap-3 ${result.constraints_respected ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
        <div className={`w-3 h-3 rounded-full ${result.constraints_respected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`text-sm font-medium ${result.constraints_respected ? 'text-green-400' : 'text-red-400'}`}>
          {result.constraints_respected ? 'All Strict Constraints Respected' : 'Constraint Violation Detected'}
        </span>
      </div>
      
      <div className="mt-8">
        <details className="group">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-300 text-sm font-mono flex items-center gap-2 select-none">
                <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                View Raw JSON Response
            </summary>
            <pre className="mt-4 bg-black/50 p-4 rounded-lg overflow-x-auto text-xs text-green-400 font-mono border border-slate-800">
                {JSON.stringify(result, null, 2)}
            </pre>
        </details>
      </div>
    </div>
  );
};