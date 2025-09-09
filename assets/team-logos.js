// NFL Team Logos and Colors
// This file contains team logo data and color schemes

const NFL_TEAMS = {
    'Arizona Cardinals': {
        logo: '🃏',
        primaryColor: '#97233F',
        secondaryColor: '#000000'
    },
    'Atlanta Falcons': {
        logo: '🦅',
        primaryColor: '#A71930',
        secondaryColor: '#000000'
    },
    'Baltimore Ravens': {
        logo: '🐦‍⬛',
        primaryColor: '#241773',
        secondaryColor: '#000000'
    },
    'Buffalo Bills': {
        logo: '🐃',
        primaryColor: '#00338D',
        secondaryColor: '#C60C30'
    },
    'Carolina Panthers': {
        logo: '🐱',
        primaryColor: '#0085CA',
        secondaryColor: '#000000'
    },
    'Chicago Bears': {
        logo: '🐻',
        primaryColor: '#0B162A',
        secondaryColor: '#C83803'
    },
    'Cincinnati Bengals': {
        logo: '🐅',
        primaryColor: '#FB4F14',
        secondaryColor: '#000000'
    },
    'Cleveland Browns': {
        logo: '🧡',
        primaryColor: '#311D00',
        secondaryColor: '#FF3C00'
    },
    'Dallas Cowboys': {
        logo: '⭐',
        primaryColor: '#003594',
        secondaryColor: '#869397'
    },
    'Denver Broncos': {
        logo: '🐴',
        primaryColor: '#FB4F14',
        secondaryColor: '#002244'
    },
    'Detroit Lions': {
        logo: '🦁',
        primaryColor: '#0076B6',
        secondaryColor: '#B0B7BC'
    },
    'Green Bay Packers': {
        logo: '🧀',
        primaryColor: '#203731',
        secondaryColor: '#FFB612'
    },
    'Houston Texans': {
        logo: '🤠',
        primaryColor: '#03202F',
        secondaryColor: '#A71930'
    },
    'Indianapolis Colts': {
        logo: '🐎',
        primaryColor: '#002C5F',
        secondaryColor: '#A2AAAD'
    },
    'Jacksonville Jaguars': {
        logo: '🐆',
        primaryColor: '#006778',
        secondaryColor: '#9F8958'
    },
    'Kansas City Chiefs': {
        logo: '🏹',
        primaryColor: '#E31837',
        secondaryColor: '#FFB81C'
    },
    'Las Vegas Raiders': {
        logo: '⚔️',
        primaryColor: '#000000',
        secondaryColor: '#A5ACAF'
    },
    'Los Angeles Chargers': {
        logo: '⚡',
        primaryColor: '#0080C6',
        secondaryColor: '#FFC20E'
    },
    'Los Angeles Rams': {
        logo: '🐏',
        primaryColor: '#003594',
        secondaryColor: '#FFA300'
    },
    'Miami Dolphins': {
        logo: '🐬',
        primaryColor: '#008E97',
        secondaryColor: '#FC4C02'
    },
    'Minnesota Vikings': {
        logo: '⚔️',
        primaryColor: '#4F2683',
        secondaryColor: '#FFC62F'
    },
    'New England Patriots': {
        logo: '🇺🇸',
        primaryColor: '#002244',
        secondaryColor: '#C60C30'
    },
    'New Orleans Saints': {
        logo: '⚜️',
        primaryColor: '#D3BC8D',
        secondaryColor: '#000000'
    },
    'New York Giants': {
        logo: '🏈',
        primaryColor: '#0B2265',
        secondaryColor: '#A71930'
    },
    'New York Jets': {
        logo: '✈️',
        primaryColor: '#125740',
        secondaryColor: '#000000'
    },
    'Philadelphia Eagles': {
        logo: '🦅',
        primaryColor: '#004C54',
        secondaryColor: '#A5ACAF'
    },
    'Pittsburgh Steelers': {
        logo: '⚒️',
        primaryColor: '#FFB612',
        secondaryColor: '#000000'
    },
    'San Francisco 49ers': {
        logo: '⛏️',
        primaryColor: '#AA0000',
        secondaryColor: '#B3995D'
    },
    'Seattle Seahawks': {
        logo: '🦅',
        primaryColor: '#002244',
        secondaryColor: '#69BE28'
    },
    'Tampa Bay Buccaneers': {
        logo: '🏴‍☠️',
        primaryColor: '#D50A0A',
        secondaryColor: '#FF7900'
    },
    'Tennessee Titans': {
        logo: '⚡',
        primaryColor: '#0C2340',
        secondaryColor: '#4B92DB'
    },
    'Washington Commanders': {
        logo: '🏛️',
        primaryColor: '#5A1414',
        secondaryColor: '#FFB612'
    }
};

// Function to get team logo
function getTeamLogo(teamName) {
    const team = NFL_TEAMS[teamName];
    return team ? team.logo : '🏈';
}

// Function to get team colors
function getTeamColors(teamName) {
    const team = NFL_TEAMS[teamName];
    return team ? {
        primary: team.primaryColor,
        secondary: team.secondaryColor
    } : {
        primary: '#666666',
        secondary: '#CCCCCC'
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NFL_TEAMS, getTeamLogo, getTeamColors };
}
