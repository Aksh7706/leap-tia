import { useAccount, useContractRead } from 'wagmi';
import { IPFS_GATEWAY, LEAP_LIGHT_NODE_ABI } from '../constants';
import { useEffect, useState } from 'react';

// Define metadata type for better type safety
interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export function useNFTBalance() {
  const { address } = useAccount();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  
  // Get the NFT balance for the connected address
  const { 
    data: balance, 
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useContractRead({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: LEAP_LIGHT_NODE_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
    }
  });

  // If user has NFTs, get the first token ID
  const { 
    data: tokenId, 
    isLoading: isTokenIdLoading,
    refetch: refetchTokenId
  } = useContractRead({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: LEAP_LIGHT_NODE_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address!, BigInt(0)],
    query: {
      enabled: !!address && (balance as bigint) > BigInt(0),
    }
  });

  // If we have a token ID, get its URI
  const { 
    data: tokenURI, 
    isLoading: isTokenURILoading,
    refetch: refetchTokenURI
  } = useContractRead({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: LEAP_LIGHT_NODE_ABI,
    functionName: 'tokenURI',
    args: [tokenId as bigint],
    query: {
      enabled: !!tokenId,
    }
  });

  // Fetch metadata from tokenURI
  useEffect(() => {
    if (!tokenURI) return;
    
    const fetchMetadata = async () => {
      try {
        setIsMetadataLoading(true);
        // Handle both IPFS and HTTP URIs
        const uri = (tokenURI as string).replace('ipfs://', IPFS_GATEWAY);
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        setMetadata(null);
      } finally {
        setIsMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [tokenURI]);

  // Create a combined refetch function that will refetch all the data
  const refetch = async () => {
    await refetchBalance();
    // Only refetch tokenId if we have a positive balance
    if ((balance as bigint) > BigInt(0)) {
      await refetchTokenId();
      // Only refetch tokenURI if we have a tokenId
      if (tokenId) {
        await refetchTokenURI();
      }
    }
  };

  const isLoading = isBalanceLoading || isTokenIdLoading || isTokenURILoading || isMetadataLoading;
  const hasNFT = !isLoading && (balance as bigint) > BigInt(0);

  return {
    hasNFT,
    tokenId: tokenId ? Number(tokenId) : null,
    metadata,
    isLoading,
    refetch,
  };
} 