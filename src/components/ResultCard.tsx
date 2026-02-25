import { AnalysisResult } from "../types/analysis";
import { useState } from "react";
import clsx from "clsx";


interface ResultCardProps {
    result: AnalysisResult;
}

export default function ResultCard({ result }: ResultCardProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSaveToSheet = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/save-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            });
            if (res.ok) {
                setSaved(true);
                alert("Saved to Google Sheets!");
            } else {
                alert("Failed to save.");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving data.");
        } finally {
            setIsSaving(false);
        }
    };
    const statusColors = {
        VIP: "bg-green-50 text-green-800 border-green-200",
        INVEST: "bg-yellow-50 text-yellow-800 border-yellow-200",
        WAIT: "bg-gray-50 text-gray-800 border-gray-200",
    };

    const statusIcons = {
        VIP: "🟢",
        INVEST: "🟡",
        WAIT: "⚪",
    };

    // Determine which logo to show for the pick
    const pickLogo = result.prediction?.team === result.homeTeam ? result.homeTeamLogo : result.awayTeamLogo;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            {/* Header / Recommendation */}
            <div className={clsx(
                "flex items-center justify-between p-4 rounded-lg border mb-6",
                statusColors[result.recommendation]
            )}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{statusIcons[result.recommendation]}</span>
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {result.recommendation === "VIP" ? "⭐ ทีเด็ด VIP" :
                                result.recommendation === "INVEST" ? "✅ น่าลงทุน" :
                                    "⚠️ รอจังหวะ"}
                        </h3>
                        {/* Match Info */}
                        <div className="text-xs opacity-75 mt-1 font-medium">
                            {result.homeTeam} vs {result.awayTeam}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black">{result.score}%</span>
                    <div className="text-[10px] uppercase font-bold opacity-60">Confidence</div>
                </div>
            </div>

            {/* PREDICTION SECTION (New) */}
            {result.prediction && (
                <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>

                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="text-blue-100 text-xs font-bold tracking-wider uppercase mb-1">AI Recommendation (ทีเด็ด AI)</div>
                            <div className="flex items-center gap-3">
                                {pickLogo && (
                                    <div className="w-12 h-12 bg-white rounded-full p-1 shadow-sm flex items-center justify-center">
                                        <img src={pickLogo} alt="Pick" className="w-full h-full object-contain" />
                                    </div>
                                )}
                                <div>
                                    <div className="text-2xl font-black leading-none">{result.prediction.team}</div>
                                    <div className="text-sm font-medium text-blue-100 mt-1">
                                        Handicap: <span className="bg-white/20 px-2 py-0.5 rounded text-white font-bold">{result.prediction.handicap}</span>
                                        <span className="mx-2 opacity-50">|</span>
                                        Odds: {result.prediction.odds.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1 font-semibold">กระแสราคา (Sentiment)</div>
                    <div className={clsx(
                        "text-xl font-bold font-mono",
                        result.details.handicapScore > 60 ? "text-green-600" :
                            result.details.handicapScore < 40 ? "text-red-600" : "text-yellow-600"
                    )}>
                        {result.details.handicapScore > 60 ? "กระแสดี (Safe)" :
                            result.details.handicapScore < 40 ? "ระวังราคา (Risk)" : "ปกติ (Neutral)"}
                    </div>
                </div>


                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Stats Efficiency</span>
                    <span className="font-mono font-bold text-gray-800">
                        {result.details.statsScore} pts
                    </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">H2H History</span>
                    <span className="font-mono font-bold text-gray-800">
                        {result.details.historyScore} pts
                    </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Handicap Flow</span>
                    <span className={clsx(
                        "font-mono font-bold",
                        // Check if handicapScore exists (backward compatibility)
                        (result.details.handicapScore || 0) > 0 ? "text-green-600" : (result.details.handicapScore || 0) < 0 ? "text-red-500" : "text-gray-400"
                    )}>
                        {(result.details.handicapScore || 0) > 0 ? "+" : ""}{result.details.handicapScore || 0} pts
                    </span>
                </div>

                <div className="pt-4">
                    <h4 className="text-xs uppercase text-gray-400 mb-2">Implied Probabilities</h4>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                        <div style={{ width: `${result.impliedProbabilities.home}%` }} className="bg-blue-500" />
                        <div style={{ width: `${result.impliedProbabilities.draw}%` }} className="bg-gray-300" />
                        <div style={{ width: `${result.impliedProbabilities.away}%` }} className="bg-red-500" />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>H: {result.impliedProbabilities.home.toFixed(1)}%</span>
                        <span>D: {result.impliedProbabilities.draw.toFixed(1)}%</span>
                        <span>A: {result.impliedProbabilities.away.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* Save Button */}

        </div>
    );
}
