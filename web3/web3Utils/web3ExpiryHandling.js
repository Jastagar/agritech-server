const schedule = require('node-schedule')
const {loadContractAt}=require('../web3funding.js');
const web3=require('../web3.js');
const {info}=require('../../utils/logger.js');


function scheduleRefundCall(expire,cAddress){
    info("Schduling call...")
    const schduleTime = new Date((expire+2)*1000)
    info("Schdule->",schduleTime)
    schedule.scheduleJob(schduleTime, async () => {
        try{
            const contract = loadContractAt(cAddress);
            info("Refund called")
               const gasEstimate = await contract.methods.refund().estimateGas(); // estimate gas
                const txTemp = {
                    from:process.env.BACKEND_COINBASE_WALLET_ADDRESS,
                    to:cAddress,
                    gas:gasEstimate,
                    data: contract.methods.refund().encodeABI()
                }
                const sig = await web3.eth.accounts.signTransaction(txTemp,process.env.BACKEND_COINBASE_WALLET_PRIVATEKEY)
                await web3.eth.sendSignedTransaction(sig.rawTransaction)
                info("--------------ContractExpired--------------")
        }catch(error){
            info(error.message)
        }
    })
}

module.exports = {scheduleRefundCall}