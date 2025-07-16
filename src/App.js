import React, { useState, useEffect } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Main App component
const App = () => {
  const [activeTab, setActiveTab] = useState('home'); // State to manage active tab for navigation
  const [db, setDb] = useState(null); // Firestore instance
  const [auth, setAuth] = useState(null); // Auth instance
  const [userId, setUserId] = useState(null); // Current user ID
  const [isAuthReady, setIsAuthReady] = useState(false); // Flag to check if Firebase Auth is ready
  const [isAIChatOpen, setIsAIChatOpen] = useState(false); // State to control AI chat modal visibility
  const [authError, setAuthError] = useState(null); // State to store authentication errors

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Retrieve Firebase config and app ID from global variables provided by Canvas
        // These variables are injected by the Canvas environment
        const firebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // Fallback for appId
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        console.log("Firebase Init: __firebase_config:", firebaseConfigString ? "Available" : "Not Available");
        console.log("Firebase Init: __app_id:", appId);
        console.log("Firebase Init: __initial_auth_token:", initialAuthToken ? "Available" : "Not Available");

        if (!firebaseConfigString) {
          throw new Error("Firebase config is not available. Please ensure __firebase_config is set in the Canvas environment.");
        }
        const firebaseConfig = JSON.parse(firebaseConfigString);

        // Initialize Firebase app
        const app = initializeApp(firebaseConfig);
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
              if (initialAuthToken) {
                console.log("Firebase: Attempting sign-in with custom token...");
                await signInWithCustomToken(firebaseAuth, initialAuthToken);
                setUserId(firebaseAuth.currentUser.uid);
                console.log("Firebase: Signed in with custom token. UID:", firebaseAuth.currentUser.uid);
                setAuthError(null);
              } else {
                console.log("Firebase: Attempting anonymous sign-in...");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-blue-700">در حال بارگذاری سایت...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-700 text-white p-8 rounded-lg shadow-xl text-center max-w-sm">
          <h2 className="text-3xl font-bold mb-4">خطا</h2>
          <p className="text-lg mb-6">{authError}</p>
          <button
            onClick={handleReload}
            className="bg-white text-red-700 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-red-100 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
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
    <div className="min-h-screen bg-gray-50 font-inter text-gray-800">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-800 to-teal-600 py-2 px-6 shadow-xl rounded-b-3xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-white text-3xl md:text-4xl font-extrabold mb-2 md:mb-0">
            <span className="text-yellow-300">Erfan</span> <span className="text-white">Vakili</span>
          </div>
          <ul className="flex flex-wrap justify-center space-x-4 md:space-x-8">
            <li>
              <button
                onClick={() => setActiveTab('home')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'home' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                صفحه اصلی
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('about')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'about' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                درباره مربی
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('services')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'services' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                خدمات
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('booking')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'booking' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                رزرو نوبت
              </button>
            </li>
            {/* Removed AI Chat button from navigation */}
            <li>
              <button
                onClick={() => setActiveTab('contact')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'contact' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                تماس با ما
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 py-10">
        {renderContent()}
      </main>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-50 flex items-center justify-center text-lg font-bold"
        style={{ width: '60px', height: '60px' }} // Fixed size for round button
      >
        {/* Chat icon - You can replace this with a better icon if desired */}
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      </button>

      {/* AI Chat Modal */}
      {isAIChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"> {/* Higher z-index */}
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 max-w-2xl h-5/6 flex flex-col relative">
            <button
              onClick={() => setIsAIChatOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold focus:outline-none"
            >
              &times; {/* Close button (X icon) */}
            </button>
            <AIChatSection />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white p-6 mt-16 rounded-t-3xl shadow-inner">
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
  <section className="bg-gradient-to-br from-blue-100 to-white p-8 md:p-12 rounded-3xl shadow-2xl mb-16 border border-blue-200">
    <div className="flex flex-col items-center justify-center text-center">
      <div className="w-full">
        <h1 className="text-5xl lg:text-7xl font-extrabold text-blue-900 leading-tight mb-6 animate-fade-in-down">
          به دنیای <span className="text-teal-700">سلامتی</span> و <span className="text-yellow-600">انرژی</span> خوش آمدید!
        </h1>
        <p className="text-xl lg:text-2xl font-normal text-gray-700 leading-relaxed mb-8 animate-fade-in-up">
          با برنامه‌های ورزشی شخصی‌سازی شده و ماساژهای درمانی، به بهترین نسخه از خودتان تبدیل شوید.
        </p>
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg">
          رزرو نوبت همین حالا!
        </button>
      </div>
    </div>
  </section>
);

// About Coach Section Component
const AboutCoachSection = () => (
  <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl mb-16 border border-gray-200">
    <h2 className="text-4xl lg:text-5xl font-extrabold text-center text-blue-800 mb-10">درباره مربی</h2>
    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
      <div className="md:w-1/3 flex justify-center">
        <img
          src="https://placehold.co/350x350/B0E0E6/333333?text=تصویر+مربی"
          alt="تصویر مربی"
          className="rounded-full w-72 h-72 object-cover shadow-lg border-6 border-teal-500 transform hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/350x350/B0E0E6/333333?text=تصویر+مربی"; }}
        />
      </div>
      <div className="md:w-2/3 text-center md:text-right">
        <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">نام مربی: [نام مربی]</h3>
        <p className="text-lg lg:text-xl font-normal text-gray-700 leading-relaxed mb-6">
          [نام مربی] با بیش از ۱۰ سال تجربه در زمینه مربیگری ورزشی و ماساژ درمانی، متعهد به کمک به شما برای رسیدن به اهداف سلامتی و تناسب اندامتان است. او دارای مدارک معتبر در فیزیولوژی ورزشی و تکنیک‌های مختلف ماساژ است و با رویکردی جامع و شخصی‌سازی شده، بهترین نتایج را برای شما به ارمغان می‌آورد.
        </p>
        <p className="text-lg lg:text-xl font-normal text-gray-700 leading-relaxed">
          فلسفه [نام مربی] بر پایه تعادل بین فعالیت بدنی، آرامش ذهنی و تغذیه سالم استوار است. او معتقد است که هر فرد منحصربه‌فرد است و برنامه‌های او نیز بر اساس نیازها و اهداف خاص هر مراجعه‌کننده طراحی می‌شوند.
        </p>
      </div>
    </div>
  </section>
);

// Services Section Component
const ServicesSection = () => (
  <section className="bg-gradient-to-br from-white to-blue-100 p-8 md:p-12 rounded-3xl shadow-2xl mb-16 border border-blue-200">
    <h2 className="text-4xl lg:text-5xl font-extrabold text-center text-blue-800 mb-10">خدمات ما</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Sports Services Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-blue-300">
        <div className="flex items-center justify-center mb-6">
          <svg className="w-20 h-20 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 100-18 9 9 0 000 18z"></path>
          </svg>
        </div>
        <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6">برنامه‌های ورزشی</h3>
        <ul className="list-disc list-inside text-lg font-semibold text-gray-700 space-y-3 text-right">
          <li>طراحی برنامه تمرینی شخصی‌سازی شده (قدرتی، استقامتی، کاهش وزن)</li>
          <li>چکاپ و ارزیابی پیشرفت برنامه</li>
          <li>مشاوره تغذیه ورزشی</li>
          <li>تمرینات اصلاحی و پیشگیری از آسیب</li>
        </ul>
      </div>

      {/* Massage Services Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-teal-300">
        <div className="flex items-center justify-center mb-6">
          <svg className="w-20 h-20 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6">خدمات ماساژ</h3>
        <ul className="list-disc list-inside text-lg font-semibold text-gray-700 space-y-3 text-right">
          <li>ماساژ ریلکسی و آرامش‌بخش</li>
          <li>ماساژ ورزشی (قبل و بعد از تمرین)</li>
          <li>ماساژ درمانی (کاهش درد عضلانی، بهبود گردش خون)</li>
          <li>ماساژ با سنگ داغ و روغن‌های معطر</li>
        </ul>
      </div>
    </div>
  </section>
);

// Booking Section Component - Now embeds Google Form for file upload
const BookingSection = ({ db, userId }) => {
  const handleGoToForm = () => {
    window.open('https://forms.gle/zG3FjXZyDq7VahER6', '_blank'); // Open form in a new tab
  };

  return (
    <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl mb-16 text-center border border-gray-200">
      <h2 className="text-4xl lg:text-5xl font-extrabold text-blue-800 mb-10">رزرو نوبت و ارسال برنامه ورزشی</h2>
      <p className="text-xl lg:text-2xl font-normal text-gray-700 leading-relaxed mb-8">
        برای رزرو نوبت مشاوره ورزشی یا جلسه ماساژ، لطفاً فرم زیر را پر کنید یا با ما تماس بگیرید. همچنین می‌توانید برنامه ورزشی خود را از طریق دکمه زیر برای ما ارسال کنید.
      </p>
      <div className="bg-blue-50 p-8 rounded-2xl shadow-inner max-w-lg mx-auto border border-blue-200">
        <p className="text-lg font-semibold text-gray-600 mb-6">
          این بخش در آینده با یک سیستم رزرو آنلاین کامل‌تر خواهد شد.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg">
          تماس برای رزرو
        </button>

        <div className="mt-8 pt-8 border-t border-blue-300">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-4">ارسال برنامه ورزشی</h3>
          <p className="text-lg font-normal text-gray-700 mb-6">
            لطفاً برنامه ورزشی خود را از طریق دکمه زیر برای ما ارسال کنید.
          </p>
          <button
            onClick={handleGoToForm}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
          >
            ارسال برنامه ورزشی
          </button>
          {userId && (
            <p className="mt-4 text-xs text-gray-500">
              شناسه کاربری شما: <span className="font-mono text-blue-600 break-all">{userId}</span>
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

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newUserMessage = { role: "user", parts: [{ text: input }] };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = { contents: [...chatHistory, newUserMessage] };
      const apiKey = ""; // API key will be provided by Canvas runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const aiResponseText = result.candidates[0].content.parts[0].text;
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: aiResponseText }] }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "متاسفم، مشکلی در دریافت پاسخ از هوش مصنوعی رخ داد." }] }]);
        console.error("Unexpected API response structure:", result);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "متاسفم، خطایی در ارتباط با هوش مصنوعی رخ داد." }] }]);
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
    <div className="flex flex-col h-full"> {/* Changed section to div and set height to full */}
      <h3 className="text-3xl font-extrabold text-center text-blue-800 mb-6">مشاور هوش مصنوعی</h3> {/* Changed h2 to h3 for modal context */}
      <p className="text-lg font-normal text-gray-700 leading-relaxed mb-6 text-center">
        سوالات خود را در مورد ورزش، ماساژ، تغذیه و سلامتی از مشاور هوش مصنوعی ما بپرسید!
      </p>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 rounded-lg bg-gray-100 shadow-inner mb-4"> {/* Changed bg-white to bg-gray-100 */}
        {chatHistory.length === 0 && (
          <p className="text-gray-500 text-center italic">هنوز پیامی ارسال نشده است. سوال خود را بپرسید!</p>
        )}
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg shadow-sm bg-gray-200 text-gray-800 rounded-bl-none">
              <span className="animate-pulse">در حال فکر کردن...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="flex items-center space-x-2 mt-auto"> {/* mt-auto to push to bottom */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="سوال خود را اینجا بنویسید..."
          className="flex-grow p-3 border border-gray-300 rounded-full shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || input.trim() === ''}
          className={`py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 text-lg ${
            isLoading || input.trim() === ''
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300'
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
    <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl mb-16 border border-gray-200">
      <h2 className="text-4xl lg:text-5xl font-extrabold text-center text-blue-800 mb-10">تماس با ما</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Information */}
        <div className="bg-blue-50 p-8 rounded-2xl shadow-inner text-right border border-blue-200">
          <h3 className="text-3xl font-extrabold text-gray-900 mb-6">اطلاعات تماس</h3>
          <p className="text-lg font-semibold text-gray-700 mb-3">
            <strong className="text-blue-700">تلفن:</strong> 0912-XXX-XXXX
          </p>
          <p className="text-lg font-semibold text-gray-700 mb-3">
            <strong className="text-blue-700">ایمیل:</strong> info@sportmassage.com
          </p>
          <p className="text-lg font-semibold text-gray-700 mb-3">
            <strong className="text-blue-700">آدرس:</strong> [آدرس باشگاه], [شهر]، ایران
          </p>
          <p className="text-lg font-semibold text-gray-700 mt-6">
            ما در باشگاه [نام باشگاه] آماده خدمت‌رسانی به شما هستیم.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-teal-50 p-8 rounded-2xl shadow-inner border border-teal-200">
          <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6 text-right">ارسال پیام</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-semibold text-gray-700 text-right mb-2">نام شما:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
                placeholder="نام و نام خانوادگی"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-gray-700 text-right mb-2">ایمیل:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
                placeholder="ایمیل شما"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-semibold text-gray-700 text-right mb-2">پیام شما:</label>
              <textarea
                id="message"
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
                placeholder="پیام خود را اینجا بنویسید..."
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className={`w-full font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-300 text-lg ${
                submitStatus === 'loading'
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300'
              }`}
            >
              {submitStatus === 'loading' ? '...' : 'ارسال پیام'}
            </button>
            {submitStatus === 'success' && (
              <p className="mt-4 text-green-700 font-semibold">پیام شما با موفقیت ارسال شد!</p>
            )}
            {submitStatus === 'error' && (
              <p className="mt-4 text-red-700 font-semibold">خطا در ارسال پیام. لطفاً دوباره تلاش کنید.</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default App;

              setUserId(null); // Ensure userId is null on failure
            }
          }
          setIsAuthReady(true);
        });
        return () => unsubscribe(); // Cleanup listener
      } catch (err) {
        console.error("Firebase initialization error:", err);
        setAuthError(`Failed to initialize Firebase: ${err.message}`);
        setIsAuthReady(true); // Set to true to display error message
      }
    };

    initFirebase();
  }, []);

  // Handle reload action for auth errors
  const handleReload = () => {
    window.location.reload();
  };

  // AI Chat functions
  const handleSendAIChatMessage = async () => {
    if (aiInput.trim() === '') return;

    const newUserMessage = { role: "user", parts: [{ text: aiInput }] };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setAiInput('');
    setAiIsLoading(true);

    try {
      const payload = { contents: [...chatHistory, newUserMessage] };
      const apiKey = ""; // API key will be provided by Canvas runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const aiResponseText = result.candidates[0].content.parts[0].text;
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: aiResponseText }] }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "متاسفم، مشکلی در دریافت پاسخ از هوش مصنوعی رخ داد." }] }]);
        console.error("Unexpected API response structure:", result);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "متاسفم، خطایی در ارتباط با هوش مصنوعی رخ داد." }] }]);
    } finally {
      setAiIsLoading(false);
    }
  };

  const handleAiKeyPress = (e) => {
    if (e.key === 'Enter' && !aiIsLoading) {
      handleSendAIChatMessage();
    }
  };


  // Show loading or error states
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-blue-700">در حال بارگذاری سایت...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-700 text-white p-8 rounded-lg shadow-xl text-center max-w-sm">
          <h2 className="text-3xl font-bold mb-4">خطا</h2>
          <p className="text-lg mb-6">{authError}</p>
          <button
            onClick={handleReload}
            className="bg-white text-red-700 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-red-100 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
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
    <div className="min-h-screen bg-gray-50 font-inter text-gray-800">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-800 to-teal-600 py-2 px-6 shadow-xl rounded-b-3xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-white text-3xl md:text-4xl font-extrabold mb-2 md:mb-0">
            <span className="text-yellow-300">Erfan</span> <span className="text-white">Vakili</span>
          </div>
          <ul className="flex flex-wrap justify-center space-x-4 md:space-x-8">
            <li>
              <button
                onClick={() => setActiveTab('home')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'home' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                صفحه اصلی
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('about')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'about' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                درباره مربی
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('services')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'services' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                خدمات
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('booking')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'booking' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                رزرو نوبت
              </button>
            </li>
            {/* Removed AI Chat button from navigation */}
            <li>
              <button
                onClick={() => setActiveTab('contact')}
                className={`text-white text-lg font-bold py-2 px-6 rounded-full transition-colors duration-300 hover:bg-white hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  activeTab === 'contact' ? 'bg-blue-200 text-blue-900 shadow-md' : ''
                }`}
              >
                تماس با ما
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 py-10">
        {renderContent()}
      </main>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-50 flex items-center justify-center text-lg font-bold"
        style={{ width: '60px', height: '60px' }} // Fixed size for round button
      >
        {/* Chat icon - You can replace this with a better icon if desired */}
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      </button>

      {/* AI Chat Modal */}
      {isAIChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"> {/* Higher z-index */}
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 max-w-2xl h-5/6 flex flex-col relative">
            <button
              onClick={() => setIsAIChatOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold focus:outline-none"
            >
              &times; {/* Close button (X icon) */}
            </button>
            <AIChatSection 
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              aiInput={aiInput}
              setAiInput={setAiInput}
              aiIsLoading={aiIsLoading}
              handleSendAIChatMessage={handleSendAIChatMessage}
              handleAiKeyPress={handleAiKeyPress}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white p-6 mt-16 rounded-t-3xl shadow-inner">
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
  <section className="bg-gradient-to-br from-blue-100 to-white p-8 md:p-12 rounded-3xl shadow-2xl mb-16 border border-blue-200">
    <div className="flex flex-col items-center justify-center text-center">
      <div className="w-full">
        <h1 className="text-5xl lg:text-7xl font-extrabold text-blue-900 leading-tight mb-6 animate-fade-in-down">
          به دنیای <span className="text-teal-700">سلامتی</span> و <span className="text-yellow-600">انرژی</span> خوش آمدید!
        </h1>
        <p className="text-xl lg:text-2xl font-normal text-gray-700 leading-relaxed mb-8 animate-fade-in-up">
          با برنامه‌های ورزشی شخصی‌سازی شده و ماساژهای درمانی، به بهترین نسخه از خودتان تبدیل شوید.
        </p>
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg">
          رزرو نوبت همین حالا!
        </button>
      </div>
    </div>
  </section>
);

// About Coach Section Component
const AboutCoachSection = () => (
  <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl mb-16 border border-gray-200">
    <h2 className="text-4xl lg:text-5xl font-extrabold text-center text-blue-800 mb-10">درباره مربی</h2>
    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
      <div className="md:w-1/3 flex justify-center">
        <img
          src="https://placehold.co/350x350/B0E0E6/333333?text=تصویر+مربی"
          alt="تصویر مربی"
          className="rounded-full w-72 h-72 object-cover shadow-lg border-6 border-teal-500 transform hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/350x350/B0E0E6/333333?text=تصویر+مربی"; }}
        />
      </div>
      <div className="md:w-2/3 text-center md:text-right">
        <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">نام مربی: [نام مربی]</h3>
        <p className="text-lg lg:text-xl font-normal text-gray-700 leading-relaxed mb-6">
          [نام مربی] با بیش از ۱۰ سال تجربه در زمینه مربیگری ورزشی و ماساژ درمانی، متعهد به کمک به شما برای رسیدن به اهداف سلامتی و تناسب اندامتان است. او دارای مدارک معتبر در فیزیولوژی ورزشی و تکنیک‌های مختلف ماساژ است و با رویکردی جامع و شخصی‌سازی شده، بهترین نتایج را برای شما به ارمغان می‌آورد.
        </p>
        <p className="text-lg lg:text-xl font-normal text-gray-700 leading-relaxed">
          فلسفه [نام مربی] بر پایه تعادل بین فعالیت بدنی، آرامش ذهنی و تغذیه سالم استوار است. او معتقد است که هر فرد منحصربه‌فرد است و برنامه‌های او نیز بر اساس نیازها و اهداف خاص هر مراجعه‌کننده طراحی می‌شوند.
        </p>
      </div>
    </div>
  </section>
);

// Services Section Component
const ServicesSection = () => (
  <section className="bg-gradient-to-br from-white to-blue-100 p-8 md:p-12 rounded-3xl shadow-2xl mb-16 border border-blue-200">
    <h2 className="text-4xl lg:text-5xl font-extrabold text-center text-blue-800 mb-10">خدمات ما</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Sports Services Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-blue-300">
        <div className="flex items-center justify-center mb-6">
          <svg className="w-20 h-20 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 100-18 9 9 0 000 18z"></path>
          </svg>
        </div>
        <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6">برنامه‌های ورزشی</h3>
        <ul className="list-disc list-inside text-lg font-semibold text-gray-700 space-y-3 text-right">
          <li>طراحی برنامه تمرینی شخصی‌سازی شده (قدرتی، استقامتی، کاهش وزن)</li>
          <li>چکاپ و ارزیابی پیشرفت برنامه</li>
          <li>مشاوره تغذیه ورزشی</li>
          <li>تمرینات اصلاحی و پیشگیری از آسیب</li>
        </ul>
      </div>

      {/* Massage Services Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-teal-300">
        <div className="flex items-center justify-center mb-6">
          <svg className="w-20 h-20 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6">خدمات ماساژ</h3>
        <ul className="list-disc list-inside text-lg font-semibold text-gray-700 space-y-3 text-right">
          <li>ماساژ ریلکسی و آرامش‌بخش</li>
          <li>ماساژ ورزشی (قبل و بعد از تمرین)</li>
          <li>ماساژ درمانی (کاهش درد عضلانی، بهبود گردش خون)</li>
          <li>ماساژ با سنگ داغ و روغن‌های معطر</li>
        </ul>
      </div>
    </div>
  </section>
);

// Booking Section Component - Now embeds Google Form for file upload
const BookingSection = ({ db, userId }) => {
  const handleGoToForm = () => {
    window.open('https://forms.gle/zG3FjXZyDq7VahER6', '_blank'); // Open form in a new tab
  };

  return (
    <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl mb-16 text-center border border-gray-200">
      <h2 className="text-4xl lg:text-5xl font-extrabold text-blue-800 mb-10">رزرو نوبت و ارسال برنامه ورزشی</h2>
      <p className="text-xl lg:text-2xl font-normal text-gray-700 leading-relaxed mb-8">
        برای رزرو نوبت مشاوره ورزشی یا جلسه ماساژ، لطفاً فرم زیر را پر کنید یا با ما تماس بگیرید. همچنین می‌توانید برنامه ورزشی خود را از طریق دکمه زیر برای ما ارسال کنید.
      </p>
      <div className="bg-blue-50 p-8 rounded-2xl shadow-inner max-w-lg mx-auto border border-blue-200">
        <p className="text-lg font-semibold text-gray-600 mb-6">
          این بخش در آینده با یک سیستم رزرو آنلاین کامل‌تر خواهد شد.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg">
          تماس برای رزرو
        </button>

        <div className="mt-8 pt-8 border-t border-blue-300">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-4">ارسال برنامه ورزشی</h3>
          <p className="text-lg font-normal text-gray-700 mb-6">
            لطفاً برنامه ورزشی خود را از طریق دکمه زیر برای ما ارسال کنید.
          </p>
          <button
            onClick={handleGoToForm}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
          >
            ارسال برنامه ورزشی
          </button>
          {userId && (
            <p className="mt-4 text-xs text-gray-500">
              شناسه کاربری شما: <span className="font-mono text-blue-600 break-all">{userId}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

// AI Chat Section Component - New component for AI chatbot
const AIChatSection = ({ chatHistory, setChatHistory, aiInput, setAiInput, aiIsLoading, handleSendAIChatMessage, handleAiKeyPress }) => {
  return (
    <div className="flex flex-col h-full"> {/* Changed section to div and set height to full */}
      <h3 className="text-3xl font-extrabold text-center text-blue-800 mb-6">مشاور هوش مصنوعی</h3> {/* Changed h2 to h3 for modal context */}
      <p className="text-lg font-normal text-gray-700 leading-relaxed mb-6 text-center">
        سوالات خود را در مورد ورزش، ماساژ، تغذیه و سلامتی از مشاور هوش مصنوعی ما بپرسید!
      </p>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 rounded-lg bg-gray-100 shadow-inner mb-4"> {/* Changed bg-white to bg-gray-100 */}
        {chatHistory.length === 0 && (
          <p className="text-gray-500 text-center italic">هنوز پیامی ارسال نشده است. سوال خود را بپرسید!</p>
        )}
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {aiIsLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg shadow-sm bg-gray-200 text-gray-800 rounded-bl-none">
              <span className="animate-pulse">در حال فکر کردن...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="flex items-center space-x-2 mt-auto"> {/* mt-auto to push to bottom */}
        <input
          type="text"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyPress={handleAiKeyPress}
          placeholder="سوال خود را اینجا بنویسید..."
          className="flex-grow p-3 border border-gray-300 rounded-full shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
          disabled={aiIsLoading}
        />
        <button
          onClick={handleSendAIChatMessage}
          disabled={aiIsLoading || aiInput.trim() === ''}
          className={`py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 text-lg ${
            aiIsLoading || aiInput.trim() === ''
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300'
          }`}
        >
          {aiIsLoading ? '...' : 'ارسال'}
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
    const appId = process.env.REACT_APP_APP_ID || 'default-app-id'; // Use process.env for Netlify

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
    <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl mb-16 border border-gray-200">
      <h2 className="text-4xl lg:text-5xl font-extrabold text-center text-blue-800 mb-10">تماس با ما</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Information */}
        <div className="bg-blue-50 p-8 rounded-2xl shadow-inner text-right border border-blue-200">
          <h3 className="text-3xl font-extrabold text-gray-900 mb-6">اطلاعات تماس</h3>
          <p className="text-lg font-semibold text-gray-700 mb-3">
            <strong className="text-blue-700">تلفن:</strong> 0912-XXX-XXXX
          </p>
          <p className="text-lg font-semibold text-gray-700 mb-3">
            <strong className="text-blue-700">ایمیل:</strong> info@sportmassage.com
          </p>
          <p className="text-lg font-semibold text-gray-700 mb-3">
            <strong className="text-blue-700">آدرس:</strong> [آدرس باشگاه], [شهر]، ایران
          </p>
          <p className="text-lg font-semibold text-gray-700 mt-6">
            ما در باشگاه [نام باشگاه] آماده خدمت‌رسانی به شما هستیم.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-teal-50 p-8 rounded-2xl shadow-inner border border-teal-200">
          <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6 text-right">ارسال پیام</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-semibold text-gray-700 text-right mb-2">نام شما:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
                placeholder="نام و نام خانوادگی"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-gray-700 text-right mb-2">ایمیل:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
                placeholder="ایمیل شما"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-semibold text-gray-700 text-right mb-2">پیام شما:</label>
              <textarea
                id="message"
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
                placeholder="پیام خود را اینجا بنویسید..."
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className={`w-full font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-300 text-lg ${
                submitStatus === 'loading'
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300'
              }`}
            >
              {submitStatus === 'loading' ? 'در حال ارسال...' : 'ارسال پیام'}
            </button>
            {submitStatus === 'success' && (
              <p className="mt-4 text-green-700 font-semibold">پیام شما با موفقیت ارسال شد!</p>
            )}
            {submitStatus === 'error' && (
              <p className="mt-4 text-red-700 font-semibold">خطا در ارسال پیام. لطفاً دوباره تلاش کنید.</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default App;
