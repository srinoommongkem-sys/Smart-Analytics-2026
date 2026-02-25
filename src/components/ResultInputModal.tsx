
import React, { useState } from 'react';
import { AnalysisResult } from '../types/analysis';

interface ResultInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (matchId: string, score: string) => void;
    match: AnalysisResult | null;
}

export default function ResultInputModal({ isOpen, onClose, onSave, match }: ResultInputModalProps) {
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');

    if (!isOpen || !match) return null;

    const handleSave = () => {
        if (homeScore === '' || awayScore === '') return;
        const scoreString = `${homeScore}-${awayScore}`;
        onSave(match.id, scoreString);
        setHomeScore('');
        setAwayScore('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-xl font-black text-gray-800 mb-1 text-center">Update Match Result</h3>
                <p className="text-gray-500 text-sm mb-6 text-center">{match.homeTeam} vs {match.awayTeam}</p>

                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Home</span>
                        <input
                            type="number"
                            min="0"
                            className="w-16 h-16 text-3xl font-black text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                            value={homeScore}
                            onChange={(e) => setHomeScore(e.target.value)}
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                    <span className="text-2xl font-black text-gray-300">-</span>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Away</span>
                        <input
                            type="number"
                            min="0"
                            className="w-16 h-16 text-3xl font-black text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                            value={awayScore}
                            onChange={(e) => setAwayScore(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={homeScore === '' || awayScore === ''}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Result
                    </button>
                </div>
            </div>
        </div>
    );
}
