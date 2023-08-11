const web3 = require('./web3')
const abi = require("./contracts/ABIs.js").CoinsABI2
const { Caddress } = require("./contracts/ABIs.js")
const { info, warn } = require("../utils/logger");
const keythereum = require('keythereum');
const fs = require('fs')

const contract = new web3.eth.Contract(abi, Caddress)

const managerAcc = process.env.BACKEND_COINBASE_WALLET_ADDRESS
// info(managerAcc)

async function getBalance(accountAddress) {
	let bal = await contract.methods.balanceOf(accountAddress).call()
	const ans = bal // we can use ether here since KCO has same decimal number as ether i.e. 18
	return ans
}
// const gasEstimate = await KCOcontract.methods.withDrawTokens(walletAddress, (req.body.amount - 1)).estimateGas(); // estimate gas
//             const txTemp = {
//                 from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
//                 to:Caddress,
//                 gas:gasEstimate,
//                 data: KCOcontract.methods.withDrawTokens(walletAddress, (req.body.amount - 1)).encodeABI()
//             }
//             const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
//             const response = await web3.eth.sendSignedTransaction(sig.rawTransaction)

async function transferFromKCO(fromAddress, toAddress, amount, password) {
	
	await showAllowance(fromAddress, toAddress, password)
		info('Transfering...')
		// info('from',fromAddress)
		// info('to',toAddress)
		// info('amount',amount)
		// const res = await contract.methods.transferFromPermit(fromAddress, toAddress,amount).send({
		// 	from:managerAcc
		// })
		const gasEstimate = await contract.methods.transferFromPermit(fromAddress, toAddress,amount).estimateGas(); // estimate gas
		const txTemp = {
			from:managerAcc,
			to:Caddress,
			gas:gasEstimate,
			data: contract.methods.transferFromPermit(fromAddress, toAddress,amount).encodeABI()
		}
		const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
		const res= await web3.eth.sendSignedTransaction(sig.rawTransaction)
		const { transactionHash } = res
		info(transactionHash)
		return res
}

async function showAllowance(fromAddress, toAddress, password) {
	const approvalRes = await contract.methods.allowance(fromAddress, toAddress).call()
	info('Approval status', approvalRes)
	return approvalRes
}



async function addAccount(password) {
	const newPrivateKey = web3.eth.accounts.create()
	// info("This newPrivateKey is the required->",newPrivateKey)
    const keystoref = newPrivateKey.encrypt(password)
    const name = `UTC--${new Date().toISOString()}--${keystoref.address}`
	// fs.writeFile(path.resolve("./"+name), JSON.stringify(keystoref), (err) => err? info("Key saved."):warn(err))
	keythereum.exportToFile(keystoref,'../keystore');
    return "0x"+keystoref.address
}

module.exports = {
	getBalance,
	addAccount,
	transferFromKCO,
}