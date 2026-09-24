import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: "Customers",
    items: [
      { q: "How do I find a nearby print shop?", a: "You can use our interactive map or search by location on the home dashboard to find partnered print shops near you." },
      { q: "Do I need an account to print?", a: "Yes, you need to create a free account to securely upload files, process payments, and track your print orders." },
      { q: "How do I collect my prints?", a: "Once your order is ready, you will receive a secure collection token or QR code. Present this to the shop owner to collect your documents." },
      { q: "Can I print directly from my mobile phone?", a: "Absolutely. Our platform is fully mobile-responsive, allowing you to upload and print directly from your smartphone." }
    ]
  },
  {
    category: "Shop Owners",
    items: [
      { q: "How do I register my print shop?", a: "Click the 'Partner with Us' or 'Shop Owner Login' link, and complete the registration form with your business details." },
      { q: "What hardware do I need to connect my printers?", a: "You need a standard Windows PC connected to your printers running our Print Hub desktop client to receive automated jobs." },
      { q: "Can I set my own prices for printing?", a: "Yes, shop owners have full control over their pricing matrix, including different rates for color, B&W, and paper sizes." },
      { q: "How do I receive print jobs?", a: "Jobs are automatically routed to your configured printers via our cloud service as soon as the customer completes the payment." }
    ]
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "We support secure payments via authorized third-party gateways (e.g., PhonePe), accepting UPI, credit/debit cards, and net banking." },
      { q: "When am I charged for a print job?", a: "Your payment method is charged securely at the moment you confirm your order before the print job is sent to the shop." },
      { q: "How do shop owners get paid?", a: "Earnings are settled directly to the shop owner's registered bank account according to our standard payout schedule." },
      { q: "Are there any hidden fees?", a: "No. All costs, including print charges and any platform fees, are clearly displayed upfront before you confirm payment." }
    ]
  },
  {
    category: "Printing",
    items: [
      { q: "What document formats are supported?", a: "We currently support PDF files to ensure that your formatting is perfectly preserved across all devices and printers." },
      { q: "Can I choose between color or black & white?", a: "Yes, you can select your preferred color mode in the print settings before submitting your job." },
      { q: "Can I select paper size and quality?", a: "Yes, available options (like A4, Legal, standard, or premium paper) depend on the specific capabilities of the shop you select." },
      { q: "Is duplex (double-sided) printing supported?", a: "Yes, provided the destination print shop's hardware supports duplex printing, you can select this option." }
    ]
  },
  {
    category: "Subscriptions",
    items: [
      { q: "Is there a subscription fee for shop owners?", a: "We offer a basic free tier. Advanced features like detailed analytics and multi-branch management may require a premium subscription." },
      { q: "What is included in the premium subscription?", a: "Premium subscriptions include advanced analytics, priority support, multi-staff access, and priority listing on the customer map." },
      { q: "How do I cancel my subscription?", a: "You can manage or cancel your active subscription at any time from your Shop Owner account settings." },
      { q: "Do you offer a free trial for premium features?", a: "Yes, new shop owners can usually opt into a 14-day free trial to explore premium features before committing." }
    ]
  },
  {
    category: "Refunds",
    items: [
      { q: "Can I cancel a print job after paying?", a: "Due to the automated nature of the service, jobs usually cannot be cancelled once processing begins at the destination shop." },
      { q: "What if my print quality is poor?", a: "Please address quality issues directly with the shop owner at the time of pickup. If unresolved, contact our support team." },
      { q: "I paid, but the shop was closed. How do I get a refund?", a: "If a shop cannot fulfill your order due to closure or hardware failure, contact support with your Order ID for a full refund." },
      { q: "How long do refunds take to process?", a: "Approved refunds are typically processed and credited back to your original payment method within 5-7 business days." }
    ]
  },
  {
    category: "Privacy",
    items: [
      { q: "Are my documents secure?", a: "Yes, all files are encrypted during transit using industry-standard protocols to ensure your privacy." },
      { q: "Who can see my printed documents?", a: "Files are processed automatically. Only the shop owner handling your physical prints has access to the final output." },
      { q: "How long do you store my files?", a: "Files are automatically deleted from our servers according to our retention policy (typically 24 hours after successful printing)." },
      { q: "Do you share my data with third parties?", a: "We only share necessary data with trusted payment processors. We do not sell your personal data. See our Privacy Policy for details." }
    ]
  },
  {
    category: "Account",
    items: [
      { q: "How do I reset my password?", a: "Click the 'Forgot Password' link on the login screen to receive a secure password reset email." },
      { q: "Can I change my registered email address?", a: "Yes, you can update your account details, including your email address, from your Account Settings page." },
      { q: "How do I delete my account?", a: "You can request permanent account deletion from your privacy settings or by contacting our support team." }
    ]
  },
  {
    category: "Files",
    items: [
      { q: "Is there a file size limit for uploads?", a: "Yes, the maximum file size per document upload is currently set to 50MB to ensure smooth processing." },
      { q: "Can I upload multiple files at once?", a: "Yes, you can add multiple files to a single print order cart before checking out." },
      { q: "Why is my PDF failing to upload?", a: "Please ensure your PDF is not password-protected, encrypted, or corrupted. Flattening the PDF often resolves upload issues." }
    ]
  },
  {
    category: "PDF Tools",
    items: [
      { q: "What PDF tools do you offer?", a: "We plan to offer basic built-in utilities like merging, splitting, and compressing PDFs directly within the platform." },
      { q: "Are the PDF tools free to use?", a: "Yes, basic PDF utilities are provided free of charge for all registered Print Hub users." }
    ]
  },
  {
    category: "Notifications",
    items: [
      { q: "How will I know when my print is ready?", a: "You will receive real-time status updates in the app, as well as optional email or push notifications." },
      { q: "Can I turn off notifications?", a: "Yes, you can manage your communication preferences in your account settings." }
    ]
  },
  {
    category: "Technical Issues",
    items: [
      { q: "The map isn't loading shops near me. What should I do?", a: "Please ensure you have granted location permissions to your browser/app, or try refreshing the page." },
      { q: "My payment failed but money was deducted.", a: "This is usually a temporary bank hold. The amount will typically auto-refund within 48 hours. Contact support if it persists." }
    ]
  },
  {
    category: "Contact Support",
    items: [
      { q: "How can I reach customer support?", a: "You can reach us via the Contact Us page, or email us directly at edwinmoothedan2000@gmail.com." },
      { q: "What are your support hours?", a: "Our automated systems run 24/7. Live emergency support for critical failures is also available 24/7." }
    ]
  }
];

export function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryId: number, itemId: number) => {
    const key = `${categoryId}-${itemId}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold tracking-wide uppercase mb-2">
          <HelpCircle className="w-4 h-4" /> Help Center
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Find answers to common questions about Print Hub's features, payments, and policies.
        </p>
      </div>

      <div className="space-y-12">
        {faqs.map((category, catIndex) => (
          <div key={catIndex} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.items.map((item, itemIndex) => {
                const isOpen = openItems[`${catIndex}-${itemIndex}`];
                return (
                  <div key={itemIndex} className="border border-slate-100 rounded-2xl overflow-hidden transition-colors hover:border-indigo-100">
                    <button
                      onClick={() => toggleItem(catIndex, itemIndex)}
                      className="w-full text-left px-6 py-4 flex justify-between items-center bg-slate-50 hover:bg-indigo-50/50 transition-colors focus:outline-none"
                    >
                      <span className="font-semibold text-slate-800 pr-4">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 py-4 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-center text-white mt-12">
        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
          Can't find the answer you're looking for? Please chat with our friendly team.
        </p>
        <Link 
          to="/contact" 
          className="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
