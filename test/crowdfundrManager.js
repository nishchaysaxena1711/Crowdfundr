const { expect } = require("chai");
const { BigNumber } = ethers;

describe("Crowdfundr", function() {
    let crowdfundrMgr;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        CrowdFundrMgr = await ethers.getContractFactory("CrowdfundrManager");
        [owner1, depositor1, depositor2, depositor3, owner2] = await ethers.getSigners();

        crowdfundrMgr = await CrowdFundrMgr.deploy();
        await crowdfundrMgr.deployed();
        await crowdfundrMgr.connect(owner1).createCrowdfundr("CrowdFundr Project 1", owner1.address, BigNumber.from(100), { value: 50 });
        await crowdfundrMgr.connect(owner2).createCrowdfundr("CrowdFundr Project 2", owner2.address, BigNumber.from(200));
    });

    it("should validate project get successfully created or not", async function() {
        expect(await crowdfundrMgr.connect(owner1).getProjectName(owner1.address)).to.deep.equal("CrowdFundr Project 1");
        expect(await crowdfundrMgr.connect(owner2).getProjectName(owner2.address)).to.deep.equal("CrowdFundr Project 2");

        expect(await crowdfundrMgr.connect(owner1).getProjectOwner(owner1.address)).to.deep.equal(owner1.address);
        expect(await crowdfundrMgr.connect(owner2).getProjectOwner(owner2.address)).to.deep.equal(owner2.address);

        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner2).getProjectBalance(owner2.address)).to.deep.equal(BigNumber.from(0));

        expect(await crowdfundrMgr.connect(owner1).getProjectMaximumBalance(owner1.address)).to.deep.equal(BigNumber.from(100));
        expect(await crowdfundrMgr.connect(owner2).getProjectMaximumBalance(owner2.address)).to.deep.equal(BigNumber.from(200));

        expect(await crowdfundrMgr.connect(owner1).getAddresses(owner1.address)).to.deep.equal([owner1.address]);
        expect(await crowdfundrMgr.connect(owner2).getAddresses(owner2.address)).to.deep.equal([]);

        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, owner1.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, owner2.address)).to.deep.equal(BigNumber.from(0));

        try {
            // if connected with depositor then it should not be able to check balance of other user
            expect(await crowdfundrMgr.connect(depositor1).getBalanceOfDepositor(owner1.address, owner1.address)).to.deep.equal(BigNumber.from(0));
        } catch(err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'You're not the owner of the contract'");
        }
    });

    it("should validate balance is credited correctly or not", async function() {
        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner2).getProjectBalance(owner2.address)).to.deep.equal(BigNumber.from(0));

        await crowdfundrMgr.connect(depositor1).credit(owner1.address, { value: 5 });
        await crowdfundrMgr.connect(depositor1).credit(owner2.address, { value: 15 });

        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(55));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, owner1.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor1.address)).to.deep.equal(BigNumber.from(5));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor2.address)).to.deep.equal(BigNumber.from(0));
        expect(await crowdfundrMgr.connect(owner2).getProjectBalance(owner2.address)).to.deep.equal(BigNumber.from(15));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, owner2.address)).to.deep.equal(BigNumber.from(0));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, depositor1.address)).to.deep.equal(BigNumber.from(15));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, depositor2.address)).to.deep.equal(BigNumber.from(0));

        await crowdfundrMgr.connect(depositor2).credit(owner1.address, { value: 15 });
        await crowdfundrMgr.connect(depositor2).credit(owner2.address, { value: 30 });

        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(70));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, owner1.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor1.address)).to.deep.equal(BigNumber.from(5));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor2.address)).to.deep.equal(BigNumber.from(15));
        expect(await crowdfundrMgr.connect(owner2).getProjectBalance(owner2.address)).to.deep.equal(BigNumber.from(45));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, owner2.address)).to.deep.equal(BigNumber.from(0));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, depositor1.address)).to.deep.equal(BigNumber.from(15));
        expect(await crowdfundrMgr.connect(owner2).getBalanceOfDepositor(owner2.address, depositor2.address)).to.deep.equal(BigNumber.from(30));
    });

    it("should not debit balance if balance is not reached to maxProjectAmount", async function() {
        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));

        try {
            await crowdfundrMgr.connect(depositor1).debit(owner1.address, BigNumber.from(5));
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'You're not the owner of the contract'");
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        }
``
        try {
            await crowdfundrMgr.connect(owner1).debit(owner1.address, BigNumber.from(5));
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'you can't debit ether from project.'");
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        }

        try {
            await crowdfundrMgr.connect(owner2).debit(owner1.address, BigNumber.from(5));
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'You're not the owner of the contract'");
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        }
    });

    it("should not be able to deregister project", async function() {
        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));

        try {
            await crowdfundrMgr.connect(depositor1).deregister(owner1.address);
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'You're not the owner of the contract'");
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        }
    });

    it("should debit project balance if maxBalance is reached", async function() {
        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));

        await crowdfundrMgr.connect(depositor1).credit(owner1.address, { value: 25 });

        try {
            await crowdfundrMgr.connect(depositor1).debit(owner1.address, BigNumber.from(10));
        } catch (err) {
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(75));
        }

        await crowdfundrMgr.connect(depositor2).credit(owner1.address, { value: 10 });

        try {
            await crowdfundrMgr.connect(depositor2).debit(owner1.address, BigNumber.from(20));
        } catch (err) {
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(85));
        }

        try {
            await crowdfundrMgr.connect(owner1).debit(owner1.address, BigNumber.from(20));
        } catch (err) {
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(85));
        }

        await crowdfundrMgr.connect(depositor3).credit(owner1.address, { value: 30 });

        try {
            await crowdfundrMgr.connect(depositor3).debit(owner1.address, BigNumber.from(20));
        } catch (err) {
            expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(115));
        }
    });

    it("should show correct balance if the same depositor deposit balance more than once", async function() {
        expect(await crowdfundrMgr.connect(owner1).getProjectBalance(owner1.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor1.address)).to.deep.equal(BigNumber.from(0));

        await crowdfundrMgr.connect(depositor1).credit(owner1.address, { value: 20 });
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor1.address)).to.deep.equal(BigNumber.from(20));

        await crowdfundrMgr.connect(depositor1).credit(owner1.address, { value: 10 });
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundrMgr.connect(owner1).getBalanceOfDepositor(owner1.address, depositor1.address)).to.deep.equal(BigNumber.from(30));
    });
});
