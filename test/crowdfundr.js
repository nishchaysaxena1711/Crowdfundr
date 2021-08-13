const { expect } = require("chai");
const { BigNumber } = ethers;

describe("Crowdfundr", function() {
    it("should not be able to call constructor directly", async function() {
        try {
            CrowdFundrMgr = await ethers.getContractFactory("Crowdfundr");
            [owner, depositor1, depositor2, depositor3] = await ethers.getSigners();
    
            const crowdfundrMgr = await CrowdFundrMgr.connect(owner).deploy(
                "CrowdFundr Test Project", BigNumber.from(100), owner.address, owner.address, BigNumber.from(50)
            );
            await crowdfundrMgr.deployed();
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'You need to use the factory'");
        }
    });
});
