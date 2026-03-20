"use client";

import { useState, useCallback, useEffect } from "react";
import {
  mintNFT,
  getAllNFTs,
  getNFT,
  getOwnerNFTs,
  transferNFT,
  setNFTMetadata,
  CONTRACT_ADDRESS,
  NFTData,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────

function Textarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <textarea
          {...props}
          rows={3}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none resize-none"
        />
      </div>
    </div>
  );
}

// ── NFT Card ─────────────────────────────────────────────

function NFTCard({
  nft,
  walletAddress,
  onTransfer,
  onEdit,
}: {
  nft: NFTData;
  walletAddress: string | null;
  onTransfer: (nftId: number) => void;
  onEdit: (nftId: number) => void;
}) {
  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const isOwner = walletAddress && nft.creator === walletAddress;

  return (
    <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className="aspect-square bg-gradient-to-br from-[#7c6cf0]/10 to-[#4fc3f7]/10 flex items-center justify-center relative overflow-hidden">
        {nft.image_url ? (
          <img
            src={nft.image_url}
            alt={nft.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="text-white/20">
            <ImageIcon />
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="info" className="text-[10px] font-mono">#{nft.id}</Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-white/90 truncate">{nft.name}</h3>
        <p className="text-xs text-white/40 line-clamp-2 h-8">{nft.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/25">Creator</span>
            <span className="font-mono text-[10px] text-white/50">{truncate(nft.creator)}</span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(nft.id)}
                className="p-1.5 rounded-lg text-white/30 hover:text-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all"
                title="Edit metadata"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => onTransfer(nft.id)}
                className="p-1.5 rounded-lg text-white/30 hover:text-[#4fc3f7] hover:bg-[#4fc3f7]/10 transition-all"
                title="Transfer"
              >
                <SendIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Transfer Modal ─────────────────────────────────────────────

function TransferModal({
  nftId,
  onClose,
  onTransfer,
  isTransferring,
}: {
  nftId: number;
  onClose: () => void;
  onTransfer: (recipient: string) => void;
  isTransferring: boolean;
}) {
  const [recipient, setRecipient] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <AnimatedCard className="relative z-10 w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Transfer NFT #{nftId}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">&times;</button>
        </div>
        <Input
          label="Recipient Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="G..."
        />
        <ShimmerButton
          onClick={() => onTransfer(recipient)}
          disabled={!recipient.trim() || isTransferring}
          shimmerColor="#4fc3f7"
          className="w-full"
        >
          {isTransferring ? <><SpinnerIcon /> Transferring...</> : <><SendIcon /> Transfer</>}
        </ShimmerButton>
      </AnimatedCard>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────

function EditModal({
  nft,
  onClose,
  onSave,
  isSaving,
}: {
  nft: NFTData;
  onClose: () => void;
  onSave: (name: string, description: string, imageUrl: string) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(nft.name);
  const [description, setDescription] = useState(nft.description);
  const [imageUrl, setImageUrl] = useState(nft.image_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <AnimatedCard className="relative z-10 w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Edit NFT #{nft.id}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">&times;</button>
        </div>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NFT name..."
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your NFT..."
        />
        <Input
          label="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        <ShimmerButton
          onClick={() => onSave(name, description, imageUrl)}
          disabled={!name.trim() || isSaving}
          shimmerColor="#fbbf24"
          className="w-full"
        >
          {isSaving ? <><SpinnerIcon /> Saving...</> : <><CheckIcon /> Save Changes</>}
        </ShimmerButton>
      </AnimatedCard>
    </div>
  );
}

// ── Mint Modal ─────────────────────────────────────────────

function MintModal({
  onClose,
  onMint,
  isMinting,
}: {
  onClose: () => void;
  onMint: (name: string, description: string, imageUrl: string) => void;
  isMinting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <AnimatedCard className="relative z-10 w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Mint New NFT</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">&times;</button>
        </div>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome NFT..."
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the world about your creation..."
        />
        <Input
          label="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.png"
        />
        <ShimmerButton
          onClick={() => onMint(name, description, imageUrl)}
          disabled={!name.trim() || isMinting}
          shimmerColor="#7c6cf0"
          className="w-full"
        >
          {isMinting ? <><SpinnerIcon /> Minting...</> : <><ImageIcon /> Mint NFT</>}
        </ShimmerButton>
      </AnimatedCard>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "gallery" | "my-nfts" | "mint";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("gallery");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [allNFTs, setAllNFTs] = useState<NFTData[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [transferNftId, setTransferNftId] = useState<number | null>(null);
  const [editNft, setEditNft] = useState<NFTData | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);

  const [isTransferring, setIsTransferring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const loadAllNFTs = useCallback(async () => {
    setIsLoading(true);
    try {
      const nfts = await getAllNFTs(walletAddress || undefined);
      setAllNFTs(nfts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load gallery");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMyNFTs = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const nftIds = await getOwnerNFTs(walletAddress);
      const nfts: NFTData[] = [];
      for (const id of nftIds) {
        const nft = await getNFT(id, walletAddress);
        if (nft) nfts.push(nft);
      }
      setMyNFTs(nfts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load your NFTs");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (activeTab === "gallery") {
      loadAllNFTs();
    } else if (activeTab === "my-nfts") {
      loadMyNFTs();
    }
  }, [activeTab, loadAllNFTs, loadMyNFTs]);

  const handleTransfer = useCallback(
    async (nftId: number, recipient: string) => {
      if (!walletAddress) return setError("Connect wallet first");
      setIsTransferring(true);
      setTxStatus("Awaiting signature...");
      try {
        await transferNFT(walletAddress, recipient, nftId);
        setTxStatus("NFT transferred successfully!");
        setTransferNftId(null);
        setTimeout(() => setTxStatus(null), 3000);
        loadMyNFTs();
        loadAllNFTs();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Transfer failed");
        setTxStatus(null);
      } finally {
        setIsTransferring(false);
      }
    },
    [walletAddress, loadMyNFTs, loadAllNFTs]
  );

  const handleEdit = useCallback(
    async (nftId: number, name: string, description: string, imageUrl: string) => {
      if (!walletAddress) return setError("Connect wallet first");
      setIsSaving(true);
      setTxStatus("Awaiting signature...");
      try {
        await setNFTMetadata(walletAddress, nftId, name, description, imageUrl);
        setTxStatus("Metadata updated!");
        setEditNft(null);
        setTimeout(() => setTxStatus(null), 3000);
        loadMyNFTs();
        loadAllNFTs();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Update failed");
        setTxStatus(null);
      } finally {
        setIsSaving(false);
      }
    },
    [walletAddress, loadMyNFTs, loadAllNFTs]
  );

  const handleMint = useCallback(
    async (name: string, description: string, imageUrl: string) => {
      if (!walletAddress) return setError("Connect wallet first");
      setIsMinting(true);
      setTxStatus("Awaiting signature...");
      try {
        await mintNFT(walletAddress, name, description, imageUrl);
        setTxStatus("NFT minted successfully!");
        setShowMintModal(false);
        setTimeout(() => setTxStatus(null), 3000);
        loadAllNFTs();
        loadMyNFTs();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Minting failed");
        setTxStatus(null);
      } finally {
        setIsMinting(false);
      }
    },
    [walletAddress, loadAllNFTs, loadMyNFTs]
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "gallery", label: "Gallery", icon: <GridIcon />, color: "#7c6cf0" },
    { key: "my-nfts", label: "My NFTs", icon: <UserIcon />, color: "#4fc3f7" },
    { key: "mint", label: "Mint", icon: <ImageIcon />, color: "#34d399" },
  ];

  const displayNFTs = activeTab === "my-nfts" ? myNFTs : allNFTs;

  return (
    <div className="w-full max-w-4xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("success") || txStatus.includes("updated") || txStatus.includes("on-chain") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">NFT Gallery</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {walletAddress && (
                <Badge variant="success" className="text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                  Connected
                </Badge>
              )}
              <Badge variant="info" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key);
                  setError(null);
                  if (t.key === "mint") {
                    setShowMintModal(true);
                  }
                }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 px-4">
              {activeTab !== "mint" && (
                <ShimmerButton
                  onClick={activeTab === "gallery" ? loadAllNFTs : loadMyNFTs}
                  shimmerColor="#7c6cf0"
                  className="px-3 py-1.5 text-xs"
                >
                  {isLoading ? <SpinnerIcon /> : <RefreshIcon />}
                </ShimmerButton>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab !== "mint" && (
              <>
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <SpinnerIcon />
                    <span className="ml-2 text-sm text-white/50">Loading...</span>
                  </div>
                ) : displayNFTs.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-white/20 mb-4"><ImageIcon /></div>
                    <p className="text-white/50 text-sm">
                      {activeTab === "my-nfts" && walletAddress
                        ? "You don't own any NFTs yet"
                        : "No NFTs in the gallery yet"}
                    </p>
                    {activeTab === "my-nfts" && !walletAddress ? (
                      <button
                        onClick={onConnect}
                        disabled={isConnecting}
                        className="mt-4 rounded-xl border border-dashed border-[#4fc3f7]/20 bg-[#4fc3f7]/[0.03] px-6 py-3 text-sm text-[#4fc3f7]/60 hover:border-[#4fc3f7]/30 hover:text-[#4fc3f7]/80 transition-all"
                      >
                        Connect wallet to view your NFTs
                      </button>
                    ) : activeTab === "gallery" ? (
                      <p className="mt-2 text-white/30 text-xs">Be the first to mint an NFT!</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayNFTs.map((nft) => (
                      <NFTCard
                        key={nft.id}
                        nft={nft}
                        walletAddress={walletAddress}
                        onTransfer={(id) => setTransferNftId(id)}
                        onEdit={(id) => {
                          const nftData = displayNFTs.find((n) => n.id === id);
                          if (nftData) setEditNft(nftData);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "mint" && !showMintModal && (
              <div className="text-center py-20">
                <div className="text-white/20 mb-4"><ImageIcon /></div>
                <p className="text-white/50 text-sm">Create a new NFT on Stellar</p>
                {walletAddress ? (
                  <ShimmerButton
                    onClick={() => setShowMintModal(true)}
                    shimmerColor="#7c6cf0"
                    className="mt-4"
                  >
                    <ImageIcon />
                    <span className="ml-2">Mint New NFT</span>
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="mt-4 rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] px-6 py-3 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 transition-all"
                  >
                    Connect wallet to mint
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">NFT Gallery &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/15">{displayNFTs.length} NFTs</span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>

      {/* Modals */}
      {transferNftId !== null && (
        <TransferModal
          nftId={transferNftId}
          onClose={() => setTransferNftId(null)}
          onTransfer={(recipient) => handleTransfer(transferNftId, recipient)}
          isTransferring={isTransferring}
        />
      )}

      {editNft && (
        <EditModal
          nft={editNft}
          onClose={() => setEditNft(null)}
          onSave={(name, description, imageUrl) => handleEdit(editNft.id, name, description, imageUrl)}
          isSaving={isSaving}
        />
      )}

      {showMintModal && (
        <MintModal
          onClose={() => {
            setShowMintModal(false);
            setActiveTab("gallery");
          }}
          onMint={handleMint}
          isMinting={isMinting}
        />
      )}
    </div>
  );
}
