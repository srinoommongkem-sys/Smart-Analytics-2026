import { NextResponse } from 'next/server';
import { getMatchesFromSheet } from '../../../lib/google-sheets';
import { AnalysisResult } from '../../../types/analysis';

export async function GET() {
    try {
        const rows = await getMatchesFromSheet();

        // Skip header row if it exists (assuming row 0 is header)
        // Check if rows exists and if the first row contains 'Home Team' or similar
        let dataRows = rows;
        let rowOffset = 1; // Google Sheets is 1-indexed
        if (dataRows.length > 0 && String(dataRows[0][1]).toLowerCase().includes('home')) {
            dataRows = dataRows.slice(1);
            rowOffset = 2; // Offset by 2 if there's a header row
        }

        const matches: AnalysisResult[] = dataRows.map((row: any[], index: number) => {
            return {
                id: `sheet-${index + rowOffset}`, // This precisely maps to the row number in Google Sheets
                timestamp: new Date(`${row[0]} GMT+0700`).getTime() || Date.now(),
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
                matchTime: row[16] ? new Date(`${row[16]} GMT+0700`).getTime() : undefined,
                actualScore: row[17] || undefined,
                resultStatus: row[18] || undefined,
                oddsShift: 0,
                impliedProbabilities: { home: 0, draw: 0, away: 0 }
            } as AnalysisResult;
        });

        // Deduplicate matches based on homeTeam, awayTeam, and date
        const matchMap = new Map<string, AnalysisResult>();
        for (const match of matches) {
            if (match.homeTeam !== "Unknown" && match.awayTeam !== "Unknown") {
                const d = new Date(match.matchTime || match.timestamp);
                const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const key = `${match.homeTeam}-${match.awayTeam}-${dateKey}`;
                matchMap.set(key, match); // The later row overwrites earlier rows
            }
        }

        // Exclude completely broken entries and entries marked as DELETED
        const validMatches = Array.from(matchMap.values()).filter(m => m.resultStatus !== "DELETED");

        return NextResponse.json({ success: true, matches: validMatches });
    } catch (error) {
        console.error("Failed to fetch matches API", error);
        return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
    }
}
