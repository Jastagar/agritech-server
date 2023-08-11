const abi = require("./contracts/ABIs.js").CoinsABI2
const {Caddress} = require("./contracts/ABIs.js")
const web3=require("./web3");
const {info}=require("../utils/logger.js");
const {loadContractAt}=require('./web3funding.js');
const {getSign}=require("./gettingWeb3RSV.js");
const {transferFromKCO}=require("./web3Wallet.js");


const contract = new web3.eth.Contract(abi,Caddress)
const managerAcc = process.env.BACKEND_COINBASE_WALLET_ADDRESS

async function givePermit(fromAddress,toAddress, amount, password){
    info("sd",fromAddress)
    info("ad",managerAcc)
    info("ps",process.env.BACKEND_COINBASE_WALLET_PASSWORD)
    const {r,s,v} = await getSign(fromAddress,toAddress,amount,password)
    info("Got RSV")
    const gasEstimate = await contract.methods.permit(fromAddress,toAddress,amount,'10000000000',v,r,s).estimateGas(); // estimate gas
    const txTemp = {
        from:managerAcc,
        to:Caddress,
        gas:gasEstimate,
        data: contract.methods.permit(fromAddress,toAddress,amount,'10000000000',v,r,s).encodeABI()
    }
    const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
    const permit = await web3.eth.sendSignedTransaction(sig.rawTransaction)
    return permit
}
async function contributeIn(toAddress,contributerAddress, amount) {
    const contract = loadContractAt(toAddress);
    if (contract) {
        const gasEstimate = await contract.methods.Contribute(amount,contributerAddress).estimateGas(); // estimate gas
        const txTemp = {
            from:managerAcc,
            to:Caddress,
            gas:gasEstimate,
            data: contract.methods.Contribute(amount,contributerAddress).encodeABI()
        }
        const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
        const res = await web3.eth.sendSignedTransaction(sig.rawTransaction)
        return res
        
    } else {
        return 'No Contract selected or password incorrect'
    }
}
async function ContributeGasLessly(fromAddress,toAddress,amount,password){
    const permitTx = await givePermit(fromAddress,toAddress,amount,password);
    info("Final permit-->", permitTx)
    const contributionCalling = await contributeIn(toAddress,fromAddress,amount);

    info("Contribution Calling--->",contributionCalling)
    return contributionCalling
}

async function TransferGaslessLy(fromAddress,toAddress,amount,password){
    const permitTx = await givePermit(fromAddress,toAddress,amount,password);
    info("Final permit-->", permitTx)
    const transactionCalling = await transferFromKCO(fromAddress,toAddress,amount,password);
    info("Transaction Calling--->",transactionCalling)
    return transactionCalling
}
module.exports = {
    ContributeGasLessly,
    givePermit,
    TransferGaslessLy,
}