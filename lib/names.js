// Generate consistent male names from visitor IDs
const MALE_NAMES = [
    'Carl', 'Fred', 'Mike', 'Jake', 'Dave', 'Tom', 'Brad', 'Chad', 'Kyle', 'Ryan',
    'Mark', 'Steve', 'John', 'Paul', 'Dan', 'Matt', 'Luke', 'Max', 'Sam', 'Ben',
    'Alex', 'Chris', 'Nick', 'Tim', 'Rob', 'Sean', 'Adam', 'Eric', 'James', 'Josh',
    'Tyler', 'Brandon', 'Kevin', 'Brian', 'Scott', 'Jason', 'Jeff', 'Gary', 'Greg', 'Derek',
    'Colin', 'Justin', 'Evan', 'Aaron', 'Dylan', 'Logan', 'Mason', 'Nathan', 'Owen', 'Blake'
];

// Simple hash function for consistent name assignment
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Get consistent name for visitor ID
function getVisitorName(visitorId) {
    if (!visitorId) return 'Anonymous';
    
    const hash = hashString(visitorId);
    const index = hash % MALE_NAMES.length;
    return MALE_NAMES[index];
}

module.exports = { getVisitorName };

