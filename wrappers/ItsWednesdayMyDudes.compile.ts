import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/its_wednesday_my_dudes.tact',
    options: {
        debug: true,
    },
};
