import { getRandomShard } from '../dh-shared/src/utils/counterUtils.js';

console.log("=== Testing Distributed Counter Utility ===");
for (let i = 0; i < 5; i++) {
    const shard = getRandomShard(5);
    console.log(`Generated Shard [${i+1}]: ${shard}`);
    if (!shard.startsWith('T') || parseInt(shard.replace('T', '')) > 5 || parseInt(shard.replace('T', '')) < 1) {
        throw new Error("Invalid shard generated!");
    }
}
console.log("SUCCESS: Shard generation is valid and functional.");
