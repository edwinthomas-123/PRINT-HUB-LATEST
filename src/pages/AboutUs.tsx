import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Clock, 
  Smartphone, 
  Layers, 
  CheckCircle2, 
  Cpu
} from 'lucide-react';

export function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold tracking-wide uppercase mb-4">
          <Zap className="w-4 h-4" /> Powering the Future of Digital Printing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Print Anywhere. <br className="hidden sm:block" />Pick Up Anywhere.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
          Print Hub exists because printing is still unnecessarily slow and manual. We are modernizing the process through automation, digital workflows, and cloud-connected software.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
            <Globe className="w-32 h-32" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" /> Our Mission
          </h3>
          <p className="text-slate-600 leading-relaxed relative z-10">
            To make printing as simple as scanning a QR code by connecting customers and print shops through secure, automated, and intelligent technology. We empower local print businesses with modern software that saves time, reduces manual work, and delivers a faster, more convenient printing experience for everyone.
          </p>
        </div>
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-700 text-indigo-400">
            <Layers className="w-32 h-32" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" /> Our Vision
          </h3>
          <p className="text-slate-300 leading-relaxed relative z-10">
            To become the world's leading digital printing ecosystem, where every print shop can operate smarter, every customer can print from anywhere, and every document service is available through a single platform. Print Hub aims to transform traditional print shops into connected, automated digital service centers.
          </p>
        </div>
      </div>

      {/* The Problem We Solve */}
      <div className="bg-indigo-50 rounded-3xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">The Problem We Solve</h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
            Traditional printing processes frustrate both customers and shop owners. We've built Print Hub to eliminate these bottlenecks.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> For Customers
            </h4>
            <ul className="space-y-3">
              {[
                "Long waiting times in queues",
                "Confusing print instructions",
                "Multiple file transfers (WhatsApp, USBs)",
                "Difficulty finding nearby print shops",
                "Manual and insecure payment processes",
                "Lack of real-time status updates"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-0.5 text-red-400">&times;</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
              <Printer className="w-5 h-5" /> For Shop Owners
            </h4>
            <ul className="space-y-3">
              {[
                "Repetitive manual work and file handling",
                "Chaotic physical queue management",
                "Print errors caused by incorrect instructions",
                "Managing multiple disjointed printers",
                "Manual payment verification and reconciliation",
                "Limited digital presence to attract users"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-0.5 text-red-400">&times;</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* How it Works & Benefits */}
      <div className="py-8 border-t border-slate-200">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">How Print Hub Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">1. Connect & Upload</h3>
            <p className="text-slate-600 text-sm">Customers find nearby shops, upload files securely, and choose exact print settings from anywhere.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">2. Secure Payment</h3>
            <p className="text-slate-600 text-sm">Instant online payment processing ensures shops are paid before printing begins.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">3. Automated Routing</h3>
            <p className="text-slate-600 text-sm">Print Hub automatically routes the job to the correct local printer for instant, error-free output.</p>
          </div>
        </div>
      </div>

      {/* Technology & Security */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-slate-700" /> Technology Stack
          </h3>
          <ul className="space-y-3">
            {[
              "Cloud-connected SaaS architecture",
              "Windows desktop print service integration",
              "Intelligent printer mapping algorithms",
              "Modular architecture for future expansion",
              "Push notification and real-time socket system",
              "Local document processing capabilities"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-700" /> Core Security
          </h3>
          <ul className="space-y-3">
            {[
              "Encrypted sensitive communications (TLS/SSL)",
              "Automated temporary file deletion policies",
              "Strict access control and authorization",
              "Verified payments prior to print execution",
              "Secure shop owner and customer account isolation",
              "Reliable system audit logging"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 mb-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Future Roadmap</h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            We are building a digital operating system for print businesses.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-slate-700 bg-slate-800/50 p-6 rounded-2xl">
            <div className="text-indigo-400 font-bold mb-3 text-sm tracking-wider uppercase">Phase 1</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>&bull; QR-based printing</li>
              <li>&bull; Automatic payment verification</li>
              <li>&bull; Printer mapping & queues</li>
              <li>&bull; PDF utilities</li>
            </ul>
          </div>
          <div className="border border-slate-700 bg-slate-800/50 p-6 rounded-2xl">
            <div className="text-indigo-400 font-bold mb-3 text-sm tracking-wider uppercase">Phase 2</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>&bull; DigiLocker integration</li>
              <li>&bull; Cloud storage integration</li>
              <li>&bull; Multi-branch support</li>
              <li>&bull; Business analytics</li>
            </ul>
          </div>
          <div className="border border-slate-700 bg-slate-800/50 p-6 rounded-2xl">
            <div className="text-indigo-400 font-bold mb-3 text-sm tracking-wider uppercase">Phase 3</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>&bull; AI document enhancement</li>
              <li>&bull; OCR & Smart recommendations</li>
              <li>&bull; Automated document prep</li>
              <li>&bull; Offline PrintHub Box</li>
            </ul>
          </div>
          <div className="border border-slate-700 bg-slate-800/50 p-6 rounded-2xl">
            <div className="text-indigo-400 font-bold mb-3 text-sm tracking-wider uppercase">Phase 4</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>&bull; Self-service PrintHub kiosks</li>
              <li>&bull; International expansion</li>
              <li>&bull; Enterprise solutions</li>
              <li>&bull; API platform for integrations</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center py-6">
        <p className="text-slate-500 font-medium">
          Founded by Edwin Thomas &copy; {new Date().getFullYear()} Print Hub
        </p>
      </div>
    </div>
  );
}
