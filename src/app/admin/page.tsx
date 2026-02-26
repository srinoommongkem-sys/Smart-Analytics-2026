"use client";

import { useState, useEffect } from "react";
import InputForm from "../../components/InputForm";
import ResultCard from "../../components/ResultCard";
import SavedMatchList from "../../components/SavedMatchList";
import PasscodeManager from "../../components/PasscodeManager";
import StatsOverview from "../../components/StatsOverview";
import { AnalysisResult, MatchData } from "../../types/analysis";
import { calculateAnalysis } from "../../utils/calculate";
import { calculateResultStatus } from "../../utils/resultCalculator";

import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'calculator' | 'database' | 'vip'>('calculator');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [savedMatches, setSavedMatches] = useState<AnalysisResult[]>([]);
    const [editingMatch, setEditingMatch] = useState<MatchData | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Load matches from API (Google Sheets) on mount
    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch('/api/matches');
                const data = await res.json();
                if (data.success && data.matches) {
                    setSavedMatches(data.matches.reverse());
                }
            } catch (error) {
                console.error("Failed to fetch matches from API", error);
                const saved = localStorage.getItem("savedMatches");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const sanitized = parsed.map((m: any) => ({
                            ...m,
                            id: m.id || crypto.randomUUID(),
                            timestamp: m.timestamp || Date.now(),
                            oddsShift: m.oddsShift || 0,
                            prediction: m.prediction || {
                                team: m.score >= 50 ? m.homeTeam : m.awayTeam,
                                handicap: "0",
                                odds: 0.90
                            }
                        }));
                        setSavedMatches(sanitized);
                    } catch (e) {
                        console.error("Failed to parse saved matches", e);
                        localStorage.removeItem("savedMatches");
                    }
                }
            }
        };
        fetchMatches();
    }, []);

    const handleAnalyze = (data: MatchData) => {
        const analysis = calculateAnalysis(data);
        // If we are editing, preserve the ID
        if (editingId) {
            analysis.id = editingId;
        }
        setResult(analysis);
    };

    const handleEdit = (match: AnalysisResult) => {
        if (match.originalData) {
            setEditingMatch(match.originalData);
        } else {
            // Reconstruct basic data for old matches
            setEditingMatch({
                leagueName: match.leagueName,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                homeTeamLogo: match.homeTeamLogo,
                awayTeamLogo: match.awayTeamLogo,
                // Defaults for missing data
                handicap: [{ value: 0, homeOdd: 0.90, awayOdd: 0.90 }],
                stats: {
                    home: { last5: [], last5Home: [], goals: { scored: 0, conceded: 0 } },
                    away: { last5: [], last5Away: [], goals: { scored: 0, conceded: 0 } }
                },
                history: { h2h: [] },
                odds: { home: 0, draw: 0, away: 0 },
                standings: {
                    home: { rank: 0, points: 0, goalDiff: 0 },
                    away: { rank: 0, points: 0, goalDiff: 0 }
                }
            });
        }
        setEditingId(match.id);
        setResult(null); // Clear result to show form
        setActiveTab('calculator'); // Jump back to Calculator tab
    };

    const handleSave = async () => {
        if (result) {
            // 1. Save to Local Storage (Immediate UI update)
            let newMatches;
            const existingIndex = savedMatches.findIndex(m => m.id === result.id);

            if (existingIndex >= 0) {
                // Update existing
                newMatches = [...savedMatches];
                newMatches[existingIndex] = result;
            } else {
                // Add new
                newMatches = [result, ...savedMatches];
            }

            setSavedMatches(newMatches);
            localStorage.setItem("savedMatches", JSON.stringify(newMatches));

            // 2. Save to Google Sheets (Background)
            try {
                // Determine if we should append new row or update (for now, just append as log)
                // TODO: Update logic for Google Sheets if needed, currently append-only log is safer
                await fetch('/api/save-match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result),
                });
                alert("Saved to Database & Google Sheets! ✅");
            } catch (error) {
                console.error("Failed to sync with Google Sheets", error);
                alert("Saved Locally Only (Sheet Sync Failed) ⚠️");
            }

            // Reset state
            setResult(null);
            setEditingMatch(null);
            setEditingId(null);

            // Removed redirect to Home, keeping user on Admin page
        }
    };

    const handleDelete = async (id: string) => {
        const newMatches = savedMatches.filter(m => m.id !== id);
        setSavedMatches(newMatches);
        localStorage.setItem("savedMatches", JSON.stringify(newMatches));

        try {
            await fetch('/api/delete-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            // Don't need an alert, silent delete is fine since UI is immediately updated.
        } catch (error) {
            console.error("Failed to delete from server", error);
            alert("Error deleting from server");
        }
    };

    const handleUpdateResult = async (id: string, score: string) => {
        const matchIndex = savedMatches.findIndex(m => m.id === id);
        if (matchIndex === -1) return;

        const match = savedMatches[matchIndex];
        const status = calculateResultStatus(
            match.prediction.team,
            match.homeTeam,
            match.awayTeam,
            parseFloat(match.prediction.handicap),
            score
        );

        const updatedMatch = {
            ...match,
            actualScore: score,
            resultStatus: status
        };

        const newMatches = [...savedMatches];
        newMatches[matchIndex] = updatedMatch;

        setSavedMatches(newMatches);
        localStorage.setItem("savedMatches", JSON.stringify(newMatches));

        // Sync to Sheets
        try {
            await fetch('/api/save-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedMatch),
            });
            alert(`Result Updated: ${status} ✅`);
        } catch (error) {
            console.error("Failed to sync result", error);
            alert("Result Saved Locally Only ⚠️");
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 text-center pt-8 border-b pb-4 border-gray-200 relative">
                    <button
                        onClick={() => router.push("/")}
                        className="absolute left-0 top-8 text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-2xl font-black text-red-600 mb-2 tracking-tight">
                        ADMIN BACKOFFICE
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Calculation System & Data Entry
                    </p>
                </header>

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl w-full max-w-3xl mx-auto overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'calculator'
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        📝 เครื่องคิดเลข (Calculator)
                    </button>
                    <button
                        onClick={() => setActiveTab('database')}
                        className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'database'
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        🗂️ ฐานข้อมูลคู่แข่ง (Database)
                    </button>
                    <button
                        onClick={() => setActiveTab('vip')}
                        className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'vip'
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        🔑 จัดการรหัส VIP (Passcodes)
                    </button>
                </div>

                {activeTab === 'calculator' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12 animate-in fade-in duration-300">
                        {/* Left Column: Input Form */}
                        <div className="lg:col-span-6">
                            <InputForm onAnalyze={handleAnalyze} initialData={editingMatch} />
                        </div>

                        {/* Middle Column: Results */}
                        <div className="lg:col-span-6 space-y-6">
                            {result ? (
                                <div className="space-y-4">
                                    <ResultCard result={result} />
                                    <button
                                        onClick={handleSave}
                                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                    >
                                        <span>💾</span> {editingId ? "UPDATE MATCH" : "SAVE TO PUBLIC LIST"}
                                    </button>
                                    {editingId && (
                                        <button
                                            onClick={() => {
                                                setResult(null);
                                                setEditingMatch(null);
                                                setEditingId(null);
                                            }}
                                            className="w-full py-2 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                                        >
                                            CANCEL EDIT
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center py-20 h-full flex flex-col justify-center items-center">
                                    <div className="text-4xl mb-4">⚙️</div>
                                    <h3 className="font-bold text-gray-800 mb-2">Calculator Ready</h3>
                                    <p className="text-gray-400 text-sm">
                                        {editingMatch ? "Editing match..." : "Input data to calculate probabilities."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="space-y-8 mb-12 animate-in fade-in duration-300">
                        {/* Stats Overview */}
                        <div>
                            <StatsOverview matches={savedMatches} />
                        </div>

                        {/* Bottom Row: Match History (Editable) */}
                        <div className="pt-8 border-t border-gray-200">
                            <h3 className="font-bold text-lg mb-6 text-gray-800 border-l-4 border-blue-600 pl-4">Manage Stored Data</h3>
                            <SavedMatchList
                                matches={savedMatches}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onUpdateResult={handleUpdateResult}
                                layout="grid"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'vip' && (
                    <div className="mb-12 animate-in fade-in duration-300">
                        <PasscodeManager />
                    </div>
                )}
            </div>
        </main>
    );
}
