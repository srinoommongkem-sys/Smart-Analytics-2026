import { AnalysisResult } from "../types/analysis";
import clsx from "clsx";
import { useState, useEffect } from "react";
import ResultInputModal from "./ResultInputModal";

interface SavedMatchListProps {
    matches: AnalysisResult[];
    onDelete?: (id: string) => void;
    onEdit?: (match: AnalysisResult) => void;
    onUpdateResult?: (id: string, score: string) => void;
    readOnly?: boolean;
    layout?: "grid" | "list";
}

export default function SavedMatchList({ matches, onDelete, onEdit, onUpdateResult, readOnly = false, layout = "grid" }: SavedMatchListProps) {
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [selectedMatchForResult, setSelectedMatchForResult] = useState<AnalysisResult | null>(null);

    // VIP Passcode State
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passcodeInput, setPasscodeInput] = useState("");
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false); // loading state for API

    useEffect(() => {
        const unlocked = sessionStorage.getItem("vip_unlocked") === "true";
        if (unlocked) setIsUnlocked(true);
    }, []);

    const handleUnlock = async () => {
        if (!passcodeInput.trim()) {
            alert("กรุณาใส่รหัสผ่าน");
            return;
        }

        setIsUnlocking(true);
        try {
            const res = await fetch('/api/verify-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode: passcodeInput.trim() })
            });

            const data = await res.json();

            if (data.valid) {
                setIsUnlocked(true);
                sessionStorage.setItem("vip_unlocked", "true");
                setShowUnlockModal(false);
                setPasscodeInput("");
                alert("VIP Access Unlocked! 🎉");
            } else {
                alert("รหัสผ่านไม่ถูกต้อง หรือถูกระงับการใช้งาน");
            }
        } catch (error) {
            console.error("Failed to verify passcode:", error);
            alert("เกิดข้อผิดพลาดในการตรวจสอบรหัส กรุณาลองใหม่");
        } finally {
            setIsUnlocking(false);
        }
    };

    // Initialize date: Today (or yesterday if before 5:00 AM)
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date();
        if (d.getHours() < 5) {
            d.setDate(d.getDate() - 1);
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    if (matches.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="text-6xl mb-4 opacity-20">⚽</div>
                <p className="text-lg font-medium text-gray-500">No signals generated yet.</p>
                <p className="text-sm text-gray-400 mt-2">Waiting for new calculations...</p>
            </div>
        );
    }

    // Sort matches by time (earliest first)
    const sortedMatches = [...matches].sort((a, b) => {
        const timeA = new Date(a.matchTime || a.timestamp).getTime();
        const timeB = new Date(b.matchTime || b.timestamp).getTime();
        return timeA - timeB;
    });

    // Group matches by Date, then League
    const matchesByDate = sortedMatches.reduce((acc, match) => {
        const matchDate = new Date(match.matchTime || match.timestamp);

        // Logical Date Calculation:
        // Matches scheduled before 05:00 AM belong to the previous logical day's fixtures.
        const logicalDate = new Date(matchDate);
        if (logicalDate.getHours() < 5) {
            logicalDate.setDate(logicalDate.getDate() - 1);
        }

        const year = logicalDate.getFullYear();
        const month = String(logicalDate.getMonth() + 1).padStart(2, '0');
        const day = String(logicalDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (!acc[dateKey]) {
            acc[dateKey] = {
                dateObj: logicalDate, // Store logical date for header rendering
                leagues: {}
            };
        }

        const rawLeague = match.leagueName || "Other Matches";
        const normalizedLeague = rawLeague.trim().replace(/\s+/g, ' ').toLowerCase();

        if (!acc[dateKey].leagues[normalizedLeague]) {
            acc[dateKey].leagues[normalizedLeague] = {
                displayName: rawLeague.trim(),
                matches: []
            };
        }
        acc[dateKey].leagues[normalizedLeague].matches.push(match);
        return acc;
    }, {} as any);

    let sortedDateKeys = Object.keys(matchesByDate).sort((a, b) => b.localeCompare(a)); // Newest first

    // Select the latest date by default if no date is manually selected yet (and if there are any dates)
    // Actually, letting them see 'All' or picking a date explicitly is usually better.
    // Let's filter by selectedDate if it's not empty string ""
    if (selectedDate !== "") {
        sortedDateKeys = sortedDateKeys.filter(dateKey => dateKey === selectedDate);
    }

    return (
        <div className="space-y-12">
            {/* VIP Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 text-white text-center">
                            <h3 className="text-xl font-black flex items-center justify-center gap-2">
                                <span>🔒</span> กรุณาใส่รหัส VIP
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500 text-center">
                                ข้อมูลและทีเด็ดถูกสงวนไว้สำหรับสมาชิก VIP เท่านั้น
                            </p>
                            <input
                                type="password"
                                value={passcodeInput}
                                onChange={(e) => setPasscodeInput(e.target.value)}
                                placeholder="รหัสผ่าน..."
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-center text-lg font-bold outline-none focus:border-yellow-500 transition-colors"
                            />
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowUnlockModal(false)}
                                    disabled={isUnlocking}
                                    className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleUnlock}
                                    disabled={isUnlocking || !passcodeInput.trim()}
                                    className="flex-1 py-3 text-white font-bold bg-yellow-500 hover:bg-yellow-600 rounded-xl shadow-lg transition disabled:opacity-50"
                                >
                                    {isUnlocking ? "กำลังตรวจสอบ..." : "ยืนยัน"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ResultInputModal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                onSave={(id, score) => {
                    if (onUpdateResult) onUpdateResult(id, score);
                }}
                match={selectedMatchForResult}
            />
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${!readOnly ? 'px-2' : ''}`}>
                {!readOnly ? (
                    <h3 className="font-bold text-xl text-gray-900 border-l-4 border-blue-600 pl-4">Recent Calculations</h3>
                ) : (
                    <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                        <span>🗓️</span> ข้อมูลการคำนวณทั้งหมด
                    </h3>
                )}

                {/* Date Picker/Filter & VIP Unlock */}
                <div className="flex flex-wrap items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-gray-200 w-full md:w-auto">
                    {readOnly && !isUnlocked && (
                        <button
                            onClick={() => setShowUnlockModal(true)}
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1.5 rounded-md text-sm font-bold shadow hover:from-yellow-500 hover:to-yellow-700 transition flex items-center gap-2 whitespace-nowrap"
                        >
                            <span>🔒</span> ปลดล็อค VIP
                        </button>
                    )}
                    <button
                        onClick={() => setSelectedDate("")}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${selectedDate === "" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                        ทั้งหมด
                    </button>
                    <div className="relative flex-grow md:flex-grow-0 flex items-center">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`w-full md:w-auto px-4 py-2 rounded-md border text-sm font-bold cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${selectedDate !== "" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
                        />
                        <div className="absolute right-3 pointer-events-none text-gray-400">
                            📅
                        </div>
                    </div>
                </div>
            </div>

            {sortedDateKeys.length === 0 && selectedDate !== "" ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                    <p className="text-lg font-bold">ไม่พบข้อมูลของวันที่เลือก</p>
                    <button onClick={() => setSelectedDate("")} className="mt-4 text-blue-600 font-medium hover:underline">
                        ดูทั้งหมด
                    </button>
                </div>
            ) : null}

            {sortedDateKeys.map(dateKey => {
                const dateGroup = matchesByDate[dateKey];
                const dateMatches = dateGroup.leagues;

                // Find the first match chronologically for this day (the free match)
                const allMatchesThisDay = Object.values(dateMatches).flatMap((l: any) => l.matches);
                allMatchesThisDay.sort((a: any, b: any) => new Date(a.matchTime || a.timestamp).getTime() - new Date(b.matchTime || b.timestamp).getTime());
                const freeMatchId = allMatchesThisDay[0]?.id;

                const sortedLeagueKeys = Object.keys(dateMatches).sort((a, b) => {
                    const nameA = dateMatches[a].displayName;
                    const nameB = dateMatches[b].displayName;
                    if (nameA === "Other Matches") return 1;
                    if (nameB === "Other Matches") return -1;
                    return nameA.localeCompare(nameB);
                });

                return (
                    <div key={dateKey} className="mb-12">
                        <div className="bg-gray-800 text-white py-2 px-4 rounded-lg mb-6 shadow-sm inline-block">
                            <h2 className="text-lg font-black tracking-wide">
                                {dateGroup.dateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h2>
                        </div>

                        <div className="space-y-8 pl-0 md:pl-4 border-l-0 md:border-l-2 border-gray-100 md:ml-2">
                            {sortedLeagueKeys.map((leagueKey) => {
                                const leagueData = dateMatches[leagueKey];
                                const leagueName = leagueData.displayName;
                                const leagueMatches = leagueData.matches;

                                return (
                                    <div key={leagueKey} className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">{leagueName}</h4>
                                            <div className="h-px flex-grow bg-gray-200"></div>
                                        </div>

                                        <div className="space-y-4">

                                            {layout === "list" ? (
                                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                                                    <table className="w-full text-sm text-left min-w-[700px]">
                                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                                            <tr>
                                                                <th className="py-3 px-4 w-24">Time</th>
                                                                <th className="py-3 px-4 w-24">Status</th>
                                                                <th className="py-3 px-4">Match</th>
                                                                <th className="py-3 px-4">Pick</th>
                                                                <th className="py-3 px-4 text-center">Conf.</th>
                                                                {!readOnly && <th className="py-3 px-4 text-right">Actions</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {leagueMatches.map((match: any) => {
                                                                const isVIP = match.recommendation === "VIP";
                                                                const isInvest = match.recommendation === "INVEST";
                                                                let isHomeFav = false;
                                                                let isAwayFav = false;

                                                                if (match.originalData?.handicap) {
                                                                    isHomeFav = (match.originalData.handicap[0]?.value || 0) < 0;
                                                                    isAwayFav = (match.originalData.handicap[0]?.value || 0) > 0;
                                                                } else if (match.prediction?.handicap) {
                                                                    const isPredFav = match.prediction.handicap.trim().startsWith('-');
                                                                    const isPredDog = match.prediction.handicap.trim().startsWith('+');
                                                                    if (isPredFav) {
                                                                        if (match.prediction.team === match.homeTeam) isHomeFav = true;
                                                                        else if (match.prediction.team === match.awayTeam) isAwayFav = true;
                                                                    } else if (isPredDog) {
                                                                        if (match.prediction.team === match.homeTeam) isAwayFav = true;
                                                                        else if (match.prediction.team === match.awayTeam) isHomeFav = true;
                                                                    }
                                                                }

                                                                const isLocked = readOnly && !isUnlocked && match.id !== freeMatchId;

                                                                return (
                                                                    <tr key={match.id} className="hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0">
                                                                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                                                                            <div className="flex flex-col text-xs font-mono text-gray-500">
                                                                                {match.matchTime ? (
                                                                                    <>
                                                                                        <span className="font-bold text-gray-900">{new Date(match.matchTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                                                        <span>{new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span>{new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-2 align-middle text-center w-16">
                                                                            {match.resultStatus ? (
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <span className={clsx(
                                                                                        "inline-block px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide uppercase whitespace-nowrap",
                                                                                        match.resultStatus === "WIN" ? "bg-green-500 text-white" :
                                                                                            match.resultStatus === "HALF_WIN" ? "bg-green-400 text-white" :
                                                                                                match.resultStatus === "LOSS" ? "bg-red-500 text-white" :
                                                                                                    match.resultStatus === "HALF_LOSS" ? "bg-red-400 text-white" :
                                                                                                        match.resultStatus === "DRAW" ? "bg-gray-500 text-white" :
                                                                                                            "bg-gray-200 text-gray-500"
                                                                                    )}>
                                                                                        {match.resultStatus.replace('_', ' ')}
                                                                                    </span>
                                                                                    {match.actualScore && <span className="text-xs font-mono font-bold">{match.actualScore}</span>}
                                                                                </div>
                                                                            ) : (
                                                                                <span className={clsx(
                                                                                    "inline-block px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide uppercase whitespace-nowrap",
                                                                                    isVIP ? "bg-green-100 text-green-700" :
                                                                                        isInvest ? "bg-yellow-100 text-yellow-800" :
                                                                                            "bg-gray-100 text-gray-400"
                                                                                )}>
                                                                                    {match.recommendation === "VIP" ? "VIP" : match.recommendation === "INVEST" ? "INV" : "-"}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-4 align-middle w-1/3">
                                                                            <div className="flex items-center justify-center w-full">
                                                                                {/* Home */}
                                                                                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                                                                                    <span className={clsx("text-sm font-bold truncate", isHomeFav ? "text-red-600" : "text-gray-900")}>
                                                                                        {match.homeTeam}
                                                                                    </span>
                                                                                    {match.homeTeamLogo ? <img src={match.homeTeamLogo} className="w-6 h-6 object-contain flex-shrink-0" /> : <span className="text-lg">🏠</span>}
                                                                                </div>

                                                                                {/* VS */}
                                                                                <div className="px-3 text-[10px] font-bold text-gray-300">VS</div>

                                                                                {/* Away */}
                                                                                <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                                                                                    {match.awayTeamLogo ? <img src={match.awayTeamLogo} className="w-6 h-6 object-contain flex-shrink-0" /> : <span className="text-lg">✈️</span>}
                                                                                    <span className={clsx("text-sm font-bold truncate", isAwayFav ? "text-red-600" : "text-gray-900")}>
                                                                                        {match.awayTeam}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 align-middle relative">
                                                                            {match.prediction && (
                                                                                <div className={clsx("flex flex-col gap-1 items-start justify-center min-w-[140px]", isLocked && "blur-sm opacity-50 select-none")}>
                                                                                    <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                                                                                        {(match.prediction.team === match.homeTeam ? match.homeTeamLogo : match.awayTeamLogo) && (
                                                                                            <img src={match.prediction.team === match.homeTeam ? match.homeTeamLogo : match.awayTeamLogo} className="w-4 h-4 object-contain" />
                                                                                        )}
                                                                                        <span className="truncate max-w-[120px]">{match.prediction.team}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                                        <span className="bg-blue-50 text-blue-700 px-1 rounded font-mono font-bold">HDP {match.prediction.handicap}</span>
                                                                                        <span>@{match.prediction.odds.toFixed(2)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {isLocked && (
                                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                    <span className="text-xl bg-white/70 rounded-full p-1 shadow-sm" title="VIP Only">🔒</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-4 align-middle text-center relative">
                                                                            <div className={clsx("font-black text-sm", isVIP ? "text-green-600" : isInvest ? "text-yellow-600" : "text-gray-600", isLocked && "blur-sm opacity-50 select-none")}>
                                                                                {match.score}%
                                                                            </div>
                                                                        </td>
                                                                        {!readOnly && (
                                                                            <td className="py-3 px-4 align-middle text-right">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    {onEdit && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                onEdit(match);
                                                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                                            }}
                                                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                                            title="Edit"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                                        </button>
                                                                                    )}
                                                                                    {onUpdateResult && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setSelectedMatchForResult(match);
                                                                                                setIsResultModalOpen(true);
                                                                                            }}
                                                                                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                                                            title="Set Result"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                                                        </button>
                                                                                    )}
                                                                                    {onDelete && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                onDelete(match.id);
                                                                                            }}
                                                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                                            title="Delete"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className={clsx(
                                                    "grid gap-3",
                                                    layout === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"
                                                )}>
                                                    {leagueMatches.map((match: any) => {
                                                        const isVIP = match.recommendation === "VIP";
                                                        const isInvest = match.recommendation === "INVEST";
                                                        let isHomeFav = false;
                                                        let isAwayFav = false;

                                                        if (match.originalData?.handicap) {
                                                            isHomeFav = (match.originalData.handicap[0]?.value || 0) < 0;
                                                            isAwayFav = (match.originalData.handicap[0]?.value || 0) > 0;
                                                        } else if (match.prediction?.handicap) {
                                                            const isPredFav = match.prediction.handicap.trim().startsWith('-');
                                                            const isPredDog = match.prediction.handicap.trim().startsWith('+');
                                                            if (isPredFav) {
                                                                if (match.prediction.team === match.homeTeam) isHomeFav = true;
                                                                else if (match.prediction.team === match.awayTeam) isAwayFav = true;
                                                            } else if (isPredDog) {
                                                                if (match.prediction.team === match.homeTeam) isAwayFav = true;
                                                                else if (match.prediction.team === match.awayTeam) isHomeFav = true;
                                                            }
                                                        }

                                                        const isHomeFavGrid = isHomeFav;
                                                        const isAwayFavGrid = isAwayFav;
                                                        const isLocked = readOnly && !isUnlocked && match.id !== freeMatchId;

                                                        return (
                                                            <div
                                                                key={match.id}
                                                                className={clsx(
                                                                    "relative group overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1",
                                                                    "bg-white border hover:shadow-xl",
                                                                    isVIP ? "border-green-500 shadow-md shadow-green-100" :
                                                                        isInvest ? "border-yellow-500 shadow-md shadow-yellow-100" :
                                                                            "border-gray-200 shadow-sm"
                                                                )}
                                                            >
                                                                {/* Card Content */}
                                                                <div className="p-4">
                                                                    {/* Header: Badge & Time */}
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="text-[10px] text-gray-400 font-mono flex flex-col gap-0.5 leading-none">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0"></span>
                                                                                {match.matchTime ? (
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-bold text-blue-600 leading-tight">
                                                                                            {new Date(match.matchTime).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                                                        </span>
                                                                                        <span className="text-[9px] opacity-75">
                                                                                            {new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                        </span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-bold text-gray-400 leading-tight">
                                                                                            {new Date(match.timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                                                        </span>
                                                                                        <span className="text-[9px] opacity-75">
                                                                                            {new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Status Badge */}
                                                                        <span className={clsx(
                                                                            "px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase shadow-sm whitespace-nowrap ml-1",
                                                                            isVIP ? "bg-green-100 text-green-700 border border-green-200" :
                                                                                isInvest ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                                                                                    "bg-gray-100 text-gray-600 border border-gray-200"
                                                                        )}>
                                                                            {match.recommendation === "VIP" ? "ทีเด็ด" :
                                                                                match.recommendation === "INVEST" ? "น่าลงทุน" :
                                                                                    "รอก่อน"}
                                                                        </span>
                                                                    </div>

                                                                    {/* Teams with Logos (Compact) */}
                                                                    <div className="space-y-2 mb-4">
                                                                        {/* Home Team */}
                                                                        <div className="flex flex-col items-center justify-center text-center gap-1 group/team">
                                                                            {match.homeTeamLogo ? (
                                                                                <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-10 h-10 object-contain" />
                                                                            ) : (
                                                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-base">🏠</div>
                                                                            )}
                                                                            <span className={clsx(
                                                                                "font-bold text-sm leading-tight line-clamp-1 px-1",
                                                                                (match.originalData?.handicap?.[0]?.value || 0) < 0 ? "text-red-600" : "text-gray-900"
                                                                            )}>
                                                                                {match.homeTeam}
                                                                            </span>
                                                                        </div>

                                                                        {/* VS Separator (Compact) */}
                                                                        <div className="flex justify-center items-center relative py-1">
                                                                            <div className="absolute left-0 right-0 h-px bg-gray-100"></div>
                                                                            <span className="relative bg-white px-2 text-[10px] text-gray-300 font-bold uppercase tracking-widest">VS</span>
                                                                        </div>

                                                                        {/* Away Team */}
                                                                        <div className="flex flex-col items-center justify-center text-center gap-1 group/team">
                                                                            {match.awayTeamLogo ? (
                                                                                <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-10 h-10 object-contain" />
                                                                            ) : (
                                                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-base">✈️</div>
                                                                            )}
                                                                            <span className={clsx(
                                                                                "font-bold text-sm leading-tight line-clamp-1 px-1",
                                                                                (match.originalData?.handicap?.[0]?.value || 0) > 0 ? "text-red-600" : "text-gray-900"
                                                                            )}>
                                                                                {match.awayTeam}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* AI Prediction Section (Compact) */}
                                                                    {match.prediction && (() => {
                                                                        const isPickFav = (match.prediction.team === match.homeTeam && isHomeFavGrid) ||
                                                                            (match.prediction.team === match.awayTeam && isAwayFavGrid);

                                                                        return (
                                                                            <div className={clsx(
                                                                                "mb-3 rounded-lg p-3 text-white shadow relative overflow-hidden",
                                                                                isLocked ? "bg-gradient-to-r from-gray-700 to-gray-900" :
                                                                                    isPickFav ? "bg-gradient-to-r from-red-600 to-rose-700" : "bg-gradient-to-r from-blue-600 to-indigo-700"
                                                                            )}>
                                                                                {isLocked ? (
                                                                                    <div className="flex flex-col items-center justify-center py-2 relative z-10">
                                                                                        <span className="text-2xl mb-1">🔒</span>
                                                                                        <span className="text-xs font-bold text-white/90">VIP ONLY</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="absolute top-0 right-0 opacity-10 transform translate-x-2 -translate-y-2">
                                                                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                                                                                        </div>

                                                                                        <div className="relative z-10">
                                                                                            <div className={clsx("text-[9px] font-bold tracking-wider uppercase mb-1", isPickFav ? "text-red-100" : "text-blue-100")}>AI Recommendation</div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {(match.prediction.team === match.homeTeam ? match.homeTeamLogo : match.awayTeamLogo) && (
                                                                                                    <div className="w-8 h-8 bg-white rounded-full p-0.5 shadow-sm flex items-center justify-center flex-shrink-0">
                                                                                                        <img
                                                                                                            src={match.prediction.team === match.homeTeam ? match.homeTeamLogo : match.awayTeamLogo}
                                                                                                            alt="Pick"
                                                                                                            className="w-full h-full object-contain"
                                                                                                        />
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="min-w-0">
                                                                                                    <div className="font-black text-sm leading-tight mb-0.5 truncate">{match.prediction.team}</div>
                                                                                                    <div className={clsx("flex items-center gap-1.5 text-[10px] font-medium", isPickFav ? "text-red-100" : "text-blue-100")}>
                                                                                                        <span className="bg-white/20 px-1.5 py-px rounded text-white flex items-center gap-1">
                                                                                                            HDP {match.prediction.handicap}
                                                                                                        </span>
                                                                                                        <span>@{match.prediction.odds.toFixed(2)}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 relative">
                                                                        <div className={clsx("bg-gray-50 rounded-lg p-2 text-center", isLocked && "blur-sm opacity-50 select-none")}>
                                                                            <div className="text-[10px] text-gray-400 mb-0.5 font-semibold">CONFIDENCE</div>
                                                                            <div className={clsx(
                                                                                "text-lg font-black",
                                                                                isVIP ? "text-green-600" : isInvest ? "text-yellow-600" : "text-gray-500"
                                                                            )}>
                                                                                {match.score}%
                                                                            </div>
                                                                        </div>

                                                                        <div className={clsx("bg-gray-50 rounded-lg p-2 text-center", isLocked && "blur-sm opacity-50 select-none")}>
                                                                            <div className="text-[10px] text-gray-400 mb-0.5 font-semibold">ความเชื่อมั่น</div>
                                                                            <div className={clsx(
                                                                                "text-xs font-bold font-mono uppercase mt-1",
                                                                                match.details.handicapScore > 60 ? "text-green-600" :
                                                                                    match.details.handicapScore < 40 ? "text-red-600" : "text-yellow-600"
                                                                            )}>
                                                                                {match.details.handicapScore > 60 ? "ปลอดภัย" :
                                                                                    match.details.handicapScore < 40 ? "เสี่ยง" : "ทั่วไป"}
                                                                            </div>
                                                                        </div>

                                                                        {isLocked && (
                                                                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                                                                <span className="bg-white/80 text-gray-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                                                                    <span>🔒</span> สงวนสิทธิ์
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Set Result Button */}
                                                                {!readOnly && onUpdateResult && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedMatchForResult(match);
                                                                            setIsResultModalOpen(true);
                                                                        }}
                                                                        className="absolute bottom-4 right-24 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-green-50 rounded-full text-green-500"
                                                                        title="Set Result"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                                    </button>
                                                                )}

                                                                {/* Edit Button */}
                                                                {!readOnly && onDelete && onEdit && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onEdit(match);
                                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                        }}
                                                                        className={clsx(
                                                                            "absolute bottom-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-blue-50 rounded-full cursor-pointer",
                                                                            match.originalData ? "text-blue-500" : "text-yellow-500"
                                                                        )}
                                                                        title={match.originalData ? "Edit Match" : "Partial Edit (Re-enter Stats)"}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                    </button>
                                                                )}

                                                                {/* Delete Button (Only for Admin) */}
                                                                {!readOnly && onDelete && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDelete(match.id);
                                                                        }}
                                                                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full text-red-500"
                                                                        title="Delete Match"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
