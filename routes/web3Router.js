const auth=require("../middleware/auth")
const User=require("../models/User")
const {info}=require("../utils/logger")
const {getBalance, transferKCO}=require("../web3/web3Wallet")

const web3Router = require("express").Router()

web3Router.get("/getBalance/:id", async (req,res) => {
    const amount = await getBalance(req.params.id)
    const resData = {amount}
    res.status(200).send(resData)
})

web3Router.post("/transfer", auth,async (req,res) => {
    const user = await User.findById(req.user._id);
    const data = req.body
    info(data)
    const txHash = await transferKCO(
        data.addressFrom,
        data.addressTo,
        data.amount,
        data.password
    )
    user.transactions.push(txHash);
    user.save();
    
    res.send({
        txHash
    })
})
module.exports = web3Router