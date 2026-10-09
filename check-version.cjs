require('dotenv').config();
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { WalletContractV5R1, WalletContractV4, Address } = require('@ton/ton');

(async () => {
  const mnemonic = process.env.TREASURY_MNEMONIC.trim().split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const v5 = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
  const v4 = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

  const order = Address.parse(process.env.ORDER_TON_ADDRESS);

  console.log('');
  console.log('Treasury derived as v5r1 :', v5.address.toString());
  console.log('Treasury derived as v4   :', v4.address.toString());
  console.log('ORDER_TON_ADDRESS        :', order.toString());
  console.log('');

  const matchV5 = v5.address.toString() === order.toString();
  const matchV4 = v4.address.toString() === order.toString();

  if (matchV5 && !matchV4) {
    console.log('✅ Use TREASURY_WALLET_VERSION=v5r1');
  } else if (matchV4 && !matchV5) {
    console.log('✅ Use TREASURY_WALLET_VERSION=v4');
  } else if (matchV5 && matchV4) {
    console.log('✅ Both match — either version works, but keep v5r1');
  } else {
    console.log('❌ NEITHER matches ORDER_TON_ADDRESS');
    console.log('   Your mnemonic does not control this address.');
    console.log('   Do NOT proceed — you will lock funds.');
  }
  console.log('');
})().catch(e => { console.error(e); process.exit(1); });