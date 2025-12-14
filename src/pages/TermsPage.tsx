import { ArrowLeft } from 'lucide-react';

const LOGO_URL = "https://res.cloudinary.com/ddhhlkyut/image/upload/v1765406050/Proofedge6_dxarbe.svg";

interface TermsPageProps {
  onBack: () => void;
}

export default function TermsPage({ onBack }: TermsPageProps) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: December 11, 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                By accessing or using ProofEdge ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, please do not use our Service.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting 
                the new Terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                ProofEdge provides social proof notification widgets that display real-time customer activity on your 
                website, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Recent purchase notifications</li>
                <li>Live visitor counts</li>
                <li>Customer review displays</li>
                <li>Sign-up and conversion notifications</li>
                <li>Custom activity alerts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Subscription and Payments</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Free Plan:</strong> We offer a free tier with limited features. No payment is required for the free plan.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Paid Plans:</strong> Paid subscriptions are billed monthly or annually. By subscribing to a paid plan, you agree to pay the applicable fees.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period.
              </p>
              <p className="text-gray-600 leading-relaxed">
                <strong>Refunds:</strong> We offer a 14-day money-back guarantee for new paid subscriptions. After 14 days, no refunds will be provided.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Display false, misleading, or fraudulent notifications</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Distribute malware or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by ProofEdge and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You retain ownership of any content you submit through the Service. By submitting content, you grant 
                us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in 
                connection with the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent 
                to the collection and use of information as described in our Privacy Policy.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for ensuring that your use of the Service complies with all applicable data 
                protection and privacy laws, including obtaining necessary consents from your website visitors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To the maximum extent permitted by law, ProofEdge shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to loss of profits, data, 
                or business opportunities.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our total liability for any claims arising from your use of the Service shall not exceed the amount 
                you paid us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-600 leading-relaxed">
                The Service is provided "as is" and "as available" without warranties of any kind, either express 
                or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                for any reason, including breach of these Terms.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Upon termination, your right to use the Service will cease immediately. All provisions of these Terms 
                that should survive termination shall survive.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in 
                which ProofEdge operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Email:</strong> support@proofedge.com
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
