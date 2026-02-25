
import { calculateAnalysis } from "./utils/calculate";
import { MatchData } from "./types/analysis";

const mockData: MatchData = {
    homeTeam: "Qarabağ",
    awayTeam: "Newcastle",
    handicap: [
        { value: 1.25, homeOdd: 0.9, awayOdd: 0.9 }, // Away Fav (Home gets +1.25)
        { value: 1.5, homeOdd: 0.9, awayOdd: 0.9 }
    ],
    stats: {
        home: { last5: ["W", "W", "W", "W", "W"], last5Home: ["W", "W", "W", "W", "W"], goals: { scored: 10, conceded: 0 } },
        away: { last5: ["L", "L", "L", "L", "L"], last5Away: ["L", "L", "L", "L", "L"], goals: { scored: 0, conceded: 10 } }
    },
    history: { h2h: [] },
    odds: { home: 3.0, draw: 3.0, away: 2.0 },
    standings: {
        home: { rank: 1, points: 10, goalDiff: 10 },
        away: { rank: 10, points: 0, goalDiff: -10 }
    }
};

const result = calculateAnalysis(mockData);
console.log("Prediction:", result.prediction);
console.log("Recommended:", result.recommendation);
console.log("Score:", result.score);

// Test Case 2: Negative Value (Home Fav)
const mockData2: MatchData = {
    ...mockData,
    handicap: [{ value: -1.25, homeOdd: 0.9, awayOdd: 0.9 }]
};
const result2 = calculateAnalysis(mockData2);
console.log("Prediction 2 (Home Fav -1.25):", result2.prediction);
