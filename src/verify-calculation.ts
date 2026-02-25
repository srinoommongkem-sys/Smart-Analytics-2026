
import { calculateAnalysis } from './utils/calculate';
import { MatchData } from './types/analysis';

const mockData: MatchData = {
    homeTeam: "Strong Attack",
    awayTeam: "Weak Defense",
    handicap: { opening: -0.5, live: -0.75 }, // Favors home
    handicapOdds: { opening: 0.90, live: 0.80 }, // Odds drop = money flow in
    stats: {
        home: {
            last5: ["W", "W", "W", "W", "W"],
            last5Home: ["W", "W", "W", "W", "W"],
            goals: { scored: 3.0, conceded: 0.5 } // High scoring
        },
        away: {
            last5: ["L", "L", "L", "L", "L"],
            last5Away: ["L", "L", "L", "L", "L"],
            goals: { scored: 0.5, conceded: 3.0 } // High conceding
        }
    },
    history: { h2h: ["W", "W", "W", "W", "W"] },
    odds: { home: 1.5, draw: 4.0, away: 6.0 }
};

const result = calculateAnalysis(mockData);
console.log("Final Score:", result.score);
console.log("Details:", JSON.stringify(result.details, null, 2));

// Expected:
// goalScore should be high (close to 100) because Home scores 3 and Away concedes 3.
// details should include goalScore.
