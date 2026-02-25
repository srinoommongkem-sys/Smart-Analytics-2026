// PriceData removed as requested


export interface StatsData {
    home: {
        last5: string[]; // "W", "D", "L" (Overall)
        last5Home: string[]; // "W", "D", "L" (Home Matches Only)
        goals: { scored: number; conceded: number }; // Avg per match (Last 5)
    };
    away: {
        last5: string[]; // (Overall)
        last5Away: string[]; // (Away Matches Only)
        goals: { scored: number; conceded: number }; // Avg per match (Last 5)
    };
}

export interface HistoryData {
    h2h: string[]; // "W", "D", "L" (from perspective of Home team or primary team)
}

export interface MatchData {
    leagueName?: string; // Optional League Name
    matchDate?: string; // YYYY-MM-DD
    matchTime?: string; // HH:mm
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo?: string; // Optional URL
    awayTeamLogo?: string; // Optional URL
    // Simplified Handicap & Odds (Array for multiple lines)
    handicap: {
        value: number; // Current Handicap (Negative = Home Fav, Positive = Away Fav)
        homeOdd: number; // Current Home Payout
        awayOdd: number; // Current Away Payout
    }[];
    /* Removed complex opening/live history
    handicapOdds: {
        opening: number;
        live: number;
    }; */
    stats: StatsData;
    history: HistoryData;
    odds: {
        home: number;
        draw: number;
        away: number;
    };
    standings: {
        home: { rank: number; points: number; goalDiff: number };
        away: { rank: number; points: number; goalDiff: number };
    };
}

export type Recommendation = "VIP" | "INVEST" | "WAIT";

export interface AnalysisResult {
    id: string;
    timestamp: number; // Analysis creation time
    matchTime?: number; // Scheduled match time (epoch)
    leagueName?: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    score: number;
    oddsShift: number; // percentage shift in handicap payout (odds)
    impliedProbabilities: {
        home: number;
        draw: number;
        away: number;
    };
    recommendation: Recommendation;
    details: {
        oddsScore: number; // Replaces priceScore
        handicapScore: number;
        statsScore: number;
        historyScore: number;
        goalScore: number;
        classScore: number;
    };
    prediction: {
        team: string; // "Home" or "Away"
        handicap: string; // e.g. "-0.5", "+1.0"
        odds: number;
        reason?: string;
    };
    originalData?: MatchData; // Store original input for editing
    actualScore?: string; // e.g. "2-1"
    resultStatus?: "WIN" | "LOSS" | "DRAW" | "HALF_WIN" | "HALF_LOSS" | "VOID";
}
