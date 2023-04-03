const Bid = require("../models/Bid");
const Bounty = require("../models/Bounty");

const checkOwnership = () => {
    return async (req, res, next) => {
        const bounty = await Bounty.findById({ _id: req.body.pid })
        if (bounty)
            if (req.body.uid == bounty.author)
                next()
            else
                res.status(403).json({ error: true, message: "You are not authorized for that operation." });
    }
}

const checkBidOwnership = () => {
    return async (req, res, next) => {
        const bid = await Bid.findById({ _id: req.body.pid })
        if (bid)
            if (req.body.uid == bid.author)
                next()
            else
                res.status(403).json({ error: true, message: "You are not authorized for that operation." });
    }
}

module.exports = {checkOwnership, checkBidOwnership}