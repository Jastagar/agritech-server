const web3 = require('./web3')
const ABI = require("./compile.js").compiledABI
const bytecode = require("./compile.js").compiledByteCode
const {info}=require("../utils/logger");

const contract = new web3.eth.Contract(ABI);

async function deployContract(account,target,deadline,minContribution){

    const preDeploy = await contract.deploy({ 
        data: bytecode,
        arguments:[account,target,deadline,minContribution]
    })
    info("preDeployed -->",preDeploy)
    const estimateGasFee = await preDeploy.estimateGas()
    info("Predicted fee -->",estimateGasFee)
    const txTemp = {
        from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
        gas:estimateGasFee,
        data: preDeploy.encodeABI()
    }
    const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
    const deployedContract = await web3.eth.sendSignedTransaction(sig.rawTransaction)
    // const deployedContract = await preDeploy.send({ from: process.env.BACKEND_COINBASE_WALLET_ADDRESS, gas:estimateGasFee })
    info(deployedContract.contractAddress)
    return deployedContract
}

module.exports = deployContract