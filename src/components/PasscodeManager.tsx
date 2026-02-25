import { useState, useEffect } from "react";
import clsx from "clsx";

interface Passcode {
    code: string;
    status: string;
    note: string;
    rowNumber: number;
}

export default function PasscodeManager() {
    const [passcodes, setPasscodes] = useState<Passcode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCode, setNewCode] = useState("");
    const [newNote, setNewNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPasscodes();
    }, []);

    const fetchPasscodes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/passcodes");
            const data = await res.json();
            if (data.success) {
                setPasscodes(data.passcodes);
            }
        } catch (error) {
            console.error("Failed to fetch passcodes", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/passcodes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: newCode.trim(), note: newNote.trim() })
            });

            if (res.ok) {
                setNewCode("");
                setNewNote("");
                fetchPasscodes(); // Refresh list
            } else {
                alert("Failed to add passcode");
            }
        } catch (error) {
            console.error("Failed to add passcode", error);
            alert("Error adding passcode");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (passcode: Passcode) => {
        const newStatus = passcode.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        // Optimistic UI update
        setPasscodes(prev => prev.map(p => p.rowNumber === passcode.rowNumber ? { ...p, status: newStatus } : p));

        try {
            const res = await fetch("/api/passcodes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rowNumber: passcode.rowNumber, status: newStatus })
            });

            if (!res.ok) {
                // Revert on failure
                fetchPasscodes();
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update status", error);
            fetchPasscodes();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <span>🔑</span> VIP Passcode Management
                </h3>
                <div className="text-yellow-100 text-sm">
                    {passcodes.filter(p => p.status === "ACTIVE").length} Active Codes
                </div>
            </div>

            <div className="p-6">
                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">New Passcode</label>
                        <input
                            type="text"
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            placeholder="e.g. vip-user-01"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-yellow-500 outline-none"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Note (Optional)</label>
                        <input
                            type="text"
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            placeholder="e.g. Given to Line User A"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-yellow-500 outline-none"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isSaving || !newCode.trim()}
                            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition disabled:opacity-50 h-[42px]"
                        >
                            {isSaving ? "Adding..." : "+ Create"}
                        </button>
                    </div>
                </form>

                {/* Passcode List */}
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading passcodes...</div>
                ) : passcodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">No passcodes found. Create one above!</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="pb-3 px-4 font-bold text-gray-500 uppercase text-xs">Passcode</th>
                                    <th className="pb-3 px-4 font-bold text-gray-500 uppercase text-xs">Note</th>
                                    <th className="pb-3 px-4 font-bold text-gray-500 uppercase text-xs w-32 text-center">Status</th>
                                    <th className="pb-3 px-4 font-bold text-gray-500 uppercase text-xs w-32 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {passcodes.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-mono font-bold text-gray-800">{p.code}</td>
                                        <td className="py-3 px-4 text-gray-600 text-sm">{p.note || "-"}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-xs font-bold uppercase",
                                                p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => toggleStatus(p)}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold transition border",
                                                    p.status === "ACTIVE"
                                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                                        : "border-green-200 text-green-600 hover:bg-green-50"
                                                )}
                                            >
                                                {p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
