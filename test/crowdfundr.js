const { expect } = require("chai");
const { BigNumber } = ethers;

describe("Crowdfundr", function() {
    let crowdfundr;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        CrowdFundr = await ethers.getContractFactory("Crowdfundr");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        crowdfundr = await CrowdFundr.connect(owner).deploy("CrowdFundr Test Project", BigNumber.from(100), { value: 50 });
        await crowdfundr.deployed();
    });

    it("validate project get successfully created or not", async function() {
        expect(await crowdfundr.getProjectName()).to.deep.equal("CrowdFundr Test Project");
    });
});