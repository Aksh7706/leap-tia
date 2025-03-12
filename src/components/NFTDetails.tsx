import { IPFS_GATEWAY } from "../constants";

interface NFTDetailsProps {
  tokenId: number;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  } | null;
}

export function NFTDetails({ tokenId, metadata }: NFTDetailsProps) {
  if (!metadata) {
    return (
      <div className="p-6 border rounded-xl max-w-md">
        <h2 className="text-xl font-semibold mb-2">NFT #{tokenId}</h2>
        <p>Loading metadata...</p>
      </div>
    );
  }

  console.log(metadata);

  // Convert IPFS URLs to gateway URLs for display
  const imageUrl = metadata.image?.replace('ipfs://', IPFS_GATEWAY);

  return (
    <div className="p-6 border rounded-xl max-w-md">
      <h2 className="text-xl font-semibold mb-2">{`${metadata.name} #${tokenId}`}</h2>
      
      {imageUrl && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img src={imageUrl} alt={metadata.name || `NFT #${tokenId}`} className="w-full" />
        </div>
      )}
      
      {metadata.attributes && metadata.attributes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Attributes</h3>
          <div className="grid grid-cols-2 gap-2">
            {metadata.attributes.map((attr, index) => (
              <div key={index} className="rounded">
                <p className="text-sm font-medium">{attr.trait_type}: {attr.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 