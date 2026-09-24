import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

export function CookiePolicy() {
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
              <Cookie className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-slate-300">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
          <p className="lead text-lg text-slate-600 mb-8">
            This Cookie Policy explains how Print Hub ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website at https://printhub-252652101790.asia-south1.run.app and use our SaaS platform.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">1. What Are Cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, Print Hub) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., like advertising, interactive content and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">2. Types of Cookies We Use</h2>
          
          <h3 className="font-bold text-slate-800 mt-6 mb-2">Session Cookies</h3>
          <p>
            These cookies are temporary and expire once you close your browser (or once your session ends). They are essential to enable you to navigate the website and use its features, such as accessing secure areas of the website.
          </p>

          <h3 className="font-bold text-slate-800 mt-6 mb-2">Login & Authentication Cookies</h3>
          <p>
            We use these cookies to remember your login details and authentication status. This prevents you from having to log in every time you navigate to a new page or return to the platform within a certain timeframe.
          </p>

          <h3 className="font-bold text-slate-800 mt-6 mb-2">Security Cookies</h3>
          <p>
            Security cookies are used to authenticate users, prevent fraudulent use of login credentials, and protect user data from unauthorized parties. They are essential for the safe operation of our print platform.
          </p>

          <h3 className="font-bold text-slate-800 mt-6 mb-2">Preference Cookies</h3>
          <p>
            These cookies allow our website to remember choices you make (such as your preferred language or the region you are in) and provide enhanced, more personal features. They may also be used to remember changes you have made to text size, fonts and other parts of web pages that you can customize.
          </p>

          <h3 className="font-bold text-slate-800 mt-6 mb-2">Analytics & Performance Cookies</h3>
          <p>
            These cookies collect information about how visitors use our website, for instance, which pages visitors go to most often, and if they get error messages from web pages. These cookies don't collect information that identifies a visitor. All information these cookies collect is aggregated and therefore anonymous. It is only used to improve how a website works.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">3. Third-Party Cookies</h2>
          <p>
            In some special cases, we also use cookies provided by trusted third parties. For example, our site uses third-party payment processors (e.g., PhonePe) and authentication providers (e.g., Google). These third parties may place cookies on your device to facilitate their services securely. We have no control over these third-party cookies.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">4. Cookie Management and Browser Controls</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
          </p>
          <p>
            In addition, most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">allaboutcookies.org</a>.
          </p>
          <p>
            Find out how to manage cookies on popular browsers:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
            <li>Google Chrome</li>
            <li>Microsoft Edge</li>
            <li>Mozilla Firefox</li>
            <li>Microsoft Internet Explorer</li>
            <li>Opera</li>
            <li>Apple Safari</li>
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Please note that if you choose to reject cookies, doing so may impair some of our website functionality.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">5. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100">6. Contact Information</h2>
          <p className="text-slate-600 mb-4">
            If you have any questions about our use of cookies or other technologies, please contact us at:
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
