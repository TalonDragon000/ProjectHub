import { X, AlertTriangle, Shield, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface BotAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: string;
  alertType: string;
  severity: string;
  evidence: any;
  botScore: number;
}

export default function BotAlertModal({
  isOpen,
  onClose,
  alertId,
  alertType,
  severity,
  evidence,
  botScore
}: BotAlertModalProps) {
  const [disputeMessage, setDisputeMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const getAlertTypeText = () => {
    switch (alertType) {
      case 'rapid_project_publishing':
        return 'Rapid Project Publishing';
      case 'rapid_idea_submission':
        return 'Rapid Idea Submission';
      case 'coordinated_reactions':
        return 'Coordinated Reactions';
      default:
        return 'Suspicious Activity';
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeMessage.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bot_alerts')
        .update({
          user_dispute_message: disputeMessage,
          disputed_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setDisputeMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting dispute:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Dispute Submitted</h3>
          <p className="text-gray-600">
            Your dispute has been submitted and will be reviewed by our team shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 border-b ${getSeverityColor()}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-1">Bot Activity Alert</h2>
                <p className="text-sm opacity-80">
                  Our system detected unusual activity patterns on your account
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Alert Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Alert Type</span>
                <span className="font-semibold text-gray-900">{getAlertTypeText()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Severity</span>
                <span className={`font-semibold capitalize ${severity === 'high' ? 'text-red-600' : severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'}`}>
                  {severity}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Current Bot Score</span>
                <span className="font-semibold text-gray-900">{botScore}/100</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">What This Means</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Your account has been flagged for {getAlertTypeText().toLowerCase()}. This could be due to:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800 list-disc list-inside">
                {alertType === 'rapid_project_publishing' && (
                  <>
                    <li>Publishing multiple projects in a very short time</li>
                    <li>Automated or scripted project submissions</li>
                  </>
                )}
                {alertType === 'rapid_idea_submission' && (
                  <>
                    <li>Submitting many ideas in a short period</li>
                    <li>Potential spam or low-quality submissions</li>
                  </>
                )}
                {alertType === 'coordinated_reactions' && (
                  <>
                    <li>Receiving many reactions from the same sources</li>
                    <li>Potential vote manipulation</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {evidence && Object.keys(evidence).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Evidence</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(evidence, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">What Happens Next?</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                If your bot score reaches 50 or higher, your account will be automatically flagged
                and excluded from the leaderboard until reviewed by an administrator.
              </p>
              <p>
                If you believe this alert is a mistake, you can submit a dispute below. Our team
                will review your account activity and respond accordingly.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Submit a Dispute</h3>
            <div className="space-y-3">
              <textarea
                value={disputeMessage}
                onChange={(e) => setDisputeMessage(e.target.value)}
                placeholder="Explain why you believe this alert is incorrect..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitDispute}
                  disabled={submitting || !disputeMessage.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
