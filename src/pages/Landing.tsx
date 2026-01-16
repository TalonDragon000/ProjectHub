import { Link } from 'react-router-dom';
import { MessageSquare, BarChart3, ChevronDown, Pen } from 'lucide-react';
import { useState } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need a finalized project to join?",
      answer: "No! ProjectHub is designed for projects at any stage - from early ideas to fully launched products. Share your progress and get feedback along the way."
    },
    {
      question: "Is this a founder platform?",
      answer: "ProjectHub is for anyone building something - solo founders, side project creators, indie hackers, and small teams. If you're building, you belong here."
    },
    {
      question: "Who gives feedback on my project?",
      answer: "Feedback comes from other builders, early adopters, and potential users in the community. Everyone here understands the building journey."
    },
    {
      question: "Is ProjectHub free?",
      answer: "Yes! Creating projects and receiving feedback is completely free. We believe in supporting builders without barriers."
    },
    {
      question: "Can I keep things private?",
      answer: "You control your project's visibility. Share what you're comfortable with and keep the rest private until you're ready."
    },
    {
      question: "Is this just another idea board or notes app?",
      answer: "No. ProjectHub is about accountability and progress. It's a space to share what you're actually building, get real feedback, and stay motivated through community support."
    }
  ];

  return (
    <div className="page-gradient">
      <NavBar />
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
            <div>
              <div className="badge-info mb-4 inline-block">
                ✨ Early Access
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 cursor-default">
                Stop building <span className="italic bg-gradient-to-r from-blue-200 via-blue-300 to-purple-200 bg-clip-text text-transparent transition-opacity hover:opacity-50">alone</span>.
              </h1>
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                Build with others, get early feedback, and stay accountable.<br/>
                ProjectHub is where builders support builders.
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                <Link to="/login" className="btn-primary btn-lg">
                  Create your project (free)
                </Link>
                <Link to="/browse" className="btn-secondary btn-lg">
                  Explore Projects
                </Link>
              </div>
            </div>
        </div>
      </section>

      {/* Why Projects Fail Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2">
              <h2 className="text-4xl font-bold text-slate-900 mb-6 cursor-default">
                Most startups don't fail from bad ideas.<br/>
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent transition-opacity hover:opacity-50">
                  They fail in silence.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-4">
                Founders build for weeks or months without real feedback, real users, or real accountability.
              </p>
              <p className="text-lg text-slate-600">
                They get too attached. The "Aha!" moment is already wrong - or interesting - so motivation is gone.
              </p>
            </div>
            <div className="md:order-1 card-glass">
              <div className="aspect-square bg-gradient-to-br from-blue-100  to-purple-100 rounded-2xl flex items-center justify-center">
              <img src="/images/landing/person-with-laptop.png" alt="Hero Illustration" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-launch Home Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 cursor-default">
                ProjectHub is a 
                <br/><span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">pre-launch home</span>.
              </h2>
              <ul className="space-y-4 text-lg text-slate-600">
               <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span><strong>Share ideas early</strong> - before they're polished</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span><strong>Get structured, honest feedback</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span><strong>Let others try your demos</strong> and start validating it publicly</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span><strong>Build momentum through public accountability</strong></span>
              </li>
              </ul>
            </div>
            <div className="bg-white/50 rounded-3xl p-8 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <img src="/images/landing/performance-reviewed.png" alt="Building Illustration" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-blue-50 border-4 border-blue-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl p-6 mb-6 inline-block">
                <Pen className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Step 1<br/>Create a project</h3>
              <p className="text-slate-600">
                Post your idea, demo, or work-in-progress.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-purple-50 border-4 border-purple-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl p-6 mb-6 inline-block">
                <MessageSquare className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Step 2<br/>Get & receive</h3>
              <p className="text-slate-600">
                Collect feedback, reactions, and insights from real people.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-green-50 border-4 border-green-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl p-6 mb-6 inline-block">
                <BarChart3 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Step 3<br/>Grow with momentum</h3>
              <p className="text-slate-600">
                Track progress, stay accountable, and catch traction before launch.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              to="/login"
              className="px-8 py-4 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-all shadow-lg inline-block"
            >
              Start a project in minutes
            </Link>
          </div>
        </div>
      </section>

      {/* From Messy Ideas Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
           <div className="md:order-2">
              <h2 className="text-4xl font-bold text-slate-900 mb-6 cursor-default">
                From messy ideas to <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent hover:from-blue-500 hover:via-blue-600 hover:to-purple-500 hover:scale-105 transition-all duration-300">real projects</span>
              </h2>
              <p className="text-lg text-slate-600 mb-4">
                Start with rough thoughts, half-formed ideas, or experiments. 
               When something feels worth pursuing, turn it into a project and start validating it publicly.
              </p>
              <ul className="space-y-4 text-lg text-slate-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Capture ideas</strong> without pressure</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Pick which ones</strong> are worth exploring</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>private → public</strong> moves are gradual and seamless</span>
                </li>
              </ul>
            </div>
            <div className="md:order-1 bg-white/50 rounded-3xl p-8 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center">
                <img src="/images/landing/lightbulb.png" alt="Lightbulb Ideas" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Signal Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 cursor-default">
                Built for <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent hover:from-blue-600 hover:via-blue-700 hover:to-purple-600 hover:scale-105 transition-all duration-300">signal, not vanity</span>
              </h2>
              <ul className="space-y-4 text-lg text-slate-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Feedback</strong> instead of likes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Demos</strong> instead of pitch decks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Early validation</strong> instead of post-launch regret</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Builders supporting builders</strong> — not shouting into the void</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/50 rounded-3xl p-8 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <img src="/images/landing/signal.png" alt="Signal" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Early Builders Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2">
              <h2 className="text-4xl font-bold text-slate-900 mb-6 cursor-default">
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent hover:from-blue-600 hover:via-blue-700 hover:to-purple-600 hover:scale-105 transition-all duration-300">Early Builders</span> use ProjectHub to:
              </h2>
              <ul className="space-y-4 text-lg text-slate-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Validate ideas</strong> before writing months of code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Share progress publicly</strong> without the pressure of "launch day"</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Get structured reviews</strong> on design, UX, positioning, or vibe</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Stay accountable</strong> with friends and peers</span>
                </li>
              </ul>
            </div>
            <div className="md:order-1 bg-white/50 rounded-3xl p-8 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <img src="/images/landing/early.png" alt="Early Builders" className="w-fit px-4 object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 cursor-default">
                ProjectHub <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent hover:from-blue-600 hover:via-blue-600 hover:to-purple-600 hover:scale-105 transition-all duration-300">is for you</span> if you're:
              </h2>
              <ul className="space-y-4 text-lg text-slate-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Building a startup</strong>, side project, or indie product</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Exploring ideas</strong> as early as it gets, or small mvps</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Working solo</strong> and need the early support of a tribe</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span><strong>Tired of building in isolation</strong></span>
                </li>
              </ul>
            </div>
            <div className="bg-white/50 rounded-3xl p-8 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center">
                <img src="/images/landing/for-you.png" alt="This is for you" className="w-fit px-4 pb-4 object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-800 text-white rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-700 transition-colors"
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform flex-shrink-0 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-slate-750 border-t border-slate-700">
                    <p className="text-slate-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white/50 rounded-3xl p-8 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <img src="/images/landing/momentum.png" alt="Turn your idea into momentum" className="w-full object-cover" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-5xl font-bold text-slate-900 mb-6 cursor-default">
                Turn your Idea into <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent hover:from-blue-500 hover:via-blue-300 hover:to-purple-500 hover:scale-105 hover:shimmer-hover transition-all duration-300">momentum</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                No pitch decks. No pressure. Just progress.
              </p>
              <Link
                to="/login"
                className="btn-primary btn-lg"
              >
                Create your project (free)
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}