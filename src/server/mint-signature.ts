"use server";

import { LEAP_LIGHT_NODE_ABI } from '@/constants';
import { ethers } from 'ethers';

// Contract details - you should store these in env variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_NAME = "LeapLightNode";
const CONTRACT_VERSION = "1.0";

// Whitelist storage - in a production app, you would use a database
const whitelistedAddresses = new Map<string, boolean>();

export async function mintSignature(address: string) {
  try {
    if (!address) {
      throw new Error("Wallet address is required");
    }

    // Check if address is whitelisted
    if (!isWhitelisted(address)) {
      throw new Error("Address is not whitelisted");
    }

    // Get private key from environment variables
    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!privateKey || !CONTRACT_ADDRESS) {
      throw new Error("Server configuration error");
    }

    // Create a signer from the private key
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    // Get chain ID
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // Create signature
    const signature = await createMintSignature(address, signer, chainId, "0x01");

    // Return the signature
    return { signature };

  } catch (error) {
    console.error('Error creating signature:', error);
    throw new Error(`Failed to create signature: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to check if an address is whitelisted
function isWhitelisted(address: string): boolean {
  return whitelistedAddresses.has(address.toLowerCase());
}

// Function to add an address to the whitelist
export async function addToWhitelist(address: string) {
  try {
    if (!address) {
      throw new Error("Wallet address is required");
    }

    whitelistedAddresses.set(address.toLowerCase(), true);
    return { success: true, message: "Address added to whitelist" };
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    throw new Error(`Failed to add to whitelist: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to get all whitelisted addresses
export async function getWhitelistedAddresses() {
  try {
    return { addresses: Array.from(whitelistedAddresses.keys()) };
  } catch (error) {
    console.error('Error getting whitelisted addresses:', error);
    throw new Error(`Failed to get whitelisted addresses: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function createMintSignature(to: string, signer: ethers.Wallet, chainId: bigint, stage: string = "0x01") {
  const domain = {
    name: CONTRACT_NAME,
    version: CONTRACT_VERSION,
    chainId: Number(chainId),
    verifyingContract: CONTRACT_ADDRESS
  };

  const types = {
    Mint: [
      { name: "to", type: "address" },
      { name: "stage", type: "bytes1" }
    ]
  };

  const value = {
    to: to,
    stage: stage
  };

  return await signer.signTypedData(domain, types, value);
}

// Function to update stage for a single user
export async function updateUserStage(address: string, stage: number) {
  try {
    if (!address) {
      throw new Error("Wallet address is required");
    }

    if (stage < 1 || stage > 3) {
      throw new Error("Stage must be between 1 and 3");
    }

    // Get admin private key from environment variables
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey || !CONTRACT_ADDRESS) {
      throw new Error("Server configuration error");
    }

    // Create a signer from the admin private key
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const adminSigner = new ethers.Wallet(adminPrivateKey, provider);

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, LEAP_LIGHT_NODE_ABI, adminSigner);

    // Get token ID for the address
    const tokenId = await contract.tokenOfOwnerByIndex(address, 0);

    // Convert stage number to bytes1
    const stageByte = ethers.toBeHex(stage, 1); // Convert to 1-byte hex

    // Update the token stage
    const tx = await contract.updateTokenStage(tokenId, stageByte);
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash
    };
  } catch (error) {
    console.error('Error updating user stage:', error);
    throw new Error(`Failed to update user stage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to batch update stages for multiple users
export async function batchUpdateStages(addresses: string[], stage: number) {
  try {
    if (!addresses || addresses.length === 0) {
      throw new Error("At least one address is required");
    }

    if (stage < 1 || stage > 3) {
      throw new Error("Stage must be between 1 and 3");
    }

    // Get admin private key from environment variables
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey || !CONTRACT_ADDRESS) {
      throw new Error("Server configuration error");
    }

    // Create a signer from the admin private key
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const adminSigner = new ethers.Wallet(adminPrivateKey, provider);

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, LEAP_LIGHT_NODE_ABI, adminSigner);

    // Convert stage number to bytes1
    const stageByte = ethers.toBeHex(stage, 1); // Convert to 1-byte hex

    // Batch update the token stages
    const tx = await contract.batchUpdateStagesByAddress(addresses, stageByte);
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash
    };
  } catch (error) {
    console.error('Error batch updating stages:', error);
    throw new Error(`Failed to batch update stages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

