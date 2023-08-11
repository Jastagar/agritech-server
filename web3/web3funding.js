const web3 = require('./web3.js')
const { FundingABI2 } = require('./contracts/ABIs.js')
const { info } = require("../utils/logger");
const {getSignR, getSignVR, getSignTR}=require('./gettingWeb3RSV.js');

function loadContractAt(address) {
    const findcontract = new web3.eth.Contract(FundingABI2, address)
    return findcontract
}

async function getRaisedAmount(contract) {
    if (contract) {
        const amount = await contract.methods.GetContractTokenBalance().call()
        return amount
    } else {
        return 'No Contract selected'
    }
}
async function getMaxAmountSoFar(contract) {
    if (contract) {
        const amount = await contract.methods.maxSoFar().call()
        return amount
    } else {
        return 'No Contract selected'
    }
}
// initiate VoteReq
async function initateVoteReq(cAddress, fromAddress, toAddess, amount, reason, password) {
    const contract = loadContractAt(cAddress)
    if (contract) {
        const {r,s,v} = await getSignR(cAddress,toAddess,amount,fromAddress,password);
        info("Got RSV")
        const gasEstimate = await contract.methods.CreateRequest(toAddess, amount,v,r,s).estimateGas(); // estimate gas
        const txTemp = {
            from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
            to:cAddress,
            gas:gasEstimate,
            data: contract.methods.CreateRequest(toAddess, amount,v,r,s).encodeABI()
        }
        const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
        const response = await web3.eth.sendSignedTransaction(sig.rawTransaction)
        info("Vote Res->", response)
        return response
    } else {
        return 'No Contract selected or password incorrect'
    }
}
// vote in certain req
async function voteInReq(cAddress, reqNumber, voter, password) {
    const contract = loadContractAt(cAddress);
    if (contract) {
        const {r,s,v} = await getSignVR(cAddress,reqNumber,voter,password);//contractAddress,vote number,voter,password
        const gasEstimate = await contract.methods.VoteRequest(reqNumber,v,r,s).estimateGas(); // estimate gas
        const txTemp = {
            from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
            to:cAddress,
            gas:gasEstimate,
            data: contract.methods.VoteRequest(reqNumber,v,r,s).encodeABI()
        }
        const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
        const response = await web3.eth.sendSignedTransaction(sig.rawTransaction)
        info("Voted->", response)
        return response
    } else {
        return 'No Contract selected or password incorrect'
    }

}
// withdraw from activeRequest
async function activateRequest(cAddress, owner, reqNumber, password) {
    const contract = loadContractAt(cAddress)
    if (contract && unlocked) {
        const {r,s,v} = await getSignTR(cAddress,parseInt(reqNumber) - 1,owner,password)
        const gasEstimate = await contract.methods.TransferToBuy(parseInt(reqNumber) - 1,v,r,s).estimateGas(); // estimate gas
        const txTemp = {
            from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
            to:cAddress,
            gas:gasEstimate,
            data: contract.methods.TransferToBuy(parseInt(reqNumber) - 1,v,r,s).encodeABI()
        }
        const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
        const response = await web3.eth.sendSignedTransaction(sig.rawTransaction)
        info("Status->", response)
        return response
    } else {
        return 'No Contract selected or password incorrect'
    }
}



module.exports = {
    loadContractAt,
    getRaisedAmount,
    initateVoteReq,
    voteInReq,
    activateRequest,
    getMaxAmountSoFar,
}