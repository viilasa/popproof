import { ArrowLeft } from 'lucide-react';

const LOGO_URL = "https://res.cloudinary.com/ddhhlkyut/image/upload/v1765406050/Proofedge6_dxarbe.svg";

interface PrivacyPageProps {
  onBack: () => void;
}

export default function PrivacyPage({ onBack }: PrivacyPageProps) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: December 11, 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                ProofEdge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our social proof notification 
                service ("Service").
              </p>
              <p className="text-gray-600 leading-relaxed">
                Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use 
                of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, password, and company name when you register</li>
                <li><strong>Payment Information:</strong> Billing address and payment details (processed securely by our payment provider)</li>
                <li><strong>Website Information:</strong> URLs and domains where you install our widgets</li>
                <li><strong>Support Communications:</strong> Information you provide when contacting our support team</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Usage Data:</strong> How you interact with our dashboard and Service</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
                <li><strong>Log Data:</strong> IP addresses, access times, and pages viewed</li>
                <li><strong>Cookies:</strong> Small data files stored on your device for authentication and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">2.3 Information from Your Website Visitors</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you install our widget on your website, we may collect limited information about your visitors to 
                display social proof notifications:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>General location (city/country level, not precise location)</li>
                <li>Browser and device type</li>
                <li>Pages visited on your website</li>
                <li>Actions taken (purchases, sign-ups) that you configure for notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative notifications and updates</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>Personalize and improve your experience</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We may share your information in the following situations:</p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">4.1 Service Providers</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share information with third-party vendors who perform services on our behalf, such as payment 
                processing, data analysis, email delivery, hosting, and customer service.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">4.2 Legal Requirements</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may disclose information if required by law or in response to valid requests by public authorities.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">4.3 Business Transfers</h3>
              <p className="text-gray-600 leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part 
                of that transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Encryption of data in transit (SSL/TLS) and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data centers with physical security measures</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your 
                information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We retain your personal information for as long as your account is active or as needed to provide you 
                with our Service. We will also retain and use your information as necessary to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Website visitor data used for notifications is typically retained for 30 days, after which it is 
                automatically deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-600 leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
                <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@proofedge.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to collect and track information about your use of 
                our Service. Types of cookies we use:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for the Service to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                You can control cookies through your browser settings. Note that disabling certain cookies may affect 
                the functionality of our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your information in accordance with this Privacy Policy 
                and applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Service is not intended for children under 16 years of age. We do not knowingly collect personal 
                information from children under 16. If you believe we have collected information from a child under 16, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this 
                Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="text-gray-600 space-y-1">
                <p><strong>Email:</strong> privacy@proofedge.com</p>
                <p><strong>Support:</strong> support@proofedge.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
