import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { mintSignature } from '@/server/mint-signature';
import { LEAP_LIGHT_NODE_ABI } from '../constants';
import { toast } from 'sonner';

interface MintNFTProps {
  onMintSuccess?: () => void;
}

export function MintNFT({ onMintSuccess }: MintNFTProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isMinting, setIsMinting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  async function handleMint() {
    if (!address || !walletClient || !publicClient) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsMinting(true);
      setError(null);

      const { signature } = await mintSignature(address);
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      toast.loading('Minting your NFT...', { id: 'mint' });

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: LEAP_LIGHT_NODE_ABI,
        functionName: 'safeMint',
        args: [signature as `0x${string}`]
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction confirmed:', receipt);

      toast.success('NFT minted successfully!', { id: 'mint' });
      
      if (onMintSuccess) {
        onMintSuccess();
      }
    } catch (err) {
      console.error('Minting error:', err);
      setError('Failed to mint NFT');
      toast.error('Failed to mint NFT', { id: 'mint' });
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Mint Your NFT</h1>
      <button
        onClick={handleMint}
        disabled={isMinting}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
      >
        {isMinting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Mint NFT'
        )}
      </button>
      {/* {error && <p className="text-red-500">{error}</p>} */}
    </>
  );
} 