import { NextResponse } from 'next/server';
import { verifyPasscodeInSheet } from '../../../lib/google-sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { passcode } = body;

        if (!passcode) {
            return NextResponse.json({ success: false, error: "Passcode is required" }, { status: 400 });
        }

        // Verify against Google Sheets
        const isValid = await verifyPasscodeInSheet(passcode);

        if (isValid) {
            return NextResponse.json({ success: true, valid: true, message: "Passcode unlocked" });
        } else {
            return NextResponse.json({ success: true, valid: false, message: "Invalid or inactive passcode" });
        }
    } catch (error) {
        console.error("Passcode verification API error:", error);
        return NextResponse.json({ success: false, error: "Failed to verify passcode" }, { status: 500 });
    }
}
