import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Twitter,
  Linkedin,
  Facebook,
  Instagram
} from 'lucide-react';

export function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {/* Header Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold tracking-wide uppercase mb-2">
          <MessageSquare className="w-4 h-4" /> Get in Touch
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Contact Print Hub Support
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Contact Information Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Email Us</p>
                  <a href="mailto:edwinmoothedan2000@gmail.com" className="text-slate-600 hover:text-indigo-600 transition-colors">edwinmoothedan2000@gmail.com</a>
                  <p className="text-xs text-slate-500 mt-1">Expected response time: &lt; 2 hours</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Call Us</p>
                  <a href="tel:+918590399020" className="text-slate-600 hover:text-indigo-600 transition-colors">+91 8590399020</a>
                  <p className="text-xs text-slate-500 mt-1">Available 24/7</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Headquarters</p>
                  <p className="text-slate-600">[Street Address]<br />[City, State, Zip Code]<br />India</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Business Hours</p>
                  <p className="text-slate-600">24/7 Customer Support<br />Always available</p>
                </div>
              </div>
            </div>
            
            <hr className="my-8 border-slate-100" />
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-amber-900">Emergency Support?</h4>
              <p className="text-sm text-amber-800 mt-1">For urgent partner shop issues or payment failures, call our emergency hotline: <strong>+91 8590399020</strong></p>
            </div>
          </div>
          
          <Link to="/" className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between group hover:bg-slate-800 transition-colors cursor-pointer block w-full">
            <div className="flex items-center gap-4 text-white">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              <div>
                <h4 className="font-bold">Check our FAQ</h4>
                <p className="text-sm text-slate-400">Find quick answers</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 transform rotate-180 group-hover:text-white transition-colors" />
          </Link>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
            
            {isSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Message Sent Successfully!</h3>
                <p className="text-emerald-700">Thank you for reaching out. We will get back to you shortly.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-bold text-slate-700">Subject</label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Payments">Billing & Payments</option>
                    <option value="Partnership / Shop Owner">Partnership / Shop Owner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-bold text-slate-700">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="How can we help you today?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold tracking-wide hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Message <Send className="w-5 h-5" />
                    </span>
                  )}
                </button>
                <p className="text-xs text-slate-500 mt-4">
                  By submitting this form, you agree to our <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-slate-200 rounded-3xl overflow-hidden h-[400px] border border-slate-300 relative group">
        {/* Placeholder for Google Map */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-100">
          <MapPin className="w-12 h-12 text-slate-400 mb-4" />
          <p className="font-medium text-lg">Map View</p>
          <p className="text-sm text-slate-400">[Google Maps Embed Placeholder]</p>
        </div>
      </div>
    </div>
  );
}
