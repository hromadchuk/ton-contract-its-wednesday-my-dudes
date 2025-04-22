import { Blockchain, SendMessageResult, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, toNano } from '@ton/core';
import { ItsWednesdayMyDudes } from '../wrappers/ItsWednesdayMyDudes';
import { BlockchainTransaction } from '@ton/sandbox';
import '@ton/test-utils';
import { SandboxContract } from '@ton/sandbox/dist/blockchain/Blockchain';

const MONDAY = 1704067200; // 1 Jan 2024
const TUESDAY = 1704153600; // 2 Jan 2024
const WEDNESDAY = 1704240000; // 3 Jan 2024 ✅
const THURSDAY = 1704326400; // 4 Jan 2024
const FRIDAY = 1704412800; // 5 Jan 2024
const SATURDAY = 1704499200; // 6 Jan 2024
const SUNDAY = 1704585600; // 7 Jan 2024

const PHRASE = "ITSWEDNESDAYMYDUDES";

async function setup(time: number) {
    const blockchain = await Blockchain.create();
    blockchain.now = time;

    const contract = blockchain.openContract(await ItsWednesdayMyDudes.fromInit());
    const deployer = await blockchain.treasury('deployer');

    await contract.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    const wallets = new Map<number, SandboxContract<TreasuryContract>>;
    for (let i = 1; i <= 20; i++) {
        wallets.set(i, await blockchain.treasury(`wallet${i}`));
    }

    function send(walletId: number, message: string) {
        return contract.send(
            wallets.get(walletId)!.getSender(),
            {
                value: toNano('0.05'),
            },
            message
        );
    }

    return { blockchain, deployer, contract, wallets, send };
}

function getBounceReason(
    txs: BlockchainTransaction[],
    contractAddr: Address
) {
    const tr = txs.find((t) =>
        Address.parseRaw(`0:${t.address.toString(16).padStart(64, '0')}`)
            .equals(contractAddr)
    );
    if (!tr) {
        return undefined;
    }

    const first = tr.outMessages.get(0);
    if (!first) {
        return undefined;
    }

    const slice = first.body.beginParse();
    slice.loadUint(32);
    return slice.loadStringTail();
}

describe('ItsWednesdayMyDudes', () => {
    it('Check Wednesday', async () => {
        const { contract, send } = await setup(WEDNESDAY);

        await send(1, 'I');
        expect(await contract.getGetProgress()).toBe(1n);

        await send(2, 'T');
        expect(await contract.getGetProgress()).toBe(2n);
    });

    describe('Broke work', () => {
        it('With I', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            await send(1, 'I');
            expect(await contract.getGetProgress()).toBe(1n);

            await send(2, 'T');
            expect(await contract.getGetProgress()).toBe(2n);

            await send(3, 'S');
            expect(await contract.getGetProgress()).toBe(3n);

            await send(4, 'I');
            expect(await contract.getGetProgress()).toBe(1n);
        });

        it('With other letter', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            await send(1, 'I');
            expect(await contract.getGetProgress()).toBe(1n);

            await send(2, 'T');
            expect(await contract.getGetProgress()).toBe(2n);

            await send(3, 'S');
            expect(await contract.getGetProgress()).toBe(3n);

            await send(4, 'S');
            expect(await contract.getGetProgress()).toBe(0n);
        });
    });

    describe('Broke work with same address', () => {
        it('I letter', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            await send(1, 'I');
            expect(await contract.getGetProgress()).toBe(1n);

            await send(2, 'T');
            expect(await contract.getGetProgress()).toBe(2n);

            await send(1, 'I');
            expect(await contract.getGetProgress()).toBe(1n);
        });

        it('Other letter', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            await send(1, 'I');
            expect(await contract.getGetProgress()).toBe(1n);

            await send(2, 'T');
            expect(await contract.getGetProgress()).toBe(2n);

            await send(1, 'S');
            expect(await contract.getGetProgress()).toBe(0n);
        });
    });

    describe('Make word', () => {
        it('Write full', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            expect(await contract.getGetLastCompletionWeek()).toBe(0n);

            await send(1, 'I');
            expect(await contract.getGetProgress()).toBe(1n);

            await send(2, 'T');
            expect(await contract.getGetProgress()).toBe(2n);

            for (let i = 1; i <= PHRASE.length; i++) {
                await send(i, PHRASE[i - 1]);
            }

            expect(await contract.getGetLastCompletionWeek()).toBe(2818n);
        });

        it('Write full with second attempt', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            expect(await contract.getGetLastCompletionWeek()).toBe(0n);

            for (let i = 1; i <= PHRASE.length; i++) {
                await send(i, PHRASE[i - 1]);
            }

            expect(await contract.getGetLastCompletionWeek()).toBe(2818n);
        });

        it('Try write second word', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            expect(await contract.getGetLastCompletionWeek()).toBe(0n);

            for (let i = 1; i <= PHRASE.length; i++) {
                await send(i, PHRASE[i - 1]);
            }

            expect(await contract.getGetLastCompletionWeek()).toBe(2818n);

            const result = await send(1, 'I');
            expect(getBounceReason(result.transactions, contract.address))
                .toBe('Already completed this Wednesday');
        });
    });

    describe('Check incorrect days', () => {
        const days = [
            ['Monday', MONDAY],
            ['Tuesday', TUESDAY],
            ['Thursday', THURSDAY],
            ['Friday', FRIDAY],
            ['Saturday', SATURDAY],
            ['Sunday', SUNDAY],
        ];

        it.each(days)('%s', async (dayName, timestamp) => {
            const { contract, send } = await setup(timestamp as number);

            const result = await send(1, 'I');
            expect(getBounceReason(result.transactions, contract.address))
                .toBe('Not Wednesday');
        });
    });

    describe('Check incorrect message', () => {
        const days = [
            ['Empty', ''],
            ['Single ukrainian letter', 'ї'],
            ['Single ukrainian letter', 'а'],
            ['Single russian letter', 'ё'],
            ['Two letters', 'AB'],
            ['Emoji', '🤓'],
        ];

        it.each(days)('%s', async (dayName, letter) => {
            const { contract, send } = await setup(WEDNESDAY);

            const result = await send(1, letter);
            expect(getBounceReason(result.transactions, contract.address))
                .toBe('Exactly one letter required');
        });

        it('Single number', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            const result = await send(1, '1');
            expect(getBounceReason(result.transactions, contract.address))
                .toBe('Only A‑Z letters accepted');
        });

        it('Double number', async () => {
            const { contract, send } = await setup(WEDNESDAY);

            const result = await send(1, '42');
            expect(getBounceReason(result.transactions, contract.address))
                .toBe('Exactly one letter required');
        });
    });
});
