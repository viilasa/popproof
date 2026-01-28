import { ArrowLeft } from 'lucide-react';

const LOGO_URL = "https://res.cloudinary.com/ddhhlkyut/image/upload/v1765406050/Proofedge6_dxarbe.svg";

interface RefundPageProps {
  onBack: () => void;
}

export default function RefundPage({ onBack }: RefundPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ProofEdge" className="w-8 h-8" />
            <span className="font-bold text-gray-900">ProofEdge</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: December 27, 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At ProofEdge, we want you to be completely satisfied with our service. This Refund & Cancellation Policy
                outlines the terms and conditions for refunds and subscription cancellations.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By subscribing to our paid plans, you agree to the terms outlined in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Free Plan</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Starter plan is completely free and does not require any payment. You can use the free plan
                indefinitely with no obligation to upgrade. No refund policy applies to the free plan as no payment is made.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Money-Back Guarantee</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We offer a <strong>14-day money-back guarantee</strong> for all new paid subscriptions (Pro and Growth plans).
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>If you are not satisfied with our service within the first 14 days of your paid subscription, you may request a full refund.</li>
                <li>The 14-day period starts from the date of your first payment.</li>
                <li>Refund requests must be submitted within the 14-day window.</li>
                <li>Refunds will be processed within 5-7 business days to the original payment method.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Subscription Cancellation</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may cancel your subscription at any time through your account dashboard or by contacting our support team.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Effective Date:</strong> Cancellation takes effect at the end of your current billing period.</li>
                <li><strong>Access:</strong> You will continue to have access to paid features until the end of your billing period.</li>
                <li><strong>No Partial Refunds:</strong> After the 14-day money-back guarantee period, we do not offer partial refunds for unused time.</li>
                <li><strong>Downgrade:</strong> After cancellation, your account will automatically downgrade to the free Starter plan.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Refund Eligibility</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Refunds are available under the following conditions:
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">5.1 Eligible for Refund</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Request made within 14 days of initial subscription payment</li>
                <li>Technical issues that prevent you from using the service (verified by our team)</li>
                <li>Duplicate or erroneous charges</li>
                <li>Service unavailability exceeding 48 hours (verified outage)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">5.2 Not Eligible for Refund</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Requests made after the 14-day money-back guarantee period</li>
                <li>Subscription renewals (monthly or annual)</li>
                <li>Partial month usage after cancellation</li>
                <li>Violation of our Terms of Service</li>
                <li>Change of mind after the 14-day period</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. How to Request a Refund</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>Email us at <a href="mailto:support@proofedge.co" className="text-blue-600 hover:underline">support@proofedge.co</a> with the subject line "Refund Request"</li>
                <li>Include your registered email address and order/transaction ID</li>
                <li>Provide a brief reason for your refund request</li>
                <li>Our team will review your request within 2 business days</li>
                <li>If approved, refunds will be processed within 5-7 business days</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Plan Changes</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Upgrades:</strong> When you upgrade your plan, the new pricing takes effect immediately.
                You will be charged the prorated difference for the remainder of your billing period.
              </p>
              <p className="text-gray-600 leading-relaxed">
                <strong>Downgrades:</strong> When you downgrade your plan, the change takes effect at the start of
                your next billing period. You will continue to have access to your current plan's features until then.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Payment Methods</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We accept payments through Razorpay and PayPal, which support:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Credit Cards (Visa, Mastercard, American Express)</li>
                <li>Debit Cards</li>
                <li>Net Banking</li>
                <li>PayPal Balance</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                All payments are processed in USD. Refunds will be credited to the original payment method used for the transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about our Refund & Cancellation Policy, please contact us:
              </p>
              <ul className="list-none text-gray-600 space-y-2">
                <li><strong>Email:</strong> <a href="mailto:support@proofedge.co" className="text-blue-600 hover:underline">support@proofedge.co</a></li>
                <li><strong>Website:</strong> <a href="https://proofedge.co" className="text-blue-600 hover:underline">https://proofedge.co</a></li>
              </ul>
            </section>

            <section className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>14-day money-back guarantee</strong> for new subscriptions</li>
                <li><strong>Cancel anytime</strong> - takes effect at end of billing period</li>
                <li><strong>No partial refunds</strong> after the 14-day period</li>
                <li><strong>Refunds processed</strong> within 5-7 business days</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ProofEdge. All rights reserved.</p>
      </footer>
    </div>
  );
}
