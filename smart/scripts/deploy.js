async function main() {
    const MusicRegistry = await ethers.getContractFactory("MusicRegistry");
    const musicRegistry = await MusicRegistry.deploy();
    const contractAddress = musicRegistry.target;
    console.log("MusicRegistry deployed to:", contractAddress);
  }
  
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
  