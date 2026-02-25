
import { AnalysisResult } from "../types/analysis";

export type ResultStatus = "WIN" | "LOSS" | "DRAW" | "HALF_WIN" | "HALF_LOSS" | "VOID";

export function calculateResultStatus(
    predictionTeam: string,
    homeTeam: string,
    awayTeam: string,
    handicap: number,
    actualScore: string // "H-A" e.g. "2-1"
): ResultStatus {
    if (!actualScore || !actualScore.includes("-")) return "VOID";

    const [homeScore, awayScore] = actualScore.split("-").map(s => parseFloat(s.trim()));

    if (isNaN(homeScore) || isNaN(awayScore)) return "VOID";

    // Determine which side was picked
    const isHomePick = predictionTeam === homeTeam;

    // Calculate Adjusted Score
    // If Home Pick: (Home Score + Handicap) vs Away Score
    // If Away Pick: (Away Score + Handicap) vs Home Score
    // But usually handicap is presented relative to Home team in Asian Handicap?
    // Let's assume the handicap passed here IS the handicap line for the PICKED TEAM.
    // Standard convention: 
    // If Pick Home -0.5 -> Home Score - 0.5 vs Away Score
    // If Pick Away +0.5 -> Away Score + 0.5 vs Home Score

    // So:
    let adjustedScoreDiff: number;

    if (isHomePick) {
        // Home Picked. 
        // Diff = (Home + HDP) - Away
        adjustedScoreDiff = (homeScore + handicap) - awayScore;
    } else {
        // Away Picked.
        // Diff = (Away + HDP) - Home
        // Note: If the line was "Home -0.5", then for Away it is "Away +0.5".
        // The `handicap` in AnalysisResult.prediction.handicap seems to be signed?
        // Let's check `calculate.ts`. 
        // Usually HDP is displayed for the specific team. If it says "Home -0.5", prediction.handicap should be -0.5.
        // If it says "Away +0.5", prediction.handicap should be +0.5.
        adjustedScoreDiff = (awayScore + handicap) - homeScore;
    }

    // Now determine status based on difference
    // Win: Diff > 0
    // Loss: Diff < 0
    // Draw: Diff == 0
    // Half Win: Diff = 0.25
    // Half Loss: Diff = -0.25

    // Asian Handicap Logic:
    // Use epsilon for float comparison
    const epsilon = 0.001;

    if (Math.abs(adjustedScoreDiff) < epsilon) {
        return "DRAW"; // Push
    }

    if (Math.abs(adjustedScoreDiff - 0.25) < epsilon) {
        return "HALF_WIN";
    }

    if (Math.abs(adjustedScoreDiff + 0.25) < epsilon) {
        return "HALF_LOSS";
    }

    if (adjustedScoreDiff > 0) {
        return "WIN";
    }

    return "LOSS";
}
