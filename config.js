module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,
    URL: process.env.BASE_URL || 'http://localhost:3000',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://alienbush:H9XluLrCHjqc@ds243054.mlab.com:43054/repairs_database',
    MONGODB_NAME: 'repairs_database',
    SESSION_LIFETIME: process.env.SESSION_LIFETIME || 1000 * 60 * 60 * 2, // 2 hours
    SESSION_NAME: process.env.SESSION_NAME || 'sid',
    SESSION_SECRET: process.env.SESSION_SECRET || 'wJ869dh9KnBb'
}