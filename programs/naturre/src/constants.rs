pub const CONFIG_SEED: &[u8] = b"config";
pub const VALIDATOR_SEED: &[u8] = b"validator";
pub const TREE_SEED: &[u8] = b"tree";
pub const USER_STATS_SEED: &[u8] = b"user_stats";
pub const VOTE_SEED: &[u8] = b"vote";

/// GPS coordinates scaled by 10^7
pub const GPS_SCALE: i64 = 10_000_000;
pub const MIN_LATITUDE: i64 = -90 * GPS_SCALE;   // -900_000_000
pub const MAX_LATITUDE: i64 = 90 * GPS_SCALE;    //  900_000_000
pub const MIN_LONGITUDE: i64 = -180 * GPS_SCALE; // -1_800_000_000
pub const MAX_LONGITUDE: i64 = 180 * GPS_SCALE;  //  1_800_000_000

/// Maximum length for IPFS metadata CID string
pub const MAX_METADATA_CID_LEN: usize = 100;

/// Default required approvals for consensus
pub const DEFAULT_REQUIRED_APPROVALS: u8 = 2;

/// Milestone verification thresholds (PRD aligned)
pub const MILESTONE_FIRST_ROOT: u32 = 1;
pub const MILESTONE_GROVE_BUILDER: u32 = 10;
pub const MILESTONE_FOREST_GUARDIAN: u32 = 50;

/// Milestone bitmask flags
pub const MILESTONE_FLAG_FIRST_ROOT: u8 = 1 << 0;       // 0b00000001
pub const MILESTONE_FLAG_GROVE_BUILDER: u8 = 1 << 1;     // 0b00000010
pub const MILESTONE_FLAG_FOREST_GUARDIAN: u8 = 1 << 2;  // 0b00000100
