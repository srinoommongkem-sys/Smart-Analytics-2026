
import { google } from 'googleapis';

export async function appendToSheet(values: any[]) {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline characters
        const sheetId = process.env.GOOGLE_SHEET_ID;

        if (!clientEmail || !privateKey || !sheetId) {
            throw new Error("Missing Google Sheets credentials in .env");
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:Z', // Appends to the first available row in Sheet1
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });

        return response.data;
    } catch (error) {
        console.error("Google Sheets Error:", error);
        throw error;
    }
}

export async function getMatchesFromSheet() {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const sheetId = process.env.GOOGLE_SHEET_ID;

        if (!clientEmail || !privateKey || !sheetId) {
            throw new Error("Missing Google Sheets credentials in .env");
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:Z',
        });

        const rows = response.data.values || [];
        if (rows.length === 0) return [];

        // Assuming Row 1 is header, map rows to JSON
        // Based on the append, we need to know the schema. Wait, `/api/save-match` appends the entire JSON as a string? Or columns?
        return rows;
    } catch (error) {
        console.error("Get Matches Error:", error);
        return [];
    }
}

export async function verifyPasscodeInSheet(passcode: string): Promise<boolean> {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const sheetId = process.env.GOOGLE_SHEET_ID;

        if (!clientEmail || !privateKey || !sheetId) {
            throw new Error("Missing Google Sheets credentials in .env");
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Passcodes!A:B', // Check column A for Passcode, Column B for Status
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return false;
        }

        // Search for the passcode and check its status
        for (const row of rows) {
            const sheetPasscode = row[0]?.toString().trim();
            const status = row[1]?.toString().trim().toUpperCase();

            // Match exact passcode and ensure status is exactly "ACTIVE"
            if (sheetPasscode === passcode && status === "ACTIVE") {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error("Verify Passcode Error:", error);
        return false;
    }
}

// Passcode Admin Management Functions
function getGoogleSheetsAuth() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !sheetId) {
        throw new Error("Missing Google Sheets credentials in .env");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return { auth, sheetId };
}

export async function getPasscodes() {
    try {
        const { auth, sheetId } = getGoogleSheetsAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Passcodes!A:C',
        });

        const rows = response.data.values || [];
        // Skip header if it exists (assuming row 1 might be headers if A1 doesn't look like a passcode)
        // For simplicity, we'll try to return all rows, UI can filter headers visually.
        // But better: we'll attach row numbers so we can update them later.

        return rows.map((row, index) => ({
            code: row[0]?.toString() || '',
            status: row[1]?.toString() || 'INACTIVE',
            note: row[2]?.toString() || '',
            rowNumber: index + 1 // Google Sheets rows are 1-indexed
        })).filter(p => p.code !== '' && p.code.toLowerCase() !== 'passcode'); // filter out empty and exact header row
    } catch (error) {
        console.error("Get Passcodes Error:", error);
        throw error;
    }
}

export async function addPasscode(code: string, note: string) {
    try {
        const { auth, sheetId } = getGoogleSheetsAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Passcodes!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[code, 'ACTIVE', note]],
            },
        });

        return response.data;
    } catch (error) {
        console.error("Add Passcode Error:", error);
        throw error;
    }
}

export async function updatePasscodeStatus(rowNumber: number, newStatus: 'ACTIVE' | 'INACTIVE') {
    try {
        const { auth, sheetId } = getGoogleSheetsAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Update just the Status column (Column B) for the specific row
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `Passcodes!B${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[newStatus]],
            },
        });

        return response.data;
    } catch (error) {
        console.error("Update Passcode Status Error:", error);
        throw error;
    }
}
