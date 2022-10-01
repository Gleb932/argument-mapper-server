module.exports = function(req, res, next)
{
    console.log("URL\n", req.url, "\nPARAMS\n", req.body, "\nHEADERS\n", JSON.stringify(req.headers))
    next()
}