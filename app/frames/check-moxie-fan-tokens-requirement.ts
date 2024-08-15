import { hubHttpUrl, hubRequestOptions } from "@/utils/constants";
import { getAddressesForFid } from "frames.js";
import { gql, GraphQLClient } from "graphql-request";

const vestinGqlClient = new GraphQLClient(
  "https://api.studio.thegraph.com/query/23537/moxie_vesting_mainnet/version/latest"
);
const statsGqlClient = new GraphQLClient(
  "https://api.studio.thegraph.com/query/23537/moxie_protocol_stats_mainnet/version/latest"
);

async function fetchWalletsByFid(fid: number): Promise<string[]> {
  const addresses = await getAddressesForFid({
    fid,
    options: { hubHttpUrl, hubRequestOptions },
  });
  return addresses.reduce((acc, a) => {
    if (a.type === "verified") {
      acc.push(a.address);
    }
    return acc;
  }, [] as string[]);
}

async function fetchTokenLockWallets(beneficiaries: string[]) {
  const query = gql`
    query MyQuery($beneficiaries: [Bytes!]) {
      tokenLockWallets(where: { beneficiary_in: $beneficiaries }) {
        address: id
      }
    }
  `;

  try {
    const data = (await vestinGqlClient.request(query, { beneficiaries })) as {
      tokenLockWallets: { address: string }[];
    };
    console.log("D", data);
    return data.tokenLockWallets.map((wallet) => wallet.address);
  } catch (e) {
    console.error(e);
    throw new Error("Error fetching token lock wallets");
  }
}

interface FanTokenPortfolio {
  balance: string;
  buyVolume: string;
  sellVolume: string;
  subjectToken: { name: string; symbol: string };
}

async function fetchFanTokensForUserAddresses(
  userAddresses: string[]
): Promise<FanTokenPortfolio[]> {
  const query = gql`
    query MyQuery($userAddresses: [ID!]) {
      users(where: { id_in: $userAddresses }) {
        portfolio {
          balance
          buyVolume
          sellVolume
          subjectToken {
            name
            symbol
          }
        }
      }
    }
  `;

  const variable = {
    userAddresses,
  };

  try {
    const data = (await statsGqlClient.request(query, variable)) as {
      users: {
        portfolio: FanTokenPortfolio[];
      }[];
    };
    return data.users.flatMap((user) => user.portfolio);
  } catch (e) {
    console.error(e);
    throw new Error("Error fetching user's portfolio");
  }
}

export async function checkMoxieFanTokensRequirement(
  casterFid: number,
  requesterFid: number,
  minTokens: number
): Promise<boolean> {
  const requesterAddresses = await fetchWalletsByFid(requesterFid);
  console.log("Requester addresses", requesterAddresses);
  const tokenLockWallets = await fetchTokenLockWallets(requesterAddresses);
  console.log("Token lock wallets", tokenLockWallets);
  const allAddresses = [...requesterAddresses, ...tokenLockWallets];
  const portfolio = await fetchFanTokensForUserAddresses(allAddresses);
  console.log("Portfolio", portfolio);
  const casterPortfolio = portfolio.filter(
    (p) => p.subjectToken.symbol === `fid:${casterFid}`
  );
  if (minTokens === 0) {
    return casterPortfolio.length > 0;
  }
  const totalTokens = casterPortfolio.reduce(
    (acc, t) => acc + parseFloat(t.balance) / 1e18,
    0
  );
  // Allow a small margin of error
  return totalTokens >= minTokens - 0.0001;
}
