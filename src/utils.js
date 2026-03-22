// Format number with commas (e.g. 1234.56 -> "1,234.56")
export function fmt(n) {
    if (n == null || isNaN(n)) return "0.00";
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format as USD string (e.g. 1234.56 -> "$1,234.56")
export function fUSD(n) {
    if (n == null || isNaN(n)) return "$0.00";
    const abs = Math.abs(n);
    const formatted = "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? "-" + formatted : formatted;
}
