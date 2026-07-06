/**
 * Utility for generating distributed counter shards.
 * To avoid Firebase document write limits (1 write/second),
 * we append a random or terminal-based shard ID to the counter ID.
 */

/**
 * Returns a random shard prefix (e.g., 'T1', 'T2')
 * @param {number} maxShards Maximum number of shards (default: 5)
 * @returns {string} Shard prefix
 */
export const getRandomShard = (maxShards = 5) => {
    // Generate a random number between 1 and maxShards
    const shardNum = Math.floor(Math.random() * maxShards) + 1;
    return `T${shardNum}`;
};
