"use server";

import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { ReactionForCast } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { readFarcaster, readHAM, readTn100x } from "@/app/hamClient";

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

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

export async function getHamData(url: string, config: any) {
  if (!url) {
    return;
  }
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
    let replyFid = reply.author.fid;
    replied[replyFid] = true;
    fids.push(replyFid);
    usernames[replyFid] = reply.author.username;
  });

  allReactions.forEach((reaction) => {
    let reactionFid = reaction.user.fid;
    if (reaction.reaction_type === "like") {
      liked[reactionFid] = true;
    } else {
      recasted[reactionFid] = true;
    }

    fids.push(reactionFid);
    usernames[reactionFid] = reaction.user.username;
  });

  const uniqueFids = Array.from(new Set(fids));
  const fidToAddress: Record<number, string> = {};
  // look up hamchain for user addresses
  const addys = await readFarcaster("getBulkOwners", [uniqueFids.map(BigInt)]);

  uniqueFids.forEach((fid, i) => {
    fidToAddress[fid] = addys[i];
  });

  let fidToHoldings = config.tn100xChecked
    ? await fetchBalances(fidToAddress, readTn100x, "balanceOf", true)
    : {};
  let fidToHam = config.hamChecked
    ? await fetchBalances(fidToAddress, readHAM, "balanceOfFid")
    : {};

  return {
    fids: uniqueFids,
    cast,
    replied,
    liked,
    recasted,
    usernames,
    fidToAddress,
    fidToHoldings,
    fidToHam,
  };
}

async function fetchBalances(
  fidsWithAddresses: Record<number, string>,
  readContract: (method: string, args: any[]) => Promise<any>,
  method: string,
  useAddress: boolean = false,
) {
  const holdingsMap: Record<number, number> = {};

  for (const [fid, address] of Object.entries(fidsWithAddresses)) {
    const args = useAddress ? [address] : [fid];
    const balance = await readContract(method, args);
    holdingsMap[parseInt(fid)] = twoDecimalNumber(balance);
  }

  return holdingsMap;
}

function twoDecimalNumber(balance) {
  const divisor = 10n ** 18n;
  const amount = (balance * 100n) / divisor; // Multiply by 100 to preserve 2 decimal places
  return Number(amount) / 100;
}
