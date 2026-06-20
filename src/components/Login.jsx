import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && email.trim()) {
            onLoginSuccess({ name, email });
        }
    };

    return (
        <div className="min-h-screen bg-[#172842] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-slate-900/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 backdrop-blur-md">
                
                {/* Left Side: Motivational & Student/Goal Aesthetic */}
                <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 via-emerald-600 to-amber-500 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    {/* Decorative glowing gradient accents */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-xl"></div>

                    <div>
                        <span className="bg-white/20 text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-sm">
                            🎓 Student Focus & Goal Engine
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold mt-6 tracking-tight leading-tight">
                            Build Your Routine. <br /> Achieve Your Goals.
                        </h1>
                        <p className="text-indigo-100 mt-4 text-sm leading-relaxed">
                            Stay locked into your studies, turn ambient nature background frequencies on, guard your calendar streaks, and smash every single milestone.
                        </p>
                    </div>

                    {/* Bottom Feature Pill */}
                    <div className="mt-12 md:mt-0 border-l-4 border-amber-400 pl-4 py-2 bg-black/20 rounded-r-lg backdrop-blur-xs">
                        <p className="italic text-xs text-gray-200">
                            "The expert in anything was once a beginner."
                        </p>
                        <span className="text-[10px] text-amber-300 font-semibold block mt-1">— Study Hard, Dream Big</span>
                    </div>
                </div>

                {/* Right Side: Form Section */}
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-slate-900/40">
                    <h2 className="text-2xl font-bold text-white mb-1">Welcome, Achiever!</h2>
                    <p className="text-gray-400 text-xs mb-8">Enter your profile information to initialize your task workspace.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Input */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Your Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Rohan Sharma"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[#172842] text-white border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition placeholder-gray-600 text-sm"
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="name@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[#172842] text-white border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition placeholder-gray-600 text-sm"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-[0.98] cursor-pointer text-sm"
                        >
                            Unlock My Productivity Board
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-gray-500 mt-6">
                        We'll securely anchor your email parameters locally.
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Login;