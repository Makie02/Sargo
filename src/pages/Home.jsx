import React, { useState, useEffect } from "react";
import Register from "../components/Register";
import Login from "../components/LogIn";
import Header from "../components/Header";
import Footer from "../components/footer";
import AboutUs from "./AboutUs";
import { Calendar, QrCode, Clock, Zap, Shield, Users, Smartphone, ChevronLeft, ChevronRight, ArrowRight, Star, Trophy, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function Home({ onLoginSuccess }) {
  const [currentPage, setCurrentPage] = useState("home"); // "home" or "about"
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [images, setImages] = useState({
    LOGO: [],
    HOME: [],
    FOOTER: [],
    SLIDE: [],
    CENTER: []
  });
  
  const [currentIndexes, setCurrentIndexes] = useState({
    HOME: 0,
    SLIDE: 0,
    CENTER: 0,
    FOOTER: 0
  });

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    const homeInterval = setInterval(() => {
      if (images.HOME.length > 0) {
        setCurrentIndexes(prev => ({
          ...prev,
          HOME: (prev.HOME + 1) % images.HOME.length
        }));
      }
    }, 4000);

    const slideInterval = setInterval(() => {
      if (images.SLIDE.length > 0) {
        setCurrentIndexes(prev => ({
          ...prev,
          SLIDE: (prev.SLIDE + 1) % images.SLIDE.length
        }));
      }
    }, 4000);

    const centerInterval = setInterval(() => {
      if (images.CENTER.length > 0) {
        setCurrentIndexes(prev => ({
          ...prev,
          CENTER: (prev.CENTER + 1) % images.CENTER.length
        }));
      }
    }, 4000);

    const footerInterval = setInterval(() => {
      if (images.FOOTER.length > 0) {
        setCurrentIndexes(prev => ({
          ...prev,
          FOOTER: (prev.FOOTER + 1) % images.FOOTER.length
        }));
      }
    }, 4000);

    return () => {
      clearInterval(homeInterval);
      clearInterval(slideInterval);
      clearInterval(centerInterval);
      clearInterval(footerInterval);
    };
  }, [images]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('home_image_upload')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = {
        LOGO: [],
        HOME: [],
        FOOTER: [],
        SLIDE: [],
        CENTER: []
      };

      data?.forEach(img => {
        if (grouped[img.category]) {
          grouped[img.category].push(img);
        }
      });

      setImages(grouped);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handlePrevious = (category) => {
    setCurrentIndexes(prev => ({
      ...prev,
      [category]: prev[category] === 0 ? images[category].length - 1 : prev[category] - 1
    }));
  };

  const handleNext = (category) => {
    setCurrentIndexes(prev => ({
      ...prev,
      [category]: (prev[category] + 1) % images[category].length
    }));
  };

  const ImageSlider = ({ category, images, currentIndex, showControls = true, className = "" }) => {
    if (!images || images.length === 0) {
      return (
        <div className={`bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${className}`}>
          <p className="text-gray-400">No image available</p>
        </div>
      );
    }

    const handleImagePrevious = (e) => {
      e.stopPropagation();
      handlePrevious(category);
    };

    const handleImageNext = (e) => {
      e.stopPropagation();
      handleNext(category);
    };

    const handleDotClick = (e, index) => {
      e.stopPropagation();
      setCurrentIndexes(prev => ({ ...prev, [category]: index }));
    };

    return (
      <div className="relative overflow-hidden group h-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none"></div>
        <img
          src={images[currentIndex]?.image || images[0]?.image}
          alt={category}
          className={`w-full h-full object-cover transition-all duration-700 ${className}`}
          style={{ objectFit: 'cover', minHeight: '100%', minWidth: '100%' }}
        />
        
        {showControls && images.length > 1 && (
          <>
            <button
              onClick={handleImagePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleImageNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDotClick(e, index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white w-8 shadow-lg' 
                      : 'bg-white/40 w-1.5 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (currentPage === "about") {
    return (
      <div className="font-sans text-gray-900 bg-white">
        <Header
          onLoginClick={() => setShowLoginModal(true)}
          onRegisterClick={() => setShowRegisterModal(true)}
          onAboutClick={() => setCurrentPage("about")}
          onHomeClick={() => setCurrentPage("home")}
          logoImage={images.LOGO.length > 0 ? images.LOGO[0].image : null}
        />
        <AboutUs onHomeClick={() => setCurrentPage("home")} />
        <Footer />

        <Login
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={onLoginSuccess}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />

        <Register
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 bg-white">
      {/* Header Component */}
      <Header
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
        onAboutClick={() => setCurrentPage("about")}
        onHomeClick={() => setCurrentPage("home")}
        logoImage={images.LOGO.length > 0 ? images.LOGO[0].image : null}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-blue-800 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-8">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Premium Billiard Experience</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                Reserve Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Perfect Game
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Book your table online, skip the wait, and enjoy your game! Experience the future of billiard reservations with our modern platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 font-semibold text-lg flex items-center justify-center space-x-2 hover:scale-105"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold text-lg"
                >
                  Sign In
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-white">7+</div>
                  <div className="text-sm text-gray-400">Premium Tables</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-gray-400">Availability</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">100%</div>
                  <div className="text-sm text-gray-400">Satisfaction</div>
                </div>
              </div>
            </div>

            <div className="relative h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-3xl opacity-30 animate-pulse"></div>
              <div className="relative rounded-3xl shadow-2xl w-full h-full overflow-hidden border-4 border-white/10">
                <ImageSlider
                  category="HOME"
                  images={images.HOME}
                  currentIndex={currentIndexes.HOME}
                  className="rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">WHY CHOOSE US</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Experience the Difference
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern technology meets premium billiards for an unmatched gaming experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Instant Booking",
                description: "Book tables online in seconds. Real-time availability at your fingertips.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: QrCode,
                title: "Smart QR System",
                description: "Quick check-in with QR codes. No paperwork, no hassle, just play.",
                color: "from-blue-600 to-cyan-600"
              },
              {
                icon: Clock,
                title: "Live Updates",
                description: "See real-time table availability and never miss your perfect slot.",
                color: "from-cyan-500 to-blue-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">SIMPLE PROCESS</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Get Started in 3 Steps
            </h2>
            <p className="text-xl text-gray-600">Your journey to the perfect game starts here</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 -translate-y-1/2 z-0"></div>

            {[
              {
                step: "01",
                icon: "👤",
                title: "Create Account",
                description: "Sign up in seconds with your email or social media account"
              },
              {
                step: "02",
                icon: "📅",
                title: "Choose & Book",
                description: "Select your preferred table, date, and time slot instantly"
              },
              {
                step: "03",
                icon: "🎯",
                title: "Play & Enjoy",
                description: "Show your QR code, pay, and start playing immediately"
              }
            ].map((step, index) => (
              <div key={index} className="relative z-10">
                <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-6xl">{step.icon}</div>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-cyan-600 opacity-20">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section with Image */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">OUR OFFERINGS</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Premium Services
            </h2>
            <p className="text-xl text-gray-600">Everything you need for the perfect experience</p>
          </div>

          {/* Featured Image */}
          <div className="mb-16 relative h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative rounded-3xl shadow-2xl h-full overflow-hidden">
              <ImageSlider
                category="FOOTER"
                images={images.FOOTER}
                currentIndex={currentIndexes.FOOTER}
                className="rounded-3xl"
              />
            </div>
          </div>

          {/* Service Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Premium Tables", description: "7 professional-grade billiard tables with top-quality equipment", color: "blue" },
              { icon: Clock, title: "Flexible Hours", description: "Book for any duration that fits your schedule perfectly", color: "cyan" },
              { icon: Shield, title: "Secure Payments", description: "Safe payment processing with flexible payment options", color: "green" },
              { icon: QrCode, title: "QR Check-in", description: "Lightning-fast verification with our modern QR system", color: "orange" },
              { icon: Users, title: "Group Bookings", description: "Perfect for tournaments, events, and group gatherings", color: "blue" },
              { icon: Smartphone, title: "Mobile Ready", description: "Book and manage reservations from any device, anywhere", color: "cyan" }
            ].map((service, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 bg-${service.color}-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className={`w-6 h-6 text-${service.color}-600`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">
            Ready to Elevate Your Game?
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Join hundreds of players who trust ELEV8 for their billiard reservations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="group px-10 py-5 bg-white text-gray-900 rounded-xl hover:shadow-2xl hover:shadow-white/50 transition-all duration-300 font-bold text-lg flex items-center justify-center space-x-2 hover:scale-105"
            >
              <span>Start Playing Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 font-bold text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />

      {/* Modals */}
      <Login
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={onLoginSuccess}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <Register
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default Home;