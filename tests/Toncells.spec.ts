import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, Dictionary, beginCell, toNano } from '@ton/core';
import { Toncells } from '../wrappers/Toncells';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
describe('Toncells', () => {
  let code: Cell;

  beforeAll(async () => {
    code = await compile('Toncells');
  });

  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let toncells: SandboxContract<Toncells>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    toncells = blockchain.openContract(Toncells.createFromConfig({}, code));

    deployer = await blockchain.treasury('deployer');

    const deployResult = await toncells.sendDeploy(deployer.getSender(), toNano('0.05'));

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: toncells.address,
      deploy: true,
      success: true,
    });
  });

  it('should deploy', async () => {
    // the check is done inside beforeEach
    // blockchain and toncells are ready to use
  });
});
