// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

contract Crowdfundr {
    
    string public _projectName;
    address public _projectOwner;
    uint constant _minCreditAmount = 1;
    uint public _maxProjectBalance;
    uint public _projectCreatedAt;
    uint public _projectCurrentBalance;
    mapping(address => uint) public _depositors;
    address[] public addresses;
    
    constructor(string memory projectName, uint maxProjectBalance) payable {
        _projectName = projectName;
        _projectOwner = msg.sender;
        _projectCreatedAt = block.timestamp;
        
        if (maxProjectBalance < _minCreditAmount) {
            // throw error
            revert('max project balace cannot be less than 1 ETH');
        } else {
            // assign max project balace
            _maxProjectBalance = maxProjectBalance;
        }
        
        if (msg.value >= _minCreditAmount) {
            // current balance will be equal to initial deposit done by owner
            _projectCurrentBalance = msg.value;
            
            // added owner to project depositor list
            addresses.push(msg.sender);
            _depositors[msg.sender] = msg.value;
        }
    }
    
    // Refund is called by internal functions only. It will refund the deposit balance in partial or full to the respective addresses.
    function refund() private {
        for (uint i = 0; i < addresses.length; i++) {
            address refundOwner = addresses[i];
            uint refundValue = _depositors[addresses[i]];
            if (_projectCurrentBalance >= refundValue) {
                payable(refundOwner).transfer(refundValue);
                _projectCurrentBalance -= refundValue;
            } else {
                payable(refundOwner).transfer(_projectCurrentBalance);
                _projectCurrentBalance = 0;
                break;
            }
        }
    }
    
    // ideally it should be called by projectOwner only to deregister the project within 30 days
    function deRegisterProject() public {
        if ((msg.sender == _projectOwner) && (block.timestamp <= (_projectCreatedAt + 30 days))) {
            refund();
        } else {
            revert("you can't deregister project.");
        }
    }
    
    // can be called by anyone who wants wo credit funds in the project within 30 days
    function credit() external payable {
        // check if current balance is less than the max project balance
        // && credit amount should be greater than minimum deposit amount
        // && projectCreation time should be less than or equal to 30 days 
        if ((_projectCurrentBalance < _maxProjectBalance) && (msg.value >= _minCreditAmount) && (block.timestamp <= (_projectCreatedAt + 30 days))) {
           
            if (_depositors[msg.sender] == 0) {
                // new depositor
                addresses.push(msg.sender);
                _depositors[msg.sender] = msg.value;
            } else {
                // existing depositor
                _depositors[msg.sender] = _depositors[msg.sender] + msg.value;
            }
            
            // update project current balance
            _projectCurrentBalance += msg.value;
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
    function debit(uint amount) external {
        // if owner is doing debit from full funded project then only allow them to debit
        if ((msg.sender == _projectOwner) && (_projectCurrentBalance >= _maxProjectBalance)) {
            _projectCurrentBalance -= amount;
            payable(_projectOwner).transfer(amount);
        } else {
            revert("you can't debit ether from project.");
        }
    }

    function getProjectName() public view returns (string memory) {
        return _projectName;
    }
}
