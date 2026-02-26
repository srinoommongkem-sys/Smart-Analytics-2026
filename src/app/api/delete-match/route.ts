import { NextResponse } from 'next/server';
import { deleteMatchFromSheet } from '../../../lib/google-sheets';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id || typeof id !== 'string' || !id.startsWith('sheet-')) {
            return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 });
        }

        const rowNumber = parseInt(id.replace('sheet-', ''), 10);
        if (isNaN(rowNumber)) {
            return NextResponse.json({ success: false, error: "Invalid row number" }, { status: 400 });
        }

        await deleteMatchFromSheet(rowNumber);

        return NextResponse.json({ success: true, message: "Match marked as deleted" });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    }
}
