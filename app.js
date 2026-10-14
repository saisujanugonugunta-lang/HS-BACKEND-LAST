
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from your frontend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json({ limit: "100kb" }));

// Homepage
app.get("/", (req, res) => {
    res.send("My backend is working successfully!");
});

// Database status
app.get("/db-status", (req, res) => {
    res.json({
        connected: mongoose.connection.readyState === 1,
        status: mongoose.connection.readyState
    });
});

// Basic job-offer risk analysis
app.post("/api/analyze", (req, res) => {
    const { text } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({
            error: "Please provide job offer text."
        });
    }

    const offer = text.toLowerCase();
    let score = 0;
    const reasons = [];

    const checks = [
        {
            words: ["registration fee", "pay a fee", "upfront payment",
                    "security deposit", "processing fee"],
            points: 3,
            reason: "The offer requests an upfront payment."
        },
        {
            words: ["guaranteed job", "100% guaranteed",
                    "no interview", "instant selection"],
            points: 2,
            reason: "The offer makes unusually strong job guarantees."
        },
        {
            words: ["limited time", "act now", "urgent",
                    "immediately", "today only"],
            points: 1,
            reason: "The message uses urgency to pressure you."
        },
        {
            words: ["otp", "password", "bank details",
                    "upi pin", "share your pin"],
            points: 3,
            reason: "The message requests sensitive account information."
        },
        {
            words: ["earn thousands daily", "easy money",
                    "no experience needed, high salary"],
            points: 2,
            reason: "The earnings or job claims may be unrealistic."
        }
    ];

    for (const check of checks) {
        if (check.words.some(word => offer.includes(word))) {
            score += check.points;
            reasons.push(check.reason);
        }
    }

    let risk;
    if (score >= 4) {
        risk = "High";
    } else if (score >= 2) {
        risk = "Medium";
    } else {
        risk = "Low";
    }

    if (reasons.length === 0) {
        reasons.push(
            "No listed warning signs were detected. This does not prove the offer is genuine."
        );
    }

    return res.json({
        success: true,
        risk,
        score,
        reasons,
        recommendation:
            risk === "High"
                ? "Do not pay or share sensitive information until you independently verify the employer."
                : risk === "Medium"
                ? "Verify the employer and offer through official contact details before proceeding."
                : "Continue checking the employer and offer using independent, trusted sources."
    });
});

// Start server after connecting to MongoDB
async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
