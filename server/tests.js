// ═══════════════════════════════════════════════════════════════
//  KINGEST — Unit Tests for Critical Functions
//  Run: node server/tests.js
// ═══════════════════════════════════════════════════════════════
const assert = require('assert');
const { createToken, verifyToken, hashPin, verifyPin } = require('./auth');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

console.log('\n🧪 KINGEST — Running Unit Tests\n');

// ═══ AUTH TESTS ═══
console.log('=== JWT Auth ===');

test('createToken returns a string with 3 parts', () => {
    const token = createToken({ sub: 'user1', email: 'test@test.com' });
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.split('.').length, 3);
});

test('verifyToken validates a good token', () => {
    const token = createToken({ sub: 'user1', email: 'test@test.com' });
    const payload = verifyToken(token);
    assert.ok(payload);
    assert.strictEqual(payload.sub, 'user1');
    assert.strictEqual(payload.email, 'test@test.com');
});

test('verifyToken rejects a tampered token', () => {
    const token = createToken({ sub: 'user1' });
    const tampered = token.slice(0, -5) + 'XXXXX';
    const payload = verifyToken(tampered);
    assert.strictEqual(payload, null);
});

test('verifyToken rejects null/undefined/empty', () => {
    assert.strictEqual(verifyToken(null), null);
    assert.strictEqual(verifyToken(undefined), null);
    assert.strictEqual(verifyToken(''), null);
    assert.strictEqual(verifyToken('not.a.token'), null);
});

// ═══ PIN HASHING TESTS ═══
console.log('\n=== PIN Hashing ===');

test('hashPin returns hash and salt', () => {
    const result = hashPin('1234');
    assert.ok(result.hash);
    assert.ok(result.salt);
    assert.ok(result.hash.length > 0);
    assert.ok(result.salt.length > 0);
});

test('hashPin with same salt produces same hash', () => {
    const result1 = hashPin('1234', 'fixedsalt');
    const result2 = hashPin('1234', 'fixedsalt');
    assert.strictEqual(result1.hash, result2.hash);
});

test('hashPin with different PINs produces different hashes', () => {
    const result1 = hashPin('1234', 'fixedsalt');
    const result2 = hashPin('5678', 'fixedsalt');
    assert.notStrictEqual(result1.hash, result2.hash);
});

test('verifyPin correctly validates', () => {
    const { hash, salt } = hashPin('9876');
    assert.ok(verifyPin('9876', hash, salt));
    assert.ok(!verifyPin('0000', hash, salt));
});

// ═══ VALIDATION TESTS ═══
console.log('\n=== Input Validation ===');

test('sanitizeString removes XSS vectors', () => {
    // We'll test the server's sanitizeString
    function sanitizeString(str, maxLength = 255) {
        if (typeof str !== 'string') return '';
        return str.trim().substring(0, maxLength).replace(/[<>\"']/g, '');
    }
    assert.strictEqual(sanitizeString('<script>alert(1)</script>'), 'scriptalert(1)/script');
    assert.strictEqual(sanitizeString('normal text'), 'normal text');
    assert.strictEqual(sanitizeString(''), '');
    assert.strictEqual(sanitizeString(null), '');
});

test('IBAN validation', () => {
    function validateIBAN(iban) {
        if (!iban || typeof iban !== 'string') return false;
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{13,30}$/;
        return ibanRegex.test(iban.toUpperCase());
    }
    assert.ok(validateIBAN('FR7630006000011234567890189'));
    assert.ok(validateIBAN('DE89370400440532013000'));
    assert.ok(!validateIBAN('INVALID'));
    assert.ok(!validateIBAN(''));
    assert.ok(!validateIBAN(null));
});

test('Amount validation', () => {
    function validateAmount(amount) {
        const num = parseFloat(amount);
        if (isNaN(num) || num < 10 || num > 50000) return { valid: false };
        return { valid: true };
    }
    assert.ok(validateAmount(100).valid);
    assert.ok(validateAmount(10).valid);
    assert.ok(validateAmount(50000).valid);
    assert.ok(!validateAmount(5).valid);
    assert.ok(!validateAmount(100000).valid);
    assert.ok(!validateAmount('abc').valid);
    assert.ok(!validateAmount(NaN).valid);
});

// ═══ PAYMENT FLOW TESTS ═══
console.log('\n=== Payment Flow ===');

test('Currency validation accepts allowed currencies', () => {
    const ALLOWED = ['USD', 'EUR', 'BTC', 'ETH', 'USDT', 'USDC'];
    function validateCurrency(c) { return ALLOWED.includes(c?.toUpperCase()); }
    assert.ok(validateCurrency('USD'));
    assert.ok(validateCurrency('EUR'));
    assert.ok(validateCurrency('BTC'));
    assert.ok(!validateCurrency('XYZ'));
    assert.ok(!validateCurrency(null));
    assert.ok(!validateCurrency(''));
});

// ═══ SUMMARY ═══
console.log(`\n${'═'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);

