import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, ClipboardList, Send, CheckCircle, Search, Calendar, UserCheck } from 'lucide-react';
import { doctorApi } from '../api';

const DoctorDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await doctorApi.getPatients();
            setReports(res.data);
        } catch (err) {
            console.error("Failed to fetch patients");
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText) return;
        setSubmitting(true);
        try {
            await doctorApi.addReview(selectedReport._id, reviewText);
            setReviewText('');
            setSelectedReport(null);
            fetchPatients();
        } catch (err) {
            alert("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pt-24 px-4 max-w-7xl mx-auto pb-12">
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-2">Clinician <span className="text-secondary">Dashboard</span></h1>
                <p className="text-slate-400">Review patient scans and provide expert clinical guidance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Patient List */}
                <div className="lg:col-span-1 space-y-4 h-[calc(100vh-250px)] overflow-y-auto pr-2">
                    <h2 className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4" /> Incoming Scans
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-20"><Search className="animate-spin text-secondary" /></div>
                    ) : reports.map(report => (
                        <button
                            key={report._id}
                            onClick={() => setSelectedReport(report)}
                            className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedReport?._id === report._id
                                    ? 'bg-secondary/10 border-secondary shadow-lg shadow-secondary/5'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold flex items-center gap-2">
                                    {report.patient_name}
                                    {report.reviews.length > 0 && <UserCheck className="w-4 h-4 text-secondary" />}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${report.analysis.severity === 'High' ? 'bg-accent/20 text-accent' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                    {report.analysis.severity}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-300 mb-1">{report.analysis.disease_name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <Calendar className="w-3 h-3" /> {new Date(report.timestamp).toLocaleDateString()}
                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                {report.reviews.length} reviews
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Patient Detail */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedReport ? (
                            <motion.div
                                key={selectedReport._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-card p-8 border-secondary/20"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex gap-6">
                                        <img src={selectedReport.image_data} className="w-32 h-32 object-cover rounded-2xl border-2 border-secondary/20" alt="Scan" />
                                        <div>
                                            <h2 className="text-3xl font-bold mb-1">{selectedReport.patient_name}</h2>
                                            <p className="text-slate-400 mb-4">Submitted on {new Date(selectedReport.timestamp).toLocaleString()}</p>
                                            <div className="flex gap-4">
                                                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                                                    <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">AI Classification</div>
                                                    <div className="text-secondary font-bold">{selectedReport.analysis.disease_name}</div>
                                                </div>
                                                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                                                    <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">Confidence Score</div>
                                                    <div className="text-primary font-mono font-bold">{(selectedReport.analysis.confidence * 100).toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                        <h4 className="text-sm font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> AI Description
                                        </h4>
                                        <p className="text-slate-300 italic">"{selectedReport.analysis.description}"</p>
                                    </div>
                                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                        <h4 className="text-sm font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4" /> Recommended Action
                                        </h4>
                                        <p className="text-slate-200">{selectedReport.analysis.recommendation}</p>
                                    </div>
                                </div>

                                {/* New Review Form */}
                                <div className="border-t border-white/10 pt-8 mt-8">
                                    <h3 className="text-xl font-bold mb-4">Add Clinical Assessment</h3>
                                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                                        <textarea
                                            rows="4"
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-colors"
                                            placeholder="Provide your professional insight, treatment plan, or follow-up instructions here..."
                                        ></textarea>
                                        <div className="flex justify-end">
                                            <button
                                                disabled={submitting || !reviewText}
                                                className="bg-secondary text-white px-8 py-3 rounded-xl font-bold flex items-center hover:bg-opacity-80 transition-all disabled:opacity-50"
                                            >
                                                {submitting ? <Search className="animate-spin mr-2" /> : <Send className="mr-2 w-5 h-5" />}
                                                Submit Assessment
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Past Reviews */}
                                {selectedReport.reviews.length > 0 && (
                                    <div className="mt-12 space-y-4">
                                        <h3 className="text-sm font-bold uppercase text-slate-500">Previous Assessments</h3>
                                        {selectedReport.reviews.map((rev, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                                                <p className="text-slate-300 mb-3">{rev.content}</p>
                                                <div className="flex items-center gap-2 text-xs text-secondary">
                                                    <UserCheck className="w-3 h-3" />
                                                    <span className="font-bold">Dr. {rev.doctor_name}</span>
                                                    <span className="text-slate-500">• {new Date(rev.timestamp).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-600 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                                <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">Select a patient scan to begin clinical review</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
