module.exports = {
    equals: (a, b, options) => {
        return a === b ? options.fn(this) : options.inverse(this);
    },
    safeHTML: (context) => {
        return stripJs(context);
    }
};