import { toNano } from '@ton/core';
import { Toncells } from '../wrappers/Toncells';
import { compile, NetworkProvider } from '@ton/blueprint';


export async function run(provider: NetworkProvider) {
    const toncells = provider.open(await Toncells.createFromConfig({}, await compile('Toncells')));

    await toncells.sendDeploy(provider.sender(), toNano('2.2'))

    await provider.waitForDeploy(toncells.address);

    // run methods on `toncells`
}
