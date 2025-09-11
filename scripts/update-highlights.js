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

// Current NFL season week (2025 season only)
const getCurrentWeek = () => {
    const now = new Date();
    const seasonStart = new Date('2025-09-05'); // Start of 2025 season
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart + 1, 1), 18); // NFL regular season is 18 weeks
};

// Check if date is in 2025 season
const is2025Season = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    return year === 2025 && month >= 9; // September 2025 onwards
};

// Search for NFL highlights on YouTube - PLAYLIST FIRST APPROACH
async function searchNFLHighlights() {
    console.log('=== NFL HIGHLIGHTS SEARCH START ===');
    console.log('YouTube API Key present:', !!YOUTUBE_API_KEY);
    
    if (!YOUTUBE_API_KEY) {
        console.log('No YouTube API key provided, returning empty array');
        return [];
    }

    const highlights = [];
    const currentWeek = getCurrentWeek();
    
    console.log(`Current calculated week: ${currentWeek}`);
    
    // STEP 1: Try to find highlights from official playlists first
    console.log(`\n--- STEP 1: Searching playlists for Week ${currentWeek} ---`);
    const playlistHighlights = await searchPlaylistForWeek(currentWeek);
    console.log(`Found ${playlistHighlights.length} highlights from playlists`);
    highlights.push(...playlistHighlights);
    
    // STEP 2: If no highlights found, try direct video search
    if (highlights.length === 0) {
        console.log(`\n--- STEP 2: No playlist highlights found, trying video search ---`);
        
        const searchQueries = [
            `Game Highlights 2025 Week ${currentWeek}`,
            `NFL 2025 Season Week ${currentWeek} Game Highlights`,
            `NFL 2025 Week ${currentWeek} Game Highlights`
        ];
        
        for (const query of searchQueries) {
            console.log(`\n--- Searching: "${query}" ---`);
            
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

                console.log(`Response status: ${response.status}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`YouTube API error ${response.status}:`, errorData);
                    continue;
                }

                const data = await response.json();
                console.log(`Found ${data.items?.length || 0} videos for query: "${query}"`);
                
                for (const item of data.items || []) {
                    console.log(`  Video: "${item.snippet?.title}"`);
                    
                    const highlight = parseVideoData(item, currentWeek);
                    if (highlight) {
                        console.log(`  ✅ ACCEPTED: ${highlight.team1} vs ${highlight.team2}`);
                        highlights.push(highlight);
                    } else {
                        console.log(`  ❌ REJECTED: ${item.snippet?.title}`);
                    }
                }
                
            } catch (error) {
                console.error(`Error searching "${query}":`, error);
            }
        }
    }
    
    console.log(`\n=== SEARCH COMPLETE ===`);
    console.log(`Total highlights found: ${highlights.length}`);
    
    // Remove duplicates
    const uniqueHighlights = removeDuplicateHighlights(highlights);
    console.log(`Unique highlights after deduplication: ${uniqueHighlights.length}`);
    
    return uniqueHighlights;
}

// NEW: Search for playlists first (much more efficient)
async function searchPlaylistForWeek(week) {
    const highlights = [];
    
    try {
        // Search for multiple playlist patterns - focus on the real ones
        const playlistQueries = [
            `Week ${week} Game Recaps`,
            `Week ${week} Game Highlights`,
            `NFL 2025 Week ${week} Game Highlights`,
            `NFL 2025 Season Week ${week} Game Highlights`,
            `NFL 2025 Season Week ${week}`,
            `2025 NFL Season Week ${week}`
        ];
        
        for (const playlistQuery of playlistQueries) {
            console.log(`\n--- Searching for playlist: "${playlistQuery}" ---`);
            
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `part=snippet&` +
                `channelId=${NFL_CHANNEL_ID}&` +
                `q=${encodeURIComponent(playlistQuery)}&` +
                `type=playlist&` +
                `maxResults=5&` +
                `order=date&` +
                `key=${YOUTUBE_API_KEY}`
            );

            console.log(`Playlist search response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`YouTube API error ${response.status}:`, errorData);
                continue;
            }

            const data = await response.json();
            console.log(`Found ${data.items?.length || 0} playlists for query: "${playlistQuery}"`);
            
            // Process each playlist found
            for (const playlist of data.items || []) {
                console.log(`\n--- Found playlist: "${playlist.snippet.title}" ---`);
                console.log(`Playlist ID: ${playlist.id.playlistId}`);
                
                // Get videos from this playlist
                const playlistVideos = await getPlaylistVideos(playlist.id.playlistId, week);
                console.log(`Got ${playlistVideos.length} videos from playlist`);
                
                for (const video of playlistVideos) {
                    console.log(`  ✅ Highlight: ${video.team1} vs ${video.team2}`);
                }
                
                highlights.push(...playlistVideos);
            }
        }
        
    } catch (error) {
        console.error(`  Error searching for playlists:`, error);
    }

    return highlights;
}

// NEW: Get videos from a specific playlist
async function getPlaylistVideos(playlistId, week) {
    const highlights = [];
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?` +
            `part=snippet&` +
            `playlistId=${playlistId}&` +
            `maxResults=50&` +
            `key=${YOUTUBE_API_KEY}`
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`YouTube API error ${response.status}:`, errorData);
            return highlights;
        }

        const data = await response.json();
        
        for (const item of data.items || []) {
            console.log(`    Video: "${item.snippet?.title}"`);
            const highlight = parsePlaylistVideoData(item, week);
            if (highlight) {
                console.log(`    ✅ ACCEPTED: ${highlight.team1} vs ${highlight.team2}`);
                highlights.push(highlight);
            } else {
                console.log(`    ❌ REJECTED: ${item.snippet?.title}`);
            }
        }
        
    } catch (error) {
        console.error(`Error getting playlist videos for ${playlistId}:`, error);
    }

    return highlights;
}

// UPDATED: Video search (simplified for 10 days)
async function searchHighlightsForWeek(week) {
    const highlights = [];
    
    // Generate search queries for 2025 season only - focus on real highlights
    const searchQueries = [
        `NFL 2025 Season Week ${week} Game Highlights`,
        `NFL 2025 Week ${week} Game Highlights`,
        `2025 NFL Season Week ${week} Game Highlights`,
        `NFL 2025 Season Week ${week}`,
        `NFL 2025 Week ${week} highlights`,
        `NFL highlights week ${week} 2025`,
        `NFL week ${week} highlights 2025`,
        `Game Highlights NFL 2025 Season Week ${week}`,
        `Game Highlights 2025 NFL Season Week ${week}`
    ];

    console.log(`  Video search queries: ${searchQueries.length}`);

    for (const query of searchQueries) {
        try {
            console.log(`  Searching for: "${query}"`);
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

            console.log(`  Video search response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`  YouTube API error ${response.status}:`, errorData);
                throw new Error(`YouTube API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log(`  Found ${data.items?.length || 0} videos for query: "${query}"`);
            
            for (const item of data.items || []) {
                const highlight = parseVideoData(item, week);
                if (highlight) {
                    console.log(`  Valid highlight found: ${highlight.team1} vs ${highlight.team2} (${highlight.date})`);
                    if (!highlights.find(h => h.videoId === highlight.videoId)) {
                    highlights.push(highlight);
                    }
                } else {
                    console.log(`  Skipped video: ${item.snippet?.title} (no teams found or wrong date)`);
                }
            }
        } catch (error) {
            console.error(`  Error searching for query "${query}":`, error);
        }
    }

    console.log(`  Total video highlights found: ${highlights.length}`);
    return highlights;
}

// NEW: Broader search for all NFL highlights
async function searchAllNFLHighlights(week) {
    const highlights = [];
    
    try {
        console.log(`  Trying broader search for week ${week}...`);
        
        // Search for any video with "Game Highlights" and "2025" and "Week X"
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&` +
            `channelId=${NFL_CHANNEL_ID}&` +
            `q=Game Highlights 2025 Week ${week}&` +
            `type=video&` +
            `maxResults=20&` +
            `order=date&` +
            `key=${YOUTUBE_API_KEY}`
        );

        console.log(`  Broader search response status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`  YouTube API error ${response.status}:`, errorData);
            return highlights;
        }

        const data = await response.json();
        console.log(`  Found ${data.items?.length || 0} videos in broader search`);
        
        for (const item of data.items || []) {
            const highlight = parseVideoData(item, week);
            if (highlight) {
                console.log(`  Valid broader highlight: ${highlight.team1} vs ${highlight.team2}`);
                highlights.push(highlight);
            }
        }
        
    } catch (error) {
        console.error(`  Error in broader search:`, error);
    }

    return highlights;
}

// NEW: Parse playlist video data
function parsePlaylistVideoData(playlistItem, week) {
    const snippet = playlistItem.snippet;
    const resourceId = playlistItem.resourceId;
    
    if (!snippet || !resourceId) {
        return null;
    }
    
    const title = snippet.title;
    const description = snippet.description || '';
    
    // Filter out unwanted video types
    if (!isValidHighlightVideo(title, description)) {
        console.log(`  Skipped playlist video: ${title} (not a highlight)`);
        return null;
    }
    
    // Extract date from publishedAt
    const publishedDate = new Date(snippet.publishedAt);
    const dateString = publishedDate.toISOString().split('T')[0];
    
    // Only process videos from 2025 season (September 2025 onwards)
    if (!is2025Season(dateString)) {
        console.log(`  Skipped playlist video: ${title} (not 2025 season)`);
        return null;
    }
    
    // Extract week number from title
    const extractedWeek = extractWeekFromTitle(title);
    const finalWeek = extractedWeek || week;
    
    // Extract team names from title and description
    const teams = extractTeamsFromText(title + ' ' + description);
    
    if (teams.length < 2) {
        console.log(`  Skipped playlist video: ${title} (no teams found)`);
        return null;
    }

    console.log(`  Valid playlist highlight: ${teams[0]} vs ${teams[1]} (${dateString})`);
    return {
        id: resourceId.videoId,
        team1: teams[0],
        team2: teams[1],
        week: finalWeek,
        date: dateString,
        description: title,
        videoId: resourceId.videoId,
        channel: 'NFL',
        publishedAt: snippet.publishedAt,
        thumbnail: snippet.thumbnails?.medium?.url
    };
}

// NEW: Filter for NFL Game Highlights - ULTRA SIMPLE
function isValidHighlightVideo(title, description) {
    const lowerTitle = title.toLowerCase();
    
    console.log(`    Checking video: "${title}"`);
    
    // Just check for "game highlights" and "vs" - that's it!
    const hasGameHighlights = lowerTitle.includes('game highlights');
    const hasVs = lowerTitle.includes('vs');
    
    if (hasGameHighlights && hasVs) {
        console.log(`    ✅ ACCEPTED: Contains "game highlights" and "vs"`);
        return true;
    }
    
    console.log(`    ❌ REJECTED: Missing "game highlights" or "vs"`);
    return false;
}

// NEW: Remove duplicate highlights based on videoId
function removeDuplicateHighlights(highlights) {
    const seen = new Set();
    const uniqueHighlights = [];
    
    console.log(`    Processing ${highlights.length} highlights for duplicates...`);
    
    for (const highlight of highlights) {
        if (!seen.has(highlight.videoId)) {
            seen.add(highlight.videoId);
            uniqueHighlights.push(highlight);
            console.log(`    Added: ${highlight.team1} vs ${highlight.team2} (${highlight.videoId})`);
        } else {
            console.log(`    Removed duplicate: ${highlight.videoId} - ${highlight.team1} vs ${highlight.team2}`);
        }
    }
    
    console.log(`    Removed ${highlights.length - uniqueHighlights.length} duplicates`);
    console.log(`    Final unique highlights: ${uniqueHighlights.length}`);
    return uniqueHighlights;
}

function parseVideoData(videoItem, week) {
    const snippet = videoItem.snippet;
    const title = snippet.title;
    const description = snippet.description;
    
    // Filter out unwanted video types
    if (!isValidHighlightVideo(title, description)) {
        console.log(`  Skipped video: ${title} (not a highlight)`);
        return null;
    }
    
    // Extract date from publishedAt
    const publishedDate = new Date(snippet.publishedAt);
    const dateString = publishedDate.toISOString().split('T')[0];
    
    // Only process videos from 2025 season (September 2025 onwards)
    if (!is2025Season(dateString)) {
        console.log(`  Skipped video: ${title} (not 2025 season)`);
        return null;
    }
    
    // Extract week number from title
    const extractedWeek = extractWeekFromTitle(title);
    const finalWeek = extractedWeek || week; // Use extracted week or fallback to calculated week
    
    // Extract team names from title and description
    const teams = extractTeamsFromText(title + ' ' + description);
    
    if (teams.length < 2) {
        console.log(`  Skipped video: ${title} (no teams found)`);
        return null; // Skip if we can't identify two teams
    }

    console.log(`  Valid video highlight: ${teams[0]} vs ${teams[1]} (${dateString})`);
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
    
    // First try to extract "Team vs Team" pattern
    const vsMatch = text.match(/([A-Za-z\s]+)\s+vs\s+([A-Za-z\s]+)/i);
    if (vsMatch) {
        const team1 = vsMatch[1].trim();
        const team2 = vsMatch[2].trim();
        
        // Try to match with known teams - improved matching
        for (const team of NFL_TEAMS) {
            const teamWords = team.toLowerCase().split(' ');
            const team1Words = team1.toLowerCase().split(' ');
            
            // Check if any word from team name matches
            if (teamWords.some(word => team1Words.some(t1Word => 
                t1Word.includes(word) || word.includes(t1Word)
            ))) {
                foundTeams.push(team);
                break;
            }
        }
        
        for (const team of NFL_TEAMS) {
            const teamWords = team.toLowerCase().split(' ');
            const team2Words = team2.toLowerCase().split(' ');
            
            // Check if any word from team name matches
            if (teamWords.some(word => team2Words.some(t2Word => 
                t2Word.includes(word) || word.includes(t2Word)
            ))) {
                foundTeams.push(team);
                break;
            }
        }
        
        if (foundTeams.length >= 2) {
            return foundTeams;
        }
    }
    
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
        'baltimore ravens': 'Baltimore Ravens',
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

// Load existing highlights from file
function loadExistingHighlights() {
    try {
        const filePath = path.join(__dirname, '..', 'highlights.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data.highlights || [];
        }
    } catch (error) {
        console.log('No existing highlights file found or error reading it');
    }
    return [];
}

// Merge new highlights with existing ones, avoiding duplicates
function mergeHighlights(existingHighlights, newHighlights) {
    // Filter out demo data and invalid highlights from existing highlights
    const realExistingHighlights = existingHighlights.filter(h => {
        // Remove demo data
        if (h.id.startsWith('demo')) {
            return false;
        }
        
        // Remove invalid highlights (power rankings, full games, etc.)
        if (!isValidHighlightVideo(h.description || '', '')) {
            console.log(`Removing invalid existing highlight: ${h.description}`);
            return false;
        }
        
        return true;
    });
    
    const existingIds = new Set(realExistingHighlights.map(h => h.id));
    const existingVideoIds = new Set(realExistingHighlights.map(h => h.videoId));
    
    // Filter out duplicates based on id or videoId
    const uniqueNewHighlights = newHighlights.filter(highlight => 
        !existingIds.has(highlight.id) && !existingVideoIds.has(highlight.videoId)
    );
    
    // Combine existing and new highlights (no demo data, no invalid highlights)
    const allHighlights = [...realExistingHighlights, ...uniqueNewHighlights];
    
    // Sort by date (newest first)
    allHighlights.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Filtered out ${existingHighlights.length - realExistingHighlights.length} invalid/demo highlights`);
    console.log(`Kept ${realExistingHighlights.length} valid highlights from existing data`);
    console.log(`Added ${uniqueNewHighlights.length} new highlights`);
    
    return allHighlights;
}

// Main function to update highlights
async function updateHighlights() {
    try {
        console.log('Starting highlights update...');
        
        // Load existing highlights
        const existingHighlights = loadExistingHighlights();
        console.log(`Found ${existingHighlights.length} existing highlights`);
        
        // Search for new highlights
        const newHighlights = await searchNFLHighlights();
        console.log(`Found ${newHighlights.length} new highlights`);
        
        // Merge highlights (avoiding duplicates)
        const allHighlights = mergeHighlights(existingHighlights, newHighlights);
        console.log(`Total highlights after merge: ${allHighlights.length}`);
        
        const highlightsData = {
            lastUpdated: new Date().toISOString(),
            highlights: allHighlights
        };

        // Write to highlights.json
        const filePath = path.join(__dirname, '..', 'highlights.json');
        fs.writeFileSync(filePath, JSON.stringify(highlightsData, null, 2));
        
        console.log(`Updated highlights.json with ${allHighlights.length} highlights`);
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
