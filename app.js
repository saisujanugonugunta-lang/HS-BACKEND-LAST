
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Render provides its own port
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
