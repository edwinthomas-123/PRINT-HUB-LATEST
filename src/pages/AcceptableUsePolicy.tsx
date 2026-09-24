import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export function AcceptableUsePolicy() {
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
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Acceptable Use Policy</h1>
          <p className="text-slate-300">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
          <p className="lead text-lg text-slate-600 mb-8">
            This Acceptable Use Policy ("Policy") sets forth the general guidelines and acceptable and prohibited uses of the Print Hub website and its related products and services (collectively, "Services"). This Policy is a legally binding agreement between you ("User", "you" or "your") and Print Hub ("we", "us" or "our").
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">1. Prohibited Content and Activities</h2>
          <p>
            You may not use the Services to publish, upload, print, or transmit any material that violates applicable laws or regulations, infringes upon the rights of others, or is otherwise objectionable. Specifically, you agree not to upload or print:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
            <li><strong>Illegal Content:</strong> Materials promoting or facilitating illegal activities under local, national, or international law.</li>
            <li><strong>Copyrighted Material Without Permission:</strong> Documents, images, or files that infringe on the intellectual property rights, trademarks, or copyrights of others without explicit authorization.</li>
            <li><strong>Malware and Harmful Software:</strong> Files containing viruses, worms, Trojan horses, or any other malicious code designed to disrupt, damage, or gain unauthorized access to computer systems or networks.</li>
            <li><strong>Adult Content:</strong> Sexually explicit material, pornography, or content that depicts nudity in a gratuitous or sexually suggestive manner.</li>
            <li><strong>Violent Content:</strong> Material that depicts, promotes, or incites violence, self-harm, or cruelty to animals.</li>
            <li><strong>Fraudulent Documents:</strong> Forged documents, counterfeit currency, fake tickets, or materials designed to facilitate scams or financial fraud.</li>
            <li><strong>Fake IDs:</strong> Counterfeit identification cards, passports, driver's licenses, or official government documents.</li>
            <li><strong>Hate Speech:</strong> Content that advocates violence, discrimination, or hostility toward individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">2. Account Suspension and Termination</h2>
          <p>
            We reserve the right to monitor the use of our Services to ensure compliance with this Policy. If we determine, in our sole discretion, that you have violated any provision of this Policy, we may take appropriate action, including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
            <li>Issuing a warning.</li>
            <li>Removing or refusing to process the prohibited content.</li>
            <li>Temporarily suspending your account and access to the Services.</li>
            <li>Permanently terminating your account without prior notice or liability.</li>
            <li>Reporting illegal activities to relevant law enforcement authorities and cooperating fully with any resulting investigations.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">3. Reporting Abuse</h2>
          <p>
            We encourage our community to help us maintain a safe and legal environment. If you encounter any content or activity on Print Hub that you believe violates this Acceptable Use Policy, please report it to us immediately.
          </p>
          <p>
            When reporting abuse, please provide as much detail as possible, including a description of the offending material or activity and any relevant context to assist our investigation.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">4. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Policy or its terms relating to the Services at any time, effective upon posting of an updated version of this Policy on the website. Continued use of the Services after any such changes shall constitute your consent to such changes.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">5. Contact Information</h2>
          <p className="text-slate-600 mb-4">
            To report violations of this Acceptable Use Policy or if you have any questions, please contact us at:
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
