#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mint_nft() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let minter = Address::generate(&env);
    let nft_id = client.mint(
        &minter,
        &String::from_str(&env, "Pixel Art #1"),
        &String::from_str(&env, "A cool pixel art piece"),
        &String::from_str(&env, "https://example.com/pixel1.png"),
    );

    assert_eq!(nft_id, 0);

    let nft = client.get_nft(&0);
    assert_eq!(nft.name, String::from_str(&env, "Pixel Art #1"));
    assert_eq!(
        nft.description,
        String::from_str(&env, "A cool pixel art piece")
    );
    assert_eq!(
        nft.image_url,
        String::from_str(&env, "https://example.com/pixel1.png")
    );
    assert_eq!(nft.creator, minter);
}

#[test]
fn test_mint_multiple_nfts() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let id1 = client.mint(
        &user1,
        &String::from_str(&env, "Art 1"),
        &String::from_str(&env, "First artwork"),
        &String::from_str(&env, "https://example.com/art1.png"),
    );
    let id2 = client.mint(
        &user2,
        &String::from_str(&env, "Art 2"),
        &String::from_str(&env, "Second artwork"),
        &String::from_str(&env, "https://example.com/art2.png"),
    );
    let id3 = client.mint(
        &user1,
        &String::from_str(&env, "Art 3"),
        &String::from_str(&env, "Third artwork"),
        &String::from_str(&env, "https://example.com/art3.png"),
    );

    assert_eq!(id1, 0);
    assert_eq!(id2, 1);
    assert_eq!(id3, 2);
}

#[test]
fn test_transfer_nft() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let recipient = Address::generate(&env);

    let nft_id = client.mint(
        &owner,
        &String::from_str(&env, "Transferable Art"),
        &String::from_str(&env, "This can be transferred"),
        &String::from_str(&env, "https://example.com/transfer.png"),
    );

    assert_eq!(client.get_owner(&nft_id), owner);

    client.transfer(&owner, &recipient, &nft_id);

    assert_eq!(client.get_owner(&nft_id), recipient);

    let recipient_nfts = client.get_owner_nfts(&recipient);
    assert!(recipient_nfts.contains(&nft_id));
}

#[test]
fn test_get_all_nfts() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    client.mint(
        &user1,
        &String::from_str(&env, "NFT One"),
        &String::from_str(&env, "First"),
        &String::from_str(&env, "https://example.com/1.png"),
    );
    client.mint(
        &user2,
        &String::from_str(&env, "NFT Two"),
        &String::from_str(&env, "Second"),
        &String::from_str(&env, "https://example.com/2.png"),
    );
    client.mint(
        &user1,
        &String::from_str(&env, "NFT Three"),
        &String::from_str(&env, "Third"),
        &String::from_str(&env, "https://example.com/3.png"),
    );

    let all_nfts = client.get_all_nfts();
    assert_eq!(all_nfts.len(), 3);
}

#[test]
fn test_get_owner_nfts() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let id1 = client.mint(
        &user1,
        &String::from_str(&env, "User1 Art 1"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "https://example.com/u1-1.png"),
    );
    client.mint(
        &user2,
        &String::from_str(&env, "User2 Art"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "https://example.com/u2-1.png"),
    );
    let id3 = client.mint(
        &user1,
        &String::from_str(&env, "User1 Art 2"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "https://example.com/u1-2.png"),
    );

    let user1_nfts = client.get_owner_nfts(&user1);
    assert_eq!(user1_nfts.len(), 2);
    assert!(user1_nfts.contains(&id1));
    assert!(user1_nfts.contains(&id3));
}

#[test]
fn test_set_metadata() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "Original Name"),
        &String::from_str(&env, "Original Desc"),
        &String::from_str(&env, "https://example.com/original.png"),
    );

    client.set_metadata(
        &owner,
        &0,
        &String::from_str(&env, "Updated Name"),
        &String::from_str(&env, "Updated Description"),
        &String::from_str(&env, "https://example.com/updated.png"),
    );

    let nft = client.get_nft(&0);
    assert_eq!(nft.name, String::from_str(&env, "Updated Name"));
    assert_eq!(
        nft.description,
        String::from_str(&env, "Updated Description")
    );
    assert_eq!(
        nft.image_url,
        String::from_str(&env, "https://example.com/updated.png")
    );
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #1)")]
fn test_transfer_non_existent_nft() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.transfer(&owner, &recipient, &999);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #2)")]
fn test_transfer_not_owner() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let other = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "Art"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "https://example.com/art.png"),
    );

    client.transfer(&other, &recipient, &0);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #3)")]
fn test_set_metadata_not_owner() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let other = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "Art"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "https://example.com/art.png"),
    );

    client.set_metadata(
        &other,
        &0,
        &String::from_str(&env, "Hacked Name"),
        &String::from_str(&env, "Hacked Desc"),
        &String::from_str(&env, "https://malicious.com/hack.png"),
    );
}

#[test]
fn test_get_nfts_paginated() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // Mint 5 NFTs
    for _ in 0..5 {
        client.mint(
            &user,
            &String::from_str(&env, "Art "),
            &String::from_str(&env, "Desc "),
            &String::from_str(&env, "https://example.com/.png"),
        );
    }

    // Get paginated (first 3)
    let page1 = client.get_nfts_paginated(&0, &3);
    assert_eq!(page1.len(), 3);

    // Get paginated (next batch)
    let page2 = client.get_nfts_paginated(&3, &3);
    assert_eq!(page2.len(), 2);
}

#[test]
fn test_get_owner_empty() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    let owner_nfts = client.get_owner_nfts(&user);
    assert_eq!(owner_nfts.len(), 0);
}

#[test]
fn test_get_all_nfts_empty() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let all_nfts = client.get_all_nfts();
    assert_eq!(all_nfts.len(), 0);
}
