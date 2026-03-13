import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, ClipboardList, Send, CheckCircle, Search, Calendar, UserCheck, FileDown } from 'lucide-react';
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

    const downloadReport = (report) => {
        const printWindow = window.open('', '_blank');
        const date = new Date(report.timestamp).toLocaleString();
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Skin Analysis Report - ${report.patient_name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
                        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                        .report-info { text-align: right; font-size: 12px; color: #64748b; }
                        .section { margin-bottom: 30px; }
                        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 10px; }
                        .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
                        .image-container { width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
                        .image-container img { width: 100%; height: auto; display: block; }
                        .result-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                        .disease-name { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
                        .severity { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-top: 5px; }
                        .severity-High { background: #fee2e2; color: #ef4444; }
                        .severity-Medium { background: #fef3c7; color: #d97706; }
                        .severity-Low { background: #dcfce7; color: #10b981; }
                        .feature-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
                        .feature-item { background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
                        .feature-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
                        .feature-value { font-size: 13px; font-weight: bold; color: #334155; }
                        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">Clinician Portal | SkinMorph</div>
                        <div class="report-info">
                            <div>Patient: ${report.patient_name}</div>
                            <div>Report ID: ${report._id}</div>
                            <div>Analysis Date: ${date}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="grid">
                            <div>
                                <div class="section-title">Case Information</div>
                                <div class="result-card">
                                    <div style="font-size: 12px; color: #64748b;">AI Classification</div>
                                    <h1 class="disease-name">${report.analysis.disease_name}</h1>
                                    <div class="severity severity-${report.analysis.severity}">${report.analysis.severity} Priority</div>
                                    <p style="margin-top: 15px; font-size: 14px; color: #475569;">${report.analysis.description}</p>
                                    <div style="margin-top: 15px; font-size: 13px;">
                                        <strong>Confidence:</strong> ${(report.analysis.confidence * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div class="image-container">
                                <div class="section-title">Clinical Entry Image</div>
                                <img src="${report.image_data}" />
                            </div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="section">
                            <div class="section-title">AI Support Data</div>
                            <div class="result-card">
                                <p><strong>Recommendation:</strong><br/>${report.analysis.recommendation}</p>
                                <div class="feature-grid">
                                    ${report.analysis.features ? Object.entries(report.analysis.features).map(([k, v]) => `
                                        <div class="feature-item">
                                            <div class="feature-label">${k.replace('_', ' ')}</div>
                                            <div class="feature-value">${v}</div>
                                        </div>
                                    `).join('') : ''}
                                </div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Dermatologist Assessments</div>
                            ${report.reviews && report.reviews.length > 0 ? report.reviews.map(rev => `
                                <div class="result-card" style="margin-bottom: 10px; border-left: 4px solid #10b981;">
                                    <p style="margin: 0; font-size: 14px;">${rev.content}</p>
                                    <div style="font-size: 11px; color: #10b981; font-weight: bold; margin-top: 10px;">
                                        Dr. ${rev.doctor_name} &bull; ${new Date(rev.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            `).join('') : '<div class="result-card"><p style="color: #94a3b8; font-style: italic;">No clinical assessments provided yet.</p></div>'}
                        </div>
                    </div>

                    <div class="footer">
                        Confidential Medical Record - For Professional Use Only. Generated via SkinMorph AI Clinical Systems.
                    </div>
                    
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
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
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => downloadReport(selectedReport)}
                                            className="p-3 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all flex items-center justify-center"
                                            title="Download Clinical Report"
                                        >
                                            <FileDown className="w-6 h-6" />
                                        </button>
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
                                        <p className="text-slate-200 mb-3">{selectedReport.analysis.recommendation}</p>
                                        {selectedReport.analysis.suggestions && (
                                            <div className="pt-3 border-t border-white/5">
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">AI Care Suggestions</p>
                                                <p className="text-sm text-slate-400 font-medium">{selectedReport.analysis.suggestions}</p>
                                            </div>
                                        )}
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
