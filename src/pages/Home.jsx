import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  ChevronRight,
  Shield,
  Zap,
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Clock,
  Lock,
  BarChart3,
  UserCheck,
  School,
  Trophy,
  Target,
  Lightbulb,
  Heart,
  CheckCircle2,
  PlayCircle,
  Download,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import { COLORS } from '../constants/colors';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => {
      clearInterval(testimonialInterval);
      clearInterval(featureInterval);
    };
  }, []);

  const testimonials = [
    {
      name: "Mrs. Adebayo Kemi",
      role: "Parent of SS3 Student",
      content: "Gabs Glorious Kids Academy has transformed my daughter's academic journey. The digital platform provides real-time insights into her progress, and the teachers are incredibly supportive. I can confidently say this is the best investment in her future.",
      rating: 5,
      avatar: "👩‍👧",
      student: "Aisha Adebayo - SS3A"
    },
    {
      name: "David Okonkwo",
      role: "SS2 Student",
      content: "The online result system is absolutely amazing! I can check my results instantly, track my academic progress, and identify areas for improvement. It has made studying more engaging and goal-oriented.",
      rating: 5,
      avatar: "👨‍🎓",
      student: "David Okonkwo - SS2B"
    },
    {
      name: "Mr. Johnson Peters",
      role: "Mathematics Teacher",
      content: "The result management system has revolutionized our teaching process. It's incredibly efficient, user-friendly, and allows us to provide better feedback to students and parents. A game-changer for education!",
      rating: 5,
      avatar: "👨‍🏫",
      student: "Head of Mathematics Department"
    },
    {
      name: "Dr. Sarah Williams",
      role: "Principal",
      content: "Gabs Glorious Kids Academy's digital platform has elevated our school to new heights. The comprehensive system ensures transparency, accountability, and excellence in academic management. Our students' performance has improved significantly.",
      rating: 5,
      avatar: "👩‍💼",
      student: "School Principal"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Advanced encryption and security protocols protect all academic data with 99.9% uptime guarantee and regular security audits.",
      color: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`,
      benefits: ["SSL Encryption", "Regular Backups", "Access Control", "Audit Trails"]
    },
    {
      icon: Zap,
      title: "Real-Time Processing",
      description: "Instant result processing and real-time access for students, parents, and staff with lightning-fast performance.",
      color: "from-blue-500 to-cyan-500",
      benefits: ["Instant Updates", "Live Notifications", "Quick Access", "Mobile Optimized"]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive performance tracking with detailed analytics, progress reports, and predictive insights for better academic outcomes.",
      color: "from-yellow-500 to-orange-500",
      benefits: ["Performance Trends", "Grade Analysis", "Progress Tracking", "Predictive Insights"]
    },
    {
      icon: Users,
      title: "Multi-User Platform",
      description: "Seamless experience for students, parents, teachers, and administrators with role-based access and personalized dashboards.",
      color: "from-green-500 to-emerald-500",
      benefits: ["Role-Based Access", "Parent Portal", "Teacher Tools", "Admin Controls"]
    },
    {
      icon: BookOpen,
      title: "Comprehensive Management",
      description: "Complete academic management system covering all aspects from enrollment to graduation with detailed record keeping.",
      color: "from-purple-500 to-indigo-500",
      benefits: ["Student Records", "Grade Management", "Attendance Tracking", "Report Generation"]
    },
    {
      icon: Heart,
      title: "Student-Centric Design",
      description: "Intuitive interface designed specifically for students with gamification elements and motivational features to enhance learning.",
      color: "from-pink-500 to-rose-500",
      benefits: ["Gamification", "Achievement Badges", "Progress Rewards", "Motivational Tools"]
    }
  ];

  const stats = [
    { number: "2,500+", label: "Active Students", icon: Users, color: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`, description: "Enrolled across all classes" },
    { number: "10", label: "Academic Classes", icon: School, color: "from-blue-500 to-cyan-500", description: "Primary 1 to 5, JSS 1 to 3, SS1 to 2" },
    { number: "98%", label: "Pass Rate", icon: Trophy, color: "from-yellow-500 to-orange-500", description: "WAEC & NECO results" },
    { number: "10+", label: "Years of Excellence", icon: Award, color: "from-green-500 to-emerald-500", description: "Educational leadership" },
    { number: "50+", label: "Qualified Teachers", icon: UserCheck, color: "from-purple-500 to-indigo-500", description: "Experienced educators" },
    { number: "24/7", label: "Platform Access", icon: Clock, color: "from-pink-500 to-rose-500", description: "Always available" }
  ];

  const achievements = [
    { title: "Best Digital School 2024", description: "Lagos State Education Award", icon: Trophy },
    { title: "Excellence in Technology", description: "Nigerian Education Technology Award", icon: Award },
    { title: "Student Satisfaction", description: "98% Parent Satisfaction Rate", icon: Heart },
    { title: "Academic Excellence", description: "Top 5% WAEC Performance", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and School Name */}
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <img 
                  src="/images/ggk-academy.jpeg" 
                  alt="Gabs Glorious Kids Academy Logo" 
                  className="h-12 w-12 mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 hidden sm:block group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300" style={{ backgroundImage: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                  Gabs Glorious Kids Academy
                </span>
                <span className="text-2xl font-bold text-gray-900 sm:hidden group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300" style={{ backgroundImage: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                  GGKA
                </span>
                <p className="text-sm text-gray-600 hidden sm:block">Excellence in Education</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="group">
                <Link
                  to="/auth/admin/login"
                  className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-gray-100 group-hover:-translate-y-0.5 flex items-center"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Staff Portal
                </Link>
              </div>
              <div className="group">
                <Link
                  to="/auth/student/login"
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-1 flex items-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary.red} 0%, ${COLORS.primary.blue} 100%)`,
                    boxShadow: `0 4px 15px rgba(220, 38, 38, 0.3)`
                  }}
                >
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Student Portal
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Tablet Navigation */}
            <div className="hidden md:flex lg:hidden items-center space-x-3">
              <Link
                to="/auth/admin/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-gray-100 flex items-center"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Staff
              </Link>
              <Link
                to="/auth/student/login"
                className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 hover:shadow-lg flex items-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary.red} 0%, ${COLORS.primary.blue} 100%)`
                }}
              >
                <GraduationCap className="h-4 w-4 mr-1" />
                Student
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
            <div className="px-2 pt-4 pb-6 space-y-3 bg-white border-t border-gray-200 rounded-b-2xl shadow-lg">
              <Link
                to="/auth/admin/login"
                className="block px-4 py-3 rounded-xl text-base font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserCheck className="h-5 w-5 mr-3" />
                Staff Portal
              </Link>
              <Link
                to="/auth/student/login"
                className="block px-4 py-3 rounded-xl text-base font-bold text-white transition-all duration-200 hover:bg-gray-50 flex items-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary.red} 0%, ${COLORS.primary.blue} 100%)`
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <GraduationCap className="h-5 w-5 mr-3" />
                Student Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${COLORS.primary.red} 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, ${COLORS.primary.blue} 0%, transparent 50%)`
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              {/* School Badge */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-gray-100">
                  <img 
                    src="/images/ggk-academy.jpeg" 
                    alt="Gabs Glorious Kids Academy Logo" 
                    className="h-12 w-12"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Est. 2016</div>
                  <div className="text-lg font-bold text-gray-900">Gabs Glorious Kids Academy</div>
                </div>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Nurturing Excellence in
                  <span className="block text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                    Education
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Empowering students with modern technology for academic success. 
                  Access your results, track progress, and excel in your studies at Gabs Glorious Kids Academy.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/auth/student/login"
                  className="group px-8 py-4 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                  style={{ background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}
                >
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Student Portal
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/auth/admin/login"
                  className="group px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                >
                  <UserCheck className="h-5 w-5 mr-2" />
                  Staff Portal
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">2,500+</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-600">Satisfid Parent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">9+</div>
                  <div className="text-sm text-gray-600">Years</div>
                </div>
              </div>
            </div>

            {/* Right Content - Visual */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                {/* Main Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary.red }}></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-sm text-gray-500">Gabs Glorious Kids Academy Portal</div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-blue-600">A+</div>
                        <div className="text-sm text-gray-600">Mathematics</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-green-600">95%</div>
                        <div className="text-sm text-gray-600">English</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Overall Progress</span>
                        <span>87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{width: '87%', background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          </div>
        </div>

        
        
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}08, ${COLORS.primary.blue}08, #9333ea08)` }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-semibold text-blue-800 mb-6">
              <Lightbulb className="h-4 w-4 mr-2" />
              Platform Features
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Why Choose Our 
              <span className="block text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                Digital Platform?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Experience the future of education with our comprehensive, secure, and innovative result management system designed specifically for academic excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group transition-all duration-700 hover:-translate-y-6 cursor-pointer ${
                  activeFeature === index ? 'scale-105' : ''
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border-2 ${
                  activeFeature === index 
                    ? 'border-blue-200 shadow-2xl' 
                    : 'border-gray-100 group-hover:border-gray-200'
                }`}>
                  <div
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 bg-gradient-to-r ${feature.color} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                  >
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center text-sm text-gray-500">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <Trophy className="h-16 w-16 mx-auto mb-6 text-yellow-300" />
              <h3 className="text-3xl font-bold mb-4">Award-Winning Platform</h3>
              <p className="text-xl text-blue-100 mb-8">
                Recognized as the best digital education platform in Lagos State, 
                our system has transformed how students, parents, and teachers interact with academic data.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {achievements.map((achievement, index) => (
                  <div key={index} className="text-center">
                    <achievement.icon className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
                    <div className="font-semibold text-sm">{achievement.title}</div>
                    <div className="text-xs text-blue-200">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${COLORS.primary.red} 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, ${COLORS.primary.blue} 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, ${COLORS.primary.yellow} 0%, transparent 30%)`
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full text-sm font-semibold text-yellow-300 mb-6">
              <BarChart3 className="h-4 w-4 mr-2" />
              Our Impact
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Excellence in 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Numbers
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our achievements and impact speak volumes about our commitment to educational excellence and student success.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="group transition-all duration-700 hover:scale-110 hover:-translate-y-4"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-500 shadow-2xl">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-r ${stat.color} shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                    <stat.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className={`text-6xl font-bold mb-4 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                    {stat.number}
                  </div>
                  <div className="text-white text-xl font-semibold mb-2">{stat.label}</div>
                  <div className="text-gray-300 text-sm">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}08, ${COLORS.primary.blue}08, #9333ea08)` }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-sm font-semibold text-green-800 mb-6">
              <Heart className="h-4 w-4 mr-2" />
              What People Say
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Success Stories from Our
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                School Community
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hear from students, parents, and teachers about their transformative experiences with our digital platform.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
                      <div className="text-center">
                        <div className="text-6xl mb-6">{testimonial.avatar}</div>
                        <div className="flex justify-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <blockquote className="text-2xl text-gray-700 leading-relaxed mb-8 font-medium">
                          "{testimonial.content}"
                        </blockquote>
                        <div className="border-t border-gray-200 pt-6">
                          <div className="font-bold text-xl text-gray-900 mb-1">{testimonial.name}</div>
                          <div className="text-lg text-gray-600 mb-2">{testimonial.role}</div>
                          <div className="text-sm text-gray-500">{testimonial.student}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentTestimonial === index 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${COLORS.primary.red} 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, ${COLORS.primary.blue} 0%, transparent 50%)`
          }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full text-sm font-semibold text-yellow-300 mb-6">
            <Target className="h-4 w-4 mr-2" />
            Join Our Community
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Ready to Join the 
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Gabs Glorious Kids Academy Family?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto">
            Experience excellence in education with our modern digital platform, dedicated staff, and innovative learning environment. 
            Your academic journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-16">
            <div className="group flex-1 sm:flex-none">
              <Link
                to="/auth/student/login"
                className="w-full sm:w-auto px-12 py-6 rounded-2xl text-white font-bold text-xl transition-all duration-300 hover:shadow-2xl flex items-center justify-center group-hover:scale-105 group-hover:-translate-y-2"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.primary.red} 0%, ${COLORS.primary.blue} 100%)`,
                  boxShadow: `0 20px 40px rgba(220, 38, 38, 0.4)`
                }}
              >
                <GraduationCap className="h-6 w-6 mr-3" />
                Access Student Portal
                <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="group flex-1 sm:flex-none">
              <Link
                to="/auth/admin/login"
                className="w-full sm:w-auto px-12 py-6 rounded-2xl font-bold text-xl border-2 transition-all duration-300 hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-2 bg-white/10 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
              >
                <UserCheck className="h-6 w-6 mr-3 inline-block" />
                Staff Portal
                <ArrowRight className="ml-3 h-6 w-6 inline-block group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Additional CTA Info */}
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Clock className="h-8 w-8 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white mb-2">24/7 Access</h3>
              <p className="text-gray-300 text-sm">Access your results anytime, anywhere</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Shield className="h-8 w-8 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure Platform</h3>
              <p className="text-gray-300 text-sm">Bank-level security for your data</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <MessageCircle className="h-8 w-8 mx-auto mb-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Support Available</h3>
              <p className="text-gray-300 text-sm">24/7 technical support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${COLORS.primary.red} 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, ${COLORS.primary.blue} 0%, transparent 50%)`
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 mb-16">
            {/* School Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-8">
                <div className="relative">
                  <img 
                    src="/images/ggk-academy.jpeg" 
                    alt="Gabs Glorious Kids Academy Logo" 
                    className="h-16 w-16 mr-4"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="text-3xl font-bold">Gabs Glorious Kids Academy</span>
                  <p className="text-blue-200 text-sm">Excellence in Education</p>
                </div>
              </div>
              <p className="text-gray-300 mb-8 leading-relaxed text-lg max-w-2xl">
                Nurturing students with cutting-edge digital tools for academic success. 
                We are committed to providing world-class education through innovative technology and dedicated teaching at Gabs Glorious Kids Academy.
              </p>
              <div className="space-y-4">
                <div className="flex items-center group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Address</div>
                    <div className="text-gray-300">No. A32, A33, A35 Lazarus Mouka Crescent, Cooperative Garden Estate(El-Salem), Lugbe, Abuja.</div>
                  </div>
                </div>
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Phone</div>
                    <div className="text-gray-300">+234-8030752962, +234-8038191867</div>
                  </div>
                </div>
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Email</div>
                    <div className="text-gray-300">ggkacademy@gmail.com</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-8 text-2xl text-white">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link to="/auth/admin/login" className="hover:text-yellow-400 transition-colors flex items-center group text-gray-300 hover:text-white">
                  <UserCheck className="h-5 w-5 mr-3" />
                  Staff Portal
                  <ArrowRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link></li>
                <li><Link to="/auth/student/login" className="hover:text-yellow-400 transition-colors flex items-center group text-gray-300 hover:text-white">
                  <GraduationCap className="h-5 w-5 mr-3" />
                  Student Portal
                  <ArrowRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link></li>
              </ul>
            </div>
            
            {/* Support & Social */}
            <div>
              <h4 className="font-bold mb-8 text-2xl text-white">Contact & Support</h4>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  <span>24/7 Technical Support</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>+234-8030752962, +234-8038191867</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Mail className="h-5 w-5 mr-3" />
                  <span>ggkacademy@gmail.com</span>
                </li>
              </ul>
              
              {/* Social Media */}
              <div>
                <h5 className="font-semibold mb-4 text-white">Follow Us</h5>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <Facebook className="h-5 w-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <Twitter className="h-5 w-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                    <Instagram className="h-5 w-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gradient-to-r from-blue-700 to-blue-800 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <Linkedin className="h-5 w-5 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-300 mb-4 md:mb-0">
                <p>&copy; {new Date().getFullYear()} Gabs Glorious Kids Academy. All rights reserved.</p>
                <p className="text-sm mt-1">Excellence in Education • Character Development • Academic Achievement</p>
              </div>
              <div className="flex space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
