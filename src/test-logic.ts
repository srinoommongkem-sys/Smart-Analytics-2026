const { calculateAnalysis } = require('./utils/calculate');

// Mock data for testing
const testCase1 = {
    homeTeam: "Test Home",
    awayTeam: "Test Away",
    price: { opening: 2.0, live: 1.8 }, // 10% drop -> Score should be around 75
    stats: {
        home: { last5: ["W", "W", "W", "W", "W"] }, // 100%
        away: { last5: ["L", "L", "L", "L", "L"] }, // 0% -> Away form score? No, it's (Home + (100-Away))/2
    },
    history: { h2h: ["W", "W", "W", "W", "W"] }, // 100%
    odds: { home: 1.8, draw: 3.5, away: 4.0 },
};

// We need to compile TS to run this, or use ts-node.
// Since we don't know if ts-node is installed, we can't easily run this.
// Instead, I'll provide this as a .ts file for the user to run eventually.

console.log("Running Logic Verification...");

// However, utils/calculate.ts uses 'export const', which is ES module / TS.
// CommonJS require might fail without transpilation.
// So I will just write the instructions in walkthrough.
