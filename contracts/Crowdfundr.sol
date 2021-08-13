// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

contract CrowdfundrManager {
    mapping(address => Crowdfundr) _croudFundrAddresses;
    mapping(uint => address) _projectIds;
    uint _projectId;

    function getProjectId(uint projectId) private pure returns (uint){
        return projectId % 231;
    }

    function createCrowdfundr(string memory projectName, uint projectId, uint maxProjectBalance) external payable {
        _projectId = getProjectId(projectId);
        _croudFundrAddresses[msg.sender] = new Crowdfundr(projectName, maxProjectBalance, _projectId, msg.sender, msg.value);
        _projectIds[_projectId] = msg.sender;
    }

    function credit(uint projectId) external payable {
        _croudFundrAddresses[_projectIds[getProjectId(projectId)]].credit(msg.sender, msg.value);
    }

    function debit(uint projectId, uint amount) external {
        _croudFundrAddresses[_projectIds[getProjectId(projectId)]].debit(amount, msg.sender);
    }

    function deregister(uint projectId) external {
        _croudFundrAddresses[_projectIds[getProjectId(projectId)]].deRegisterProject(msg.sender);
    }

    function getProjectName(uint projectId) public view returns (string memory) {
        return _croudFundrAddresses[_projectIds[getProjectId(projectId)]].getProjectName(msg.sender);
    }

    function getProjectBalance(uint projectId) public view returns (uint) {
        return _croudFundrAddresses[_projectIds[getProjectId(projectId)]].getProjectBalance(msg.sender);
    }

    function getProjectOwner(uint projectId) public view returns (address) {
        return _croudFundrAddresses[_projectIds[getProjectId(getProjectId(projectId))]].getProjectOwner(msg.sender);
    }

    function getProjectMaximumBalance(uint projectId) public view returns (uint) {
        return _croudFundrAddresses[_projectIds[getProjectId(projectId)]].getProjectMaximumBalance(msg.sender);
    }

    function getAddresses(uint projectId) public view returns (address[] memory) {
        return _croudFundrAddresses[_projectIds[getProjectId(projectId)]].getAddresses(msg.sender);
    }

    function getBalanceOfDepositor(uint projectId, address depositorAddress) public view returns (uint) {
        return _croudFundrAddresses[_projectIds[getProjectId(projectId)]].getBalanceOfDepositor(depositorAddress, msg.sender);
    }
}

contract Crowdfundr {
    uint public _projectId;
    string public _projectName;
    address private _projectOwner;
    uint constant _minCreditAmount = 1;
    uint public _maxProjectBalance;
    uint public _projectCreatedAt;
    uint public _projectCurrentBalance;
    mapping(address => uint) public _depositors;
    address[] public _addresses;
    address private _factory;

    modifier onlyOwner(address caller) {
        require(caller == _projectOwner, "You're not the owner of the contract");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == _factory, "You need to use the factory");
        _;
    }

    constructor(string memory projectName, uint maxProjectBalance, uint projectId, address caller, uint amount) payable {
        _projectId = projectId;
        _projectName = projectName;
        _projectOwner = caller;
        _factory = msg.sender;
        _projectCreatedAt = block.timestamp;
        
        if (maxProjectBalance < _minCreditAmount) {
            // throw error
            revert('max project balace cannot be less than 1 ETH');
        } else {
            // assign max project balace
            _maxProjectBalance = maxProjectBalance;
        }
        
        if (amount >= _minCreditAmount) {
            // current balance will be equal to initial deposit done by owner
            _projectCurrentBalance = amount;
            
            // added owner to project depositor list
            _addresses.push(caller);
            _depositors[caller] = amount;
        }
    }
    
    // Refund is called by internal functions only. It will refund the deposit balance in partial or full to the respective addresses.
    function refund() private {
        for (uint i = 0; i < _addresses.length; i++) {
            address refundOwner = _addresses[i];
            uint refundValue = _depositors[_addresses[i]];
            if (_projectCurrentBalance >= refundValue) {
                _projectCurrentBalance -= refundValue;
                payable(refundOwner).transfer(refundValue);
            } else {
                _projectCurrentBalance = 0;
                payable(refundOwner).transfer(_projectCurrentBalance);
                break;
            }
        }
    }
    
    // it should be called by projectOwner only to deregister the project within 30 days
    function deRegisterProject(address caller) external onlyFactory onlyOwner(caller) {
        if ((caller == _projectOwner) && (block.timestamp <= (_projectCreatedAt + 30 days))) {
            refund();
        } else {
            revert("you can't deregister project.");
        }
    }
    
    // can be called by anyone who wants wo credit funds in the project within 30 days
    function credit(address depositorAddress, uint amount) external payable onlyFactory {
        // check if current balance is less than the max project balance
        // && credit amount should be greater than minimum deposit amount
        // && projectCreation time should be less than or equal to 30 days 
        if ((_projectCurrentBalance < _maxProjectBalance) && (amount >= _minCreditAmount) && (block.timestamp <= (_projectCreatedAt + 30 days))) {
           
            if (_depositors[depositorAddress] == 0) {
                // new depositor
                _addresses.push(depositorAddress);
                _depositors[depositorAddress] = amount;
            } else {
                // existing depositor
                _depositors[depositorAddress] = _depositors[depositorAddress] + amount;
            }
            
            // update project current balance
            _projectCurrentBalance += amount;
        } else if ((block.timestamp > (_projectCreatedAt + 30 days)) && _projectCurrentBalance < _maxProjectBalance) {
            // if someone tries to credit amount but the project created was more than 30 days
            // so don't allow address to credit amount. Also, goal is not met, so refund amount to the depositors.
            refund();
        } else {
            //
            revert("you can't credit ether into project.");
        }
    }
    
    // ideally it should be called by projectOwner only to debit funds from projectBalance
    function debit(uint amount, address caller) external onlyFactory onlyOwner(caller) {
        // if owner is doing debit from full funded project then only allow them to debit
        if ((caller == _projectOwner) && (_projectCurrentBalance >= _maxProjectBalance)) {
            _projectCurrentBalance -= amount;
            payable(_projectOwner).transfer(amount);
        } else {
            revert("you can't debit ether from project.");
        }
    }

    function getProjectName(address caller) public view onlyFactory onlyOwner(caller) returns (string memory) {
        return _projectName;
    }

    function getProjectBalance(address caller) public view onlyFactory onlyOwner(caller) returns (uint) {
        return _projectCurrentBalance;
    }

    function getProjectOwner(address caller) public view onlyFactory onlyOwner(caller) returns (address) {
        return _projectOwner;
    }

    function getProjectMaximumBalance(address caller) public view onlyFactory onlyOwner(caller) returns (uint) {
        return _maxProjectBalance;
    }

    function getAddresses(address caller) public view onlyFactory onlyOwner(caller) returns (address[] memory) {
        return _addresses;
    }

    function getBalanceOfDepositor(address depositorAddress, address caller) public view onlyFactory onlyOwner(caller) returns (uint) {
        return _depositors[depositorAddress];
    }
}
