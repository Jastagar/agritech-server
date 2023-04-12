const auth=require("../middleware/auth")
const Transaction=require("../models/Transaction")
const User=require("../models/User")
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
    const receiver = await User.findOne({walletAddress: data.addressTo})
    try{
        const txHash = await transferKCO(
            data.addressFrom,
            data.addressTo,
            data.amount,
            data.password
        )
        const tx = new Transaction({
            senderId: user._id,
            receiverId: receiver._id,
            amount:data.amount,
            txHash:txHash.transactionHash
        })
        const savedTx = await tx.save();
        user.transactions.push(savedTx._id);
        receiver.transactions.push(savedTx._id);
        await user.save();
        await receiver.save();
        res.json({
            status:'success',
            message:'Transfer Complete'
        })
    }catch(error){
        res.json({
            status:'Failed',
            message:error.message
        })
    }
})

web3Router.get("/transactions",auth,async (req,res) => {
    const user = await User.findById(req.user._id).populate(['transactions','contributions']);
    res.json({
        wallet:user.transactions,
        camps:user.contributions
    })
})

module.exports = web3Router