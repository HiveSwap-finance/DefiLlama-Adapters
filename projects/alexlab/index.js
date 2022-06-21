const sdk = require("@defillama/sdk");
const BigNumber = require("bignumber.js");
const axios = require("axios");
const retry = require('../helper/retry');

// https://explorer.stacks.co/txid/SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-vault?chain=mainnet
// https://stacks-node-api.blockstack.org/extended/v1/address/SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-vault/balances
const alex_vault = 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-vault';
const STACKS_API = 'https://stacks-node-api.mainnet.stacks.co/extended/v1/address'

const transformAddress = addr => {
  const slug = addr.substr(addr.indexOf('::') + 2);
  return slug
}
async function tvl(timestamp, ethBlock, chainBlocks) {
  const balances = {}

  // Retrieve contract balances using the blockstacks hiro REST API
  const url = `${STACKS_API}/${alex_vault}/balances`;
  const vault_balances_responses = await retry(async () => await axios.get(url));
  const stx_balance = vault_balances_responses.data['stx'].balance;
  sdk.util.sumSingleBalance(balances, 'blockstack', BigNumber(stx_balance).div(1e6).toFixed(0))

  // Extract fungible tokens list and build a tokenBalances object to call sumMultiBalanceOf
  const tokens = vault_balances_responses.data.fungible_tokens
  const tokenBalances = {
    output: Object.keys(tokens).map(t => 
    ({
      input: {target: t}, success: true,
      output: BigNumber(tokens[t].balance).div(1e8).toFixed(0)
    })
  )};
  sdk.util.sumMultiBalanceOf(balances, tokenBalances, true, transformAddress)

  return balances
}

module.exports = {
  timetravel: false,
  'stacks': {
    tvl
  }, 
  methodology: 'Alex Lab TVL is made of the vault token balances. The tokens balances are retrieved using Stacks HTTP REST API.'
}
