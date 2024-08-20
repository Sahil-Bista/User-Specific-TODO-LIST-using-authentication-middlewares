const jwt = require('jsonwebtoken');

const middleware = (req,res,next)=>{
    const authorization = req.cookies.token;
    console.log(authorization);
    if(!authorization){
        return res.send("Token not found");
    }
    // const token = authorization.split(" ");
    // const decoded_token = token[1];
    const decoded_token = authorization;
    if(!decoded_token){
        return res.send("Bearer token not present");
    }
    const secret_key = process.env.Secret_Key;
    let data;
    try{
        data = jwt.verify(decoded_token,secret_key);
    }catch(error){
        console.log(error.message);
        return res.send("Invalid token");
    }
    if(!data){
        return res.send("Forbidden request");
    }
    req.user = data.username;
    next();
}

module.exports = middleware;