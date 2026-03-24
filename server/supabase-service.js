// ═══════════════════════════════════════════════════════════════
//  KINGEST — Supabase Database Service
//  Persistent user storage that survives Render restarts
// ═══════════════════════════════════════════════════════════════
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ihwctcesfmzerahlpfvm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

let supabase = null;

function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

function getClient() {
    if (!supabase && isConfigured()) {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false },
        });
    }
    return supabase;
}

// ── Initialize: create users table if not exists ──
async function initDatabase() {
    if (!isConfigured()) {
        console.log("⚠️  Supabase not configured — using in-memory fallback");
        return false;
    }

    const client = getClient();

    // Create users table via SQL
    const { error } = await client.rpc("exec_sql", {
        query: `
            CREATE TABLE IF NOT EXISTS kingest_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                pin_hash TEXT NOT NULL,
                pin_salt TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ,
                selfie_data TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_kingest_users_email ON kingest_users(email);
        `,
    });

    if (error) {
        // RPC might not exist — try creating table via direct SQL
        console.log("⚠️  RPC not available, trying direct table creation...");
        // Try creating via REST by just doing an insert test
        const { error: testError } = await client
            .from("kingest_users")
            .select("id")
            .limit(1);

        if (testError && testError.code === "42P01") {
            // Table doesn't exist — need to create it manually
            console.log("❌ Table kingest_users doesn't exist. Creating via SQL...");
            // Use the SQL endpoint directly
            const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                method: "GET",
                headers: {
                    apikey: SUPABASE_SERVICE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
            });
            console.log("📋 Supabase REST status:", response.status);
            return false;
        } else if (!testError) {
            console.log("✅ Supabase connected — kingest_users table exists");
            return true;
        }
    } else {
        console.log("✅ Supabase database initialized");
        return true;
    }
    return false;
}

// ── User CRUD operations ──

async function getUser(email) {
    if (!isConfigured()) return null;
    const { data, error } = await getClient()
        .from("kingest_users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();
    if (error) return null;
    return data;
}

async function createUser({ id, email, pinHash, pinSalt, selfieData }) {
    if (!isConfigured()) return null;
    const { data, error } = await getClient()
        .from("kingest_users")
        .insert({
            id,
            email: email.toLowerCase(),
            pin_hash: pinHash,
            pin_salt: pinSalt,
            selfie_data: selfieData || null,
        })
        .select()
        .single();
    if (error) {
        console.error("[Supabase] createUser error:", error.message);
        return null;
    }
    return data;
}

async function userExists(email) {
    if (!isConfigured()) return false;
    const { data } = await getClient()
        .from("kingest_users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();
    return !!data;
}

async function updateLastLogin(email) {
    if (!isConfigured()) return;
    await getClient()
        .from("kingest_users")
        .update({ last_login: new Date().toISOString() })
        .eq("email", email.toLowerCase());
}

async function countUsers() {
    if (!isConfigured()) return 0;
    const { count } = await getClient()
        .from("kingest_users")
        .select("*", { count: "exact", head: true });
    return count || 0;
}

module.exports = {
    isConfigured,
    getClient,
    initDatabase,
    getUser,
    createUser,
    userExists,
    updateLastLogin,
    countUsers,
};
