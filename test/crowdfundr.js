const { expect } = require("chai");
const { BigNumber } = ethers;

describe("Crowdfundr", function() {
    let crowdfundr;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        CrowdFundr = await ethers.getContractFactory("Crowdfundr");
        [owner, depositor1, depositor2, depositor3] = await ethers.getSigners();

        crowdfundr = await CrowdFundr.connect(owner).deploy("CrowdFundr Test Project", BigNumber.from(100), { value: 50 });
        await crowdfundr.deployed();
    });

    it("should validate project get successfully created or not", async function() {
        expect(await crowdfundr.getProjectName()).to.deep.equal("CrowdFundr Test Project");
        expect(await crowdfundr.getProjectOwner()).to.deep.equal(owner.address);
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getProjectMaximumBalance()).to.deep.equal(BigNumber.from(100));
        expect(await crowdfundr.getAddresses()).to.deep.equal([owner.address]);
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(0));
    });

    it("should validate balance is credited correctly in project balance or not", async function() {
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getProjectMaximumBalance()).to.deep.equal(BigNumber.from(100));

        await crowdfundr.connect(depositor1).credit({ value: 5 });

        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(55));
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(5));
        expect(await crowdfundr.getBalanceOfDepositor(depositor2.address)).to.deep.equal(BigNumber.from(0));

        await crowdfundr.connect(depositor2).credit({ value: 10 });

        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(65));
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(5));
        expect(await crowdfundr.getBalanceOfDepositor(depositor2.address)).to.deep.equal(BigNumber.from(10));
    });

    it("should not debit balance if balance is not reached to maxProjectAmount", async function() {
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));

        try {
            await crowdfundr.connect(depositor1).debit(BigNumber.from(5));
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'you can't debit ether from project.'");
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        }

        try {
            await crowdfundr.connect(owner).debit(BigNumber.from(5));
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'you can't debit ether from project.'");
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        }
    });

    it("should not be able to deregister project", async function() {
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));

        try {
            await crowdfundr.connect(depositor1).deRegisterProject();
        } catch (err) {
            expect(err.message).to.be.equal("VM Exception while processing transaction: reverted with reason string 'you can't deregister project.'");
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        }
    });

    it("should debit project balance if maxBalance is reached", async function() {
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));

        await crowdfundr.connect(depositor1).credit({ value: 25 });

        try {
            await crowdfundr.connect(depositor1).debit(BigNumber.from(10));
        } catch (err) {
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(75));
        }

        await crowdfundr.connect(depositor2).credit({ value: 10 });

        try {
            await crowdfundr.connect(depositor2).debit(BigNumber.from(20));
        } catch (err) {
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(85));
        }

        try {
            await crowdfundr.connect(owner).debit(BigNumber.from(20));
        } catch (err) {
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(85));
        }

        await crowdfundr.connect(depositor3).credit({ value: 30 });

        try {
            await crowdfundr.connect(depositor3).debit(BigNumber.from(20));
        } catch (err) {
            expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(115));
        }

        await crowdfundr.connect(owner).debit(BigNumber.from(20));
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(95));
    });

    it("should show correct balance if the same depositor deposit balance more than once", async function() {
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(0));

        await crowdfundr.connect(depositor1).credit({ value: 20 });
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(20));

        await crowdfundr.connect(depositor1).credit({ value: 10 });
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(30));
    });
});
