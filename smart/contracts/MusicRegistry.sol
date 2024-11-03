// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MusicRegistry {
    struct Track {
        address owner;
        string cid;
    }

    mapping(string => Track) public tracks;

    event TrackUploaded(address indexed owner, string cid);

    // Enregistrer un morceau sur IPFS
    function registerTrack(string calldata cid) external {
        require(bytes(tracks[cid].cid).length == 0, "Track already exists.");
        tracks[cid] = Track(msg.sender, cid);
        emit TrackUploaded(msg.sender, cid);
    }

    // Vérifier si l'adresse est bien propriétaire du CID
    function isOwner(address user, string calldata cid) external view returns (bool) {
        return tracks[cid].owner == user;
    }
}
