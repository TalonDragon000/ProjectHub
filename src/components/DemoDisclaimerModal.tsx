// DemoDisclaimerModal.tsx

import { X, AlertTriangle } from "lucide-react";

type FlowSection = 'discover' | 'validate' | 'try' | 'review';

export const handleDisclaimerAccept = (setShowDisclaimerModal: (showDisclaimerModal: boolean) => void, setDisclaimerAcknowledged: (disclaimerAcknowledged: boolean) => void, setExpandedSection: (expandedSection: FlowSection) => void) => {
    setDisclaimerAcknowledged(true);
    setShowDisclaimerModal(false);
    setExpandedSection('try');
  }

export default function DemoDisclaimerModal({ 
    setShowDisclaimerModal, 
    setDisclaimerAcknowledged, 
    setExpandedSection }: { 
        setShowDisclaimerModal: (showDisclaimerModal: boolean) => void, setDisclaimerAcknowledged: (disclaimerAcknowledged: boolean) => void, setExpandedSection: (expandedSection: FlowSection) => void }) {

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDisclaimerModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowDisclaimerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Third-Party Content</h3>
            </div>
            <div className="space-y-3 text-slate-600 text-sm mb-6">
              <p>
                You are about to access external content hosted by a third party. Please be aware:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>ProjectHub does not own, operate, or control linked projects</li>
                <li>We do not endorse or guarantee any third-party content</li>
                <li>Visit external sites at your own discretion and risk</li>
                <li>We are not liable for any damages arising from third-party content</li>
              </ul>
            </div>
            <button
              onClick={() => handleDisclaimerAccept(setShowDisclaimerModal, setDisclaimerAcknowledged, setExpandedSection)}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
    );
}