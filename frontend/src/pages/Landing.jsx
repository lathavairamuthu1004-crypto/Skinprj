import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Search, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="pt-24 pb-12 overflow-hidden">
            {/* Hero Section */}
            <section className="relative px-4 max-w-7xl mx-auto text-center">
                {/* Background Gradients */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary opacity-10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary opacity-10 blur-[100px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
                        Advanced Dermatology AI
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                        Your Skin's Best <br />
                        <span className="gradient-text">Guardian is Here</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        Detect 25+ skin conditions instantly with 98.4% precision. Bridge the gap between AI diagnostics and expert clinical review.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            className="px-8 py-4 bg-primary text-white rounded-xl text-lg font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center group"
                        >
                            Start Free Diagnosis
                            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-lg font-bold hover:bg-white/10 transition-all"
                        >
                            Log in as Professional
                        </Link>
                    </div>
                </motion.div>

                {/* Floating Stats */}
                <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: 'Diseases Detected', value: '25+', icon: Search },
                        { label: 'Accuracy Rate', value: '98.4%', icon: Zap },
                        { label: 'Licensed Doctors', value: '500+', icon: Shield },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="glass-card p-8 text-center"
                        >
                            <stat.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                            <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                            <p className="text-slate-400 font-medium">{stat.label}</p>
                        </motion.div>
                    ))}
                </section>
            </section>

            {/* Features Section */}
            <section className="mt-32 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Precision Meets Expertise</h2>
                    <p className="text-slate-400">The most comprehensive AI toolkit for patients and dermatologists.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        className="space-y-6"
                    >
                        {[
                            "Real-time visual analysis of 25+ skin disorders",
                            "Instant severity assessment & recommendations",
                            "Secure document sharing with board-certified doctors",
                            "Clinical review cycle with expert dermatologist feedback"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start space-x-4">
                                <div className="mt-1 bg-primary/20 p-1 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-lg font-medium text-slate-300">{feature}</p>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-primary blur-[80px] opacity-20" />
                        <div className="glass-card aspect-video flex items-center justify-center overflow-hidden border-primary/20">
                            <div className="animate-pulse text-primary font-mono">
                                &lt;DR_REVIEW_MODULE_INITIALIZING...&gt;
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
