
import React from 'react';
import { AnalysisResult } from '../types/analysis';

interface StatsOverviewProps {
    matches: AnalysisResult[];
}

export default function StatsOverview({ matches }: StatsOverviewProps) {
    const totalMatches = matches.filter(m => m.resultStatus && m.resultStatus !== "VOID").length;

    if (totalMatches === 0) return null;

    const wins = matches.filter(m => m.resultStatus === "WIN" || m.resultStatus === "HALF_WIN").length;
    const losses = matches.filter(m => m.resultStatus === "LOSS").length;
    const halfLosses = matches.filter(m => m.resultStatus === "HALF_LOSS").length;
    const draws = matches.filter(m => m.resultStatus === "DRAW").length;

    // Calculate Win Rate: Win = 1 (HALF_WIN is already in wins)
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Calculate "Net Score" (Win = +1, Loss = -1, HalfLoss = -0.5)
    const netScore = wins - losses - (halfLosses * 0.5);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Matches</span>
                <span className="text-3xl font-black text-gray-800">{totalMatches}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Win Rate</span>
                <span className={`text-3xl font-black ${winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {winRate.toFixed(1)}%
                </span>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Net Score</span>
                <span className={`text-3xl font-black ${netScore > 0 ? 'text-green-600' : netScore < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {netScore > 0 ? '+' : ''}{netScore}
                </span>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Record</span>
                <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="text-green-600">{wins}W</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-500">{draws}D</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-red-600">{losses}L</span>
                </div>
            </div>
        </div>
    );
}
