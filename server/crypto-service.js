/**
 * KINGEST Crypto Service
 *
 * Provides real blockchain interaction via public APIs:
 * - Etherscan/Polygonscan/etc for EVM chains (balance + tx verification)
 * - Blockstream for Bitcoin
 * - Trongrid for TRON
 *
 * For sending: uses custody model — transactions are queued and require
 * manual approval or integration with a custody provider (Fireblocks, BitGo)
 * in production. For now, sends go through simulation with clear labeling.
 */

const fetch = require("node-fetch");

// Block explorer APIs (free tiers, no API key needed for basic calls)
const EXPLORERS = {
    ethereum: {
        api: "https://api.etherscan.io/api",
        txUrl: "https://etherscan.io/tx/",
    },
    polygon: {
        api: "https://api.polygonscan.com/api",
        txUrl: "https://polygonscan.com/tx/",
    },
    arbitrum: {
        api: "https://api.arbiscan.io/api",
        txUrl: "https://arbiscan.io/tx/",
    },
    base: {
        api: "https://api.basescan.org/api",
        txUrl: "https://basescan.org/tx/",
    },
    bsc: {
        api: "https://api.bscscan.com/api",
        txUrl: "https://bscscan.com/tx/",
    },
};

/**
 * Verify an EVM transaction on-chain
 * @param {string} txHash - Transaction hash
 * @param {string} network - Network name (ethereum, polygon, etc.)
 * @returns {object} { verified, confirmations, from, to, value, blockNumber }
 */
async function verifyEVMTransaction(txHash, network) {
    const explorer = EXPLORERS[network];
    if (!explorer) return { verified: false, error: "Unsupported network" };

    try {
        const url = `${explorer.api}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
        const res = await fetch(url, { timeout: 10000 });
        const data = await res.json();

        if (data.status === "1" && data.result?.status === "1") {
            // Get transaction details
            const detailUrl = `${explorer.api}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`;
            const detailRes = await fetch(detailUrl, { timeout: 10000 });
            const detail = await detailRes.json();

            return {
                verified: true,
                txHash,
                network,
                from: detail.result?.from,
                to: detail.result?.to,
                value: detail.result?.value,
                blockNumber: detail.result?.blockNumber,
                explorerUrl: explorer.txUrl + txHash,
            };
        }

        return { verified: false, txHash, network, error: "Transaction not confirmed" };
    } catch (e) {
        return { verified: false, txHash, network, error: e.message };
    }
}

/**
 * Check EVM address balance (native token)
 * @param {string} address - Wallet address
 * @param {string} network - Network name
 * @returns {object} { balance (in wei), formatted }
 */
async function getEVMBalance(address, network) {
    const explorer = EXPLORERS[network];
    if (!explorer) return { balance: "0", formatted: "0", error: "Unsupported network" };

    try {
        const url = `${explorer.api}?module=account&action=balance&address=${address}&tag=latest`;
        const res = await fetch(url, { timeout: 10000 });
        const data = await res.json();

        if (data.status === "1") {
            const wei = BigInt(data.result);
            const eth = Number(wei) / 1e18;
            return { balance: data.result, formatted: eth.toFixed(6), network };
        }

        return { balance: "0", formatted: "0", error: data.message };
    } catch (e) {
        return { balance: "0", formatted: "0", error: e.message };
    }
}

/**
 * Verify Bitcoin transaction via Blockstream API
 * @param {string} txid - Bitcoin transaction ID
 * @returns {object} { verified, confirmations, amount }
 */
async function verifyBTCTransaction(txid) {
    try {
        const url = `https://blockstream.info/api/tx/${txid}`;
        const res = await fetch(url, { timeout: 10000 });

        if (!res.ok) return { verified: false, error: "Transaction not found" };

        const tx = await res.json();
        const confirmed = tx.status?.confirmed || false;

        return {
            verified: confirmed,
            txHash: txid,
            network: "bitcoin",
            confirmations: tx.status?.block_height ? "confirmed" : "unconfirmed",
            fee: tx.fee,
            explorerUrl: `https://blockstream.info/tx/${txid}`,
        };
    } catch (e) {
        return { verified: false, error: e.message };
    }
}

/**
 * Get Bitcoin address balance via Blockstream API
 * @param {string} address - Bitcoin address
 * @returns {object} { balance (in satoshis), formatted (in BTC) }
 */
async function getBTCBalance(address) {
    try {
        const url = `https://blockstream.info/api/address/${address}`;
        const res = await fetch(url, { timeout: 10000 });

        if (!res.ok) return { balance: 0, formatted: "0", error: "Address not found" };

        const data = await res.json();
        const funded = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        const balance = funded - spent;

        return {
            balance,
            formatted: (balance / 1e8).toFixed(8),
            network: "bitcoin",
            txCount: data.chain_stats?.tx_count || 0,
        };
    } catch (e) {
        return { balance: 0, formatted: "0", error: e.message };
    }
}

/**
 * Verify a TRON transaction via TronGrid
 * @param {string} txHash - Transaction hash
 * @returns {object} { verified, ... }
 */
async function verifyTRONTransaction(txHash) {
    try {
        const url = `https://api.trongrid.io/v1/transactions/${txHash}`;
        const res = await fetch(url, { timeout: 10000 });
        const data = await res.json();

        if (data.success && data.data?.length > 0) {
            const tx = data.data[0];
            return {
                verified: tx.ret?.[0]?.contractRet === "SUCCESS",
                txHash,
                network: "tron",
                explorerUrl: `https://tronscan.org/#/transaction/${txHash}`,
            };
        }

        return { verified: false, error: "Transaction not found" };
    } catch (e) {
        return { verified: false, error: e.message };
    }
}

/**
 * Universal transaction verification
 * Routes to the right chain based on network
 */
async function verifyTransaction(txHash, network) {
    const net = network.toLowerCase();

    if (net === "bitcoin" || net === "lightning") {
        return verifyBTCTransaction(txHash);
    }
    if (net === "tron") {
        return verifyTRONTransaction(txHash);
    }
    // EVM chains
    if (EXPLORERS[net]) {
        return verifyEVMTransaction(txHash, net);
    }

    return { verified: false, error: `Unsupported network: ${network}` };
}

/**
 * Universal balance check
 */
async function getBalance(address, network) {
    const net = network.toLowerCase();

    if (net === "bitcoin") {
        return getBTCBalance(address);
    }
    if (EXPLORERS[net]) {
        return getEVMBalance(address, net);
    }

    return { balance: "0", formatted: "0", error: `Unsupported network: ${network}` };
}

module.exports = {
    verifyTransaction,
    getBalance,
    verifyEVMTransaction,
    verifyBTCTransaction,
    verifyTRONTransaction,
    getEVMBalance,
    getBTCBalance,
    EXPLORERS,
};
