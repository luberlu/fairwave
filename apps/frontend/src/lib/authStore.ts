import { writable } from 'svelte/store';
import Gun from 'gun';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

export const address = writable<string>('');
export const status = writable<string>('');
export const isAuthenticated = writable<boolean>(false);
export const encryptionKey = writable<string|null>(null);

const gun = Gun(['http://localhost:8765/gun']);

export async function initializeEncryptionKey(passphrase: string): Promise<void> {
  const derivedKey = CryptoJS.SHA256(passphrase).toString(CryptoJS.enc.Hex);
  encryptionKey.set(derivedKey);

  const storedAddress = getAuthenticatedAddress();
  if (storedAddress) {
    gun.get('userProfiles').get(storedAddress).put({ encryptionKey: derivedKey });
    localStorage.setItem('encryptionKey', derivedKey);
  }
}

export async function authenticate(): Promise<void> {
  status.set("Authentification en cours...");

  if (typeof window === 'undefined' || !(window as any).ethereum) {
    status.set("Veuillez installer MetaMask pour continuer.");
    return;
  }

  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const message = "Veuillez signer ce message pour authentifier votre session.";
    const signature = await signer.signMessage(message);

    gun.get('userProfiles').get(userAddress).put({ address: userAddress, signature });
    localStorage.setItem('userAddress', userAddress);
    address.set(userAddress);
    isAuthenticated.set(true);
    status.set("Profil utilisateur authentifié et stocké avec succès !");

    const storedEncryptionKey = localStorage.getItem('encryptionKey');
    if (storedEncryptionKey) {
      encryptionKey.set(storedEncryptionKey);
    } else {
      gun.get('userProfiles').get(userAddress).once((data: any) => {
        if (data && data.encryptionKey) {
          encryptionKey.set(data.encryptionKey);
          localStorage.setItem('encryptionKey', data.encryptionKey);
        } else {
          status.set("Veuillez entrer une passphrase pour configurer le chiffrement.");
        }
      });
    }

  } catch (error) {
    console.error("Erreur lors de l'authentification :", error);
    status.set("Erreur lors de l'authentification.");
  }
}

export function checkAuthentication() {
  if (typeof window === 'undefined') return;

  const storedAddress = getAuthenticatedAddress();
  if (storedAddress) {
    gun.get('userProfiles').get(storedAddress).once((data: any) => {
      if (data && data.signature) {
        address.set(storedAddress);
        isAuthenticated.set(true);
        console.log(isAuthenticated);
        status.set("Authentification vérifiée depuis Gun !");
        
        if (data.encryptionKey) {
          encryptionKey.set(data.encryptionKey);
          localStorage.setItem('encryptionKey', data.encryptionKey);
        } else {
          status.set("Veuillez entrer une passphrase pour configurer le chiffrement.");
        }
      } else {
        status.set("Profil non trouvé dans Gun.");
      }
    });
  }
}

export function getAuthenticatedAddress(): string | null {
  return localStorage.getItem('userAddress') || null;
}

export function getEncryptionKey(): string | null {
  return localStorage.getItem('encryptionKey') || null;
}