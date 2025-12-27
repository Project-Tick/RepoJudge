const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const { redisClient, connectRedis, getCache, setCache } = require('./src/services/redis');
const RedisStore = require('connect-redis').RedisStore;

const { getRepoStructure, getFileContents } = require('./src/services/github');
const { generateReadme, analyzeRepo } = require('./src/services/gemini');
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Redis
connectRedis().catch(console.error);

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Session middleware with Redis
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static('public'));

// Auth routes
app.use('/auth', authRoutes);

// Helper to get auth token from session
function getAuthToken(req) {
    return req.session?.user?.accessToken || null;
}

// API Routes
app.post('/api/generate', async (req, res) => {
    const { repoUrl, language, forceRefresh } = req.body;
    const authToken = getAuthToken(req);

    if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
        // Parse URL
        // Expected format: https://github.com/owner/repo or owner/repo
        let owner, repo;
        if (repoUrl.includes('github.com')) {
            const parts = repoUrl.split('github.com/')[1].split('/');
            owner = parts[0];
            repo = parts[1]?.replace('.git', '');
        } else {
            const parts = repoUrl.split('/');
            owner = parts[0];
            repo = parts[1];
        }

        if (!owner || !repo) {
            return res.status(400).json({ error: 'Invalid repository URL format' });
        }

        // Cache Check
        const cacheKey = `readme:${owner}:${repo}:${language || 'en'}`;

        if (!forceRefresh) {
            const cachedResult = await getCache(cacheKey);
            if (cachedResult) {
                console.log(`[Cache Hit] Serving README for ${owner}/${repo}`);
                return res.json({ success: true, readme: cachedResult });
            }
        }

        console.log(`Fetching structure for ${owner}/${repo}...`);
        const fileStructure = await getRepoStructure(owner, repo, authToken);

        console.log(`Fetching content for ${owner}/${repo}...`);
        const fileContents = await getFileContents(owner, repo, fileStructure, authToken);

        console.log(`Generating README via Gemini...`);
        const readme = await generateReadme(repo, fileStructure, fileContents, language || 'en');

        // Set Cache (Expire in 1 hour)
        await setCache(cacheKey, readme, 3600);

        res.json({ success: true, readme });

    } catch (error) {
        console.error('SERVER ERROR in /api/generate:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate README',
            details: error.response?.data || error.cause
        });
    }
});

app.post('/api/analyze', async (req, res) => {

    const { repoUrl, language, forceRefresh, model } = req.body;
    const authToken = getAuthToken(req);

    if (!repoUrl) {
        return res.status(400).json({ error: 'GitHub repository URL is required' });
    }

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);

        // Cache Check
        const cacheKey = `analysis:${owner}:${repo}:${language || 'en'}:${model || 'flash'}`;

        if (!forceRefresh) {
            const cachedAnalysis = await getCache(cacheKey);
            if (cachedAnalysis) {
                console.log(`[Cache Hit] Serving Analysis for ${owner}/${repo}`);
                return res.json({ success: true, analysis: cachedAnalysis, cached: true });
            }
        }

        const { fileStructure, fileContents } = await fetchRepoContent(owner, repo, authToken);

        const analysis = await analyzeRepo(repo, fileStructure, fileContents, language || 'en', model);

        // Set Cache
        await setCache(cacheKey, analysis, 3600);

        res.json({ success: true, analysis, cached: false });
    } catch (error) {
        console.error('Error in /api/analyze:', error.message);
        res.status(500).json({ error: 'Failed to analyze repository' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { repoUrl, message, history, language, model } = req.body;
    const authToken = getAuthToken(req);

    if (!repoUrl || !message) return res.status(400).json({ error: 'Missing repository URL or message' });

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        const { fileStructure, fileContents } = await fetchRepoContent(owner, repo, authToken);

        const response = await chatWithRepo(`${owner}/${repo}`, fileStructure, fileContents, history || [], message, language || 'en', model);

        res.json({ success: true, response });
    } catch (err) {
        console.error('Chat Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
