import { Address, Dictionary, BitReader, BitBuilder, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import fs from 'fs';
import { sha256_sync } from 'ton-crypto'
import { compile } from '@ton/blueprint'
export type ToncellsConfig = {};


export function flattenSnakeCell(cell: Cell) {
    let c: Cell | null = cell;

    const bitResult = new BitBuilder();
    while (c) {
        const cs = c.beginParse();
        if (cs.remainingBits === 0) {
            break;
        }

        const data = cs.loadBits(cs.remainingBits);
        bitResult.writeBits(data);
        c = c.refs && c.refs[0];
    }

    const endBits = bitResult.build();
    const reader = new BitReader(endBits);

    return reader.loadBuffer(reader.remaining / 8);
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
    const chunks: Buffer[] = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.slice(0, chunkSize));
        // eslint-disable-next-line no-param-reassign
        buff = buff.slice(chunkSize);
    }
    return chunks;
}

export function makeSnakeCell(data: Buffer): Cell {
    const chunks = bufferToChunks(data, 127);

    if (chunks.length === 0) {
        return beginCell().endCell();
    }

    if (chunks.length === 1) {
        return beginCell().storeBuffer(chunks[0]).endCell();
    }

    let curCell = beginCell();

    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];

        curCell.storeBuffer(chunk);

        if (i - 1 >= 0) {
            const nextCell = beginCell();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }

    return curCell.endCell();
}
export function encodeOffChainContent(content: any) {
    let data = Buffer.from(content);
    let offChainPrefix = Buffer.from([0x00]); // onchain
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}
export function encodeOnChainPic(content: any) {
    const file = './img.png'
    const img = fs.readFileSync(file);
    console.log(img)
    let data = Buffer.from(img);
    let offChainPrefix = Buffer.from([0x00]); // onchain
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}
//vrite bufferToBigInt
export function bufferToBigInt(buffer: any) {
    let hex = buffer.toString('hex');
    let bigInt = BigInt('0x' + hex);
    return bigInt;
}

export async function toncellsConfigToCell(config: ToncellsConfig): Promise<Cell> {
    return beginCell().storeUint(1, 64).storeAddress(Address.parseFriendly("EQDK0oXh10W2uoKgKilP7nhWvHDXdtbNIhldvWVcCwSlf16L").address).endCell()
}

export class Item implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new Item(address);
    }

    static async createFromConfig(config: ToncellsConfig, code: Cell, workchain = 0) {
        const data = await toncellsConfigToCell(config);
        const init = { code, data };
        return new Item(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());

        dict.set(bufferToBigInt(sha256_sync('description')), encodeOffChainContent('onchain dog.'));
        dict.set(bufferToBigInt(sha256_sync('name')), encodeOffChainContent('dog'));
        // dict.set(bufferToBigInt(sha256_sync('image_data')), encodeOnChainPic('1'));
        //to edit nft
        // beginCell()
        //     .storeUint(0x1a0b9d51, 32)
        //     .storeUint(0, 64)
        //     // .storeAddress(null)
        //     .storeRef(beginCell()
        //         .storeInt(0x00, 8)
        //         .storeDict(dict)
        //         .endCell())
        //     // .storeAddress(Address.parseFriendly("EQACELBSnsN24mT_LzaBZQUp78I6Bt9qdVt2R57Crh8TSuLm").address)
        //     .endCell()
        //to deploy nft            
        //.storeAddress(null)
        //.storeRef(beginCell()
        //    .storeInt(0x00, 8)
        //    .storeDict(dict)
        //    .endCell())
        //.storeAddress(Address.parseFriendly("EQACELBSnsN24mT_LzaBZQUp78I6Bt9qdVt2R57Crh8TSuLm").address)
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body:
                beginCell()
                    .storeUint(0x1a0b9d51, 32)
                    .storeUint(0, 64)
                    // .storeAddress(null)
                    .storeRef(beginCell()
                        .storeInt(0x00, 8)
                        .storeDict(dict)
                        .endCell())
                    // .storeAddress(Address.parseFriendly("EQACELBSnsN24mT_LzaBZQUp78I6Bt9qdVt2R57Crh8TSuLm").address)
                    .endCell()
        });
    }
}
