"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✨</span>
            </div>
            <span className="font-bold text-xl text-gray-800">AI Writing Coach</span>
          </div>
          <Link
            href="/agents-sdk"
            className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white transition-all duration-200 text-gray-700 font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className={`space-y-8 ${mounted ? 'animate-in slide-in-from-left duration-700' : 'opacity-0'}`}>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  AI-Powered Writing Assistant
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Transform Your
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Writing</span>
                  <br />
                  with AI Precision
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  Get professional-quality rewrites for LinkedIn posts, emails, blogs, and more. 
                  Our AI analyzes your text and applies proven writing principles to make it shine.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/agents-sdk"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Start Rewriting
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Learn More
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">2-Step</div>
                  <div className="text-sm text-gray-600">Process</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">AI-Powered</div>
                  <div className="text-sm text-gray-600">Analysis</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">Professional</div>
                  <div className="text-sm text-gray-600">Results</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className={`relative ${mounted ? 'animate-in slide-in-from-right duration-700 delay-200' : 'opacity-0'}`}>
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="ml-auto text-sm text-gray-500">AI Writing Coach</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-2">📝 Your Original Text</div>
                        <div className="text-gray-800 leading-relaxed">
                          Hey everyone! I just wanted to share some exciting news...
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center py-2">
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">AI Analysis</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100">
                        <div className="text-sm text-blue-700 mb-2">✨ Rewritten Version</div>
                        <div className="text-gray-800 leading-relaxed">
                          Thrilled to announce my new role as Software Engineer! This opportunity represents...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                  🚀
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                  ✨
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our AI-powered process analyzes your text and applies proven writing principles for professional results
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto">
                  🔍
                </div>
                <h3 className="text-xl font-semibold text-gray-900">1. Smart Analysis</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our AI analyzes your text type, tone, audience, and purpose. It searches our knowledge base for relevant writing guidelines.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto">
                  ⚡
                </div>
                <h3 className="text-xl font-semibold text-gray-900">2. One-Click Rewrite</h3>
                <p className="text-gray-600 leading-relaxed">
                  Click the "Rewrite Text" button and watch as your text is transformed using professional writing principles.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto">
                  🎯
                </div>
                <h3 className="text-xl font-semibold text-gray-900">3. Perfect Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get your polished text with detailed explanations of improvements made. Copy and use immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-12 text-white">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Writing?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join professionals who trust AI to make their writing clear, engaging, and impactful.
              </p>
              <Link
                href="/agents-sdk"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Start Writing Better Today
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✨</span>
            </div>
            <span className="font-bold text-xl">AI Writing Coach</span>
          </div>
          <p className="text-gray-400">
            Powered by advanced AI technology to help you write better, faster.
          </p>
        </div>
      </footer>
    </div>
  );
}