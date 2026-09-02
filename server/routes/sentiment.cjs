/**
 * Sentiment dashboard API.
 * GET /api/sentiment/dashboard - returns data in the exact format expected by Dashboard.jsx.
 * Data is updated every 30s by Mastodon polling in index.cjs.
 */

const express = require('express');
const router = express.Router();

const { buildDashboardData, getEmptyDashboard } = require('../services/dashboardData.cjs');

// In-memory store of raw accumulated posts
let rawPostsStore = [];

/**
 * Called by server to update the raw posts from accumulator.
 * @param {Array} posts - Array of { id, content, created_at, platform, is_reply }
 */
function setRawPosts(posts) {
    rawPostsStore = posts;
}

/**
 * GET /api/sentiment/dashboard
 * Query Param: platform (e.g. 'Bluesky', 'Mastodon')
 * Returns filtered dashboard data.
 */
router.get('/dashboard', async (req, res) => {
    const { platform, filter } = req.query;

    if (!rawPostsStore || rawPostsStore.length === 0) {
        return res.status(200).json(getEmptyDashboard());
    }

    let filtered = rawPostsStore;
    if (platform && platform !== 'All') {
        filtered = rawPostsStore.filter(p => p.platform === platform);
    }

    if (filter === 'comments') {
        filtered = filtered.filter(p => p.is_reply);
    } else if (filter === 'posts') {
        filtered = filtered.filter(p => !p.is_reply);
    }

    // If no posts found for this specific platform, return empty shape
    if (filtered.length === 0) {
        return res.status(200).json(getEmptyDashboard());
    }

    try {
        const dashboardData = await buildDashboardData(filtered);
        res.status(200).json(dashboardData);
    } catch (err) {
        console.error("Error building dashboard data: ", err);
        res.status(500).json({ error: "Failed to process dashboard data" });
    }
});

module.exports = { router, setRawPosts };

module.exports = { router, setRawPosts };
