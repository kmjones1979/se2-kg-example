/*
Based on the documentation from the GitHub repo (https://github.com/graphprotocol/grc-20-ts),
here are the potential endpoint structures we could try:

1. Original endpoint (the one we're using now):
   https://api.thegraph.com/space/[spaceId]/edit/calldata

2. With api- prefix as seen in testnet version:
   https://api-mainnet.grc-20.thegraph.com/space/[spaceId]/edit/calldata

3. With grc-20 subdomain (inferring from testnet):
   https://api.grc-20.thegraph.com/space/[spaceId]/edit/calldata

4. With v1 path prefix (common in APIs):
   https://api.thegraph.com/v1/space/[spaceId]/edit/calldata

5. Direct to GRC-20:
   https://grc-20.thegraph.com/space/[spaceId]/edit/calldata

This file serves as documentation for possible endpoints to try.
*/
