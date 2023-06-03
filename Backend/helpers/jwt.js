// const usersRoutes = require('../routes/users')
// const productRoutes = require('../routes/products')
const expressJwt = require('express-jwt');

function authJwt(){
    const api = process.env.API_URL;
    console.log(api)
    const secret = process.env.secret;
    return expressJwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({ 
        path: [
            { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
            `/api/v1/users/login`,
            `${api}/users/register`
        ] })
}
// if admin is false or user is not an admin and he trying to post product or categories then token will be revoked by saying 
// unauthirized admin. payload contain salt data or external information in token which is user.id and user.isAdmin 
// while user login we provided them token, based on the token we decide who can post data or not.
async function isRevoked(req, payload, done){
    if(!payload.isAdmin){
        done(null, true)
    }
    done();
}

module.exports = authJwt ;