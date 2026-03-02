
import React from 'react';
import { AnalysisResult } from '../types/analysis';

interface StatsOverviewProps {
    matches: AnalysisResult[];
}

export default function StatsOverview({ matches }: StatsOverviewProps) {
    const totalMatches = matches.filter(m => m.resultStatus && m.resultStatus !== "VOID").length;

    if (totalMatches === 0) return null;

    const wins = matches.filter(m => m.resultStatus === "WIN" || m.resultStatus === "HALF_WIN").length;
    const losses = matches.filter(m => m.resultStatus === "LOSS" || m.resultStatus === "HALF_LOSS").length;
    const halfLosses = matches.filter(m => m.resultStatus === "HALF_LOSS").length;
    const draws = matches.filter(m => m.resultStatus === "DRAW").length;

    // Calculate Win Rate: Win = 1 (HALF_WIN is already in wins)
    // Exclude DRAWs from the total matches for an accurate win rate
    const validMatchesForWinRate = totalMatches - draws;
    const winRate = validMatchesForWinRate > 0 ? (wins / validMatchesForWinRate) * 100 : 0;

    // Calculate "Net Score" (Win = +1, Loss = -1, HalfLoss = -0.5)
    const fullLosses = matches.filter(m => m.resultStatus === "LOSS").length;
    const netScore = wins - fullLosses - (halfLosses * 0.5);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-3xl shadow-sm border border-blue-100/50 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                <span className="text-blue-600/70 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Total Matches</span>
                <span className="text-4xl font-black text-blue-950 relative z-10">{totalMatches}</span>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-3xl shadow-sm border border-green-100/50 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                <span className="text-green-600/70 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Win Rate</span>
                <span className={`text-4xl font-black relative z-10 ${winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                    {winRate.toFixed(1)}%
                </span>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-3xl shadow-sm border border-indigo-100/50 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                <span className="text-indigo-600/70 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Net Score</span>
                <span className={`text-4xl font-black relative z-10 ${netScore > 0 ? 'text-indigo-600' : netScore < 0 ? 'text-rose-600' : 'text-gray-600'}`}>
                    {netScore > 0 ? '+' : ''}{netScore}
                </span>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-3xl shadow-sm border border-purple-100/50 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                <span className="text-purple-600/70 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">Record (W-D-L)</span>
                <div className="flex items-center gap-2 text-base font-black relative z-10">
                    <span className="text-green-600 bg-green-100/50 px-2 py-0.5 rounded-md">{wins}W</span>
                    <span className="text-gray-400 bg-gray-100/50 px-2 py-0.5 rounded-md">{draws}D</span>
                    <span className="text-red-600 bg-red-100/50 px-2 py-0.5 rounded-md">{losses}L</span>
                </div>
            </div>
        </div>
    );
}
