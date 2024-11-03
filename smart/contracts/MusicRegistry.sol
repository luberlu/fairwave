// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MusicRegistry {
    struct Track {
        address owner;
        string cid;
    }

    mapping(string => Track) public tracks;
    mapping(address => string[]) private tracksByOwner; // Mapping de chaque propriétaire vers ses CIDs

    event TrackUploaded(address indexed owner, string cid);
    event TrackDeleted(address indexed owner, string cid);

    // Enregistrer un morceau sur IPFS
    function registerTrack(string calldata cid) external {
        require(bytes(tracks[cid].cid).length == 0, "Track already exists.");
        tracks[cid] = Track(msg.sender, cid);
        tracksByOwner[msg.sender].push(cid); // Ajouter le CID au tableau pour cet utilisateur
        emit TrackUploaded(msg.sender, cid);
    }

    // Vérifier si l'adresse est bien propriétaire du CID
    function isOwner(address user, string calldata cid) external view returns (bool) {
        return tracks[cid].owner == user;
    }

    // Obtenir tous les morceaux ajoutés par un propriétaire spécifique
    function getTracksByOwner(address owner) external view returns (string[] memory) {
        return tracksByOwner[owner];
    }

    // Supprimer un morceau
    function deleteTrack(string calldata cid) external {
        require(tracks[cid].owner == msg.sender, "Not the owner of the track.");
        delete tracks[cid]; // Supprimer le track du mapping

        // Supprimer le CID du tableau de l'utilisateur
        string[] storage userTracks = tracksByOwner[msg.sender];
        for (uint i = 0; i < userTracks.length; i++) {
            if (keccak256(bytes(userTracks[i])) == keccak256(bytes(cid))) {
                userTracks[i] = userTracks[userTracks.length - 1];
                userTracks.pop();
                break;
            }
        }

        emit TrackDeleted(msg.sender, cid);
    }
}
