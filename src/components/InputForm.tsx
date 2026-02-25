"use client";

import { useState, useEffect } from "react";
import { MatchData } from "../types/analysis";

interface InputFormProps {
    onAnalyze: (data: MatchData) => void;
    initialData?: MatchData | null;
}

// Local state interface to allow string inputs (for "0", "0.", etc.)
interface FormMatchData {
    leagueName?: string;
    matchDate?: string;
    matchTime?: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    // Allow string for input fields to handle "0" and decimals better
    handicap: {
        value: string | number;
        homeOdd: string | number;
        awayOdd: string | number;
    }[];
    stats: {
        home: {
            last5: string[];
            last5Home: string[];
            goals: { scored: string | number; conceded: string | number };
        };
        away: {
            last5: string[];
            last5Away: string[];
            goals: { scored: string | number; conceded: string | number };
        };
    };
    history: { h2h: string[] };
    odds: {
        home: string | number;
        draw: string | number;
        away: string | number;
    };
    standings: {
        home: { rank: string | number; points: string | number; goalDiff: string | number };
        away: { rank: string | number; points: string | number; goalDiff: string | number };
    };
}

export default function InputForm({ onAnalyze, initialData }: InputFormProps) {
    // Initialize with empty strings or defaults
    const [formData, setFormData] = useState<FormMatchData>({
        homeTeam: "",
        awayTeam: "",
        handicap: [{ value: "0", homeOdd: "0.90", awayOdd: "0.90" }],
        stats: {
            home: { last5: [], last5Home: [], goals: { scored: 0, conceded: 0 } },
            away: { last5: [], last5Away: [], goals: { scored: 0, conceded: 0 } },
        },
        history: { h2h: [] },
        odds: { home: 0, draw: 0, away: 0 },
        standings: {
            home: { rank: 0, points: 0, goalDiff: 0 },
            away: { rank: 0, points: 0, goalDiff: 0 },
        }
    });

    const [last5Home, setLast5Home] = useState("");
    const [last5HomeSpecific, setLast5HomeSpecific] = useState(""); // Specific (Home at Home)
    const [last5Away, setLast5Away] = useState("");
    const [last5AwaySpecific, setLast5AwaySpecific] = useState(""); // Specific (Away at Away)
    const [h2h, setH2h] = useState("");

    // Explicitly track handicap side (Home/Away)
    const [handicapSides, setHandicapSides] = useState<("home" | "away")[]>(["home"]);

    // Load initial data if provided (Edit Mode)
    useEffect(() => {
        if (initialData) {
            // Map MatchData back to FormMatchData (numbers to strings mostly)
            setFormData({
                leagueName: initialData.leagueName,
                matchDate: initialData.matchDate,
                matchTime: initialData.matchTime,
                homeTeam: initialData.homeTeam,
                awayTeam: initialData.awayTeam,
                homeTeamLogo: initialData.homeTeamLogo,
                awayTeamLogo: initialData.awayTeamLogo,
                handicap: (initialData.handicap || []).map(h => ({
                    value: Math.abs(h.value).toString(),
                    homeOdd: h.homeOdd.toString(),
                    awayOdd: h.awayOdd.toString()
                })),
                stats: {
                    home: {
                        last5: initialData.stats.home.last5,
                        last5Home: initialData.stats.home.last5Home,
                        goals: {
                            scored: initialData.stats.home.goals.scored.toString(),
                            conceded: initialData.stats.home.goals.conceded.toString()
                        }
                    },
                    away: {
                        last5: initialData.stats.away.last5,
                        last5Away: initialData.stats.away.last5Away,
                        goals: {
                            scored: initialData.stats.away.goals.scored.toString(),
                            conceded: initialData.stats.away.goals.conceded.toString()
                        }
                    }
                },
                history: { h2h: initialData.history.h2h },
                odds: {
                    home: initialData.odds.home.toString(),
                    draw: initialData.odds.draw.toString(),
                    away: initialData.odds.away.toString()
                },
                standings: {
                    home: {
                        rank: initialData.standings.home.rank.toString(),
                        points: initialData.standings.home.points.toString(),
                        goalDiff: initialData.standings.home.goalDiff.toString()
                    },
                    away: {
                        rank: initialData.standings.away.rank.toString(),
                        points: initialData.standings.away.points.toString(),
                        goalDiff: initialData.standings.away.goalDiff.toString()
                    }
                }
            });

            // Set simple string states
            setLast5Home(initialData.stats.home.last5.join(""));
            setLast5HomeSpecific(initialData.stats.home.last5Home.join(""));
            setLast5Away(initialData.stats.away.last5.join(""));
            setLast5AwaySpecific(initialData.stats.away.last5Away.join(""));
            setH2h(initialData.history.h2h.join(""));

            // Set handicap sides
            const sides = (initialData.handicap || []).map(h => h.value < 0 ? "home" as const : "away" as const);
            setHandicapSides(sides);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            // Reset to defaults if initialData is null (e.g. Cancel Edit)
            setFormData({
                homeTeam: "",
                awayTeam: "",
                handicap: [{ value: "0", homeOdd: "0.90", awayOdd: "0.90" }],
                stats: {
                    home: { last5: [], last5Home: [], goals: { scored: 0, conceded: 0 } },
                    away: { last5: [], last5Away: [], goals: { scored: 0, conceded: 0 } },
                },
                history: { h2h: [] },
                odds: { home: 0, draw: 0, away: 0 },
                standings: {
                    home: { rank: 0, points: 0, goalDiff: 0 },
                    away: { rank: 0, points: 0, goalDiff: 0 },
                }
            });
            setLast5Home("");
            setLast5HomeSpecific("");
            setLast5Away("");
            setLast5AwaySpecific("");
            setH2h("");
            setHandicapSides(["home"]);
        }
    }, [initialData]);

    const handleStatChange = (
        field: "last5Home" | "last5HomeSpecific" | "last5Away" | "last5AwaySpecific" | "h2h",
        value: string
    ) => {
        if (field === "last5Home") setLast5Home(value.toUpperCase());
        if (field === "last5HomeSpecific") setLast5HomeSpecific(value.toUpperCase());
        if (field === "last5Away") setLast5Away(value.toUpperCase());
        if (field === "last5AwaySpecific") setLast5AwaySpecific(value.toUpperCase());
        if (field === "h2h") setH2h(value.toUpperCase());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parseStats = (str: string) => str.split("").filter(c => ["W", "D", "L"].includes(c));

        // Helper to safely parse numbers
        const safeParse = (val: string | number) => {
            if (typeof val === "number") return val;
            const parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Reconstruct MatchData with numbers
        const data: MatchData = {
            leagueName: formData.leagueName,
            matchDate: formData.matchDate,
            matchTime: formData.matchTime,
            homeTeam: formData.homeTeam,
            awayTeam: formData.awayTeam,
            homeTeamLogo: formData.homeTeamLogo,
            awayTeamLogo: formData.awayTeamLogo,
            handicap: formData.handicap.map((h, index) => {
                const rawVal = Math.abs(safeParse(h.value));
                // Apply sign based on side
                const isHomeFav = handicapSides[index] === "home";
                return {
                    value: isHomeFav ? -rawVal : rawVal,
                    homeOdd: safeParse(h.homeOdd),
                    awayOdd: safeParse(h.awayOdd),
                };
            }),
            stats: {
                home: {
                    last5: parseStats(last5Home),
                    last5Home: parseStats(last5HomeSpecific),
                    goals: {
                        scored: safeParse(formData.stats.home.goals.scored),
                        conceded: safeParse(formData.stats.home.goals.conceded),
                    },
                },
                away: {
                    last5: parseStats(last5Away),
                    last5Away: parseStats(last5AwaySpecific),
                    goals: {
                        scored: safeParse(formData.stats.away.goals.scored),
                        conceded: safeParse(formData.stats.away.goals.conceded),
                    },
                },
            },
            history: { h2h: parseStats(h2h) },
            odds: {
                home: safeParse(formData.odds.home),
                draw: safeParse(formData.odds.draw),
                away: safeParse(formData.odds.away),
            },
            standings: {
                home: {
                    rank: safeParse(formData.standings.home.rank),
                    points: safeParse(formData.standings.home.points),
                    goalDiff: safeParse(formData.standings.home.goalDiff),
                },
                away: {
                    rank: safeParse(formData.standings.away.rank),
                    points: safeParse(formData.standings.away.points),
                    goalDiff: safeParse(formData.standings.away.goalDiff),
                },
            }
        };
        onAnalyze(data);
    };

    const [dateDisplay, setDateDisplay] = useState("");

    // Sync matchDate to dateDisplay when formData updates (e.g. initialData load)
    useEffect(() => {
        if (formData.matchDate) {
            const dateObj = new Date(formData.matchDate);
            if (!isNaN(dateObj.getTime())) {
                setDateDisplay(dateObj.toLocaleDateString('en-GB')); // DD/MM/YYYY
            } else {
                setDateDisplay(formData.matchDate); // Keep as is if invalid/partial
            }
        } else {
            setDateDisplay("");
        }
    }, [formData.matchDate]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Match Input</h2>

            {/* League & Teams & Date/Time */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700">League Name / ชื่อลีก (Optional)</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="เช่น Premier League, พรีเมียร์ลีก"
                        value={formData.leagueName || ""}
                        onChange={(e) => setFormData({ ...formData, leagueName: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, leagueName: e.target.value.trim() })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Match Date / วันที่แข่ง (DD/MM/YYYY)</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        placeholder="DD/MM/YYYY (e.g. 19/02/2026)"
                        value={dateDisplay}
                        onChange={(e) => setDateDisplay(e.target.value)}
                        onBlur={(e) => {
                            const val = e.target.value.trim();
                            // Try parsing DD/MM/YYYY
                            const parts = val.split(/[\/\-\.]/); // Allow / - or .
                            if (parts.length === 3) {
                                const d = parseInt(parts[0]);
                                const m = parseInt(parts[1]);
                                const y = parseInt(parts[2]);
                                if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                                    // Basic validation
                                    if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900) {
                                        const iso = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                                        setFormData({ ...formData, matchDate: iso });
                                        // Display will auto-update via useEffect or we can force format here if we want immediate feedback
                                        // But useEffect will handle it safely.
                                        return;
                                    }
                                }
                            }
                            // If cleared
                            if (!val) {
                                setFormData({ ...formData, matchDate: "" });
                            }
                            // If invalid, we just leave it in dateDisplay (user sees what they typed), 
                            // but matchDate remains unchanged (or we could clear it?)
                            // Better allow user to fix.
                        }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Match Time / เวลาเตะ</label>
                    <input
                        type="time"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                        value={formData.matchTime || ""}
                        onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Home Team</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        value={formData.homeTeam}
                        onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                    />
                    <label className="block text-xs text-gray-500 mt-2 mb-1">Logo URL (Optional)</label>
                    <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-xs"
                        value={formData.homeTeamLogo || ""}
                        onChange={(e) => setFormData({ ...formData, homeTeamLogo: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Away Team</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        value={formData.awayTeam}
                        onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                    />
                    <label className="block text-xs text-gray-500 mt-2 mb-1">Logo URL (Optional)</label>
                    <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-xs"
                        value={formData.awayTeamLogo || ""}
                        onChange={(e) => setFormData({ ...formData, awayTeamLogo: e.target.value })}
                    />
                </div>
            </div>

            {/* Handicap Section */}
            <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-indigo-600">Current Handicap & Payouts</h3>
                    <button
                        type="button"
                        onClick={() => {
                            const current = [...formData.handicap];
                            setFormData({
                                ...formData,
                                handicap: [...current, { value: "0", homeOdd: "0.90", awayOdd: "0.90" }]
                            });
                            setHandicapSides([...handicapSides, "home"]);
                        }}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-bold"
                    >
                        + Add Price (เพิ่มราคา)
                    </button>
                </div>

                {formData.handicap.map((hdp, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg relative">
                        {formData.handicap.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newHandicap = formData.handicap.filter((_, i) => i !== index);
                                    setFormData({ ...formData, handicap: newHandicap });
                                    setHandicapSides(handicapSides.filter((_, i) => i !== index));
                                }}
                                className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {/* Handicap Value & Favorite */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Handicap #{index + 1}</label>
                            <div className="flex flex-col gap-2">
                                <div className="flex rounded-md shadow-sm" role="group">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sides = [...handicapSides];
                                            sides[index] = "home";
                                            setHandicapSides(sides);
                                        }}
                                        className={`px-3 py-2 text-xs font-bold rounded-l-md border flex-1 transition-colors ${handicapSides[index] === "home"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-inner"
                                            : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        🏠 Home Fav
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sides = [...handicapSides];
                                            sides[index] = "away";
                                            setHandicapSides(sides);
                                        }}
                                        className={`px-3 py-2 text-xs font-bold rounded-r-md border-t border-b border-r flex-1 transition-colors ${handicapSides[index] === "away"
                                            ? "bg-red-600 text-white border-red-600 shadow-inner"
                                            : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        ✈️ Away Fav
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    placeholder="0, 0.5, 1.0"
                                    className="w-full p-2 border border-blue-200 rounded-md text-center font-mono text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    required
                                    value={hdp.value} // Directly bind string/number value
                                    onChange={(e) => {
                                        const list = [...formData.handicap];
                                        // Store raw value (string) to allow "0." and "0"
                                        list[index] = { ...list[index], value: e.target.value };
                                        setFormData({ ...formData, handicap: list });
                                    }}
                                />
                            </div>
                        </div>

                        {/* Payouts (Odds) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Payouts #{index + 1}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 mb-1 text-center">Home</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.90"
                                        className="w-full p-2 border border-gray-300 rounded-md text-center font-mono bg-blue-50 text-gray-900"
                                        required
                                        value={hdp.homeOdd}
                                        onChange={(e) => {
                                            const list = [...formData.handicap];
                                            list[index] = { ...list[index], homeOdd: e.target.value };
                                            setFormData({ ...formData, handicap: list });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 mb-1 text-center">Away</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.95"
                                        className="w-full p-2 border border-gray-300 rounded-md text-center font-mono bg-red-50 text-gray-900"
                                        required
                                        value={hdp.awayOdd}
                                        onChange={(e) => {
                                            const list = [...formData.handicap];
                                            list[index] = { ...list[index], awayOdd: e.target.value };
                                            setFormData({ ...formData, handicap: list });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Standings */}
            <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold mb-3 text-teal-600">League Standings</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* Home Standings */}
                    <div className="space-y-3">
                        <label className="block text-xs uppercase text-gray-500 font-bold">Home Team Standings</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1">Rank</label>
                                <input
                                    type="number"
                                    className="w-full p-1 border border-gray-300 rounded text-center"
                                    value={formData.standings.home.rank}
                                    onChange={(e) => setFormData({ ...formData, standings: { ...formData.standings, home: { ...formData.standings.home, rank: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1">Points</label>
                                <input
                                    type="number"
                                    className="w-full p-1 border border-gray-300 rounded text-center"
                                    value={formData.standings.home.points}
                                    onChange={(e) => setFormData({ ...formData, standings: { ...formData.standings, home: { ...formData.standings.home, points: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1">GD</label>
                                <input
                                    type="number"
                                    className="w-full p-1 border border-gray-300 rounded text-center"
                                    value={formData.standings.home.goalDiff}
                                    onChange={(e) => setFormData({ ...formData, standings: { ...formData.standings, home: { ...formData.standings.home, goalDiff: e.target.value } } })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Away Standings */}
                    <div className="space-y-3">
                        <label className="block text-xs uppercase text-gray-500 font-bold">Away Team Standings</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1">Rank</label>
                                <input
                                    type="number"
                                    className="w-full p-1 border border-gray-300 rounded text-center"
                                    value={formData.standings.away.rank}
                                    onChange={(e) => setFormData({ ...formData, standings: { ...formData.standings, away: { ...formData.standings.away, rank: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1">Points</label>
                                <input
                                    type="number"
                                    className="w-full p-1 border border-gray-300 rounded text-center"
                                    value={formData.standings.away.points}
                                    onChange={(e) => setFormData({ ...formData, standings: { ...formData.standings, away: { ...formData.standings.away, points: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1">GD</label>
                                <input
                                    type="number"
                                    className="w-full p-1 border border-gray-300 rounded text-center"
                                    value={formData.standings.away.goalDiff}
                                    onChange={(e) => setFormData({ ...formData, standings: { ...formData.standings, away: { ...formData.standings.away, goalDiff: e.target.value } } })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats (Last 5 & Goals) */}
            <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold mb-3 text-green-600">Stats Dimension (Last 5: W/D/L)</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* Home Team Stats */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Home (Overall)</label>
                            <input
                                type="text"
                                placeholder="e.g. WWDLW"
                                maxLength={5}
                                className="w-full p-2 border border-gray-300 rounded-md uppercase font-mono bg-white text-gray-900"
                                value={last5Home}
                                onChange={(e) => handleStatChange("last5Home", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-blue-600 font-bold mb-1">Home (At Home)</label>
                            <input
                                type="text"
                                placeholder="e.g. WWWWW"
                                maxLength={5}
                                className="w-full p-2 border border-blue-200 rounded-md uppercase font-mono bg-blue-50 text-gray-900"
                                value={last5HomeSpecific}
                                onChange={(e) => handleStatChange("last5HomeSpecific", e.target.value)}
                            />
                        </div>
                        {/* Home Goals Goal Inputs */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">GOALS (TOTAL 5 MATCHES)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Scored</label>
                                    <input
                                        type="number" step="1"
                                        className="w-full p-1 border border-gray-300 rounded text-center"
                                        value={formData.stats.home.goals.scored}
                                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, home: { ...formData.stats.home, goals: { ...formData.stats.home.goals, scored: e.target.value } } } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Conceded</label>
                                    <input
                                        type="number" step="1"
                                        className="w-full p-1 border border-gray-300 rounded text-center"
                                        value={formData.stats.home.goals.conceded}
                                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, home: { ...formData.stats.home, goals: { ...formData.stats.home.goals, conceded: e.target.value } } } })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Away Team Stats */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Away (Overall)</label>
                            <input
                                type="text"
                                placeholder="e.g. LLDDW"
                                maxLength={5}
                                className="w-full p-2 border border-gray-300 rounded-md uppercase font-mono bg-white text-gray-900"
                                value={last5Away}
                                onChange={(e) => handleStatChange("last5Away", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-red-600 font-bold mb-1">Away (At Away)</label>
                            <input
                                type="text"
                                placeholder="e.g. LLLLL"
                                maxLength={5}
                                className="w-full p-2 border border-red-200 rounded-md uppercase font-mono bg-red-50 text-gray-900"
                                value={last5AwaySpecific}
                                onChange={(e) => handleStatChange("last5AwaySpecific", e.target.value)}
                            />
                        </div>

                        {/* Away Goals Inputs */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">GOALS (TOTAL 5 MATCHES)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Scored</label>
                                    <input
                                        type="number" step="1"
                                        className="w-full p-1 border border-gray-300 rounded text-center"
                                        value={formData.stats.away.goals.scored}
                                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, away: { ...formData.stats.away, goals: { ...formData.stats.away.goals, scored: e.target.value } } } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Conceded</label>
                                    <input
                                        type="number" step="1"
                                        className="w-full p-1 border border-gray-300 rounded text-center"
                                        value={formData.stats.away.goals.conceded}
                                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, away: { ...formData.stats.away, goals: { ...formData.stats.away.goals, conceded: e.target.value } } } })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historical */}
            <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold mb-3 text-purple-600">Historical (H2H Last 5)</h3>
                <div>
                    <label className="block text-xs uppercase text-gray-500 mb-1">Head to Head</label>
                    <input
                        type="text"
                        placeholder="e.g. WWDLL"
                        maxLength={5}
                        className="w-full p-2 border border-gray-300 rounded-md uppercase font-mono bg-white text-gray-900"
                        value={h2h}
                        onChange={(e) => handleStatChange("h2h", e.target.value)}
                    />
                </div>
            </div>

            {/* Implied Probabilities */}
            <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold mb-3 text-orange-600">Implied Probability Odds</h3>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs text-center text-gray-500 mb-1">Home</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full p-2 border border-gray-300 rounded-md text-right font-mono bg-white text-gray-900"
                            value={formData.odds.home}
                            onChange={(e) => setFormData({ ...formData, odds: { ...formData.odds, home: e.target.value } })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-center text-gray-500 mb-1">Draw</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full p-2 border border-gray-300 rounded-md text-right font-mono bg-white text-gray-900"
                            value={formData.odds.draw}
                            onChange={(e) => setFormData({ ...formData, odds: { ...formData.odds, draw: e.target.value } })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-center text-gray-500 mb-1">Away</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full p-2 border border-gray-300 rounded-md text-right font-mono bg-white text-gray-900"
                            value={formData.odds.away}
                            onChange={(e) => setFormData({ ...formData, odds: { ...formData.odds, away: e.target.value } })}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
                Analyze Match
            </button>
        </form >
    );
}
