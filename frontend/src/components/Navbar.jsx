import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-dark bg-opacity-50 backdrop-blur-md border-b border-white border-opacity-10">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="p-2 bg-primary bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all">
                        <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Skin<span className="text-primary">Morph</span></span>
                </Link>

                <div className="flex items-center space-x-6">
                    {token ? (
                        <>
                            <div className="flex items-center space-x-2 text-slate-300">
                                <User className="w-5 h-5" />
                                <span className="text-sm font-medium">{name} ({role})</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm">Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="space-x-4">
                            <Link to="/login" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Login</Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
