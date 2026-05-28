const express = require('express');
const { fork } = require('child_process');
const cors = require('cors');

const app = express();
app.use(express.json());

// Enable CORS to allow requests from your Blogger domain
app.use(cors());

// Map to store active bot processes in memory
const activeBots = new Map();

app.post('/api/start-bot', (req, res) => {
    const { serverIp, port, username } = req.body;

    if (!serverIp || !username) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const botId = `${username}_${Date.now()}`;

    // Fork a new isolated Node process for the bot
    // This ensures that if a bot crashes, the main Express server stays online
    const botProcess = fork('./bot.js', [serverIp, port || '25565', username]);

    activeBots.set(botId, botProcess);

    // Handle bot process termination to clear memory
    botProcess.on('exit', (code) => {
        console.log(`[INFO] Bot ${botId} stopped with code ${code}`);
        activeBots.delete(botId);
    });

    res.json({ 
        success: true, 
        botId: botId, 
        message: 'Bot launched successfully and is attempting to connect.' 
    });
});

// Endpoint to check how many bots are running
app.get('/api/status', (req, res) => {
    res.json({ activeBots: activeBots.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SERVER] Railway Backend running on port ${PORT}`);
});
