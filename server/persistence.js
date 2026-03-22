// ═══════════════════════════════════════════════════════════════
//  KINGEST — JSON File Persistence Layer
//  Sauvegarde automatique des données sur disque
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonStore {
    constructor(filename, defaultValue = null) {
        this.filepath = path.join(DATA_DIR, filename);
        this.data = defaultValue;
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filepath)) {
                const raw = fs.readFileSync(this.filepath, 'utf8');
                this.data = JSON.parse(raw);
            }
        } catch (e) {
            console.error(`[PERSIST] Failed to load ${this.filepath}:`, e.message);
        }
        return this.data;
    }

    save() {
        try {
            fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (e) {
            console.error(`[PERSIST] Failed to save ${this.filepath}:`, e.message);
        }
    }

    get() { return this.data; }
    
    set(value) {
        this.data = value;
        this.save();
    }
}

// Persistent Map (for walletBalances, users, etc.)
class PersistentMap extends JsonStore {
    constructor(filename, defaultEntries = {}) {
        super(filename, {});
        if (Object.keys(this.data).length === 0 && Object.keys(defaultEntries).length > 0) {
            this.data = { ...defaultEntries };
            this.save();
        }
    }

    has(key) { return key in this.data; }
    get_val(key) { return this.data[key]; }
    set_val(key, value) { this.data[key] = value; this.save(); }
    delete_val(key) { delete this.data[key]; this.save(); }
    entries() { return Object.entries(this.data); }
    keys() { return Object.keys(this.data); }
    values() { return Object.values(this.data); }
}

// Persistent Array (for transactions)
class PersistentArray extends JsonStore {
    constructor(filename) {
        super(filename, []);
        if (!Array.isArray(this.data)) this.data = [];
    }

    push(item) { this.data.push(item); this.save(); }
    unshift(item) { this.data.unshift(item); this.save(); }
    filter(fn) { return this.data.filter(fn); }
    sort(fn) { return [...this.data].sort(fn); }
    slice(start, end) { return this.data.slice(start, end); }
    get length() { return this.data.length; }
    toArray() { return [...this.data]; }
}

module.exports = { JsonStore, PersistentMap, PersistentArray, DATA_DIR };

