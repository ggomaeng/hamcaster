import { createPublicClient, defineChain, http } from "viem";
import {
  ABI as FARCASTER_ABI,
  CONTRACT as FARCASTER_CONTRACT,
} from "@/app/abi/ham_farcaster_abi";
import {
  ABI as TN100X_ABI,
  CONTRACT as TN100X_CONTRACT,
} from "@/app/abi/ham_tn100x_abi";
import {
  ABI as HAM_ABI,
  CONTRACT as HAM_CONTRACT,
} from "@/app/abi/ham_ham_abi";

const ham = defineChain({
  id: 5112,
  name: "Ham",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://ham.calderachain.xyz/http"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ham Explorer",
      url: "https://explorer.ham.fun",
    },
  },
});

export const hamClient = createPublicClient({
  chain: ham,
  transport: http(),
});

export async function readFarcaster(functionName: string, data: any) {
  return await hamClient.readContract({
    abi: FARCASTER_ABI,
    address: FARCASTER_CONTRACT,
    functionName,
    args: data,
  });
}

export async function readTn100x(functionName: string, data: any) {
  return (await hamClient.readContract({
    abi: TN100X_ABI,
    address: TN100X_CONTRACT,
    functionName,
    args: data,
  })) as BigInt;
}

export async function readHAM(functionName: string, data: any) {
  return (await hamClient.readContract({
    abi: HAM_ABI,
    address: HAM_CONTRACT,
    functionName,
    args: data,
  })) as BigInt;
}
