
import { calculateAnalysis } from './utils/calculate';
import { MatchData } from './types/analysis';

const baseData: MatchData = {
    homeTeam: "Home",
    awayTeam: "Away",
    handicap: [{ value: -0.5, homeOdd: 0.90, awayOdd: -0.90 }],
    stats: {
        home: { last5: ["D", "D", "D", "D", "D"], last5Home: ["D", "D", "D", "D", "D"], goals: { scored: 1, conceded: 1 } },
        away: { last5: ["D", "D", "D", "D", "D"], last5Away: ["D", "D", "D", "D", "D"], goals: { scored: 1, conceded: 1 } }
    },
    history: { h2h: ["D", "D", "D", "D", "D"] },
    odds: { home: 2.0, draw: 3.0, away: 3.5 },
    standings: {
        home: { rank: 10, points: 30, goalDiff: 0 },
        away: { rank: 10, points: 30, goalDiff: 0 }
    }
};

// Case 1: Equal teams (Rank 10 vs 10, GD 0 vs 0)
const result1 = calculateAnalysis(baseData);
console.log("Case 1 (Equal):", result1.score, "ClassScore:", result1.details.classScore);

// Case 2: Home Advantage (Rank 1 vs 20, GD +20 vs -20)
const case2Data = {
    ...baseData,
    standings: {
        home: { rank: 1, points: 60, goalDiff: 20 },
        away: { rank: 20, points: 10, goalDiff: -20 }
    }
};
const result2 = calculateAnalysis(case2Data);
console.log("Case 2 (Home Top vs Away Bottom):", result2.score, "ClassScore:", result2.details.classScore);

// Case 3: Form vs Class
// Away has better form (WWW), but Home is better class (Rank 1 vs 10)
const case3Data = {
    ...baseData,
    stats: {
        home: { last5: ["L", "L", "L", "L", "L"], last5Home: ["L", "L", "L", "L", "L"], goals: { scored: 0, conceded: 2 } },
        away: { last5: ["W", "W", "W", "W", "W"], last5Away: ["W", "W", "W", "W", "W"], goals: { scored: 2, conceded: 0 } }
    },
    standings: {
        home: { rank: 1, points: 60, goalDiff: 30 }, // Top team having a bad run
        away: { rank: 10, points: 30, goalDiff: 0 }  // Mid team having a good run
    }
};
const result3 = calculateAnalysis(case3Data);
console.log("Case 3 (Home Bad Form vs Class):", result3.score, "Stats:", result3.details.statsScore, "Class:", result3.details.classScore);
