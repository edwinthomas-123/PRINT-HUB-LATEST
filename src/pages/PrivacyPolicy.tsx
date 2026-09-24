import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-indigo-100">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
          <p className="lead text-lg text-slate-600 mb-8">
            At Print Hub ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information and documents. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website (https://printhub-252652101790.asia-south1.run.app) and our SaaS platform for print shops.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us when using our services:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-600">
            <li><strong>Account Information:</strong> Name, email address, phone number, and authentication data when you register as a customer or shop partner.</li>
            <li><strong>Shop Partner Data:</strong> Business name, address, printer configurations, pricing models, and payout credentials (e.g., PhonePe Merchant IDs).</li>
            <li><strong>Document Data:</strong> Files and documents you upload for printing, scanning, or processing via our tools.</li>
            <li><strong>Transaction Data:</strong> Order details, print preferences, and payment records (processed securely via our third-party payment gateways).</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our platform, including IP addresses, device types, browser types, and access times.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">2. Why We Collect Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-600">
            <li>To provide, maintain, and improve our printing, scanning, and document management services.</li>
            <li>To process your transactions and facilitate seamless printing workflows.</li>
            <li>To route jobs accurately to local print shops and generate QR codes for print retrieval.</li>
            <li>To communicate with you regarding order statuses, platform updates, and customer support.</li>
            <li>To ensure the security and integrity of our platform and prevent fraudulent activities.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">3. Document Storage and Retention</h2>
          <p className="text-slate-600">
            We understand the sensitive nature of the documents you print and process.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-600">
            <li><strong>Storage:</strong> Files are stored securely using enterprise-grade cloud storage with encryption at rest and in transit.</li>
            <li><strong>Auto-Deletion:</strong> To minimize data footprint, files larger than [FILE_RETENTION_LIMIT] are automatically permanently deleted from our servers after [RETENTION_TIME].</li>
            <li><strong>Access Control:</strong> Documents are strictly accessible only by the intended shop partner for the sole purpose of fulfilling the print job.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">4. Payment Information</h2>
          <p className="text-slate-600">
            We use a secure third-party payment gateway (PhonePe) to process transactions. We do not store your complete credit card numbers, UPI PINs, or bank account details on our servers. Your payment information is provided directly to our payment processors, whose use of your personal information is governed by their privacy policies.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">5. Cookies and Tracking Technologies</h2>
          <p className="text-slate-600">
            We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, but some features of the platform may not function properly without them.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">6. Analytics</h2>
          <p className="text-slate-600">
            We may use third-party Service Providers to monitor and analyze the use of our Service to improve platform performance, track user engagement, and optimize the routing of print jobs across our partner network.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">7. Data Security</h2>
          <p className="text-slate-600">
            The security of your data is paramount. We employ industry-standard security measures including SSL/TLS encryption, secure database architectures, and strict access controls to protect your personal information and documents from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">8. Account Deletion and User Rights</h2>
          <p className="text-slate-600">
            You have the right to access, update, or delete your personal information. You can request the deletion of your account and associated data by contacting our support team. Upon request, we will promptly securely erase your account details, order history, and any remaining cached documents, subject to any legal obligations to retain specific records.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">9. Third-Party Services</h2>
          <p className="text-slate-600">
            Our platform may contain links to or integrate with third-party sites and services (e.g., Google authentication, PhonePe payments, Maps). We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">10. Children's Privacy</h2>
          <p className="text-slate-600">
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">11. Changes to This Privacy Policy</h2>
          <p className="text-slate-600">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">12. Contact Us</h2>
          <p className="text-slate-600 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us:
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
