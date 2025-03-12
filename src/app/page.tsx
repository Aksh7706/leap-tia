'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { MintNFT } from '@/components/MintNFT';
import { useNFTBalance } from '@/hooks/useNFTBalance';
import { NFTDetails } from '@/components/NFTDetails';
import { useState, useEffect } from 'react';
import { addToWhitelist, getWhitelistedAddresses, batchUpdateStages } from '@/server/mint-signature';
import { BLOCKCHAIN_EXPLORER } from '@/constants';
import { toast } from 'sonner';

// Add constant for NFT contract address - replace with your actual address
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Home() {
  const { isConnected, address } = useAccount();
  const { hasNFT, tokenId, metadata, isLoading, refetch } = useNFTBalance();
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>([]);
  const [isAddingToWhitelist, setIsAddingToWhitelist] = useState(false);
  const [isWhitelistLoading, setIsWhitelistLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);

  const handleMintSuccess = async () => {
    // Refetch NFT data after successful mint
    await refetch();
  };

  const fetchWhitelistedAddresses = async () => {
    try {
      setIsWhitelistLoading(true);
      const { addresses } = await getWhitelistedAddresses();
      console.log(addresses);
      setWhitelistedAddresses(addresses);
    } catch (error) {
      console.error('Failed to fetch whitelisted addresses:', error);
    } finally {
      setIsWhitelistLoading(false);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!address) return;
    
    try {
      setIsAddingToWhitelist(true);
      await addToWhitelist(address);
      await fetchWhitelistedAddresses();
    } catch (error) {
      console.error('Failed to add to whitelist:', error);
    } finally {
      setIsAddingToWhitelist(false);
    }
  };

  const getCurrentStage = (): number => {
    if (!metadata?.attributes) return 0;
    
    const stageAttribute = metadata.attributes.find(attr => 
      attr.trait_type === 'Stage' || attr.trait_type === 'stage'
    );
    return stageAttribute ? Number(stageAttribute.value) : 0;
  };
  
  const currentStage = getCurrentStage();
  const canPromote = hasNFT && currentStage < 3;
  
  const handlePromote = async () => {
    if (!address || !hasNFT) return;
    
    try {
      setIsPromoting(true);
      toast.loading('Promoting to next stage...', { id: 'promote' });
      await batchUpdateStages([address], currentStage + 1);
      await refetch();
      toast.success(`Successfully promoted to Stage ${currentStage + 1}!`, { id: 'promote' });
    } catch (error) {
      console.error('Failed to promote user:', error);
      toast.error('Failed to promote. Please try again.', { id: 'promote' });
    } finally {
      setIsPromoting(false);
    }
  };

  useEffect(() => {
    fetchWhitelistedAddresses();
  }, []);

  const isCurrentAddressWhitelisted = address && whitelistedAddresses.includes(address.toLowerCase());

  const openExplorer = () => {
    // You can adjust this URL based on which network you're using
    window.open(`${BLOCKCHAIN_EXPLORER}/address/${NFT_CONTRACT_ADDRESS}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)] relative pb-14">
      {/* Header with ConnectButton in top right */}
      <header className="sticky top-0 w-full p-4 flex justify-end z-10 bg-background/80 backdrop-blur-sm">
        <ConnectButton />
      </header>

      {/* Main content - two column layout */}
      <main className="flex-1 flex flex-col md:flex-row p-8 gap-8 sm:p-20">
        {/* Left side - Main dApp content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            {!isConnected ? (
              <p className="text-center max-w-md">
                Connect your wallet to interact with this dApp.
              </p>
            ) : isLoading ? (
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : hasNFT ? (
              <NFTDetails tokenId={tokenId!} metadata={metadata} />
            ) : (
              <MintNFT onMintSuccess={handleMintSuccess} />
            )}
          </div>
        </div>

        {/* Right side - Whitelist */}
        <div className="flex-1 flex flex-col border-l border-gray-200 pl-8">
          <h2 className="text-xl font-semibold mb-4">Whitelist</h2>
          
          {isConnected && (
            <div className="mb-6">
              <button
                onClick={handleAddToWhitelist}
                disabled={isAddingToWhitelist || isCurrentAddressWhitelisted}
                className={`px-4 py-2 rounded cursor-pointer ${
                  isCurrentAddressWhitelisted 
                    ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAddingToWhitelist 
                  ? 'Adding...' 
                  : isCurrentAddressWhitelisted 
                    ? 'Already Whitelisted' 
                    : 'Add Me to Whitelist'}
              </button>
              
              {/* Promote Me button */}
              {hasNFT && (
                <button
                  onClick={handlePromote}
                  disabled={isPromoting || !canPromote || isLoading}
                  className={`px-4 py-2 rounded cursor-pointer ml-2 ${
                    !canPromote 
                      ? 'bg-gray-100 text-gray-800 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isPromoting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : currentStage >= 3
                    ? 'Max Stage Reached'
                    : 'Promote Me'}
                </button>
              )}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium mb-2">Whitelisted Addresses</h3>
            {isWhitelistLoading ? (
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : whitelistedAddresses.length === 0 ? (
              <p className="text-gray-500">No addresses whitelisted yet</p>
            ) : (
              <ul className="text-sm border border-gray-200 rounded divide-y max-h-80 overflow-y-auto">
                {whitelistedAddresses.map(addr => (
                  <li key={addr} className="p-2 break-all">
                    {addr}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Footer with contract address - fixed at bottom */}
      <footer className="fixed bottom-0 left-0 w-full p-4 text-center text-sm backdrop-blur-sm z-10">
        <div 
          onClick={openExplorer} 
          className="cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1"
        >
          <span>NFT Contract:</span>
          <span className="font-mono">{NFT_CONTRACT_ADDRESS}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </div>
      </footer>
    </div>
  );
}
