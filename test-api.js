// Test script to check YouTube API
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

console.log('Testing YouTube API...');
console.log('API Key present:', !!YOUTUBE_API_KEY);
console.log('API Key length:', YOUTUBE_API_KEY ? YOUTUBE_API_KEY.length : 0);

if (!YOUTUBE_API_KEY) {
    console.log('No API key found');
    process.exit(1);
}

async function testAPI() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&` +
            `channelId=UCDVYQ4Zhbm3S2dlz7P1GBDg&` +
            `q=NFL 2025 Season Week 1&` +
            `type=video&` +
            `maxResults=5&` +
            `order=date&` +
            `key=${YOUTUBE_API_KEY}`
        );

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
        } else {
            const data = await response.json();
            console.log('Success! Found', data.items?.length || 0, 'videos');
            if (data.items && data.items.length > 0) {
                console.log('First video:', data.items[0].snippet.title);
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testAPI();
