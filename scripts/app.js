// NFL Highlights App
class NFLHighlightsApp {
    constructor() {
        this.highlights = [];
        this.filteredHighlights = [];
        this.teams = new Set();
        this.weeks = new Set();
        
        this.init();
    }

    async init() {
        try {
            await this.loadHighlights();
            this.setupEventListeners();
            this.populateFilters();
            this.renderHighlights();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Kunde inte ladda highlights. Försök igen senare.');
        }
    }

    async loadHighlights() {
        try {
            const response = await fetch('highlights.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.highlights = data.highlights || [];
            this.filteredHighlights = [...this.highlights];
            
            // Extract unique teams and weeks
            this.highlights.forEach(highlight => {
                if (highlight.team1) this.teams.add(highlight.team1);
                if (highlight.team2) this.teams.add(highlight.team2);
                if (highlight.week) this.weeks.add(highlight.week);
            });
        } catch (error) {
            console.error('Error loading highlights:', error);
            // Fallback to demo data if highlights.json doesn't exist
            this.highlights = this.getDemoData();
            this.filteredHighlights = [...this.highlights];
            this.highlights.forEach(highlight => {
                if (highlight.team1) this.teams.add(highlight.team1);
                if (highlight.team2) this.teams.add(highlight.team2);
                if (highlight.week) this.weeks.add(highlight.week);
            });
        }
    }

    getDemoData() {
        return [
            {
                id: 'demo1',
                team1: 'Kansas City Chiefs',
                team2: 'Buffalo Bills',
                week: 18,
                date: '2024-01-07',
                description: 'Wild Card Round - Kansas City Chiefs vs Buffalo Bills',
                videoId: 'dQw4w9WgXcQ',
                channel: 'NFL'
            },
            {
                id: 'demo2',
                team1: 'Dallas Cowboys',
                team2: 'Green Bay Packers',
                week: 18,
                date: '2024-01-14',
                description: 'Wild Card Round - Dallas Cowboys vs Green Bay Packers',
                videoId: 'dQw4w9WgXcQ',
                channel: 'NFL'
            },
            {
                id: 'demo3',
                team1: 'San Francisco 49ers',
                team2: 'Detroit Lions',
                week: 17,
                date: '2024-01-28',
                description: 'NFC Championship - San Francisco 49ers vs Detroit Lions',
                videoId: 'dQw4w9WgXcQ',
                channel: 'NFL'
            }
        ];
    }

    setupEventListeners() {
        const teamFilter = document.getElementById('teamFilter');
        const weekFilter = document.getElementById('weekFilter');
        const sortBy = document.getElementById('sortBy');
        const filterToggle = document.getElementById('filterToggle');
        const filters = document.getElementById('filters');

        teamFilter.addEventListener('change', () => this.applyFilters());
        weekFilter.addEventListener('change', () => this.applyFilters());
        sortBy.addEventListener('change', () => this.applyFilters());
        
        filterToggle.addEventListener('click', () => {
            const isVisible = filters.style.display !== 'none';
            if (isVisible) {
                filters.style.display = 'none';
                filterToggle.classList.remove('active');
            } else {
                filters.style.display = 'grid';
                filterToggle.classList.add('active');
            }
        });
    }

    populateFilters() {
        const teamFilter = document.getElementById('teamFilter');
        const weekFilter = document.getElementById('weekFilter');

        // Populate team filter
        const sortedTeams = Array.from(this.teams).sort();
        sortedTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamFilter.appendChild(option);
        });

        // Populate week filter
        const sortedWeeks = Array.from(this.weeks).sort((a, b) => b - a);
        sortedWeeks.forEach(week => {
            const option = document.createElement('option');
            option.value = week;
            option.textContent = `Vecka ${week}`;
            weekFilter.appendChild(option);
        });
    }

    applyFilters() {
        const teamFilter = document.getElementById('teamFilter').value;
        const weekFilter = document.getElementById('weekFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        // Filter highlights
        this.filteredHighlights = this.highlights.filter(highlight => {
            const teamMatch = !teamFilter || 
                highlight.team1 === teamFilter || 
                highlight.team2 === teamFilter;
            const weekMatch = !weekFilter || 
                highlight.week === parseInt(weekFilter);
            
            return teamMatch && weekMatch;
        });

        // Sort highlights
        this.sortHighlights(sortBy);

        this.renderHighlights();
    }

    sortHighlights(sortBy) {
        switch (sortBy) {
            case 'date-desc':
                this.filteredHighlights.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                this.filteredHighlights.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'week-desc':
                this.filteredHighlights.sort((a, b) => (b.week || 0) - (a.week || 0));
                break;
            case 'week-asc':
                this.filteredHighlights.sort((a, b) => (a.week || 0) - (b.week || 0));
                break;
        }
    }

    renderHighlights() {
        const grid = document.getElementById('highlightsGrid');
        const loading = document.getElementById('loading');
        const noResults = document.getElementById('noResults');

        // Hide loading
        loading.style.display = 'none';

        if (this.filteredHighlights.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        noResults.style.display = 'none';

        // Clear existing content
        grid.innerHTML = '';

        // Render highlight cards
        this.filteredHighlights.forEach(highlight => {
            const card = this.createHighlightCard(highlight);
            grid.appendChild(card);
        });
    }

    createHighlightCard(highlight) {
        const card = document.createElement('div');
        card.className = 'highlight-card';

        const weekBadge = highlight.week ? 
            `<div class="week-badge">Vecka ${highlight.week}</div>` : '';

        const team1Logo = this.getTeamLogo(highlight.team1);
        const team2Logo = this.getTeamLogo(highlight.team2);

        const formattedDate = this.formatDate(highlight.date);
        const videoUrl = `https://www.youtube.com/watch?v=${highlight.videoId}`;

        card.innerHTML = `
            <div class="week-badge">Week ${highlight.week}</div>
            <div class="match-header">
                <div class="teams-container">
                    <div class="vs-overlay">VS</div>
                    <div class="teams">
                        <div class="team-logo">${team1Logo}</div>
                        <div class="team-logo">${team2Logo}</div>
                    </div>
                </div>
                <div class="team-names">${highlight.team1} <span class="vs-text">VS</span> ${highlight.team2}</div>
                <div class="match-date">${formattedDate}</div>
            </div>
            <a href="${videoUrl}" target="_blank" rel="noopener noreferrer" class="watch-button">
                <i class="fas fa-play"></i>
                Watch Highlights
            </a>
        `;

        return card;
    }

    getTeamLogo(teamName) {
        // Use real NFL team logos from SVG files
        const teamLogos = {
            'Arizona Cardinals': `<img src="assets/logos/arizona-cardinals-logo-svg.svg" alt="Arizona Cardinals" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Atlanta Falcons': `<img src="assets/logos/atlanta-falcons-logo-hex-colors.svg" alt="Atlanta Falcons" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Baltimore Ravens': `<img src="assets/logos/baltimore-ravens-maryland-themed-shield-logo-svg.svg" alt="Baltimore Ravens" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Buffalo Bills': `<img src="assets/logos/buffalo-bills-logosvg-hex-color.svg" alt="Buffalo Bills" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Carolina Panthers': `<img src="assets/logos/carolina-panthers-logo-svg-hexa-color.svg" alt="Carolina Panthers" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Chicago Bears': `<img src="assets/logos/chicago-bears-logo-svg-hexa-colors.svg" alt="Chicago Bears" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Cincinnati Bengals': `<img src="assets/logos/cincinnati-bengals-logo-svg.svg" alt="Cincinnati Bengals" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Cleveland Browns': `<img src="assets/logos/cleveland-browns-logo-svg.svg" alt="Cleveland Browns" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Dallas Cowboys': `<img src="assets/logos/dallas-cowboys-logo-svg.svg" alt="Dallas Cowboys" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Denver Broncos': `<img src="assets/logos/denver-broncos-logo-emblem-svg.svg" alt="Denver Broncos" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Detroit Lions': `<img src="assets/logos/detroit-lions-emblem-logo-svg.svg" alt="Detroit Lions" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Green Bay Packers': `<img src="assets/logos/green-bay-packers-symbol-logo-svg.svg" alt="Green Bay Packers" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Houston Texans': `<img src="assets/logos/houston-texans-football-logo-svg.svg" alt="Houston Texans" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Indianapolis Colts': `<img src="assets/logos/indianapolis-colts-logo-symbol-svg.svg" alt="Indianapolis Colts" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Jacksonville Jaguars': `<img src="assets/logos/jacksonville-jaguars-logo-symbol-svg.svg" alt="Jacksonville Jaguars" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Kansas City Chiefs': `<img src="assets/logos/kansas-city-chiefs-logo-emblem-svg.svg" alt="Kansas City Chiefs" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Las Vegas Raiders': `<img src="assets/logos/las-vegas-raiders-logo-emblem-svg.svg" alt="Las Vegas Raiders" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Los Angeles Chargers': `<img src="assets/logos/los-angeles-chargers-logo-symbol-svg.svg" alt="Los Angeles Chargers" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Los Angeles Rams': `<img src="assets/logos/los-angeles-rams-football-logo-svg.svg" alt="Los Angeles Rams" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Miami Dolphins': `<img src="assets/logos/miami-dolphins-logo-emblem-svg.svg" alt="Miami Dolphins" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Minnesota Vikings': `<img src="assets/logos/minnesota-vikings-logo-emblem-svg.svg" alt="Minnesota Vikings" style="width: 100%; height: 100%; object-fit: contain;">`,
            'New England Patriots': `<img src="assets/logos/new-england-patriots-logo-emblem-svg.svg" alt="New England Patriots" style="width: 100%; height: 100%; object-fit: contain;">`,
            'New Orleans Saints': `<img src="assets/logos/new-orleans-saints-logo-emblem-svg.svg" alt="New Orleans Saints" style="width: 100%; height: 100%; object-fit: contain;">`,
            'New York Giants': `<img src="assets/logos/new-york-giants-logo-emblem-svg.svg" alt="New York Giants" style="width: 100%; height: 100%; object-fit: contain;">`,
            'New York Jets': `<img src="assets/logos/new-york-jets-logo-emblem-svg.svg" alt="New York Jets" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Philadelphia Eagles': `<img src="assets/logos/philadelphia-eagles-logo-emblem-svg.svg" alt="Philadelphia Eagles" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Pittsburgh Steelers': `<img src="assets/logos/pittsburgh-steelers-logo-emblem-svg.svg" alt="Pittsburgh Steelers" style="width: 100%; height: 100%; object-fit: contain;">`,
            'San Francisco 49ers': `<img src="assets/logos/san-francisco-49ers-logo-emblem-svg.svg" alt="San Francisco 49ers" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Seattle Seahawks': `<img src="assets/logos/seattle-seahawks-logo-emblem-svg.svg" alt="Seattle Seahawks" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Tampa Bay Buccaneers': `<img src="assets/logos/tampa-bay-buccaneers-logo-svg-2020.svg" alt="Tampa Bay Buccaneers" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Tennessee Titans': `<img src="assets/logos/tennessee-titans-logo-emblem-svg.svg" alt="Tennessee Titans" style="width: 100%; height: 100%; object-fit: contain;">`,
            'Washington Commanders': `<img src="assets/logos/washington-commanders-logo-emblem-svg.svg" alt="Washington Commanders" style="width: 100%; height: 100%; object-fit: contain;">`
        };
        
        return teamLogos[teamName] || `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#666666"/>
            <text x="50" y="55" text-anchor="middle" fill="white" font-size="20" font-weight="bold">?</text>
        </svg>`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    }

    showError(message) {
        const grid = document.getElementById('highlightsGrid');
        const loading = document.getElementById('loading');
        
        loading.style.display = 'none';
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ett fel uppstod</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NFLHighlightsApp();
});
