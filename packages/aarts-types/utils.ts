
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

/**
 * Appends sourceRingToken, which is the ringToken of the current process. 
 * Attempts to parse any json strings passed for ease of cloudwatch queries
 * @param message 
 * @param obj 
 */
export const loginfo = (message: string, ...input: any[]) => {
    console.log(Object.assign({ 
        ringTokenSource: process.env.ringToken, message 
    }, 
    ...input))
}

export const logdebug = (message: any) => {
    !process.env.DEBUGGER || loginfo(message)
}

export const ifDebugger = (func: Function) => {
    !process.env.DEBUGGER || func()
}
