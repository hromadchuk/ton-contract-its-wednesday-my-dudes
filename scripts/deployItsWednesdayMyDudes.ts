import { toNano } from '@ton/core';
import { ItsWednesdayMyDudes } from '../wrappers/ItsWednesdayMyDudes';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const itsWednesdayMyDudes = provider.open(await ItsWednesdayMyDudes.fromInit());

    await itsWednesdayMyDudes.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(itsWednesdayMyDudes.address);

    // run methods on `itsWednesdayMyDudes`
}
