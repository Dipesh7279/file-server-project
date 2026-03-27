const jwt = require("jsonwebtoken");


const authmiddleware = async (req, res, next) => {
  try {

    // GET token from header
    const authheaders = req.headers.authorization;
    if (!authheaders) {
      return res.status(401).json({
        message: "no token, Access Denied"
      })
    }
    //Extract token (bearer token)
    const token = authheaders.split(" ")[1];

    //VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // attach user info to request
    req.user = decoded

    next();

  }
  catch (err) {
    return res.status(401).json({
      message: "Invalid token"
    })
  }

}

module.exports = authmiddleware;
