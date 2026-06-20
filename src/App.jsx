import { useState, useEffect, useRef } from 'react'
import { TodoProvider } from './contexts'
import './App.css'
import TodoForm from './components/TodoForm'
import TodoItem from './components/TodoItem'
import Login from './components/Login' // 🌟 1. Import Login Component

function App() {
  const [user, setUser] = useState(null) // 🌟 2. Added User State
  const [todos, setTodos] = useState([])
  const [showNotification, setShowNotification] = useState(false)
  const [notes, setNotes] = useState([])
  const [noteInput, setNoteInput] = useState("")
  const [quote, setQuote] = useState("Loading your daily motivation...")
  const [author, setAuthor] = useState("")

  // 🔥 Gamification States
  const [streak, setStreak] = useState(0)
  const [lastCompletedDate, setLastCompletedDate] = useState("")
  const [rewardBadge, setRewardBadge] = useState("👶 Beginner")

  // ⏰ Timer, Screen On & Nature Sounds States
  const [timeLeft, setTimeLeft] = useState("24:00:00")
  const [isScreenOn, setIsScreenOn] = useState(false)
  const [activeSound, setActiveSound] = useState(null)

  // Refs for Audio and WakeLock
  const audioContextRef = useRef(null)
  const soundNodesRef = useRef([])
  const wakeLockRef = useRef(null)

  const addTodo = (todo) => setTodos((prev) => [{id: Date.now(), ...todo}, ...prev] )
  const updateTodo = (id, todo) => setTodos((prev) => prev.map((t) => (t.id === id ? todo : t )))
  const deleteTodo = (id) => setTodos((prev) => prev.filter((t) => t.id !== id))
  const toggleComplete = (id) => setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))
  
  const addNote = (e) => {
    e.preventDefault()
    if (!noteInput.trim()) return
    setNotes((prev) => [{id: Date.now(), text: noteInput}, ...prev])
    setNoteInput("")
  }
  const deleteNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id))

  const handleResetAll = () => {
    if (window.confirm("क्या आप वाकई अपना सारा डेटा डिलीट करना चाहते हैं?")) {
      setTodos([]); setNotes([]); setStreak(0); setLastCompletedDate(""); setRewardBadge("👶 Beginner")
      localStorage.clear()
      setUser(null) // Clear user out on hard reset
    }
  }

  // --- ⏰ Live Countdown Timer ---
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)

      const diff = midnight - now

      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        if (todos.some(t => !t.completed)) {
          setShowNotification(true)
          playBeepSound()
          setStreak(0)
        }
      }

      const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0')
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0')
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0')
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [todos])

  // --- 👁️ Keep Screen On (Wake Lock) ---
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isScreenOn) {
        try { wakeLockRef.current = await navigator.wakeLock.request('screen') } 
        catch (err) { console.error(err) }
      }
    }
    const releaseWakeLock = async () => {
      if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null }
    }
    if (isScreenOn) requestWakeLock()
    else releaseWakeLock()
    return () => { releaseWakeLock() }
  }, [isScreenOn])

  // --- 🎵 Web Audio API Engines ---
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  const stopCurrentSound = () => {
    soundNodesRef.current.forEach(node => { try { node.stop() } catch(e){} })
    soundNodesRef.current = []
    setActiveSound(null)
  }

  const playBeepSound = () => {
    initAudio()
    const osc = audioContextRef.current.createOscillator()
    const gain = audioContextRef.current.createGain()
    osc.connect(gain); gain.connect(audioContextRef.current.destination)
    osc.frequency.setValueAtTime(600, audioContextRef.current.currentTime)
    gain.gain.setValueAtTime(0.5, audioContextRef.current.currentTime)
    osc.start(); setTimeout(() => { osc.stop() }, 1000)
  }

  const playAmbientSound = (type) => {
    initAudio()
    stopCurrentSound()
    setActiveSound(type)

    const ctx = audioContextRef.current
    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1 }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    const filter = ctx.createBiquadFilter()
    const mainGain = ctx.createGain()

    if (type === 'rain') {
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(400, ctx.currentTime)
      mainGain.gain.setValueAtTime(0.15, ctx.currentTime)
      whiteNoise.connect(filter); filter.connect(mainGain); mainGain.connect(ctx.destination)
      whiteNoise.start()
      soundNodesRef.current.push(whiteNoise)
    } 
    else if (type === 'river') {
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(300, ctx.currentTime)
      mainGain.gain.setValueAtTime(0.2, ctx.currentTime)
      whiteNoise.connect(filter); filter.connect(mainGain); mainGain.connect(ctx.destination)
      whiteNoise.start()
      soundNodesRef.current.push(whiteNoise)
    } 
    else if (type === 'birds') {
      mainGain.gain.setValueAtTime(0.05, ctx.currentTime)
      mainGain.connect(ctx.destination)
      const chirpInterval = setInterval(() => {
        if (audioContextRef.current?.state === 'closed') return
        const osc = ctx.createOscillator()
        const oscGain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(2500 + Math.random() * 1000, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1)
        oscGain.gain.setValueAtTime(0.05, ctx.currentTime)
        oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
        osc.connect(oscGain); oscGain.connect(mainGain)
        osc.start(); osc.stop(ctx.currentTime + 0.1)
      }, 800)
      soundNodesRef.current.push({ stop: () => clearInterval(chirpInterval) })
    }
  }

  // Initial Sync from LocalStorage
  useEffect(() => {
    const savedTodos = JSON.parse(localStorage.getItem("todos"))
    if (savedTodos) setTodos(savedTodos)
    const savedNotes = JSON.parse(localStorage.getItem("notes"))
    if (savedNotes) setNotes(savedNotes)
    const savedStreak = localStorage.getItem("streak")
    if (savedStreak) setStreak(parseInt(savedStreak))
    const savedDate = localStorage.getItem("lastCompletedDate")
    if (savedDate) setLastCompletedDate(savedDate)
    
    // 🌟 Check if User Session Profile Exists
    const savedUser = JSON.parse(localStorage.getItem("todo_user"))
    if (savedUser) setUser(savedUser)

    const fetchQuote = async () => {
      try {
        const response = await fetch('https://dummyjson.com/quotes/random')
        const data = await response.json()
        if (data && data.quote) { setQuote(data.quote); setAuthor(data.author) }
      } catch (e) { setQuote("The secret of getting ahead is getting started."); setAuthor("Mark Twain") }
    }
    fetchQuote()
  }, [])

  useEffect(() => { localStorage.setItem("todos", JSON.stringify(todos)) }, [todos])
  useEffect(() => { localStorage.setItem("notes", JSON.stringify(notes)) }, [notes])

  // 🌟 Authentication Event Utilities
  const handleLoginSuccess = (userData) => {
    localStorage.setItem("todo_user", JSON.stringify(userData));
    setUser(userData);
  }

  const handleLogout = () => {
    localStorage.removeItem("todo_user");
    stopCurrentSound();
    setUser(null);
  }

  const totalTodos = todos.length
  const completedTodos = todos.filter(t => t.completed).length
  const progressPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  // 🌟 3. Guard Render Loop: Show motivating login view if user profile is absent
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <TodoProvider value={{todos, addTodo, updateTodo, deleteTodo, toggleComplete}}>
      <div className="bg-[#172842] min-h-screen py-8 relative text-white" onClick={initAudio}>
        
        {/* Notification Popup */}
        {showNotification && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 px-4">
            <div className="bg-slate-800 border border-red-500 rounded-lg p-6 max-w-md w-full text-center shadow-lg">
              <span className="text-4xl">⚠️</span>
              <h2 className="text-xl font-bold text-red-400 mt-2">दिन खत्म हो गया!</h2>
              <p className="text-white/80 mt-2">लेकिन आपका टास्क अभी भी पेंडिंग है। स्ट्रीक रिसेट हो गई!</p>
              <button onClick={() => setShowNotification(false)} className="mt-4 px-5 py-2 bg-red-600 text-white rounded-md font-semibold">ठीक है</button>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto px-4 flex flex-col gap-6">
          
          {/* 🌟 USER BANNER WITH SIGN-OUT BUTTON */}
          <div className="w-full bg-slate-900/40 border border-white/10 p-4 rounded-xl shadow-md flex justify-between items-center gap-4">
            <div>
              <p className="text-xs text-amber-400 font-bold tracking-wide uppercase">Workspace Active</p>
              <h2 className="text-lg font-bold text-white">Let's crush today's objectives, {user.name}!</h2>
              <p className="text-[11px] text-gray-400 font-mono">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          {/* ⏰ 1. HIGHLIGHTED ALARM & COUNTDOWN BOX */}
          <div className="w-full bg-blue-900/40 border-2 border-blue-500/40 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">⏰</span>
              <div>
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide">Time Until Day Ends / Beep Alarm</h4>
                <p className="text-2xl font-mono font-black text-blue-300 tracking-wider">{timeLeft}</p>
              </div>
            </div>
            <label className="flex items-center gap-2 bg-purple-600/30 border border-purple-500/40 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold select-none">
              <input 
                type="checkbox" 
                checked={isScreenOn} 
                onChange={(e) => setIsScreenOn(e.target.checked)}
                className="cursor-pointer accent-purple-500 w-4 h-4"
              />
              <span>{isScreenOn ? "💡 Screen Always ON" : "💤 Normal Screen"}</span>
            </label>
          </div>

          {/* 📊 STREAK & PROGRESS DASHBOARD */}
          <div className="w-full bg-slate-900/60 p-5 rounded-xl border border-white/10 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              <div className="text-center bg-orange-600/20 border border-orange-500/30 px-4 py-2 rounded-lg">
                <p className="text-xs text-orange-400 font-bold uppercase">Streak</p>
                <p className="text-2xl font-black text-orange-500">🔥 {streak} Days</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-yellow-500 font-bold uppercase">Current Reward</p>
                <p className="text-sm font-bold text-white">{rewardBadge}</p>
              </div>
              <button onClick={handleResetAll} className="px-3 py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all">
                🔄 Reset Data
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full md:w-1/3 text-right">
              <span className="text-xs font-bold text-green-400">{progressPercentage}% Completed</span>
              <div className="w-full bg-gray-700 h-2 rounded-full mt-1 overflow-hidden border border-white/5">
                <div className="bg-green-500 h-full duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          </div>

          {/* 🌿 NATURE SOUNDS CONTROLLER */}
          <div className="w-full bg-slate-900/40 px-4 py-3 rounded-xl border border-white/10 shadow-md flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <span>🎧</span> Study Ambient Modes:
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <button 
                onClick={() => activeSound === 'rain' ? stopCurrentSound() : playAmbientSound('rain')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSound === 'rain' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/70 hover:bg-slate-700'}`}
              >
                🌧️ Rain
              </button>
              <button 
                onClick={() => activeSound === 'birds' ? stopCurrentSound() : playAmbientSound('birds')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSound === 'birds' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-white/70 hover:bg-slate-700'}`}
              >
                🐦 Birds
              </button>
              <button 
                onClick={() => activeSound === 'river' ? stopCurrentSound() : playAmbientSound('river')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSound === 'river' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white/70 hover:bg-slate-700'}`}
              >
                🌊 River
              </button>
              {activeSound && (
                <button onClick={stopCurrentSound} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">
                  ⏹️ Stop
                </button>
              )}
            </div>
          </div>

          {/* 📜 QUOTE OF THE DAY */}
          <div className="w-full bg-slate-900/30 p-4 rounded-xl border border-white/10 shadow-md text-center">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 mb-1">✨ Quote of the Day</h3>
            <p className="text-base italic">"{quote}"</p>
            {author && <p className="text-xs text-white/50 mt-1">— {author}</p>}
          </div>

          {/* MAIN WORKSPACE */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* LEFT SIDE: TODO SECTION */}
            <div className="flex-1 bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-md">
              <h1 className="text-2xl font-bold text-center mb-6 text-green-400">Manage Your Todos</h1>
              <div className="mb-4"><TodoForm /></div>
              <div className="flex flex-col gap-y-3">
                {todos.map((todo) => (
                  <div key={todo.id} className='w-full'><TodoItem todo={todo} /></div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: NOTES SECTION */}
            <div className="w-full md:w-80 bg-slate-900/60 p-4 rounded-xl border border-white/10 shadow-md flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-yellow-400">📝 Important Notes</h2>
              <form onSubmit={addNote} className="flex mb-4">
                <input
                  type="text"
                  placeholder="Add a quick note..."
                  className="w-full border border-black/10 rounded-l-lg px-3 bg-white/20 py-1.5 text-white outline-none"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
                <button type="submit" className="rounded-r-lg px-3 py-1 bg-yellow-600 text-white font-bold">+</button>
              </form>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
                {notes.length === 0 ? (
                  <p className="text-sm text-white/40 text-center italic mt-4">No notes added yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="flex justify-between items-start bg-white/10 p-2 rounded-lg border border-white/5 group">
                      <p className="text-sm break-all text-white/90">{note.text}</p>
                      <button onClick={() => deleteNote(note.id)} className="text-xs text-red-400 ml-2">🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </TodoProvider>
  )
}

export default App