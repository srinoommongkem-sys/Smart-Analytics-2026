import { NextResponse } from 'next/server';
import { getPasscodes, addPasscode, updatePasscodeStatus } from '../../../lib/google-sheets';

export async function GET() {
    try {
        const passcodes = await getPasscodes();
        return NextResponse.json({ success: true, passcodes });
    } catch (error) {
        console.error("GET API Passcodes error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch passcodes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, note } = body;

        if (!code) {
            return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
        }

        await addPasscode(code, note || "");
        return NextResponse.json({ success: true, message: "Passcode added successfully" });
    } catch (error) {
        console.error("POST API Passcodes error:", error);
        return NextResponse.json({ success: false, error: "Failed to add passcode" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { rowNumber, status } = body;

        if (!rowNumber || !status) {
            return NextResponse.json({ success: false, error: "rowNumber and status are required" }, { status: 400 });
        }

        if (status !== 'ACTIVE' && status !== 'INACTIVE') {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        await updatePasscodeStatus(rowNumber, status);
        return NextResponse.json({ success: true, message: "Passcode status updated successfully" });
    } catch (error) {
        console.error("PUT API Passcodes error:", error);
        return NextResponse.json({ success: false, error: "Failed to update passcode status" }, { status: 500 });
    }
}
