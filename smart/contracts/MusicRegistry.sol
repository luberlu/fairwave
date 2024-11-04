// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MusicRegistry {
    struct Track {
        string did; // Utilisation du DID au lieu de l'adresse
        string cid;
    }

    mapping(string => Track) public tracks;
    mapping(string => string[]) private tracksByDid; // Mapping de chaque DID vers ses CIDs

    event TrackUploaded(string indexed did, string cid);
    event TrackDeleted(string indexed did, string cid);

    // Enregistrer un morceau sur IPFS
    function registerTrack(string calldata did, string calldata cid) external {
        require(bytes(tracks[cid].cid).length == 0, "Track already exists.");
        tracks[cid] = Track(did, cid);
        tracksByDid[did].push(cid); // Ajouter le CID au tableau pour ce DID
        emit TrackUploaded(did, cid);
    }

    // Vérifier si le DID est bien le propriétaire du CID
    function isOwner(string calldata did, string calldata cid) external view returns (bool) {
        return keccak256(abi.encodePacked(tracks[cid].did)) == keccak256(abi.encodePacked(did));
    }

    // Obtenir tous les morceaux ajoutés par un propriétaire spécifique (DID)
    function getTracksByOwner(string calldata did) external view returns (string[] memory) {
        return tracksByDid[did];
    }

    // Supprimer un morceau
    function deleteTrack(string calldata did, string calldata cid) external {
        require(keccak256(abi.encodePacked(tracks[cid].did)) == keccak256(abi.encodePacked(did)), "Not the owner of the track.");
        delete tracks[cid]; // Supprimer le track du mapping

        // Supprimer le CID du tableau de l'utilisateur
        string[] storage userTracks = tracksByDid[did];
        for (uint i = 0; i < userTracks.length; i++) {
            if (keccak256(bytes(userTracks[i])) == keccak256(bytes(cid))) {
                userTracks[i] = userTracks[userTracks.length - 1];
                userTracks.pop();
                break;
            }
        }

        emit TrackDeleted(did, cid);
    }
}
