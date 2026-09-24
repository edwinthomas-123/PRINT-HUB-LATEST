import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

export function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-10 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-2xl">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-slate-300">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
          <p className="lead text-lg text-slate-600 mb-8">
            Welcome to Print Hub. These Terms and Conditions outline the rules and regulations for the use of Print Hub's Website, located at https://printhub-252652101790.asia-south1.run.app, and our associated SaaS application.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">1. Acceptance of Terms</h2>
          <p>
            By accessing this website and using our SaaS application, we assume you accept these terms and conditions in full. Do not continue to use Print Hub if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">2. Eligibility</h2>
          <p>
            You must be at least 18 years of age to use our Services. By using our Services and agreeing to these terms, you warrant and represent that you are at least 18 years of age.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">4. Shop Owner Accounts</h2>
          <p>
            Shop Owners who register on our platform must provide valid business details and ensure their printing equipment is capable of fulfilling orders as configured. Shop Owners are responsible for setting their own prices, managing their hardware, and processing jobs in a timely manner.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">5. Payments</h2>
          <p>
            All online transactions are securely processed via authorized third-party payment gateways (e.g., PhonePe). By submitting payment details, you confirm that you are authorized to use the designated payment method. You authorize us to charge your order to that payment method.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">6. Refunds and Order Cancellation</h2>
          <p>
            Due to the automated nature of our printing services, once a print job is submitted and processed, it generally cannot be cancelled or refunded unless there is a verifiable hardware failure or quality issue at the destination print shop. Please review your documents carefully before submission.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">7. Subscription</h2>
          <p>
            Certain advanced features for Shop Owners may be subject to subscription fees. Subscriptions are billed in advance on a recurring and periodic basis (Billing Cycle). At the end of each Billing Cycle, your Subscription will automatically renew unless you cancel it.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">8. Printing Policy and Printer Failures</h2>
          <p>
            While we strive for high reliability, we do not guarantee that your files will be printed perfectly without error. Factors such as printer malfunction, network outages, or paper jams at the destination shop can occur. In the event of a total printer failure preventing job completion, you may request a refund by contacting support.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">9. User Responsibilities</h2>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">10. Copyright and Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Print Hub and its licensors. The Service is protected by copyright, trademark, and other laws of India.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">11. Prohibited Content and File Upload Rules</h2>
          <p>
            You may not upload documents that contain illegal, offensive, explicit, or otherwise prohibited content. You warrant that you hold the necessary rights and permissions to print any documents you upload. We reserve the right to delete files that violate these terms or exceed our storage limits.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">12. Liability Limitation</h2>
          <p>
            In no event shall Print Hub, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">13. Account Suspension and Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">14. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any dispute arising out of or related to these Terms will be subject to the exclusive jurisdiction of the courts in India.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">15. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">16. Contact Information</h2>
          <p className="text-slate-600 mb-4">
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700">
            <p className="mb-2"><strong>Business Name:</strong> Print Hub</p>
            <p className="mb-2"><strong>Email:</strong> edwinmoothedan2000@gmail.com</p>
            <p className="mb-2"><strong>Phone:</strong> +91 8590399020</p>
            <p className="mb-2"><strong>Country:</strong> India</p>
            <p><strong>Website:</strong> https://printhub-252652101790.asia-south1.run.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
