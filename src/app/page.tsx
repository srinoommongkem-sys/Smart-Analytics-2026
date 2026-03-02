"use client";

import { useState, useEffect } from "react";
import SavedMatchList from "../components/SavedMatchList";
import StatsOverview from "../components/StatsOverview";
import { AnalysisResult } from "../types/analysis";

export default function Home() {
    const [savedMatches, setSavedMatches] = useState<AnalysisResult[]>([]);
    const [settledMatches, setSettledMatches] = useState<AnalysisResult[]>([]);

    // Load matches from API (Google Sheets) on mount
    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch('/api/matches');
                const data = await res.json();

                if (data.success && data.matches) {
                    const activeMatches = data.matches.filter((m: any) => !m.resultStatus);
                    const settled = data.matches.filter((m: any) => m.resultStatus && m.resultStatus !== "VOID");
                    settled.sort((a: AnalysisResult, b: AnalysisResult) => b.timestamp - a.timestamp);
                    // Reverse to show newest first if they are appended chronologically
                    setSavedMatches(activeMatches.reverse());
                    setSettledMatches(settled);
                }
            } catch (error) {
                console.error("Failed to fetch matches from API, falling back to local", error);
                // Fallback to local storage if API fails
                const saved = localStorage.getItem("savedMatches");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const activeMatches = parsed.filter((m: AnalysisResult) => !m.resultStatus);
                        const settled = parsed.filter((m: AnalysisResult) => m.resultStatus && m.resultStatus !== "VOID");
                        settled.sort((a: AnalysisResult, b: AnalysisResult) => b.timestamp - a.timestamp);
                        setSavedMatches(activeMatches);
                        setSettledMatches(settled);
                    } catch (e) {
                        console.error("Failed to parse local matches", e);
                    }
                }
            }
        };
        fetchMatches();
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden">
            {/* Background Ambience (Light) */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12">
                {/* Navigation / Header */}
                <nav className="flex justify-between items-center mb-20">
                    <div className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="text-blue-600">SMART</span>
                        <span className="text-gray-900">FOOTBALL</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/results" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-white rounded-full">
                            Match Results
                        </a>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="text-center mb-20 space-y-6">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4 border border-blue-100">
                        2026 Edition
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
                        Smart Football <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Analytics 2026</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        ยกระดับการลงทุนกีฬาฟุตบอล ด้วยเทคโนโลยี AI อัจฉริยะ <br />
                        ขับเคลื่อนด้วยอัลกอริทึมขั้นสูง เพื่อผลการวิเคราะห์ที่แม่นยำที่สุด
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="mb-12">
                    <StatsOverview matches={settledMatches} />
                </div>

                {/* Content Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Latest Signals</h2>
                        <div className="text-sm text-gray-500 font-medium">
                            {savedMatches.length} Active Signals
                        </div>
                    </div>
                    <SavedMatchList matches={savedMatches} readOnly={true} layout="grid" hideConfidence={true} />
                </div>

                {/* Footer */}
                <footer className="mt-24 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
                    <p>© 2026 Smart Football Analytics. All rights reserved.</p>
                </footer>
            </div>
        </main>
    );
}
