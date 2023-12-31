// SPDX-License-Identifier: SEE LICENSE IN LICENSE

pragma solidity 0.8.0;

import "./verify/IVerifier.sol";
import "./merkle-tree/MerkleTree.sol";

contract StarlightCoffeeShield is MerkleTree {


          enum FunctionNames { addPoints, spendPoints, joinCommitments }

          IVerifier private verifier;

          mapping(uint256 => uint256[]) public vks; // indexed to by an enum uint(FunctionNames)

          event EncryptedData(uint256[] cipherText, uint256[2] ephPublicKey);

          uint256 public newNullifierRoot;

          mapping(uint256 => uint256) public commitmentRoots;

          uint256 public latestRoot;

          mapping(address => uint256) public zkpPublicKeys;

          struct Inputs {
            uint nullifierRoot; 
              uint latestNullifierRoot; 
              uint[] newNullifiers;
                  
						uint commitmentRoot;
						uint[] newCommitments;
						uint[][] cipherText;
						uint[2][] encKeys;
						uint[] customInputs;
          }


        function registerZKPPublicKey(uint256 pk) external {
      		zkpPublicKeys[msg.sender] = pk;
      	}
        


        function verify(
      		uint256[] memory proof,
      		uint256 functionId,
      		Inputs memory _inputs
      	) private {
        
          uint[] memory customInputs = _inputs.customInputs;

          uint[] memory newNullifiers = _inputs.newNullifiers;

          uint[] memory newCommitments = _inputs.newCommitments;

          require(commitmentRoots[_inputs.commitmentRoot] == _inputs.commitmentRoot, "Input commitmentRoot does not exist.");

          uint encInputsLen = 0;

          for (uint i; i < _inputs.cipherText.length; i++) {
            encInputsLen += _inputs.cipherText[i].length + 2;
          }

            uint256[] memory inputs = new uint256[](customInputs.length + newNullifiers.length + (newNullifiers.length > 0 ? 3 : 0) + newCommitments.length + encInputsLen);
          
          if (functionId == uint(FunctionNames.addPoints)) {
            uint k = 0;
            
            inputs[k++] = newCommitments[0];
              for (uint j; j < _inputs.cipherText[0].length; j++) {
              inputs[k++] = _inputs.cipherText[0][j];
            }
              inputs[k++] = _inputs.encKeys[0][0];
              inputs[k++] = _inputs.encKeys[0][1];
            
          }

          if (functionId == uint(FunctionNames.spendPoints)) {
            uint k = 0;
             
            require(newNullifierRoot == _inputs.nullifierRoot, "Input NullifierRoot does not exist.");
            inputs[k++] = _inputs.nullifierRoot;
            inputs[k++] = _inputs.latestNullifierRoot;
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
            
          }


         if (functionId == uint(FunctionNames.joinCommitments)) {

          
          require(newNullifierRoot == _inputs.nullifierRoot, "Input NullifierRoot does not exist.");

           uint k = 0;

           inputs[k++] = _inputs.nullifierRoot;
           inputs[k++] = _inputs.latestNullifierRoot;
           inputs[k++] = newNullifiers[0];
           inputs[k++] = newNullifiers[1];
           inputs[k++] = _inputs.commitmentRoot;
           inputs[k++] = newCommitments[0];
           inputs[k++] = 1;
                
         }
          
          bool result = verifier.verify(proof, inputs, vks[functionId]);

          require(result, "The proof has not been verified by the contract");

          if (newCommitments.length > 0) {
      			latestRoot = insertLeaves(newCommitments);
      			commitmentRoots[latestRoot] = latestRoot;
      		}

       if (newNullifiers.length > 0) {
        newNullifierRoot = _inputs.latestNullifierRoot;
      }
        }

           function joinCommitments(uint256 nullifierRoot, uint256 latestNullifierRoot, uint256[] calldata newNullifiers,  uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public {

            Inputs memory inputs;

            inputs.customInputs = new uint[](1);
        	  inputs.customInputs[0] = 1;

            inputs.nullifierRoot = nullifierRoot;

            inputs.latestNullifierRoot = latestNullifierRoot;

            inputs.newNullifiers = newNullifiers;

            inputs.commitmentRoot = commitmentRoot;

            inputs.newCommitments = newCommitments;

            verify(proof, uint(FunctionNames.joinCommitments), inputs);
        }


        address public owner;




      constructor  (address verifierAddress, uint256[][] memory vk)   {

         verifier = IVerifier(verifierAddress);
    		  for (uint i = 0; i < vk.length; i++) {
    			  vks[i] = vk[i];
    		  }
          newNullifierRoot = Initial_NullifierRoot;
owner = msg.sender;
      }


      function addPoints (uint256[] calldata newCommitments, uint256[][] calldata cipherText, uint256[2][] calldata ephPubKeys, uint256[] calldata proof) public  {

        require(msg.sender == owner);


          Inputs memory inputs;

          inputs.newCommitments = newCommitments;

          inputs.cipherText = cipherText;

          inputs.encKeys = ephPubKeys;

           verify(proof, uint(FunctionNames.addPoints), inputs);

          for (uint j; j < cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = ephPubKeys[j];
            uint256[] memory cipherToEmit = cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
          }
      }


      function spendPoints (uint256 nullifierRoot, uint256 latestNullifierRoot,uint256[] calldata newNullifiers, uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

        require(msg.sender == owner);


          Inputs memory inputs;

          inputs.customInputs = new uint[](1);
        	inputs.customInputs[0] = 1;

          inputs.nullifierRoot = nullifierRoot; 

          inputs.latestNullifierRoot = latestNullifierRoot; 

          inputs.newNullifiers = newNullifiers;
           

          inputs.commitmentRoot = commitmentRoot;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.spendPoints), inputs);
      }
}