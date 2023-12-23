const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * (array.length - 1))]
}

module.exports = {
    getRandomElement
}