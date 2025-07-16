import React, { useState, useEffect, useRef } from 'react'; // Added useRef

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define keyframes for animations and import fonts
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');

  /* Border Glow Animation */
  @keyframes glow-border {
    0% {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.4); /* blue-500 with opacity */
    }
    50% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); /* Stronger glow */
    }
    100% {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
    }
  }

  .animate-glow-border {
    animation: glow-border 3s infinite ease-in-out;
  }

  /* Clock Hand Animations */
  @keyframes rotate-hand-hour {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes rotate-hand-minute {
    from { transform: rotate(0deg); }
    to { transform: rotate(720deg); } /* Faster rotation for minute hand */
  }

  .animate-hour-hand {
    animation: rotate-hand-hour 2s linear infinite;
  }

  .animate-minute-hand {
    animation: rotate-hand-minute 2s linear infinite;
  }

  /* Text Shine Effect - White for Erfan */
  @keyframes white-shine {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .white-shine-text {
    background: linear-gradient(to right, #ffffff00 0%, #ffffff80 50%, #ffffff00 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: white-shine 3s infinite linear;
  }

  /* Text Shine Effect - Blue for Vakili */
  @keyframes blue-shine {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .blue-shine-text {
    background: linear-gradient(to right, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.5) 50%, rgba(59, 130, 246, 0) 100%); /* blue-500 with opacity */
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: blue-shine 3s infinite linear;
  }

  /* New AI Icon Animations */
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  @keyframes bicep-flex {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(-25deg); } /* Rotate upwards from the elbow */
    100% { transform: rotate(0deg); }
  }

  .animate-pulse {
    animation: pulse 2s infinite ease-in-out;
  }

  .animate-bicep-flex {
    animation: bicep-flex 1s infinite ease-in-out;
    transform-origin: 16px 12px; /* Set pivot point for the bicep */
  }
`;

// Component for the animated clock icon
const AnimatedClockIcon = ({ isAnimating }) => {
  // Initial positions for hands (e.g., hour at 12, minute at 3)
  const initialHourRotation = -90; // 12 o'clock (SVG default is 3 o'clock)
  const initialMinuteRotation = 0; // 3 o'clock

  return (
    <svg className="w-24 h-24 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" strokeWidth="1.5"></circle> {/* Thicker circle border */}
      {/* Hour hand */}
      <rect
        x="11" y="7" width="2" height="6" rx="1" ry="1"
        transform={`rotate(${isAnimating ? 0 : initialHourRotation} 12 12)`}
        className={isAnimating ? 'animate-hour-hand' : ''}
        style={{ transformOrigin: 'center center', transition: 'transform 1s ease-out' }} // Smooth transition back
      ></rect>
      {/* Minute hand */}
      <rect
        x="11" y="4" width="2" height="9" rx="1" ry="1"
        transform={`rotate(${isAnimating ? 0 : initialMinuteRotation} 12 12)`}
        className={isAnimating ? 'animate-minute-hand' : ''}
        style={{ transformOrigin: 'center center', transition: 'transform 1s ease-out' }} // Smooth transition back
      ></rect>
    </svg>
  );
};

// Component for the animated title with shine effect
const AnimatedTitle = () => {
  return (
    <div className="relative inline-block overflow-hidden">
      <span className="block text-blue-500 relative">
        Erfan
        <span className="absolute inset-0 block white-shine-text pointer-events-none">Erfan</span>
      </span>
      <span className="block text-gray-100 relative">
        Vakili
        <span className="absolute inset-0 block blue-shine-text pointer-events-none">Vakili</span>
      </span>
    </div>
  );
};

// Define a hardcoded Firebase config as a fallback
// This should match your actual Firebase project configuration.
// Replace with your actual Firebase config if it differs.
const HARDCODED_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBWoRrUVDYyBd5IYm138cuD04Urx3KWpGA", // Replace with your actual API Key
  authDomain: "erfan2-523ab.firebaseapp.com",
  projectId: "erfan2-523ab",
  storageBucket: "erfan2-523ab.firebasestorage.app",
  messagingSenderId: "1043803138398",
  appId: "1:1043803138398:web:8b7b1c79aae18a701147cf",
  measurementId: "G-K0M82KSGDS"
};

// Main App component
const App = () => {
  const [activeTab, setActiveTab] = useState('home'); // State to manage active tab for navigation
  const [db, setDb] = useState(null); // Firestore instance
  const [auth, setAuth] = useState(null); // Auth instance
  const [userId, setUserId] = useState(null); // Current user ID
  const [isAuthReady, setIsAuthReady] = useState(false); // Flag to check if Firebase Auth is ready
  const [isAIChatOpen, setIsAIChatOpen] = useState(false); // State to control AI chat modal visibility
  const [authError, setAuthError] = useState(null); // State to store authentication errors

  // Inject global styles (keyframes and font import)
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    const initFirebase = async () => {
      try {
        let firebaseConfigToUse = null;
        let appIdToUse = 'default-app-id'; // Fallback for appId
        let initialAuthTokenToUse = null; // Default to null

        // --- Debugging Firebase config retrieval ---
        console.log("--- Firebase Init Debug Start ---");
        console.log("typeof __firebase_config (Canvas global):", typeof __firebase_config);
        console.log("typeof __app_id (Canvas global):", typeof __app_id);
        console.log("typeof __initial_auth_token (Canvas global):", typeof __initial_auth_token);
        console.log("process.env.REACT_APP_FIREBASE_CONFIG (Netlify/local):", typeof process !== 'undefined' && process.env ? process.env.REACT_APP_FIREBASE_CONFIG : "N/A");
        console.log("process.env.REACT_APP_APP_ID (Netlify/local):", typeof process !== 'undefined' && process.env ? process.env.REACT_APP_APP_ID : "N/A");
        console.log("--- End Firebase Init Debug Start ---");


        // 1. Prioritize Netlify/local environment variables first for deployed apps
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_CONFIG) {
          try {
            firebaseConfigToUse = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
            appIdToUse = process.env.REACT_APP_APP_ID || appIdToUse;
            console.log("Firebase Init: Successfully parsed REACT_APP_FIREBASE_CONFIG from environment.");
          } catch (e) {
            console.error("Firebase Init: Failed to parse REACT_APP_FIREBASE_CONFIG from environment:", e.message);
          }
        }

        // 2. Fallback to Canvas global variables if Netlify/local env var failed or not present
        if (!firebaseConfigToUse && typeof __firebase_config !== 'undefined' && __firebase_config) {
          try {
            firebaseConfigToUse = JSON.parse(__firebase_config);
            appIdToUse = typeof __app_id !== 'undefined' ? __app_id : appIdToUse;
            initialAuthTokenToUse = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
            console.log("Firebase Init: Successfully parsed __firebase_config from Canvas globals.");
          } catch (e) {
            console.error("Firebase Init: Failed to parse __firebase_config from Canvas globals:", e.message);
          }
        }

        // 3. Ultimate fallback to hardcoded config
        if (!firebaseConfigToUse) {
          firebaseConfigToUse = HARDCODED_FIREBASE_CONFIG;
          appIdToUse = HARDCODED_FIREBASE_CONFIG.appId || appIdToUse; // Use hardcoded appId
          console.log("Firebase Init: Falling back to hardcoded Firebase config.");
        }

        console.log("Firebase Init: Final firebaseConfig used:", firebaseConfigToUse);
        console.log("Firebase Init: Final appId used:", appIdToUse);
        console.log("Firebase Init: Final initialAuthToken used:", initialAuthTokenToUse ? "Available" : "Not Available");
        console.log("--- Firebase Init Debug End ---");

        if (!firebaseConfigToUse || Object.keys(firebaseConfigToUse).length === 0) {
          throw new Error("Firebase config is empty or invalid after all attempts.");
        }

        // Initialize Firebase app
        const app = initializeApp(firebaseConfigToUse);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            // User is signed in
            setUserId(user.uid);
            console.log("Firebase: User signed in with UID:", user.uid);
            setAuthError(null); // Clear any previous auth errors
          } else {
            // User is signed out or not yet signed in, attempt anonymous sign-in
            try {
              if (initialAuthTokenToUse) {
                console.log("Firebase: Attempting sign-in with custom token...");
                await signInWithCustomToken(firebaseAuth, initialAuthTokenToUse);
                setUserId(firebaseAuth.currentUser.uid);
                console.log("Firebase: Signed in with custom token. UID:", firebaseAuth.currentUser.uid);
                setAuthError(null);
              } else {
                await signInAnonymously(firebaseAuth);
                setUserId(firebaseAuth.currentUser.uid);
                console.log("Firebase: Signed in anonymously. UID:", firebaseAuth.currentUser.uid);
                setAuthError(null);
              }
            } catch (authErr) {
              console.error("Firebase: Authentication failed:", authErr.code, authErr.message);
              setAuthError(`خطا در احراز هویت Firebase: ${authErr.message} (کد خطا: ${authErr.code}). لطفاً صفحه را بارگذاری مجدد کنید.`);
              setUserId(null); // Ensure userId is null on failure
            }
          }
          setIsAuthReady(true); // Firebase Auth is now ready
          console.log("Firebase: Auth readiness set to true.");
        });

        // Cleanup the auth listener on component unmount
        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setAuthError(`خطا در مقداردهی اولیه Firebase: ${error.message}. لطفاً صفحه را بارگذاری مجدد کنید.`);
        setUserId(null); // Ensure userId is null on failure
        setIsAuthReady(true); // Still set to true to show the error message in UI
      }
    };

    initFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle reload action for auth errors
  const handleReload = () => {
    window.location.reload();
  };

  // Show a loading message while Firebase is initializing or an error if auth failed
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-xl font-semibold text-blue-400">در حال بارگذاری سایت...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-800 text-white p-8 rounded-lg shadow-xl text-center max-w-sm border-2 border-red-600">
          <h2 className="text-3xl font-bold mb-4">خطا</h2>
          <p className="text-lg mb-6">{authError}</p>
          <button
            onClick={handleReload}
            className="bg-white text-red-800 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-red-100 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            بارگذاری مجدد
          </button>
        </div>
      </div>
    );
  }

  // Function to render content based on active tab, passing Firebase instances
  const renderContent = () => {
    return (
      <>
        {activeTab === 'home' && <HomeSection />}
        {activeTab === 'about' && <AboutCoachSection />}
        {activeTab === 'services' && <ServicesSection />}
        {activeTab === 'booking' && <BookingSection db={db} userId={userId} />}
        {activeTab === 'contact' && <ContactSection db={db} userId={userId} />}
      </>
    );
  };

  return (
    // Added dir="rtl" for consistent right-to-left layout
    <div className="min-h-screen bg-gray-900 font-vazirmatn text-gray-200" dir="rtl">
      {/* Navigation Bar */}
      <nav className="bg-gray-950 py-3 px-4 sm:px-8 shadow-2xl rounded-b-xl border-b-4 border-blue-700">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-white text-4xl md:text-5xl font-extrabold mb-3 md:mb-0 text-center md:text-right">
            <AnimatedTitle /> {/* Use the new AnimatedTitle component */}
          </div>
          <ul className="flex flex-wrap justify-center space-x-2 sm:space-x-4 md:space-x-8 mt-3 md:mt-0"> {/* Adjusted spacing for mobile */}
            <li>
              <button
                onClick={() => setActiveTab('home')}
                className={`text-gray-300 text-base sm:text-lg font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                  activeTab === 'home' ? 'bg-blue-700 text-white shadow-md' : ''
                }`}
              >
                صفحه اصلی
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('about')}
                className={`text-gray-300 text-base sm:text-lg font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                  activeTab === 'about' ? 'bg-blue-700 text-white shadow-md' : ''
                }`}
              >
                درباره مربی
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('services')}
                className={`text-gray-300 text-base sm:text-lg font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                  activeTab === 'services' ? 'bg-blue-700 text-white shadow-md' : ''
                }`}
              >
                خدمات
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('booking')}
                className={`text-gray-300 text-base sm:text-lg font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                  activeTab === 'booking' ? 'bg-blue-700 text-white shadow-md' : ''
                }`}
              >
                رزرو نوبت
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('contact')}
                className={`text-gray-300 text-base sm:text-lg font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                  activeTab === 'contact' ? 'bg-blue-700 text-white shadow-md' : ''
                }`}
              >
                تماس با ما
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 py-12">
        {renderContent()}
      </main>

      {/* Floating AI Chat Button */}
      {!isAIChatOpen && ( // Conditionally render the button
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500 z-50 flex items-center justify-center text-lg font-bold animate-pulse" // Added pulse animation
          style={{ width: '64px', height: '64px' }} // Slightly larger for prominence
        >
          {/* New Muscular Arm Icon */}
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {/* Muscular Arm - simplified and more defined */}
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
              fill="#3B82F6" /* Blue-500 for the background circle */
            />
            <path
              d="M15.5 12.5c-.7-.7-1.4-.7-2.1-.7s-1.4 0-2.1.7L9 14.5c-.7.7-1.4.7-2.1 0s-.7-1.4 0-2.1L9.5 10c.7-.7 1.4-.7 2.1-.7s1.4 0 2.1.7L15.5 12.5zM12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              fill="#10B981" /* Teal-600 for the arm */
              className="animate-bicep-flex"
              style={{ transformOrigin: '12px 10px' }} /* Adjust pivot point for elbow flex */
            />
            {/* Hand/Fist - simplified */}
            <circle cx="10" cy="15.5" r="2" fill="#065F46"/> {/* Darker teal for fist */}
          </svg>
        </button>
      )}

      {/* AI Chat Modal */}
      {isAIChatOpen && (
        <div
          className="fixed bottom-8 right-8 w-80 md:w-96 h-[400px] md:h-[500px] p-6 rounded-2xl shadow-2xl flex flex-col relative border-2 border-teal-600 z-[100] transform transition-all duration-300 ease-out"
          style={{
            backgroundColor: '#1a4d4d', // Base dark teal color for massage theme
            // Subtle diagonal lines for a textured background (honeycomb-like)
            backgroundImage: `
              linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(45deg, rgba(255,255,255,0.03) 75%, transparent 75%),
              linear-gradient(-45deg, rgba(255,255,255,0.03) 75%, transparent 75%)
            `,
            backgroundSize: '20px 20px',
          }}
        >
          <button
            onClick={() => setIsAIChatOpen(false)}
            className="absolute top-4 left-4 text-gray-400 hover:text-white text-3xl font-bold focus:outline-none" // Adjusted to left for RTL
          >
            &times; {/* Close button (X icon) */}
          </button>
          <AIChatSection />
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 p-8 mt-20 rounded-t-xl shadow-inner border-t-4 border-blue-700">
        <div className="container mx-auto text-center text-sm">
          <p>&copy; 2025 وب‌سایت مربی ورزش و ماساژ. تمامی حقوق محفوظ است.</p>
          <p className="mt-2 text-gray-500">Designed by Arvin Vakili</p>
        </div>
      </footer>
    </div>
  );
};

// Home Section Component
const HomeSection = () => (
  <section className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 md:p-16 rounded-2xl shadow-2xl mb-20 border-4 border-blue-700 animate-glow-border">
    <div className="flex flex-col items-center justify-center text-center">
      <div className="w-full">
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-8 animate-fade-in-down font-lalezar">
          به دنیای <span className="text-blue-500">قدرت</span> و <span className="text-teal-500">آرامش</span> خوش آمدید!
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl font-light text-gray-300 leading-relaxed mb-10 animate-fade-in-up font-vazirmatn">
          با برنامه‌های ورزشی شخصی‌سازی شده و ماساژهای درمانی، به بهترین نسخه از خودتان تبدیل شوید.
        </p>
        <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-10 sm:px-12 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 text-lg sm:text-xl tracking-wide font-vazirmatn">
          رزرو نوبت همین حالا!
        </button>
      </div>
    </div>
  </section>
);

// About Coach Section Component
const AboutCoachSection = () => (
  <section className="bg-gray-800 p-10 md:p-16 rounded-2xl shadow-xl mb-20 border-4 border-blue-700 animate-glow-border">
    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center text-blue-500 mb-12 font-lalezar">درباره مربی</h2>
    <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
      <div className="md:w-1/3 flex justify-center">
        <img
          src="https://placehold.co/400x400/334155/E2E8F0?text=تصویر+مربی" // Darker placeholder
          alt="تصویر مربی"
          className="rounded-full w-64 h-64 sm:w-80 sm:h-80 object-cover shadow-lg border-6 border-blue-600 transform hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/334155/E2E8F0?text=تصویر+مربی"; }}
        />
      </div>
      <div className="md:w-2/3 text-center md:text-right">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-8 font-lalezar">نام مربی: [نام مربی]</h3>
        <p className="text-base sm:text-lg lg:text-xl font-light text-gray-300 leading-relaxed mb-8 font-vazirmatn">
          [نام مربی] با بیش از ۱۰ سال تجربه در زمینه مربیگری ورزشی و ماساژ درمانی، متعهد به کمک به شما برای رسیدن به اهداف سلامتی و تناسب اندامتان است. او دارای مدارک معتبر در فیزیولوژی ورزشی و تکنیک‌های مختلف ماساژ است و با رویکردی جامع و شخصی‌سازی شده، بهترین نتایج را برای شما به ارمغان می‌آورد.
        </p>
        <p className="text-base sm:text-lg lg:text-xl font-light text-gray-300 leading-relaxed font-vazirmatn">
          فلسفه [نام مربی] بر پایه تعادل بین فعالیت بدنی، آرامش ذهنی و تغذیه سالم استوار است. او معتقد است که هر فرد منحصربه‌فرد است و برنامه‌های او نیز بر اساس نیازها و اهداف خاص هر مراجعه‌کننده طراحی می‌شوند.
        </p>
      </div>
    </div>
  </section>
);

// Services Section Component
const ServicesSection = () => {
  const [isMassageAnimating, setIsMassageAnimating] = useState(false);

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 md:p-16 rounded-2xl shadow-2xl mb-20 border-4 border-blue-700 animate-glow-border">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center text-white mb-12 font-lalezar">خدمات ما</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Sports Services Card */}
        <div className="bg-gray-900 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border-4 border-blue-600">
          <div className="flex items-center justify-center mb-8">
            <svg className="w-24 h-24 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 100-18 9 9 0 000 18z"></path>
            </svg>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-400 mb-8 font-lalezar">برنامه‌های ورزشی</h3>
          <ul className="list-disc list-inside text-base sm:text-lg font-light text-gray-300 space-y-4 text-right font-vazirmatn">
            <li>طراحی برنامه تمرینی شخصی‌سازی شده (قدرتی، استقامتی، کاهش وزن)</li>
            <li>چکاپ و ارزیابی پیشرفت برنامه</li>
            <li>مشاوره تغذیه ورزشی</li>
            <li>تمرینات اصلاحی و پیشگیری از آسیب</li>
          </ul>
        </div>

        {/* Massage Services Card */}
        <div
          className="bg-gray-900 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border-4 border-teal-600"
          onMouseEnter={() => setIsMassageAnimating(true)}
          onMouseLeave={() => setIsMassageAnimating(false)}
          onTouchStart={() => setIsMassageAnimating(true)}
          onTouchEnd={() => setIsMassageAnimating(false)}
        >
          <div className="flex items-center justify-center mb-8">
            <AnimatedClockIcon isAnimating={isMassageAnimating} />
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-center text-teal-400 mb-8 font-lalezar">خدمات ماساژ</h3>
          <ul className="list-disc list-inside text-base sm:text-lg font-light text-gray-300 space-y-4 text-right font-vazirmatn">
            <li>ماساژ ریلکسی و آرامش‌بخش</li>
            <li>ماساژ ورزشی (قبل و بعد از تمرین)</li>
            <li>ماساژ درمانی (کاهش درد عضلانی، بهبود گردش خون)</li>
            <li>ماساژ با سنگ داغ و روغن‌های معطر</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// Booking Section Component - Now embeds Google Form for file upload
const BookingSection = ({ db, userId }) => {
  // Removed file upload states and handlers as they are replaced by Google Form embed

  const handleGoToForm = () => {
    window.open('https://forms.gle/zG3FjXZyDq7VahER6', '_blank'); // Open form in a new tab
  };

  return (
    <section className="bg-gray-800 p-10 md:p-16 rounded-2xl shadow-xl mb-20 text-center border-4 border-blue-700 animate-glow-border">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-500 mb-12 font-lalezar">رزرو نوبت و ارسال برنامه ورزشی</h2>
      <p className="text-lg sm:text-xl lg:text-2xl font-light text-gray-300 leading-relaxed mb-10 font-vazirmatn">
        برای رزرو نوبت مشاوره ورزشی یا جلسه ماساژ، لطفاً فرم زیر را پر کنید یا با ما تماس بگیرید. همچنین می‌توانید برنامه ورزشی خود را از طریق دکمه زیر برای ما ارسال کنید.
      </p>
      <div className="bg-gray-900 p-10 rounded-2xl shadow-inner max-w-lg mx-auto border-2 border-blue-600">
        <p className="text-base sm:text-lg font-semibold text-gray-400 mb-8 font-vazirmatn">
          این بخش در آینده با یک سیستم رزرو آنلاین کامل‌تر خواهد شد.
        </p>
        <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-10 sm:px-12 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 text-lg sm:text-xl font-vazirmatn">
          تماس برای رزرو
        </button>

        <div className="mt-10 pt-10 border-t border-gray-700">
          <h3 className="text-3xl font-extrabold text-white mb-6 font-lalezar">ارسال برنامه ورزشی</h3>
          <p className="text-lg font-light text-gray-300 mb-8 font-vazirmatn">
            لطفاً برنامه ورزشی خود را از طریق دکمه زیر برای ما ارسال کنید.
          </p>
          <button
            onClick={handleGoToForm}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-10 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500 text-lg sm:text-xl tracking-wide font-vazirmatn"
          >
            ارسال برنامه ورزشی
          </button>
          {userId && (
            <p className="mt-6 text-xs text-gray-500 font-vazirmatn">
              شناسه کاربری شما: <span className="font-mono text-blue-400 break-all">{userId}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

// AI Chat Section Component - New component for AI chatbot
const AIChatSection = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newUserMessage = { role: "user", parts: [{ text: input }] };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get API Key: Prioritize Netlify env var, then Canvas global, then fallback to empty string
      let geminiApiKey = "";
      // Check for Netlify environment variable first
      if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) {
        geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
        console.log("AIChat: Using REACT_APP_GEMINI_API_KEY from Netlify environment.");
      }
      // Fallback to Canvas global variable if not found in process.env
      else if (typeof window !== 'undefined' && window.parent && window.parent.__gemini_api_key) {
        geminiApiKey = window.parent.__gemini_api_key;
        console.log("AIChat: Using __gemini_api_key from Canvas parent window.");
      } else {
        console.log("AIChat: No specific GEMINI_API_KEY found in environment or Canvas globals. Using default empty string (expecting Canvas runtime to fill if applicable).");
      }

      console.log("AIChat: Gemini API Key value (first 5 chars):", geminiApiKey.substring(0, 5) + (geminiApiKey.length > 5 ? '...' : '')); // Log partial key for security

      // Add instruction to the prompt for concise responses and specific tone
      const promptWithInstruction = `${input}\n\n پاسخ شما باید در حیطه ورزش و ماساژ باشد. لطفا پاسخ خود را مختصر و مفید (حداکثر 100 کلمه) و با لحنی دوستانه و غیررسمی ارائه دهید. از جملاتی که نشان دهد به شما دستور داده شده است (مانند "بر اساس دستور شما") خودداری کنید.`;
      const payload = { contents: [...chatHistory, { role: "user", parts: [{ text: promptWithInstruction }] }] };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

      console.log("AIChat: Sending request to API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("AIChat: API Response Error Body:", errorBody);
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const aiResponseText = result.candidates[0].content.parts[0].text;
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: aiResponseText }] }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "متاسفم، مشکلی در دریافت پاسخ از هوش مصنوعی رخ داد. پاسخ از API خالی بود یا ساختار نامعتبری داشت." }] }]);
        console.error("AIChat: Unexpected API response structure:", result);
      }
    } catch (error) {
      console.error("AIChat: Error calling Gemini API:", error);
      setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: `متاسفم، خطایی در ارتباط با هوش مصنوعی رخ داد: ${error.message}` }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full text-gray-200" dir="rtl"> {/* Added dir="rtl" for chat modal content */}
      <h3 className="text-3xl sm:text-4xl font-extrabold text-center text-teal-400 mb-6 font-lalezar">مشاور هوش مصنوعی</h3>
      <p className="text-base sm:text-lg font-light text-gray-300 leading-relaxed mb-6 text-center font-vazirmatn">
        سوالات خود را در مورد ورزش، ماساژ، تغذیه و سلامتی از مشاور هوش مصنوعی ما بپرسید!
      </p>

      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 rounded-lg bg-gray-900 shadow-inner mb-6 border border-gray-700"> {/* Darker background, stronger border */}
        {chatHistory.length === 0 && (
          <p className="text-gray-500 text-center italic font-vazirmatn">هنوز پیامی ارسال نشده است. سوال خود را بپرسید!</p>
        )}
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 sm:p-4 rounded-xl shadow-md font-vazirmatn ${ // Larger padding, more rounded
                msg.role === 'user'
                  ? 'bg-teal-700 text-white rounded-br-none' // Stronger teal for user
                  : 'bg-gray-700 text-gray-100 rounded-bl-none' // Darker gray for AI
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </div>

      {/* Chat Input */}
      <div className="flex items-center space-x-2 sm:space-x-4 mt-auto"> {/* mt-auto to push to bottom */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="سوال خود را اینجا بنویسید..."
          className="flex-grow p-3 sm:p-4 border border-gray-700 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base sm:text-lg bg-gray-700 text-white placeholder-gray-400 font-vazirmatn" // Darker input, white text
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || input.trim() === ''}
          className={`py-3 px-6 sm:px-8 rounded-lg shadow-lg transform transition-all duration-300 text-base sm:text-lg font-vazirmatn ${
            isLoading || input.trim() === ''
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-teal-700 hover:bg-teal-800 text-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500' // Teal button
          }`}
        >
          {isLoading ? '...' : 'ارسال'}
        </button>
      </div>
    </div>
  );
};

// Contact Section Component - Now sends messages to Firestore
const ContactSection = ({ db, userId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState(''); // 'success', 'error', 'loading', ''

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      setSubmitStatus('error: سرویس ارسال پیام آماده نیست. لطفاً صفحه را رفرش کنید.');
      console.error("Firestore or User ID not available.");
      return;
    }

    setSubmitStatus('loading');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/contact_messages`), {
        name: name,
        email: email,
        message: message,
        timestamp: serverTimestamp(),
        userId: userId, // Store user ID for tracking
      });
      setSubmitStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSubmitStatus(''), 5000); // Clear message after 5 seconds
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus(`error: ${error.message}`);
      setTimeout(() => setSubmitStatus(''), 5000); // Clear message after 5 seconds
    }
  };

  return (
    <section className="bg-gray-800 p-10 md:p-16 rounded-2xl shadow-xl mb-20 border-4 border-blue-700 animate-glow-border">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center text-blue-500 mb-12 font-lalezar">تماس با ما</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="bg-gray-900 p-10 rounded-2xl shadow-inner text-right border-2 border-blue-600">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 font-lalezar">اطلاعات تماس</h3>
          <p className="text-base sm:text-lg font-light text-gray-300 mb-4 font-vazirmatn">
            <strong className="text-blue-400">تلفن:</strong> 0912-XXX-XXXX
          </p>
          <p className="text-base sm:text-lg font-light text-gray-300 mb-4 font-vazirmatn">
            <strong className="text-blue-400">ایمیل:</strong> info@sportmassage.com
          </p>
          <p className="text-base sm:text-lg font-light text-gray-300 mb-4 font-vazirmatn">
            <strong className="text-blue-400">آدرس:</strong> [آدرس باشگاه], [شهر]، ایران
          </p>
          <p className="text-base sm:text-lg font-light text-gray-300 mt-8 font-vazirmatn">
            ما در باشگاه [نام باشگاه] آماده خدمت‌رسانی به شما هستیم.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-gray-900 p-10 rounded-2xl shadow-inner border-2 border-teal-600">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-center text-white mb-8 text-right font-lalezar">ارسال پیام</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-base sm:text-lg font-semibold text-gray-300 text-right mb-2 font-vazirmatn">نام شما:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full p-3 sm:p-4 border border-gray-700 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base sm:text-lg bg-gray-700 text-white placeholder-gray-400 font-vazirmatn"
                placeholder="نام و نام خانوادگی"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-base sm:text-lg font-semibold text-gray-300 text-right mb-2 font-vazirmatn">ایمیل:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-3 sm:p-4 border border-gray-700 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base sm:text-lg bg-gray-700 text-white placeholder-gray-400 font-vazirmatn"
                placeholder="ایمیل شما"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-base sm:text-lg font-semibold text-gray-300 text-right mb-2 font-vazirmatn">پیام شما:</label>
              <textarea
                id="message"
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full p-3 sm:p-4 border border-gray-700 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base sm:text-lg bg-gray-700 text-white placeholder-gray-400 font-vazirmatn"
                placeholder="پیام خود را اینجا بنویسید..."
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className={`w-full font-bold py-3 px-8 sm:px-10 rounded-lg shadow-lg transform transition-all duration-300 text-lg sm:text-xl tracking-wide font-vazirmatn ${
                submitStatus === 'loading'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500'
              }`}
            >
              {submitStatus === 'loading' ? '...' : 'ارسال پیام'}
            </button>
            {submitStatus === 'success' && (
              <p className="mt-4 text-green-500 font-semibold font-vazirmatn">پیام شما با موفقیت ارسال شد!</p>
            )}
            {submitStatus === 'error' && (
              <p className="mt-4 text-red-500 font-semibold font-vazirmatn">خطا در ارسال پیام. لطفاً دوباره تلاش کنید.</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default App;
