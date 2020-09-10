
export const uuid = (): string => {
    let uuidValue = "", k, randomValue;
    for (k = 0; k < 32; k++) {
        randomValue = Math.random() * 16 | 0;

        if (k == 8 || k == 12 || k == 16 || k == 20) {
            uuidValue += "-"
        }
        uuidValue += (k == 12 ? 4 : (k == 16 ? (randomValue & 3 | 8) : randomValue)).toString(16);
    }
    return uuidValue;
}

export const chunks = <T>(arr: Array<T>, size: number): Array<Array<T>> => {
    if (!Array.isArray(arr)) return [[arr]]
    const chunked_arr = [];
    let index = 0;
    while (index < arr.length) {
        chunked_arr.push(arr.slice(index, size + index));
        index += size;
    }
    return chunked_arr;
}

export const ppjson = (json: Record<string, any> | undefined): string => JSON.stringify(json, null, 4)

export const info = (message: any, messageSource?: string) => {
    if (typeof message === 'object' && message !== null) {
        console.log({ messageSource, message, ringToken: process.env.ringToken })
    } else {
        let obj
        try {
            obj = JSON.parse(message);
            console.log({ messageSource, message: obj, ringToken: process.env.ringToken })
        } catch (e) {
            console.log({ messageSource, message, ringToken: process.env.ringToken })
        }
    }
}

export const debug = (message: any) => {
    !process.env.DEBUGGER || info(message)
}

export const ifDebug = (func : Function) => {
    !process.env.DEBUGGER || func()
}
