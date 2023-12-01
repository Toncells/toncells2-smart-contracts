import { toNano } from '@ton/core';
import { Item } from '../wrappers/Item';
import { compile, NetworkProvider } from '@ton/blueprint';


export async function run(provider: NetworkProvider) {
    const toncells = provider.open(await Item.createFromConfig({}, await compile('Item')));

    await toncells.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(toncells.address);

    // run methods on `toncells`
}
