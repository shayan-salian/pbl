import { Router } from 'express';
import twilio from 'twilio';

// Twilio JWT helpers
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const twilioRouter = Router();

// Retrieve environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY; // The SID of your specific API Key
const apiSecret = process.env.TWILIO_API_SECRET; // The Secret of your specific API Key

// Middleware to check for required secrets (optional, but recommended)
twilioRouter.use((req, res, next) => {
    if (!accountSid || !apiKey || !apiSecret) {
        console.error("CRITICAL: Twilio environment variables are missing.");
        return res.status(500).send({ error: "Server configuration error: Twilio keys missing." });
    }
    next();
});

// Endpoint to generate and return a Twilio Access Token
// Accessible at: /twilio/token
twilioRouter.get('/token', (req, res) => {
    // In a real application, you should authenticate req.user here!
    
    // Identity and room name are typically passed via query parameters
    const identity = req.query.identity; 
    const roomName = req.query.room; 

    if (!identity || !roomName) {
        return res.status(400).send({ error: "Identity and room name are required." });
    }

    // 1. Create the Access Token
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity: identity });

    // 2. Grant the Video permissions
    const videoGrant = new VideoGrant({
        room: roomName
    });
    token.addGrant(videoGrant);

    // 3. Return the token as a JWT string
    res.send({ token: token.toJwt(), identity });
});

export default twilioRouter;