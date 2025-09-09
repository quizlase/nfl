const fs = require('fs');
const path = require('path');

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const NFL_CHANNEL_ID = 'UCDVYQ4Zhbm3S2dlz7P1GBDg'; // Official NFL channel ID

// NFL teams for generating search queries
const NFL_TEAMS = [
    'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
    'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
    'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
    'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
    'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
    'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
    'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
    'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
];

// Current NFL season week (this would need to be updated based on current date)
const getCurrentWeek = () => {
    const now = new Date();
    const seasonStart = new Date('2024-09-05'); // Approximate start of 2024 season
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart + 1, 1), 18); // NFL regular season is 18 weeks
};

// Search for NFL highlights on YouTube
async function searchNFLHighlights() {
    if (!YOUTUBE_API_KEY) {
        console.log('No YouTube API key provided, using demo data');
        return getDemoHighlights();
    }

    const highlights = [];
    const currentWeek = getCurrentWeek();
    
    // Search for highlights from the last 4 weeks
    for (let week = Math.max(1, currentWeek - 3); week <= currentWeek; week++) {
        try {
            const weekHighlights = await searchHighlightsForWeek(week);
            highlights.push(...weekHighlights);
        } catch (error) {
            console.error(`Error searching for week ${week} highlights:`, error);
        }
    }

    return highlights;
}

async function searchHighlightsForWeek(week) {
    const highlights = [];
    
    // Generate search queries for different team combinations
    const searchQueries = [
        `NFL highlights week ${week}`,
        `NFL week ${week} highlights`,
        `NFL highlights ${week}`
    ];

    for (const query of searchQueries) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `part=snippet&` +
                `channelId=${NFL_CHANNEL_ID}&` +
                `q=${encodeURIComponent(query)}&` +
                `type=video&` +
                `maxResults=10&` +
                `order=date&` +
                `key=${YOUTUBE_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();
            
            for (const item of data.items) {
                const highlight = parseVideoData(item, week);
                if (highlight && !highlights.find(h => h.videoId === highlight.videoId)) {
                    highlights.push(highlight);
                }
            }
        } catch (error) {
            console.error(`Error searching for query "${query}":`, error);
        }
    }

    return highlights;
}

function parseVideoData(videoItem, week) {
    const snippet = videoItem.snippet;
    const title = snippet.title;
    const description = snippet.description;
    
    // Extract team names from title and description
    const teams = extractTeamsFromText(title + ' ' + description);
    
    if (teams.length < 2) {
        return null; // Skip if we can't identify two teams
    }

    // Extract date from publishedAt
    const publishedDate = new Date(snippet.publishedAt);
    const dateString = publishedDate.toISOString().split('T')[0];

    return {
        id: videoItem.id.videoId,
        team1: teams[0],
        team2: teams[1],
        week: week,
        date: dateString,
        description: title,
        videoId: videoItem.id.videoId,
        channel: 'NFL',
        publishedAt: snippet.publishedAt,
        thumbnail: snippet.thumbnails?.medium?.url
    };
}

function extractTeamsFromText(text) {
    const foundTeams = [];
    const lowerText = text.toLowerCase();
    
    for (const team of NFL_TEAMS) {
        const teamLower = team.toLowerCase();
        if (lowerText.includes(teamLower)) {
            foundTeams.push(team);
        }
    }
    
    return foundTeams;
}

function getDemoHighlights() {
    return [
        {
            id: 'demo1',
            team1: 'Kansas City Chiefs',
            team2: 'Buffalo Bills',
            week: 18,
            date: '2024-01-07',
            description: 'Wild Card Round - Kansas City Chiefs vs Buffalo Bills',
            videoId: 'dQw4w9WgXcQ',
            channel: 'NFL',
            publishedAt: '2024-01-07T20:00:00Z'
        },
        {
            id: 'demo2',
            team1: 'Dallas Cowboys',
            team2: 'Green Bay Packers',
            week: 18,
            date: '2024-01-14',
            description: 'Wild Card Round - Dallas Cowboys vs Green Bay Packers',
            videoId: 'dQw4w9WgXcQ',
            channel: 'NFL',
            publishedAt: '2024-01-14T20:00:00Z'
        },
        {
            id: 'demo3',
            team1: 'San Francisco 49ers',
            team2: 'Detroit Lions',
            week: 17,
            date: '2024-01-28',
            description: 'NFC Championship - San Francisco 49ers vs Detroit Lions',
            videoId: 'dQw4w9WgXcQ',
            channel: 'NFL',
            publishedAt: '2024-01-28T20:00:00Z'
        }
    ];
}

// Main function to update highlights
async function updateHighlights() {
    try {
        console.log('Starting highlights update...');
        
        const highlights = await searchNFLHighlights();
        
        const highlightsData = {
            lastUpdated: new Date().toISOString(),
            highlights: highlights
        };

        // Write to highlights.json
        const filePath = path.join(__dirname, '..', 'highlights.json');
        fs.writeFileSync(filePath, JSON.stringify(highlightsData, null, 2));
        
        console.log(`Updated highlights.json with ${highlights.length} highlights`);
        console.log('Highlights update completed successfully');
        
    } catch (error) {
        console.error('Error updating highlights:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    updateHighlights();
}

module.exports = { updateHighlights, searchNFLHighlights };
