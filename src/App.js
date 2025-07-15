import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
// eslint-disable-next-line no-unused-vars
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, where, addDoc, deleteDoc } from 'firebase/firestore'; 

function App() {
  const [db, setDb] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [auth, setAuth] = useState(null); // ESLint will now ignore this line for 'no-unused-vars'
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Check if firebaseConfig is provided as an environment variable
        const firebaseConfigString = process.env.REACT_APP_FIREBASE_CONFIG;
        if (!firebaseConfigString) {
          throw new Error("REACT_APP_FIREBASE_CONFIG environment variable is not set.");
        }
        const firebaseConfig = JSON.parse(firebaseConfigString);

        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        // Listen for auth state changes
        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            // Sign in anonymously if no user is logged in
            try {
              const initialAuthToken = process.env.REACT_APP_INITIAL_AUTH_TOKEN;
              if (initialAuthToken) {
                await signInWithCustomToken(firebaseAuth, initialAuthToken);
              } else {
                await signInAnonymously(firebaseAuth);
              }
            } catch (anonError) {
              console.error("Anonymous sign-in failed:", anonError);
              setError("Failed to sign in anonymously. Please try again.");
            }
          }
          setIsAuthReady(true);
        });
      } catch (err) {
        console.error("Firebase initialization error:", err);
        setError(`Failed to initialize Firebase: ${err.message}`);
      }
    };

    initFirebase();
  }, []);

  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    // Use process.env.REACT_APP_APP_ID directly here
    const appId = process.env.REACT_APP_APP_ID; // This line is now explicitly defined and used
    const messagesCollectionRef = collection(db, `artifacts/${appId}/public/data/messages`);
    const q = query(messagesCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort messages by timestamp if available, otherwise keep original order
      fetchedMessages.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
      setMessages(fetchedMessages);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages.");
    });

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  const handleSendMessage = async () => {
    if (!message.trim() || !db || !userId) {
      setError("Message cannot be empty or Firebase not initialized.");
      return;
    }

    try {
      // Use process.env.REACT_APP_APP_ID directly here
      const appId = process.env.REACT_APP_APP_ID;
      await addDoc(collection(db, `artifacts/${appId}/public/data/messages`), {
        text: message,
        userId: userId,
        timestamp: new Date()
      });
      setMessage('');
      setError('');
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to send message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!db || !userId) {
      setError("Firebase not initialized.");
      return;
    }
    try {
      // Check if the current user is the owner of the message
      const appId = process.env.REACT_APP_APP_ID;
      const messageRef = doc(db, `artifacts/${appId}/public/data/messages`, messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists() && messageSnap.data().userId === userId) {
        await deleteDoc(messageRef);
        setError('');
      } else {
        setError("You can only delete your own messages.");
      }
    } catch (e) {
      console.error("Error deleting document: ", e);
      setError("Failed to delete message.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-red-700 p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4"></div>
          <h2 className="text-2xl font-semibold">Loading...</h2>
          <p className="text-gray-400">Initializing Firebase and authenticating user.</p>
        </div>
        <style>{`
          .loader {
            border-top-color: #3498db;
            -webkit-animation: spinner 1.5s linear infinite;
            animation: spinner 1.5s linear infinite;
          }
          @-webkit-keyframes spinner {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
          }
          @keyframes spinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-inter">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          World Olympiads Chat
        </h1>
        {userId && (
          <p className="text-sm text-gray-400 text-center mb-4">
            Your User ID: <span className="font-mono text-blue-300">{userId}</span>
          </p>
        )}

        <div className="flex flex-col space-y-4 h-80 overflow-y-auto mb-6 p-3 bg-gray-700 rounded-md scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-600">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet. Be the first to send one!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg shadow-md break-words ${
                  msg.userId === userId
                    ? 'bg-blue-600 self-end text-right'
                    : 'bg-gray-600 self-start text-left'
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {msg.userId === userId ? 'You' : `User: ${msg.userId.substring(0, 8)}...`}
                </p>
                <p className="text-lg">{msg.text}</p>
                {msg.timestamp && (
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString()}
                  </p>
                )}
                {msg.userId === userId && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="mt-2 text-red-300 hover:text-red-400 text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex space-x-3">
          <input
            type="text"
            className="flex-1 p-3 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
