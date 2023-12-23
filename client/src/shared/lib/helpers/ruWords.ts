type Type = 'ending' | 'word'

interface Params {
    root: string
    single: {
        type?: Type
        ip: string
        rp: string
    }
    multiple: {
        type?: Type,
        value: string
    }
}

export const createRuWordEndingByNumberGetter = (params: Params) => {
    const getMultiple = (params: Params) => params.multiple.type === 'word'
        ? params.multiple.value
        : params.root.concat(params.multiple.value)

    const getSingle = (params: Params, p: 'ip' | 'rp') => (params.single.type === "word")
        ? params.single[p]
        : params.root.concat(params.single[p])


    const getRuWord = (param: Params, num: number) => {

        const stringNum = num.toString()
        const lastSymbol = +stringNum[stringNum.length - 1]
        const last2Symbols = stringNum.length > 1 ? stringNum.slice(stringNum.length - 2, stringNum.length) : -1

        if ([0, 5, 6, 7, 8, 9].includes(lastSymbol) || (+last2Symbols >= 11 && +last2Symbols <= 19)) {
            return getMultiple(param)
        }
        if (lastSymbol === 1) {
            return getSingle(params, 'ip')
        }
        if ([2, 3, 4].includes(lastSymbol)) {
            return getSingle(params, 'rp')
        }
    }
    return (num: number) => getRuWord(params, num)
}