import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, History, Upload, CheckCircle2, AlertCircle, Info, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { patientApi } from '../api';

const PatientDashboard = () => {
    const [reports, setReports] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [image, setImage] = useState(null);
    const [base64, setBase64] = useState('');
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await patientApi.getReports();
            setReports(res.data);
        } catch (err) {
            console.error("Failed to fetch reports");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
            const reader = new FileReader();
            reader.onloadend = () => setBase64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const runAnalysis = async () => {
        if (!base64) return;
        setAnalyzing(true);
        try {
            await patientApi.analyze(base64);
            setImage(null);
            setBase64('');
            setActiveTab('history');
            fetchReports();
        } catch (err) {
            if (err.response?.status === 401) {
                alert("Session expired. Please log in again.");
                navigate('/login');
            } else {
                alert("Analysis failed. Please check backend connection.");
            }
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="pt-24 px-4 max-w-6xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Patient <span className="text-primary">Portal</span></h1>
                    <p className="text-slate-400">Track your skin health with AI precision</p>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'new' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        New Scan
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'new' ? (
                    <motion.div
                        key="new"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-full max-w-2xl glass-card p-12 flex flex-col items-center text-center">
                            {!image ? (
                                <>
                                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                        <Camera className="w-10 h-10 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-4">Analyze New Image</h2>
                                    <p className="text-slate-400 mb-8">Upload a clear photo of the skin area for instant AI analysis.</p>
                                    <label className="btn-primary cursor-pointer flex items-center">
                                        <Upload className="mr-2 w-5 h-5" /> Choose Photo
                                        <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </>
                            ) : (
                                <div className="w-full">
                                    <img src={image} className="w-full h-80 object-cover rounded-2xl mb-8 border-4 border-white/10" alt="Preview" />
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={() => setImage(null)}
                                            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={runAnalysis}
                                            disabled={analyzing}
                                            className="btn-primary px-8 py-3 flex items-center justify-center min-w-[160px]"
                                        >
                                            {analyzing ? <Clock className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                            {analyzing ? 'Analyzing...' : 'Run Analysis'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {reports.length === 0 ? (
                            <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                                <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500">No scan history found yet.</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <div key={report._id} className="glass-card overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                                    <div className="space-y-4">
                                        <div className="aspect-square rounded-xl overflow-hidden border border-white/5">
                                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 px-2">Original Image</div>
                                            <img src={report.image_data} className="w-full h-full object-cover" alt="Scan" />
                                        </div>
                                        {report.analysis.heatmap && (
                                            <div className="aspect-square rounded-xl overflow-hidden border border-primary/20 bg-primary/5">
                                                <div className="text-[10px] uppercase font-bold text-primary mb-1 px-2">AI Focus Map (Grad-CAM)</div>
                                                <img src={report.analysis.heatmap} className="w-full h-full object-cover" alt="Heatmap" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-3 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-2xl font-bold">{report.analysis.disease_name}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${report.analysis.severity === 'High' ? 'bg-accent/20 text-accent' :
                                                        report.analysis.severity === 'Medium' ? 'bg-amber-500/20 text-amber-500' :
                                                            'bg-primary/20 text-primary'
                                                        }`}>
                                                        {report.analysis.severity} Risk
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 capitalize">
                                                    Scanned on {new Date(report.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500 uppercase font-bold">Confidence</div>
                                                <div className="text-2xl font-mono text-primary">{(report.analysis.confidence * 100).toFixed(1)}%</div>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-start gap-2 mb-2">
                                                <Info className="w-4 h-4 text-primary mt-1 shrink-0" />
                                                <p className="text-sm text-slate-300 italic">"{report.analysis.description}"</p>
                                            </div>
                                            <div className="flex items-start gap-2 mb-2">
                                                <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                                                <p className="text-sm font-medium text-slate-200">{report.analysis.recommendation}</p>
                                            </div>
                                            {report.analysis.suggestions && (
                                                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-white/10">
                                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                                                    <p className="text-sm font-medium text-slate-200">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px] mr-2">Care Suggestions</span>
                                                        {report.analysis.suggestions}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {report.analysis.features && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {Object.entries(report.analysis.features).map(([key, value]) => (
                                                    <div key={key} className="bg-slate-900/80 border border-white/5 p-2 rounded-lg text-center">
                                                        <div className="text-[10px] uppercase text-slate-500 font-bold">{key.replace('_', ' ')}</div>
                                                        <div className="text-sm font-mono text-white">{value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Doctor Reviews */}
                                        <div className="mt-4 border-t border-white/10 pt-4">
                                            <h4 className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2 mb-3">
                                                <MessageSquare className="w-4 h-4" /> Dermatologist Feedback
                                            </h4>
                                            {report.reviews && report.reviews.length > 0 ? (
                                                report.reviews.map((rev, i) => (
                                                    <div key={i} className="bg-primary/5 border border-primary/10 p-4 rounded-xl mb-2">
                                                        <p className="text-slate-200 mb-2">{rev.content}</p>
                                                        <div className="text-xs text-primary font-bold">Dr. {rev.doctor_name} • {new Date(rev.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-500 text-sm py-2 px-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                                    <Clock className="w-4 h-4" /> Awaiting professional review...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PatientDashboard;
