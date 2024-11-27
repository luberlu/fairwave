import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
    this.contract = new ethers.Contract(
      '0x5fbdb2315678afecb367f032d93f642f64180aa3',
      [
        'function registerTrack(string did, string cid) public',
        'function isOwner(string did, string cid) public view returns (bool)',
        'function getTracksByOwner(string did) public view returns (string[])',
      ],
      this.provider,
    );
  }

  async registerTrack(userDid: string, cid: string): Promise<string> {
    const signer = await this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    try {
      const registerTrackFn = contractWithSigner.getFunction('registerTrack');
      const transaction = await registerTrackFn(userDid, cid); // Passer le DID lors de l'enregistrement
      await transaction.wait();
      return transaction.hash;
    } catch (error) {
      console.error(
        'Erreur lors de l’enregistrement sur la blockchain:',
        error,
      );
      throw error;
    }
  }

  async isTrackRegistered(userDid: string, cid: string): Promise<boolean> {
    return this.contract.isOwner(userDid, cid);
  }

  async getUserTracks(userDid: string): Promise<string[]> {
    return this.contract.getTracksByOwner(userDid);
  }
}
