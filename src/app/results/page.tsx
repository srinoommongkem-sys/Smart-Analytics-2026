
"use client";

import { useEffect, useState } from "react";
import SavedMatchList from "../../components/SavedMatchList";
import StatsOverview from "../../components/StatsOverview";
import { AnalysisResult } from "../../types/analysis";
import Link from "next/link";

export default function ResultsPage() {
    const [savedMatches, setSavedMatches] = useState<AnalysisResult[]>([]);
    const [settledMatches, setSettledMatches] = useState<AnalysisResult[]>([]);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch('/api/matches');
                const data = await res.json();

                if (data.success && data.matches) {
                    const settled = data.matches.filter((m: any) => m.resultStatus && m.resultStatus !== "VOID");
                    settled.sort((a: AnalysisResult, b: AnalysisResult) => b.timestamp - a.timestamp);

                    setSavedMatches(data.matches);
                    setSettledMatches(settled);
                }
            } catch (error) {
                console.error("Failed to fetch matches from API, falling back to local storage", error);
                const saved = localStorage.getItem("savedMatches");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const settled = parsed.filter((m: AnalysisResult) => m.resultStatus && m.resultStatus !== "VOID");
                        settled.sort((a: AnalysisResult, b: AnalysisResult) => b.timestamp - a.timestamp);

                        setSavedMatches(parsed);
                        setSettledMatches(settled);
                    } catch (e) {
                        console.error("Failed to parse saved matches", e);
                    }
                }
            }
        };

        fetchMatches();
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 mb-4 transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-2">
                            Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Results</span>
                        </h1>
                        <p className="text-gray-500 text-lg">Performance tracking and history.</p>
                    </div>
                </div>

                {/* Statistics Overview */}
                <StatsOverview matches={settledMatches} />

                {/* Match List */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-white">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Settled Matches</h2>
                    </div>
                    <SavedMatchList
                        matches={settledMatches}
                        readOnly={true}
                        layout="grid"
                        defaultToYesterday={true}
                        hideConfidence={true}
                    />
                </div>
            </div>
        </main>
    );
}
