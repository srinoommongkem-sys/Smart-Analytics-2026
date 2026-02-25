import { AnalysisResult, MatchData, Recommendation } from "../types/analysis";

export const calculatePriceShift = (opening: number, live: number): number => {
    if (opening === 0) return 0;
    return ((live - opening) / opening) * 100;
};

export const calculateImpliedProbability = (odds: number): number => {
    if (odds <= 0) return 0;
    return (1 / odds) * 100;
};

const POINTS = {
    W: 3,
    D: 1,
    L: 0,
};

const calculateFormScore = (results: string[]): number => {
    const totalPoints = results.reduce((acc, result) => acc + (POINTS[result as keyof typeof POINTS] || 0), 0);
    const maxPoints = results.length * 3;
    return maxPoints === 0 ? 0 : (totalPoints / maxPoints) * 100;
};

// 1. Handicap Odds Scoring (Payout Shift)
export const calculateAnalysis = (data: MatchData): AnalysisResult => {
    // Concept: If Payout drops (e.g. 0.95 -> 0.80), money is flowing IN. This is a POSITIVE signal.
    // If Payout rises (e.g. 0.85 -> 1.00), money is flowing OUT. This is a NEGATIVE signal.

    // 1. Handicap Odds Scoring (Payout Shift) - DEPRECATED
    // Now using Payout Imbalance (Handicap Score)
    let oddsScore = 50;
    const oddsShift = 0; // Kept for type compatibility


    // 2. Stats Score (Home vs Away form)
    // Weighted: 40% Overall Form, 60% Specific Form (Home@Home vs Away@Away)
    const homeOverall = calculateFormScore(data.stats.home.last5);
    const homeSpecific = calculateFormScore(data.stats.home.last5Home);

    // New: Momentum & Streak Analysis
    const getStreak = (matches: string[]) => {
        let streak = 0;
        for (const m of matches) {
            if (m === 'W') streak++;
            else break;
        }
        return streak;
    };

    // New: Cold Streak Analysis (Penalty)
    const getColdStreak = (matches: string[]) => {
        let streak = 0;
        for (const m of matches) {
            if (m === 'L') streak++;
            else break;
        }
        return streak;
    };

    const homeStreak = getStreak(data.stats.home.last5);
    const awayStreak = getStreak(data.stats.away.last5);

    const homeColdStreak = getColdStreak(data.stats.home.last5);
    const awayColdStreak = getColdStreak(data.stats.away.last5);

    // Momentum Bonus: +5 per consecutive win (max +15)
    // Cold Streak Penalty: -5 per consecutive loss (max -15)
    const homeMomentum = Math.min(15, homeStreak * 5) - Math.min(15, homeColdStreak * 5);
    const awayMomentum = Math.min(15, awayStreak * 5) - Math.min(15, awayColdStreak * 5);

    // New: Fortress & Road Warrior Factor
    // Home Fortress: If Home hasn't lost in last 5 home games -> Bonus
    const isHomeFortress = !data.stats.home.last5Home.includes('L');
    const homeFortressBonus = isHomeFortress ? 10 : 0;

    // Road Struggle: If Away hasn't won in last 5 away games -> Penalty (handled as low score)
    // Road Warrior: If Away hasn't lost in last 5 away games -> Bonus
    const isRoadWarrior = !data.stats.away.last5Away.includes('L');
    const awayRoadWarriorBonus = isRoadWarrior ? 10 : 0;

    // Recalculate Home/Away Scores with new factors
    // Base: (Overall * 0.4) + (Specific * 0.6)
    // Add Momentum & Venue Bonus
    const homeBase = (homeOverall * 0.4) + (homeSpecific * 0.6);
    const homeFinal = Math.min(100, homeBase + homeMomentum + homeFortressBonus);

    // FIX: Calculate Away scores BEFORE using them
    const awayOverall = calculateFormScore(data.stats.away.last5);
    const awaySpecific = calculateFormScore(data.stats.away.last5Away);
    const awayBase = (awayOverall * 0.4) + (awaySpecific * 0.6);
    const awayFinal = Math.min(100, awayBase + awayMomentum + awayRoadWarriorBonus);

    const statsScore = (homeFinal + (100 - awayFinal)) / 2;

    // 3. Goal Efficiency Score (New!)
    // Compare Home Attack (Scored) vs Away Defense (Conceded)
    // And Away Attack (Scored) vs Home Defense (Conceded)

    let goalScore = 50;
    const homeGoals = data.stats.home.goals || { scored: 0, conceded: 0 };
    const awayGoals = data.stats.away.goals || { scored: 0, conceded: 0 };

    if (homeGoals.scored > 0 || awayGoals.scored > 0) {
        // Inputs are now TOTAL goals from last 5 games.
        // Convert to Average for calculation:
        const homeAvgScored = homeGoals.scored / 5;
        const homeAvgConceded = homeGoals.conceded / 5;
        const awayAvgScored = awayGoals.scored / 5;
        const awayAvgConceded = awayGoals.conceded / 5;

        // Exp Goals for Home = (Home Scored Avg + Away Conceded Avg) / 2
        const expHomeGoals = (homeAvgScored + awayAvgConceded) / 2;
        // Exp Goals for Away = (Away Scored Avg + Home Conceded Avg) / 2
        const expAwayGoals = (awayAvgScored + homeAvgConceded) / 2;

        const goalDiff = expHomeGoals - expAwayGoals;

        // Map Goal Diff to Score
        // +1 Goal Diff -> 65
        // +2 Goal Diff -> 80
        // -1 Goal Diff -> 35
        goalScore = 50 + (goalDiff * 15);
        if (goalScore > 100) goalScore = 100;
        if (goalScore < 0) goalScore = 0;
    }

    // 4. History Score (H2H)
    const historyScore = calculateFormScore(data.history.h2h);

    // 4. Handicap Payout Score (Imbalance Analysis)
    // Concept: Bookies protect the likely outcome by offering LOWER odds (payouts).
    // If Favorite Team has LOWER odds (e.g. 0.85 vs 1.05) -> They are protecting the Favorite -> HIGH confidence.
    // If Favorite Team has HIGHER odds (e.g. 1.05 vs 0.85) -> They are inducing bets on the Favorite -> TRAP/LOW confidence.

    // 4. Handicap Payout Score (Imbalance Analysis - Multi Line)
    let handicapScore = 50; // Neutral start

    // Ensure handicap is an array (migration safety or default)
    const handicaps = Array.isArray(data.handicap) ? data.handicap : (data.handicap ? [data.handicap] : []);

    if (handicaps.length > 0) {
        let totalScore = 0;
        let validLines = 0;

        handicaps.forEach(hdp => {
            const { value: hdpValue, homeOdd, awayOdd } = hdp;

            // Allow 0 handicap (Level Ball)
            // Determine Favorite Team using ODDS if handicap is 0
            let isHomeFav = hdpValue < 0; // Negative = Home Fav
            if (hdpValue === 0) {
                isHomeFav = homeOdd < awayOdd; // Lower odd is favorite
            }

            const favOdd = isHomeFav ? homeOdd : awayOdd;
            const undOdd = isHomeFav ? awayOdd : homeOdd;

            // Calculate Spread
            const spread = undOdd - favOdd;

            // Calculate Score for this line
            // Spread +0.20 -> Score 90
            // Spread 0.00 -> Score 50
            // Spread -0.10 -> Score 20
            let lineScore = 50 + (spread * 200);

            // Clamp
            lineScore = Math.max(0, Math.min(100, lineScore));

            totalScore += lineScore;
            validLines++;
        });

        if (validLines > 0) {
            handicapScore = totalScore / validLines;
        }
    }

    // 5. Class Score (Rank & GD)
    let classScore = 50;
    if (data.standings) {
        const { home, away } = data.standings;
        // Rank: Lower is better. (Away - Home) -> Positive means Home is better (Rank 1 vs 20 -> 20-1 = 19)
        const rankDiff = away.rank - home.rank;

        // GD: Higher is better. (Home - Away) -> Positive means Home is better
        const gdDiff = home.goalDiff - away.goalDiff;

        // Weighting:
        // Rank Diff * 2 (Max approx +-40 in 20-team league)
        // GD Diff * 0.5 (Max approx +-20 to 30)
        classScore = 50 + (rankDiff * 2) + (gdDiff * 0.5);

        if (classScore > 100) classScore = 100;
        if (classScore < 0) classScore = 0;
    }

    // --- Dynamic Weighted Scoring ---
    // Problem: If data is missing (e.g. no H2H, no Standings), the default "50" scores dilute the real signals.
    // Solution: Only weight the factors that have actual data.

    let totalWeight = 0;
    let weightedSum = 0;

    // Helper to add score only if it keeps integrity
    const addScore = (score: number, weight: number, isValid: boolean) => {
        if (isValid) {
            weightedSum += score * weight;
            totalWeight += weight;
        }
    };

    // 1. Class Score (20%): Valid if standings exist and are not empty zeros
    const hasStandings = data.standings && (data.standings.home.rank !== 0 || data.standings.away.rank !== 0);
    addScore(classScore, 0.20, hasStandings);

    // 2. Odds Score (REMOVED): Previously 10%, but caused massive regression to the mean (50).
    // The 10% has been redistributed to Stats and Goals for more decisive predictions.

    // 3. Stats Score (30% - previously 25%): Valid if last5 data exists
    const hasStats = data.stats.home.last5.length > 0 || data.stats.away.last5.length > 0;
    addScore(statsScore, 0.30, hasStats);

    // 4. Goal Score (20% - previously 15%): Valid if goals data exists
    const hasGoals = (data.stats.home.goals.scored > 0 || data.stats.away.goals.scored > 0);
    addScore(goalScore, 0.20, hasGoals);

    // 5. History Score (10%): Valid if H2H exists
    const hasHistory = data.history.h2h.length > 0;
    addScore(historyScore, 0.10, hasHistory);

    // 6. Handicap Score (20%): Valid if handicaps exist
    const hasHandicap = handicaps.length > 0;
    addScore(handicapScore, 0.20, hasHandicap);

    // Calculate Final Score
    let finalBaseScore = 50;
    if (totalWeight > 0) {
        finalBaseScore = weightedSum / totalWeight;
    }

    // AMPLIFY: Apply volatility multiplier to spread scores away from 50 (Neutral)
    let deviation = finalBaseScore - 50;

    // Direct Market Influence Bonus/Penalty
    // If Market (Handicap Score) is Strong (Safe), boost confidence.
    // If Market is Weak (Risk), lower confidence.
    if (handicapScore >= 60) deviation += 5; // Safe Bonus
    else if (handicapScore <= 40) deviation -= 5; // Risk Penalty

    const amplifiedScore = 50 + (deviation * 2.0); // Boosted Multiplier (2.0x)

    // Clamp score 0-100
    const finalScore = Math.min(100, Math.max(0, amplifiedScore));

    // Implied Probabilities
    const impliedProbabilities = {
        home: calculateImpliedProbability(data.odds.home),
        draw: calculateImpliedProbability(data.odds.draw),
        away: calculateImpliedProbability(data.odds.away),
    };

    // Recommendation Logic
    let recommendation: Recommendation = "WAIT";
    if (finalScore >= 80) recommendation = "VIP";
    else if (finalScore >= 60) recommendation = "INVEST";

    // Special Case: Strong Money Flow override
    if (oddsShift < -15 && handicapScore >= 0) {
        if (recommendation === "WAIT") recommendation = "INVEST";
    }

    // --- Prediction Logic ---
    const isHomePrediction = finalScore >= 50;
    const predictedTeam = isHomePrediction ? data.homeTeam : data.awayTeam;

    // Find the "Best" Handicap Line
    // Priority: Select the line closest to the user's preferred range (1.70 - 1.95).
    // Target: 1.85 (Midpoint/Sweet Spot)
    let selectedHandicap = "0";
    let selectedOdds = 0;

    if (handicaps.length > 0) {
        let bestLine = handicaps[0];
        let minDiff = Number.MAX_VALUE;
        const targetOdds = 1.85; // Perfectly balanced for 1.70-1.95 range

        handicaps.forEach(h => {
            // Skip zero lines if possible, unless it's the only one
            if (h.value === 0 && handicaps.length > 1) return;

            const oddToCheck = isHomePrediction ? h.homeOdd : h.awayOdd;
            let diff = Math.abs(oddToCheck - targetOdds);

            // PENALTY: Avoid Low Water (< 1.70)
            // If odds are below 1.70, we penalize the difference significantly.
            // This makes a 2.05 (diff 0.20) preferable to a 1.65 (diff 0.20 + 1.0 = 1.20).
            if (oddToCheck < 1.70) {
                diff += 1.0;
            }

            if (diff < minDiff) {
                minDiff = diff;
                bestLine = h;
            }
        });

        const val = bestLine.value;
        if (isHomePrediction) {
            selectedHandicap = val.toString();
            selectedOdds = bestLine.homeOdd;
        } else {
            selectedHandicap = (val * -1).toString();
            selectedOdds = bestLine.awayOdd;
        }

        // Format with + sign if positive
        if (parseFloat(selectedHandicap) > 0) selectedHandicap = `+${selectedHandicap}`;
    }


    // Calculate Match Timestamp if Date/Time provided
    let matchTimestamp = undefined;
    if (data.matchDate && data.matchTime) {
        matchTimestamp = new Date(`${data.matchDate}T${data.matchTime}`).getTime();
    }

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        matchTime: matchTimestamp,
        leagueName: data.leagueName,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        homeTeamLogo: data.homeTeamLogo,
        awayTeamLogo: data.awayTeamLogo,
        score: Math.round(finalScore),
        oddsShift: parseFloat(oddsShift.toFixed(2)),
        impliedProbabilities,
        recommendation,
        details: {
            oddsScore: Math.round(oddsScore),
            handicapScore: Math.round(handicapScore),
            statsScore: Math.round(statsScore),
            historyScore: Math.round(historyScore),
            goalScore: Math.round(goalScore),
            classScore: Math.round(classScore),
        },
        prediction: {
            team: predictedTeam,
            handicap: selectedHandicap,
            odds: selectedOdds
        },
        originalData: data
    };
};
