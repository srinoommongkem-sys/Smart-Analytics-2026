
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
        // Load matches (copy logic from other pages, ideally this should be a hook or context)
        const saved = localStorage.getItem("savedMatches");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Filter only settled matches (those with a resultStatus)
                const settled = parsed.filter((m: AnalysisResult) => m.resultStatus && m.resultStatus !== "VOID");

                // Sort by date descending (newest first)
                settled.sort((a: AnalysisResult, b: AnalysisResult) => b.timestamp - a.timestamp);

                setSavedMatches(parsed);
                setSettledMatches(settled);
            } catch (e) {
                console.error("Failed to parse saved matches", e);
            }
        }
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Home
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Match Results</h1>
                        <p className="text-gray-500 mt-1">Performance tracking and history.</p>
                    </div>
                </div>

                {/* Statistics Overview */}
                <StatsOverview matches={settledMatches} />

                {/* Match List */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-white">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Settled Matches</h2>
                    <SavedMatchList
                        matches={settledMatches}
                        readOnly={true}
                        layout="list"
                    />
                </div>
            </div>
        </main>
    );
}
