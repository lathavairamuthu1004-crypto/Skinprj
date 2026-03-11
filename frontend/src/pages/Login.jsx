import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await authApi.login(formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);

            // Decode JWT to get role (simple base64 decode for now or fetch profile)
            const payload = JSON.parse(atob(access_token.split('.')[1]));
            localStorage.setItem('role', payload.role);
            localStorage.setItem('email', payload.sub);
            localStorage.setItem('name', payload.sub.split('@')[0]); // Fallback name

            if (payload.role === 'patient') {
                navigate('/patient');
            } else {
                navigate('/doctor');
            }
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card p-10 w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                    <p className="text-slate-400">Access your dermatology portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
                                placeholder="name@example.com"
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && <p className="text-accent text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 font-bold flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                Sign In <ArrowRight className="ml-2 w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400">
                    Don't have an account? {' '}
                    <Link to="/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
