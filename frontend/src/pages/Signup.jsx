import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ShieldCheck, Stethoscope, Loader2 } from 'lucide-react';
import { authApi } from '../api';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authApi.signup(formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-card p-10 w-full max-w-lg"
            >
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                    <p className="text-slate-400">Choose your role and get started</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'patient' })}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'patient'
                                    ? 'border-primary bg-primary/10 text-white'
                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                                }`}
                        >
                            <ShieldCheck className={`w-8 h-8 ${formData.role === 'patient' ? 'text-primary' : ''}`} />
                            <span className="font-bold">Patient</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'dermatologist' })}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'dermatologist'
                                    ? 'border-secondary bg-secondary/10 text-white'
                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                                }`}
                        >
                            <Stethoscope className={`w-8 h-8 ${formData.role === 'dermatologist' ? 'text-secondary' : ''}`} />
                            <span className="font-bold">Doctor</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-accent text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-xl ${formData.role === 'patient'
                                ? 'bg-primary shadow-primary/20 hover:shadow-primary/40'
                                : 'bg-secondary shadow-secondary/20 hover:shadow-secondary/40'
                            } text-white`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <UserPlus className="mr-2 w-5 h-5" /> Sign Up
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400">
                    Already have an account? {' '}
                    <Link to="/login" className="text-primary hover:underline font-semibold">Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
