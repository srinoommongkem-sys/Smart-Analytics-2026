import { NextResponse } from 'next/server';
import { getMatchesFromSheet } from '../../../lib/google-sheets';
import { AnalysisResult } from '../../../types/analysis';

export async function GET() {
    try {
        const rows = await getMatchesFromSheet();

        // Skip header row if it exists (assuming row 0 is header)
        // Check if rows exists and if the first row contains 'Home Team' or similar
        let dataRows = rows;
        if (dataRows.length > 0 && String(dataRows[0][1]).toLowerCase().includes('home')) {
            dataRows = dataRows.slice(1);
        }

        const matches: AnalysisResult[] = dataRows.map((row: any[], index: number) => {
            return {
                id: `sheet-${index}`, // fallback ID
                timestamp: new Date(row[0]).getTime() || Date.now(),
                homeTeam: row[1] || "Unknown",
                awayTeam: row[2] || "Unknown",
                score: parseInt(row[3]) || 0,
                recommendation: row[4] || "WAIT",
                details: {
                    classScore: parseInt(row[5]) || 0,
                    oddsScore: parseInt(row[6]) || 0,
                    statsScore: parseInt(row[7]) || 0,
                    goalScore: parseInt(row[8]) || 0,
                    handicapScore: parseInt(row[9]) || 0,
                },
                homeTeamLogo: row[10] || "",
                awayTeamLogo: row[11] || "",
                leagueName: row[12] || "",
                prediction: {
                    team: row[13] || "",
                    handicap: row[14] || "",
                    odds: parseFloat(row[15]) || 0.9,
                },
                matchTime: row[16] ? new Date(row[16]).getTime() : undefined,
                actualScore: row[17] || undefined,
                resultStatus: row[18] || undefined,
                oddsShift: 0,
                impliedProbabilities: { home: 0, draw: 0, away: 0 }
            } as AnalysisResult;
        });

        // Deduplicate matches based on homeTeam and awayTeam (taking the latest entry)
        const matchMap = new Map<string, AnalysisResult>();
        for (const match of matches) {
            if (match.homeTeam !== "Unknown" && match.awayTeam !== "Unknown") {
                const key = `${match.homeTeam}-${match.awayTeam}`;
                matchMap.set(key, match); // The later row overwrites earlier rows
            }
        }

        const validMatches = Array.from(matchMap.values());

        return NextResponse.json({ success: true, matches: validMatches });
    } catch (error) {
        console.error("Failed to fetch matches API", error);
        return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
    }
}
