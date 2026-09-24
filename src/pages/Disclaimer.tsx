import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export function Disclaimer() {
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
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Disclaimer</h1>
          <p className="text-slate-300">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
          <p className="lead text-lg text-slate-600 mb-8">
            The information contained on the Print Hub website (https://printhub-252652101790.asia-south1.run.app) and our SaaS platform is for general information and software service purposes only.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">1. Software Provider Status</h2>
          <p>
            Print Hub provides a software-as-a-service (SaaS) platform designed to facilitate communication, file transfer, and payment processing between customers and independent print shop owners. <strong>Print Hub does not own, operate, or control the physical printing hardware, paper, ink, or personnel at the destination print shops.</strong>
          </p>
          <p>
            By using our platform, you acknowledge and agree that Print Hub acts solely as a technological intermediary and software provider.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">2. Limitation of Responsibility for Print Output</h2>
          <p>
            Because we do not control the physical printing process, Print Hub explicitly disclaims any and all responsibility and liability for the following:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
            <li><strong>Printer Quality:</strong> Variations in color accuracy, print resolution, streaking, or overall output quality caused by the destination shop's hardware.</li>
            <li><strong>Shop Owner Mistakes:</strong> Errors made by the print shop staff, including misinterpreting instructions, incorrect binding, or mishandling of printed materials.</li>
            <li><strong>Paper Quality:</strong> The texture, weight, brightness, or specific type of paper used by the print shop, unless explicitly standardized and guaranteed by the individual shop.</li>
            <li><strong>Ink Quality:</strong> The longevity, vibrancy, or smudging of the ink or toner used during the printing process.</li>
            <li><strong>Delivery and Turnaround Delays:</strong> Delays caused by the print shop's operational backlog, network outages, equipment failure, or physical delivery issues.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">3. User-Uploaded Content</h2>
          <p>
            Print Hub does not actively monitor, review, or approve the contents of the documents uploaded by customers for printing. As a result, Print Hub is not responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
            <li><strong>Content Accuracy:</strong> Any errors, omissions, or inaccuracies within the uploaded files.</li>
            <li><strong>Copyright Violations:</strong> The unauthorized reproduction or distribution of copyrighted, trademarked, or otherwise protected intellectual property. Users are solely responsible for ensuring they have the legal right to print the documents they upload.</li>
            <li><strong>Illegal or Prohibited Material:</strong> The printing of materials that violate local laws or our Acceptable Use Policy.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">4. "As Is" Service</h2>
          <p>
            The software and services provided by Print Hub are offered on an "as is" and "as available" basis. Print Hub makes no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the software platform or the final printed products. Any reliance you place on such information or services is therefore strictly at your own risk.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">5. Contact Information</h2>
          <p className="text-slate-600 mb-4">
            If you have any questions regarding this Disclaimer or need to report an issue with a specific partner shop, please contact us at:
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
