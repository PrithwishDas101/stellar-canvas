#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, Map,
    String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NFTNotFound = 1,
    NotOwner = 2,
    NotNFTOwner = 3,
}

#[contracttype]
#[derive(Clone)]
pub struct NFTData {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub image_url: String,
    pub creator: Address,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    NFTs,      // Map<u64, NFTData>
    Owners,    // Map<u64, Address>
    OwnerNFTs, // Map<Address, Vec<u64>>
    AllIDs,    // Vec<u64> - list of all NFT IDs for iteration
    NextID,    // u64
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Mint a new NFT. Anyone can mint - completely permissionless.
    pub fn mint(
        env: Env,
        minter: Address,
        name: String,
        description: String,
        image_url: String,
    ) -> u64 {
        minter.require_auth();

        // Get and increment next ID
        let next_id = env
            .storage()
            .instance()
            .get::<_, u64>(&DataKey::NextID)
            .unwrap_or(0);
        let nft_id = next_id;
        env.storage()
            .instance()
            .set(&DataKey::NextID, &(next_id + 1));

        let nft = NFTData {
            id: nft_id,
            name,
            description,
            image_url,
            creator: minter.clone(),
            created_at: env.ledger().timestamp(),
        };

        // Store NFT data
        let mut nfts: Map<u64, NFTData> = env
            .storage()
            .instance()
            .get(&DataKey::NFTs)
            .unwrap_or_else(|| Map::new(&env));
        nfts.set(nft_id, nft);
        env.storage().instance().set(&DataKey::NFTs, &nfts);

        // Store ownership
        let mut owners: Map<u64, Address> = env
            .storage()
            .instance()
            .get(&DataKey::Owners)
            .unwrap_or_else(|| Map::new(&env));
        owners.set(nft_id, minter.clone());
        env.storage().instance().set(&DataKey::Owners, &owners);

        // Track owner's NFTs
        let mut owner_nfts: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerNFTs)
            .unwrap_or_else(|| Map::new(&env));
        let mut nft_list = owner_nfts
            .get(minter.clone())
            .unwrap_or_else(|| Vec::new(&env));
        nft_list.push_back(nft_id);
        owner_nfts.set(minter, nft_list);
        env.storage()
            .instance()
            .set(&DataKey::OwnerNFTs, &owner_nfts);

        // Track all IDs for gallery view
        let mut all_ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::AllIDs)
            .unwrap_or_else(|| Vec::new(&env));
        all_ids.push_back(nft_id);
        env.storage().instance().set(&DataKey::AllIDs, &all_ids);

        nft_id
    }

    /// Transfer NFT to another address. Only the owner can transfer.
    pub fn transfer(env: Env, from: Address, to: Address, nft_id: u64) {
        from.require_auth();

        let owners: Map<u64, Address> = env
            .storage()
            .instance()
            .get(&DataKey::Owners)
            .unwrap_or_else(|| Map::new(&env));
        if !owners.contains_key(nft_id) {
            panic_with_error!(&env, Error::NFTNotFound);
        }
        let current_owner = owners.get(nft_id).unwrap();

        if current_owner != from {
            panic_with_error!(&env, Error::NotOwner);
        }

        // Update ownership
        let mut owners = owners;
        owners.set(nft_id, to.clone());
        env.storage().instance().set(&DataKey::Owners, &owners);

        // Update owner's NFT lists
        let mut owner_nfts: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerNFTs)
            .unwrap_or_else(|| Map::new(&env));

        // Remove from sender
        let from_list = owner_nfts
            .get(from.clone())
            .unwrap_or_else(|| Vec::new(&env));
        let mut new_from_list = Vec::new(&env);
        let len = from_list.len();
        let mut i = 0u32;
        while i < len {
            if let Some(id) = from_list.get(i) {
                if id != nft_id {
                    new_from_list.push_back(id);
                }
            }
            i += 1;
        }
        owner_nfts.set(from, new_from_list);

        // Add to recipient
        let mut to_list = owner_nfts.get(to.clone()).unwrap_or_else(|| Vec::new(&env));
        to_list.push_back(nft_id);
        owner_nfts.set(to, to_list);
        env.storage()
            .instance()
            .set(&DataKey::OwnerNFTs, &owner_nfts);
    }

    /// Get NFT data by ID
    pub fn get_nft(env: Env, nft_id: u64) -> NFTData {
        let nfts: Map<u64, NFTData> = env
            .storage()
            .instance()
            .get(&DataKey::NFTs)
            .unwrap_or_else(|| Map::new(&env));
        if !nfts.contains_key(nft_id) {
            panic_with_error!(&env, Error::NFTNotFound);
        }
        nfts.get(nft_id).unwrap()
    }

    /// Get owner of an NFT
    pub fn get_owner(env: Env, nft_id: u64) -> Address {
        let owners: Map<u64, Address> = env
            .storage()
            .instance()
            .get(&DataKey::Owners)
            .unwrap_or_else(|| Map::new(&env));
        if !owners.contains_key(nft_id) {
            panic_with_error!(&env, Error::NFTNotFound);
        }
        owners.get(nft_id).unwrap()
    }

    /// Get all NFTs in the gallery
    pub fn get_all_nfts(env: Env) -> Vec<NFTData> {
        let all_ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::AllIDs)
            .unwrap_or_else(|| Vec::new(&env));

        let nfts: Map<u64, NFTData> = env
            .storage()
            .instance()
            .get(&DataKey::NFTs)
            .unwrap_or_else(|| Map::new(&env));

        let mut result = Vec::new(&env);
        let len = all_ids.len();
        let mut i = 0u32;
        while i < len {
            if let Some(id) = all_ids.get(i) {
                if let Some(nft) = nfts.get(id) {
                    result.push_back(nft);
                }
            }
            i += 1;
        }

        result
    }

    /// Get all NFTs owned by a specific address
    pub fn get_owner_nfts(env: Env, owner: Address) -> Vec<u64> {
        let owner_nfts: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerNFTs)
            .unwrap_or_else(|| Map::new(&env));
        owner_nfts.get(owner).unwrap_or_else(|| Vec::new(&env))
    }

    /// Get NFTs with pagination (offset, limit)
    pub fn get_nfts_paginated(env: Env, offset: u32, limit: u32) -> Vec<NFTData> {
        let all_ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::AllIDs)
            .unwrap_or_else(|| Vec::new(&env));

        let nfts: Map<u64, NFTData> = env
            .storage()
            .instance()
            .get(&DataKey::NFTs)
            .unwrap_or_else(|| Map::new(&env));

        let mut result = Vec::new(&env);
        let total = all_ids.len();

        let mut i = offset;
        let mut count = 0u32;
        while i < total && count < limit {
            if let Some(id) = all_ids.get(i) {
                if let Some(nft) = nfts.get(id) {
                    result.push_back(nft);
                }
            }
            i += 1;
            count += 1;
        }

        result
    }

    /// Update NFT metadata. Only the owner can update.
    pub fn set_metadata(
        env: Env,
        owner: Address,
        nft_id: u64,
        name: String,
        description: String,
        image_url: String,
    ) {
        owner.require_auth();

        let owners: Map<u64, Address> = env
            .storage()
            .instance()
            .get(&DataKey::Owners)
            .unwrap_or_else(|| Map::new(&env));
        if !owners.contains_key(nft_id) {
            panic_with_error!(&env, Error::NFTNotFound);
        }
        let current_owner = owners.get(nft_id).unwrap();

        if current_owner != owner {
            panic_with_error!(&env, Error::NotNFTOwner);
        }

        let mut nfts: Map<u64, NFTData> = env
            .storage()
            .instance()
            .get(&DataKey::NFTs)
            .unwrap_or_else(|| Map::new(&env));

        let mut nft = nfts.get(nft_id).unwrap();
        nft.name = name;
        nft.description = description;
        nft.image_url = image_url;

        nfts.set(nft_id, nft);
        env.storage().instance().set(&DataKey::NFTs, &nfts);
    }
}

mod test;
