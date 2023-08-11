const { Router } = require("express")
const Razorpay = require('razorpay');
const bcrypt = require("bcrypt")
const { err, info } = require("../utils/logger");
const web3 = require("../web3/web3")
const { Caddress, CoinsABI2 } = require("../web3/contracts/ABIs");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { getBalance } = require("../web3/web3Wallet");

const router = Router();

// get new access token
router.post("/order/create", auth, async (req, res) => {
    try {
        const payingUser = await User.findById(req.user._id);
        const passwordMatching = await bcrypt.compare(req.body.password, payingUser.password)
        info('passwardMatching', passwordMatching)
        if (!passwordMatching) {
            res.json({
                error: true,
                message: "Incorrect Password",
                signatureIsValid: false
            })
            return;
        }
        const data = req.body
        const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
        const options = {
            amount: parseInt(data.amount) * 100,  // amount in the smallest currency unit
            currency: data.currency,
            receipt: data.receipt
        };
        instance.orders.create(options, function (err, order) {
            if (err) throw err
            res.status(200).json({ error: false, data: order })
        });
    } catch (error) {
        err(error)
        res.status(500).json({ error: true, message: "Internal Server Error" })
    }
});

router.post("/payment/verify", auth, async (req, res) => {

    const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    const crypto = require("crypto");
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
    if (expectedSignature === req.body.razorpay_signature) {
        //transfer KCO from admin to user wallet
        const walletAddress = req.body.walletAddress
        const KCOcontract = new web3.eth.Contract(CoinsABI2, Caddress)
        try {
            const gasEstimate = await KCOcontract.methods.withDrawTokens(walletAddress, (req.body.amount - 1)).estimateGas(); // estimate gas
            const txTemp = {
                from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
                to:Caddress,
                gas:gasEstimate,
                data: KCOcontract.methods.withDrawTokens(walletAddress, (req.body.amount - 1)).encodeABI()
            }
            const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
            const response = await web3.eth.sendSignedTransaction(sig.rawTransaction)
            
            const tx = response.transactionHash
            const walletBalance = await getBalance(walletAddress)
            const user = await User.findOne({ walletAddress: walletAddress })
            const transaction = new Transaction({
                senderId: "643aa85e905bd156f4c63a28",
                receiverId: user._id,
                amount: (req.body.amount - 1),
                txHash: tx,
                balance: walletBalance
            })
            const savedTx = await transaction.save();
            res.status(200).json({
                error: false,
                signatureIsValid: true,
                txHash: tx
            })
        } catch (error) {
            err(error)
            res.status(400).json({ error: true, signatureIsValid: false })
        }

    }
    else {
        res.status(400).json({ error: true, signatureIsValid: false })
    }
});


module.exports = router;