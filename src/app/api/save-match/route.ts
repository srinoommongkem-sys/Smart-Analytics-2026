
import { NextResponse } from 'next/server';
import { appendToSheet } from '../../../lib/google-sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { leagueName, homeTeam, awayTeam, homeTeamLogo, awayTeamLogo, score, recommendation, details, timestamp, prediction, matchDate, matchTime } = body;

        // Format data for Google Sheets (Row)
        const processDate = new Date(timestamp).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });

        // Format Scheduled Match Time
        let scheduledTime = "";
        if (matchDate && matchTime) {
            scheduledTime = `${matchDate} ${matchTime}`;
        } else if (body.matchTime) {
            scheduledTime = new Date(body.matchTime).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
        }

        const rowData = [
            processDate,
            homeTeam,
            awayTeam,
            score,
            recommendation,
            details.classScore,
            details.oddsScore,
            details.statsScore,
            details.goalScore,
            details.handicapScore,
            homeTeamLogo || "", // Column K
            awayTeamLogo || "",  // Column L
            leagueName || "",    // Column M
            prediction?.team || "",      // Column N (Predicted Team)
            prediction?.handicap || "",  // Column O (Handicap)
            prediction?.odds || "",      // Column P (Odds)
            scheduledTime || ""          // Column Q (Match Schedule)
        ];

        await appendToSheet(rowData);

        return NextResponse.json({ success: true, message: "Saved to Google Sheets" });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 });
    }
}
