const { expect } = require("chai");
const { BigNumber } = ethers;

describe("Crowdfundr", function() {
    let crowdfundr;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        CrowdFundr = await ethers.getContractFactory("Crowdfundr");
        [owner, depositor1, depositor2, ...depositors] = await ethers.getSigners();

        crowdfundr = await CrowdFundr.connect(owner).deploy("CrowdFundr Test Project", BigNumber.from(100), { value: 50 });
        await crowdfundr.deployed();
    });

    it("validate project get successfully created or not", async function() {
        expect(await crowdfundr.getProjectName()).to.deep.equal("CrowdFundr Test Project");
        expect(await crowdfundr.getProjectOwner()).to.deep.equal(owner.address);
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getProjectMaximumBalance()).to.deep.equal(BigNumber.from(100));
        expect(await crowdfundr.getAddresses()).to.deep.equal([owner.address]);
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(0));
    });

    it("validate balance is credited in project balance or not", async function() {
        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getProjectMaximumBalance()).to.deep.equal(BigNumber.from(100));

        let tx = await crowdfundr.connect(depositor1).credit({ value: 5 });

        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(55));
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(5));
        expect(await crowdfundr.getBalanceOfDepositor(depositor2.address)).to.deep.equal(BigNumber.from(0));

        tx = await crowdfundr.connect(depositor2).credit({ value: 10 });

        expect(await crowdfundr.getProjectBalance()).to.deep.equal(BigNumber.from(65));
        expect(await crowdfundr.getBalanceOfDepositor(owner.address)).to.deep.equal(BigNumber.from(50));
        expect(await crowdfundr.getBalanceOfDepositor(depositor1.address)).to.deep.equal(BigNumber.from(5));
        expect(await crowdfundr.getBalanceOfDepositor(depositor2.address)).to.deep.equal(BigNumber.from(10));
    });
});
