const fs = require('fs');
const path = require('path');

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const NFL_CHANNEL_ID = 'UCDVYQ4Zhbm3S2dlz7P1GBDg'; // Official NFL channel ID
const NFL_CHANNELS = [
    'UCDVYQ4Zhbm3S2dlz7P1GBDg', // Official NFL channel
    'UCdNnwFi4Ncy1LdmZWdd0Z3g', // NFL Network
    'UCq-Fj5jknLsUf-MWSy4_brA'  // NFL Films
];

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
    console.log('YouTube API Key present:', !!YOUTUBE_API_KEY);
    console.log('API Key length:', YOUTUBE_API_KEY ? YOUTUBE_API_KEY.length : 0);
    
    if (!YOUTUBE_API_KEY) {
        console.log('No YouTube API key provided, using demo data');
        return getDemoHighlights();
    }

    const highlights = [];
    const currentWeek = getCurrentWeek();
    
    // Search for highlights from Week 1 to current week
    for (let week = 1; week <= currentWeek; week++) {
        try {
            console.log(`Searching for Week ${week} highlights...`);
            const weekHighlights = await searchHighlightsForWeek(week);
            console.log(`Found ${weekHighlights.length} highlights for Week ${week}`);
            highlights.push(...weekHighlights);
        } catch (error) {
            console.error(`Error searching for week ${week} highlights:`, error);
        }
    }


    // Remove duplicates based on videoId and also by team combination + week
    const seenVideoIds = new Set();
    const seenTeamCombinations = new Set();
    const uniqueHighlights = [];

    for (const highlight of highlights) {
        const teamKey = `${highlight.team1}-${highlight.team2}-${highlight.week}`;
        const reverseTeamKey = `${highlight.team2}-${highlight.team1}-${highlight.week}`;
        
        // Skip if we've seen this video ID or this team combination for this week
        if (!seenVideoIds.has(highlight.videoId) && 
            !seenTeamCombinations.has(teamKey) && 
            !seenTeamCombinations.has(reverseTeamKey)) {
            
            seenVideoIds.add(highlight.videoId);
            seenTeamCombinations.add(teamKey);
            uniqueHighlights.push(highlight);
        }
    }

    console.log(`Found ${highlights.length} total highlights, ${uniqueHighlights.length} unique`);
    return uniqueHighlights;
}

async function searchHighlightsForWeek(week) {
    const highlights = [];
    
    // Generate search queries for different team combinations
    const searchQueries = [
        `NFL highlights week ${week} 2024`,
        `NFL week ${week} highlights 2024`,
        `NFL highlights ${week} 2024`,
        `NFL week ${week} 2024`,
        `NFL 2024 week ${week} highlights`
    ];

    for (const query of searchQueries) {
        for (const channelId of NFL_CHANNELS) {
            try {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?` +
                    `part=snippet&` +
                    `channelId=${channelId}&` +
                    `q=${encodeURIComponent(query)}&` +
                    `type=video&` +
                    `maxResults=5&` +
                    `order=date&` +
                    `key=${YOUTUBE_API_KEY}`
                );

                if (!response.ok) {
                    throw new Error(`YouTube API error: ${response.status}`);
                }

                const data = await response.json();
                
                for (const item of data.items) {
                    const highlight = parseVideoData(item, week);
                    if (highlight) {
                        highlights.push(highlight);
                    }
                }
            } catch (error) {
                console.error(`Error searching for query "${query}" in channel ${channelId}:`, error);
            }
        }
    }

    return highlights;
}

function parseVideoData(videoItem, week) {
    const snippet = videoItem.snippet;
    const title = snippet.title;
    const description = snippet.description;
    
    // Extract week number from title
    const extractedWeek = extractWeekFromTitle(title);
    const finalWeek = extractedWeek || week; // Use extracted week or fallback to calculated week
    
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
        week: finalWeek,
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
    
    // Also check for common team abbreviations and variations
    const teamVariations = {
        'kansas city': 'Kansas City Chiefs',
        'chiefs': 'Kansas City Chiefs',
        'buffalo': 'Buffalo Bills',
        'bills': 'Buffalo Bills',
        'dallas': 'Dallas Cowboys',
        'cowboys': 'Dallas Cowboys',
        'green bay': 'Green Bay Packers',
        'packers': 'Green Bay Packers',
        'philadelphia': 'Philadelphia Eagles',
        'eagles': 'Philadelphia Eagles',
        'san francisco': 'San Francisco 49ers',
        '49ers': 'San Francisco 49ers',
        'miami': 'Miami Dolphins',
        'dolphins': 'Miami Dolphins',
        'detroit': 'Detroit Lions',
        'lions': 'Detroit Lions',
        'baltimore': 'Baltimore Ravens',
        'ravens': 'Baltimore Ravens',
        'houston': 'Houston Texans',
        'texans': 'Houston Texans',
        'cincinnati': 'Cincinnati Bengals',
        'bengals': 'Cincinnati Bengals',
        'cleveland': 'Cleveland Browns',
        'browns': 'Cleveland Browns',
        'pittsburgh': 'Pittsburgh Steelers',
        'steelers': 'Pittsburgh Steelers',
        'indianapolis': 'Indianapolis Colts',
        'colts': 'Indianapolis Colts',
        'jacksonville': 'Jacksonville Jaguars',
        'jaguars': 'Jacksonville Jaguars',
        'tennessee': 'Tennessee Titans',
        'titans': 'Tennessee Titans',
        'denver': 'Denver Broncos',
        'broncos': 'Denver Broncos',
        'las vegas': 'Las Vegas Raiders',
        'raiders': 'Las Vegas Raiders',
        'los angeles chargers': 'Los Angeles Chargers',
        'chargers': 'Los Angeles Chargers',
        'los angeles rams': 'Los Angeles Rams',
        'rams': 'Los Angeles Rams',
        'atlanta': 'Atlanta Falcons',
        'falcons': 'Atlanta Falcons',
        'carolina': 'Carolina Panthers',
        'panthers': 'Carolina Panthers',
        'chicago': 'Chicago Bears',
        'bears': 'Chicago Bears',
        'minnesota': 'Minnesota Vikings',
        'vikings': 'Minnesota Vikings',
        'new orleans': 'New Orleans Saints',
        'saints': 'New Orleans Saints',
        'new york giants': 'New York Giants',
        'giants': 'New York Giants',
        'new york jets': 'New York Jets',
        'jets': 'New York Jets',
        'tampa bay': 'Tampa Bay Buccaneers',
        'buccaneers': 'Tampa Bay Buccaneers',
        'arizona': 'Arizona Cardinals',
        'cardinals': 'Arizona Cardinals',
        'seattle': 'Seattle Seahawks',
        'seahawks': 'Seattle Seahawks',
        'washington': 'Washington Commanders',
        'commanders': 'Washington Commanders',
        'new england': 'New England Patriots',
        'patriots': 'New England Patriots'
    };
    
    // First check for full team names
    for (const team of NFL_TEAMS) {
        const teamLower = team.toLowerCase();
        if (lowerText.includes(teamLower)) {
            foundTeams.push(team);
        }
    }
    
    // Then check for variations
    for (const [variation, teamName] of Object.entries(teamVariations)) {
        if (lowerText.includes(variation) && !foundTeams.includes(teamName)) {
            foundTeams.push(teamName);
        }
    }
    
    return foundTeams;
}

function extractWeekFromTitle(title) {
    const lowerTitle = title.toLowerCase();
    
    // Look for patterns like "Week 1", "Week 2", etc.
    const weekMatch = lowerTitle.match(/week\s+(\d+)/);
        if (weekMatch) {
            const week = parseInt(weekMatch[1]);
            if (week >= 1 && week <= 18) {
                return week;
            }
        }
    
    // Look for patterns like "W1", "W2", etc.
    const wMatch = lowerTitle.match(/\bw(\d+)\b/);
    if (wMatch) {
        const week = parseInt(wMatch[1]);
        if (week >= 1 && week <= 18) {
            return week;
        }
    }
    
    // Look for patterns like "1st", "2nd", "3rd", etc.
    const ordinalMatch = lowerTitle.match(/(\d+)(?:st|nd|rd|th)\s+week/);
    if (ordinalMatch) {
        const week = parseInt(ordinalMatch[1]);
        if (week >= 1 && week <= 18) {
            return week;
        }
    }
    
    return null;
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
