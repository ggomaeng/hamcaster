"use server";

import { HAM_ABI } from "@/app/abi";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import {
  CastWithInteractions,
  ReactionForCast,
} from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { createPublicClient, defineChain, http } from "viem";

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

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

const hamClient = createPublicClient({
  chain: ham,
  transport: http(),
});

async function getReactions(hash: string) {
  let cursor: string | undefined;

  let allReactions: ReactionForCast[] = [];

  do {
    const { cursor: _cursor, reactions } =
      (await neynarClient.fetchReactionsForCast(hash, "all", {
        limit: 100,
        cursor: cursor ?? undefined,
      })) as any;

    cursor = _cursor;
    allReactions.push(...reactions);

    console.log(reactions.length, allReactions.length);
  } while (cursor);

  return allReactions;
}

export async function getHamData(url: string) {
  const {
    conversation: { cast },
  } = await neynarClient.lookupCastConversation(url, "url");

  // use map for O(1) lookup
  const replied: Record<number, boolean> = {};
  const liked: Record<number, boolean> = {};
  const recasted: Record<number, boolean> = {};
  const usernames: Record<number, string> = {};
  const fids: number[] = [];

  const allReactions = await getReactions(cast.hash);

  cast.direct_replies?.forEach((reply) => {
    replied[reply.author.fid] = true;
    fids.push(reply.author.fid);
    usernames[reply.author.fid] = reply.author.username;
  });

  allReactions.forEach((reaction) => {
    if (reaction.reaction_type === "like") {
      liked[reaction.user.fid] = true;
    } else {
      recasted[reaction.user.fid] = true;
    }

    fids.push(reaction.user.fid);
    usernames[reaction.user.fid] = reaction.user.username;
  });

  const uniqueFids = Array.from(new Set(fids));
  const fidToAddress: Record<number, string> = {};

  // look up hamchain for user addresses
  const addys = await hamClient.readContract({
    abi: HAM_ABI,
    address: "0xCca2e3e860079998622868843c9A00dEbb591D30",
    functionName: "getBulkOwners",
    args: [uniqueFids.map(BigInt)],
  });

  uniqueFids.forEach((fid, i) => {
    fidToAddress[fid] = addys[i];
  });

  return {
    fids: uniqueFids,
    cast,
    replied,
    liked,
    recasted,
    usernames,
    fidToAddress,
  };
}
