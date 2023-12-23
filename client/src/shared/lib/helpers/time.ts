import { createRuWordEndingByNumberGetter } from "./ruWords"

export const getYear = (date: string) => new Date(date).getFullYear()

export const getTimeWithoutSeconds = (date: string | Date) => {
    let time: string = ''
    if (typeof date === 'string') {
        time = new Date(date).toLocaleTimeString()
    } else {
        time = date.toLocaleTimeString()
    }
    return time.split(':').slice(0, 2).join(':')
}

export const getTimeAccordingNow = (date: string, lang: string) => {

    const d = new Date(date)
    const now = new Date().valueOf()
    const isRussian = lang === 'ru'

    const deltaSeconds = (now - d.valueOf()) / 1000
    const deltaMinutes = Math.floor(deltaSeconds / 60)
    const deltaHours = Math.floor(deltaMinutes / 60)
    const deltaDays = Math.floor(deltaHours / 24)
    const deltaWeeks = Math.floor(deltaDays / 7)
    const deltaMonths = Math.floor(deltaWeeks / 4)
    const deltaYears = Math.floor(deltaMonths / 12)

    const getSec = createRuWordEndingByNumberGetter({
        root: 'секунд',
        single: {ip: 'а', rp: 'ы'}, multiple: {value: ''}
    })
    const getMin = createRuWordEndingByNumberGetter({
        root: 'минут',
        single: {ip: 'а', rp: 'ы'}, multiple: {value: ''}
    })
    const getHours = createRuWordEndingByNumberGetter({
        root: 'час',
        single: {ip: '', rp: 'а'}, multiple: {value: 'ов'}
    })
    const getDays = createRuWordEndingByNumberGetter({
        root: 'день',
        single: {type: 'word', ip: 'день', rp: 'дня'}, multiple: {type: 'word', value: 'дней'}
    })
    const getWeek = createRuWordEndingByNumberGetter({
        root: 'недел',
        single: {ip: 'я', rp: 'и'}, multiple: {value: 'ь'}
    })
    const getMonths = createRuWordEndingByNumberGetter({
        root: 'месяц',
        single: {ip: '', rp: 'а'}, multiple: {value: 'ев'}
    })
    const getYears = createRuWordEndingByNumberGetter({
        root: 'год',
        single: {ip: '', rp: 'а'}, multiple: {type: "word", value: 'лет'}
    })

    const ago = isRussian ? 'назад' : 'ago'
    const secs = isRussian ? getSec(deltaSeconds) : 'seconds'
    const mins = isRussian ? getMin(deltaMinutes) : 'minutes'
    const hours = isRussian ? getHours(deltaHours) : 'hours'
    const days = isRussian ? getDays(deltaDays) : 'days'
    const weeks = isRussian ? getWeek(deltaWeeks) : 'weeks'
    const months = isRussian ? getMonths(deltaMonths) : 'months'
    const years = isRussian ? getYears(deltaYears) : 'years'

    if (deltaYears >= 1) {
        return `${deltaYears} ${years} ${ago}`
    }
    if (deltaMonths >= 1) {
        return `${deltaMonths} ${months} ${ago}`
    }
    if (deltaWeeks >= 1) {
        return `${deltaWeeks} ${weeks} ${ago}`
    }
    if (deltaDays >= 1) {
        return `${deltaDays} ${days} ${ago}`
    }
    if (deltaHours >= 1) {
        return `${deltaHours} ${hours} ${ago}`
    }
    if (deltaMinutes >= 1) {
        return `${deltaMinutes} ${mins} ${ago}`
    }
    if (deltaSeconds >= 1) {
        return `${deltaSeconds} ${secs} ${ago}`
    }

    return d.toLocaleDateString()
}
