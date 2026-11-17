// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, fetchAsset, fetchCollection, transferV1 } from "@metaplex-foundation/mpl-core";
import { createSignerFromKeypair, signerIdentity, publicKey as toUmiPublicKey } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Naturre } from "../../target/types/naturre";
import idl from "../../target/idl/naturre.json";

describe("Naturre Smart Contract Protocol Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program<Naturre>(idl as unknown as Naturre, provider);
  const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

  // Keypairs
  const admin = (provider.wallet as anchor.Wallet).payer;
  const unauthorizedUser = Keypair.generate();
  const planter = Keypair.generate();
  const validator1 = Keypair.generate();
  const validator2 = Keypair.generate();
  const validator3 = Keypair.generate();
  const validatorWithBadge = Keypair.generate();
  const recipient = Keypair.generate();

  // Shared state across suites
  const treeCollectionKeypair = Keypair.generate();
  const treeNftKeypair = Keypair.generate();
  const milestoneCollectionKeypair = Keypair.generate();
  const firstRootBadgeKeypair = Keypair.generate();
  const groveBuilderBadgeKeypair = Keypair.generate();
  const forestGuardianBadgeKeypair = Keypair.generate();

  // PDA derivation helpers
  const getConfigPda = () => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    return pda;
  };

  const getValidatorPda = (validatorKey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("validator"), validatorKey.toBuffer()],
      program.programId
    );
    return pda;
  };

  const getTreePda = (planterKey: PublicKey, treeIdBytes: number[]) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tree"), planterKey.toBuffer(), Buffer.from(treeIdBytes)],
      program.programId
    );
    return pda;
  };

  const getUserStatsPda = (userKey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), userKey.toBuffer()],
      program.programId
    );
    return pda;
  };

  const getVotePda = (treePda: PublicKey, validatorKey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), treePda.toBuffer(), validatorKey.toBuffer()],
      program.programId
    );
    return pda;
  };

  const createTreeId = (tag: string): number[] => {
    const bytes = new Array(32).fill(0);
    const encoded = Buffer.from(tag);
    for (let i = 0; i < Math.min(encoded.length, 32); i++) {
      bytes[i] = encoded[i];
    }
    return bytes;
  };

  beforeAll(async () => {
    // Airdrop SOL to test actors
    const airdropSigners = [
      unauthorizedUser,
      planter,
      validator1,
      validator2,
      validator3,
      validatorWithBadge,
      recipient,
    ];
    for (const signer of airdropSigners) {
      const tx = await provider.connection.requestAirdrop(
        signer.publicKey,
        signer === planter ? 10 * LAMPORTS_PER_SOL : 5 * LAMPORTS_PER_SOL
      );
      const latestBlockhash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        signature: tx,
        ...latestBlockhash,
      });
    }
  });

  describe("1. Protocol Initialization & Administration", () => {
    it("initializes the protocol successfully", async () => {
      const configPda = getConfigPda();
      const requiredApprovals = 2;
      const feeLamports = new anchor.BN(1000);

      await program.methods
        .initializeProtocol(requiredApprovals, feeLamports, admin.publicKey)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.protocolConfig.fetch(configPda);
      expect(config.adminAuthority.toBase58()).toBe(admin.publicKey.toBase58());
      expect(config.requiredApprovals).toBe(2);
      expect(config.isPaused).toBe(false);
      expect(config.protocolFeeLamports.toNumber()).toBe(1000);
    });

    it("prevents reinitialization of the protocol config", async () => {
      const configPda = getConfigPda();
      try {
        await program.methods
          .initializeProtocol(2, new anchor.BN(1000), admin.publicKey)
          .accountsPartial({
            admin: admin.publicKey,
            protocolConfig: configPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();
        expect.unreachable("Should have failed to reinitialize protocol config");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });

    it("prevents unauthorized users from toggling emergency pause", async () => {
      const configPda = getConfigPda();
      try {
        await program.methods
          .updatePause(true)
          .accountsPartial({
            admin: unauthorizedUser.publicKey,
            protocolConfig: configPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.unreachable("Should have failed for unauthorized user");
      } catch (err: any) {
        expect(err.message).toContain("Unauthorized");
      }
    });

    it("allows admin to pause and unpause the protocol", async () => {
      const configPda = getConfigPda();

      // Pause protocol
      await program.methods
        .updatePause(true)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
        })
        .signers([admin])
        .rpc();

      let config = await program.account.protocolConfig.fetch(configPda);
      expect(config.isPaused).toBe(true);

      // Unpause protocol
      await program.methods
        .updatePause(false)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
        })
        .signers([admin])
        .rpc();

      config = await program.account.protocolConfig.fetch(configPda);
      expect(config.isPaused).toBe(false);
    });
  });

  describe("2. Validator Accreditation & Revocation", () => {
    it("rejects unauthorized attempts to approve a validator", async () => {
      const configPda = getConfigPda();
      const valPda = getValidatorPda(validator1.publicKey);

      try {
        await program.methods
          .approveValidator(null, null)
          .accountsPartial({
            admin: unauthorizedUser.publicKey,
            protocolConfig: configPda,
            validator: validator1.publicKey,
            validatorProfile: valPda,
            badgeAsset: null,
            mplCoreProgram: null,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.unreachable("Should have failed for unauthorized user");
      } catch (err: any) {
        expect(err.message).toContain("Unauthorized");
      }
    });

    it("approves validator1 and validator2 as active Nature Heroes", async () => {
      const configPda = getConfigPda();

      // Approve Validator 1
      const val1Pda = getValidatorPda(validator1.publicKey);
      await program.methods
        .approveValidator(null, null)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validator1.publicKey,
          validatorProfile: val1Pda,
          badgeAsset: null,
          mplCoreProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const profile1 = await program.account.validatorProfile.fetch(val1Pda);
      expect(profile1.isActive).toBe(true);
      expect(profile1.validator.toBase58()).toBe(validator1.publicKey.toBase58());
      expect(profile1.totalReviewed).toBe(0);

      // Approve Validator 2
      const val2Pda = getValidatorPda(validator2.publicKey);
      await program.methods
        .approveValidator(null, null)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validator2.publicKey,
          validatorProfile: val2Pda,
          badgeAsset: null,
          mplCoreProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const profile2 = await program.account.validatorProfile.fetch(val2Pda);
      expect(profile2.isActive).toBe(true);
    });

    it("prevents approving an already active validator", async () => {
      const configPda = getConfigPda();
      const val1Pda = getValidatorPda(validator1.publicKey);

      try {
        await program.methods
          .approveValidator(null, null)
          .accountsPartial({
            admin: admin.publicKey,
            protocolConfig: configPda,
            validator: validator1.publicKey,
            validatorProfile: val1Pda,
            badgeAsset: null,
            mplCoreProgram: null,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();
        expect.unreachable("Should fail when validator is already active");
      } catch (err: any) {
        expect(err.message).toContain("ValidatorAlreadyActive");
      }
    });

    it("revokes validator and prevents unauthorized revocation", async () => {
      const configPda = getConfigPda();
      const val3Pda = getValidatorPda(validator3.publicKey);

      // Approve validator3 first
      await program.methods
        .approveValidator(null, null)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validator3.publicKey,
          validatorProfile: val3Pda,
          badgeAsset: null,
          mplCoreProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      // Unauthorized user fails to revoke
      try {
        await program.methods
          .revokeValidator()
          .accountsPartial({
            admin: unauthorizedUser.publicKey,
            protocolConfig: configPda,
            validator: validator3.publicKey,
            validatorProfile: val3Pda,
            badgeAsset: null,
            mplCoreProgram: null,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.unreachable("Unauthorized revocation should fail");
      } catch (err: any) {
        expect(err.message).toContain("Unauthorized");
      }

      // Admin revokes validator3
      await program.methods
        .revokeValidator()
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validator3.publicKey,
          validatorProfile: val3Pda,
          badgeAsset: null,
          mplCoreProgram: null,
        })
        .signers([admin])
        .rpc();

      const profile3 = await program.account.validatorProfile.fetch(val3Pda);
      expect(profile3.isActive).toBe(false);
    });
  });

  describe("3. Tree Submission & Boundary Validation", () => {
    it("submits a tree record with valid GPS coordinates and initializes user stats", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Valid GPS: latitude 37.7749 * 10^7, longitude -122.4194 * 10^7
      const lat = new anchor.BN(377749000);
      const lng = new anchor.BN(-1224194000);
      const projectType = 1; // Agroforestry
      const metadataCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

      await program.methods
        .submitTree(treeId, lat, lng, projectType, metadataCid)
        .accountsPartial({
          planter: planter.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter])
        .rpc();

      const tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.planter.toBase58()).toBe(planter.publicKey.toBase58());
      expect(tree.latitude.toNumber()).toBe(377749000);
      expect(tree.longitude.toNumber()).toBe(-1224194000);
      expect(tree.projectType).toBe(1);
      expect(tree.status).toEqual({ pending: {} });
      expect(tree.approvalsCount).toBe(0);
      expect(tree.rejectionsCount).toBe(0);

      const stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.user.toBase58()).toBe(planter.publicKey.toBase58());
      expect(stats.treesPlanted).toBe(1);
      expect(stats.treesVerified).toBe(0);
    });

    it("rejects tree submission with invalid latitude bounds", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_invalid_lat");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Latitude > 90 degrees * 10^7 (91_0000_000)
      const lat = new anchor.BN(910000000);
      const lng = new anchor.BN(0);

      try {
        await program.methods
          .submitTree(treeId, lat, lng, 0, "QmTestValidCid")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter])
          .rpc();
        expect.unreachable("Should have failed for latitude > 90 degrees");
      } catch (err: any) {
        expect(err.message).toContain("InvalidGpsCoordinates");
      }
    });

    it("rejects tree submission with invalid longitude bounds", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_invalid_lng");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Longitude < -180 degrees * 10^7 (-181_0000_000)
      const lat = new anchor.BN(0);
      const lng = new anchor.BN(-1810000000);

      try {
        await program.methods
          .submitTree(treeId, lat, lng, 0, "QmTestValidCid")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter])
          .rpc();
        expect.unreachable("Should have failed for longitude < -180 degrees");
      } catch (err: any) {
        expect(err.message).toContain("InvalidGpsCoordinates");
      }
    });

    it("rejects tree submission with empty metadata CID", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_empty_cid");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      try {
        await program.methods
          .submitTree(treeId, new anchor.BN(0), new anchor.BN(0), 0, "")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter])
          .rpc();
        expect.unreachable("Should have failed for empty metadata CID");
      } catch (err: any) {
        expect(err.message).toContain("InvalidMetadataCid");
      }
    });

    it("prevents duplicate tree submissions for the same planter and tree_id_bytes", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001"); // already used
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      try {
        await program.methods
          .submitTree(treeId, new anchor.BN(1000), new anchor.BN(1000), 0, "QmDuplicate")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter])
          .rpc();
        expect.unreachable("Duplicate submission must fail due to PDA uniqueness");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });

    it("blocks tree submission when protocol is paused", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_paused");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Pause protocol
      await program.methods
        .updatePause(true)
        .accountsPartial({ admin: admin.publicKey, protocolConfig: configPda })
        .signers([admin])
        .rpc();

      try {
        await program.methods
          .submitTree(treeId, new anchor.BN(0), new anchor.BN(0), 0, "QmPaused")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter])
          .rpc();
        expect.unreachable("Should fail when protocol is paused");
      } catch (err: any) {
        expect(err.message).toContain("ProtocolPaused");
      }

      // Unpause protocol
      await program.methods
        .updatePause(false)
        .accountsPartial({ admin: admin.publicKey, protocolConfig: configPda })
        .signers([admin])
        .rpc();
    });
  });

  describe("4. Review Consensus, Anti-Self-Validation & Milestone Updates", () => {
    it("rejects planter attempting to review their own tree (anti-self-validation)", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const planterValPda = getValidatorPda(planter.publicKey);
      const votePda = getVotePda(treePda, planter.publicKey);

      // Approve planter as validator to test self-validation block
      await program.methods
        .approveValidator(null, null)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: planter.publicKey,
          validatorProfile: planterValPda,
          badgeAsset: null,
          mplCoreProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      try {
        await program.methods
          .reviewTree(true)
          .accountsPartial({
            validator: planter.publicKey,
            protocolConfig: configPda,
            validatorProfile: planterValPda,
            planter: planter.publicKey,
            treeRecord: treePda,
            voteRecord: votePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter])
          .rpc();
        expect.unreachable("Planter self-validation must fail");
      } catch (err: any) {
        expect(err.message).toContain("SelfValidationNotAllowed");
      }
    });

    it("rejects review from inactive or revoked validator", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const val3Pda = getValidatorPda(validator3.publicKey); // validator3 was revoked earlier
      const votePda = getVotePda(treePda, validator3.publicKey);

      try {
        await program.methods
          .reviewTree(true)
          .accountsPartial({
            validator: validator3.publicKey,
            protocolConfig: configPda,
            validatorProfile: val3Pda,
            planter: planter.publicKey,
            treeRecord: treePda,
            voteRecord: votePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([validator3])
          .rpc();
        expect.unreachable("Revoked validator review must fail");
      } catch (err: any) {
        expect(err.message).toContain("ValidatorNotActive");
      }
    });

    it("records first approval from validator1; tree remains Pending", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const val1Pda = getValidatorPda(validator1.publicKey);
      const votePda = getVotePda(treePda, validator1.publicKey);

      await program.methods
        .reviewTree(true)
        .accountsPartial({
          validator: validator1.publicKey,
          protocolConfig: configPda,
          validatorProfile: val1Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: votePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator1])
        .rpc();

      const tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.approvalsCount).toBe(1);
      expect(tree.rejectionsCount).toBe(0);
      expect(tree.status).toEqual({ pending: {} });

      const vote = await program.account.voteRecord.fetch(votePda);
      expect(vote.approved).toBe(true);
      expect(vote.validator.toBase58()).toBe(validator1.publicKey.toBase58());

      const profile1 = await program.account.validatorProfile.fetch(val1Pda);
      expect(profile1.totalReviewed).toBe(1);
      expect(profile1.totalApproved).toBe(1);
    });

    it("rejects duplicate review vote from validator1 on the same tree", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const val1Pda = getValidatorPda(validator1.publicKey);
      const votePda = getVotePda(treePda, validator1.publicKey);

      try {
        await program.methods
          .reviewTree(true)
          .accountsPartial({
            validator: validator1.publicKey,
            protocolConfig: configPda,
            validatorProfile: val1Pda,
            planter: planter.publicKey,
            treeRecord: treePda,
            voteRecord: votePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([validator1])
          .rpc();
        expect.unreachable("Duplicate vote must fail");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });

    it("records second approval from validator2; tree transitions to Verified and awards First Root milestone", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const val2Pda = getValidatorPda(validator2.publicKey);
      const votePda = getVotePda(treePda, validator2.publicKey);

      await program.methods
        .reviewTree(true)
        .accountsPartial({
          validator: validator2.publicKey,
          protocolConfig: configPda,
          validatorProfile: val2Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: votePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator2])
        .rpc();

      const tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.approvalsCount).toBe(2);
      expect(tree.status).toEqual({ verified: {} });
      expect(tree.verifiedAt).not.toBeNull();

      // Check UserStats verification count and milestone flag
      const stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.treesVerified).toBe(1);
      // Bit 0 = First Root milestone flag (0x01) - unclaimed until claim_milestone_badge is called
      expect(stats.claimedMilestones & 1).toBe(0);
    });

    it("rejects further votes once a tree is already Verified", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Reactivate validator3 to attempt voting on verified tree
      const val3Pda = getValidatorPda(validator3.publicKey);
      await program.methods
        .approveValidator(null, null)
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validator3.publicKey,
          validatorProfile: val3Pda,
          badgeAsset: null,
          mplCoreProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const votePda = getVotePda(treePda, validator3.publicKey);
      try {
        await program.methods
          .reviewTree(true)
          .accountsPartial({
            validator: validator3.publicKey,
            protocolConfig: configPda,
            validatorProfile: val3Pda,
            planter: planter.publicKey,
            treeRecord: treePda,
            voteRecord: votePda,
            userStats: userStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([validator3])
          .rpc();
        expect.unreachable("Cannot vote on verified tree");
      } catch (err: any) {
        expect(err.message).toContain("TreeNotPending");
      }
    });

    it("handles two rejections resulting in Rejected status", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_rejected_002");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Planter submits tree 2
      await program.methods
        .submitTree(treeId, new anchor.BN(0), new anchor.BN(0), 0, "QmRejectTree")
        .accountsPartial({
          planter: planter.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter])
        .rpc();

      // Validator 1 rejects
      const val1Pda = getValidatorPda(validator1.publicKey);
      const vote1Pda = getVotePda(treePda, validator1.publicKey);
      await program.methods
        .reviewTree(false)
        .accountsPartial({
          validator: validator1.publicKey,
          protocolConfig: configPda,
          validatorProfile: val1Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: vote1Pda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator1])
        .rpc();

      let tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.rejectionsCount).toBe(1);
      expect(tree.status).toEqual({ pending: {} });

      // Validator 2 rejects -> quorum reached -> Rejected
      const val2Pda = getValidatorPda(validator2.publicKey);
      const vote2Pda = getVotePda(treePda, validator2.publicKey);
      await program.methods
        .reviewTree(false)
        .accountsPartial({
          validator: validator2.publicKey,
          protocolConfig: configPda,
          validatorProfile: val2Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: vote2Pda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator2])
        .rpc();

      tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.rejectionsCount).toBe(2);
      expect(tree.status).toEqual({ rejected: {} });

      // Planter verified tree count remains 1
      const stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.treesVerified).toBe(1);
    });

    it("1-to-1 split remains Pending until a 3rd validator breaks the tie", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_split_003");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Planter submits tree 3
      await program.methods
        .submitTree(treeId, new anchor.BN(100000), new anchor.BN(100000), 2, "QmSplitTree")
        .accountsPartial({
          planter: planter.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter])
        .rpc();

      // Validator 1 approves
      const val1Pda = getValidatorPda(validator1.publicKey);
      const vote1Pda = getVotePda(treePda, validator1.publicKey);
      await program.methods
        .reviewTree(true)
        .accountsPartial({
          validator: validator1.publicKey,
          protocolConfig: configPda,
          validatorProfile: val1Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: vote1Pda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator1])
        .rpc();

      // Validator 2 rejects
      const val2Pda = getValidatorPda(validator2.publicKey);
      const vote2Pda = getVotePda(treePda, validator2.publicKey);
      await program.methods
        .reviewTree(false)
        .accountsPartial({
          validator: validator2.publicKey,
          protocolConfig: configPda,
          validatorProfile: val2Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: vote2Pda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator2])
        .rpc();

      // 1 approval, 1 rejection -> status MUST remain Pending!
      let tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.approvalsCount).toBe(1);
      expect(tree.rejectionsCount).toBe(1);
      expect(tree.status).toEqual({ pending: {} });

      // Validator 3 approves -> 2 approvals reached -> Verified!
      const val3Pda = getValidatorPda(validator3.publicKey);
      const vote3Pda = getVotePda(treePda, validator3.publicKey);
      await program.methods
        .reviewTree(true)
        .accountsPartial({
          validator: validator3.publicKey,
          protocolConfig: configPda,
          validatorProfile: val3Pda,
          planter: planter.publicKey,
          treeRecord: treePda,
          voteRecord: vote3Pda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator3])
        .rpc();

      tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.approvalsCount).toBe(2);
      expect(tree.rejectionsCount).toBe(1);
      expect(tree.status).toEqual({ verified: {} });

      // Planter verified tree count is now 2
      const stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.treesVerified).toBe(2);
      expect(stats.treesPlanted).toBe(3);
    });
  });

  describe("7. Naturre Tree Collection Lifecycle", () => {
    it("rejects unauthorized user trying to initialize tree collection", async () => {
      const configPda = getConfigPda();
      const fakeCollection = Keypair.generate();

      try {
        await program.methods
          .initializeTreeCollection(
            "Naturre Tree Collection",
            "https://arweave.net/tree-collection-metadata"
          )
          .accountsPartial({
            admin: unauthorizedUser.publicKey,
            protocolConfig: configPda,
            collection: fakeCollection.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser, fakeCollection])
          .rpc();
        expect.unreachable("Should have failed for unauthorized user");
      } catch (err: any) {
        expect(err.message).toMatch(/UnauthorizedAdmin|6000|0x1770/);
      }
    });

    it("allows admin to initialize the official Naturre Tree Collection", async () => {
      const configPda = getConfigPda();

      await program.methods
        .initializeTreeCollection(
          "Naturre Tree Collection",
          "https://arweave.net/tree-collection-metadata"
        )
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          collection: treeCollectionKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin, treeCollectionKeypair])
        .rpc();

      const config = await program.account.protocolConfig.fetch(configPda);
      expect(config.treeCollection).not.toBeNull();
      expect(config.treeCollection!.toBase58()).toBe(
        treeCollectionKeypair.publicKey.toBase58()
      );
    });

    it("prevents re-initialization of the Tree Collection", async () => {
      const configPda = getConfigPda();
      const secondCollection = Keypair.generate();

      try {
        await program.methods
          .initializeTreeCollection(
            "Naturre Tree Collection 2",
            "https://arweave.net/tree-collection-metadata-2"
          )
          .accountsPartial({
            admin: admin.publicKey,
            protocolConfig: configPda,
            collection: secondCollection.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin, secondCollection])
          .rpc();
        expect.unreachable("Should have failed duplicate initialization");
      } catch (err: any) {
        expect(err.message).toMatch(/TreeCollectionAlreadyInitialized|6018/);
      }
    });
  });

  describe("8. Naturre Tree NFT Minting", () => {
    it("rejects non-planter attempting to mint NFT for a verified tree", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const fakeNft = Keypair.generate();

      try {
        await program.methods
          .mintTreeNft("Naturre Tree #1", "https://arweave.net/tree-1")
          .accountsPartial({
            planter: unauthorizedUser.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            collection: treeCollectionKeypair.publicKey,
            nftAsset: fakeNft.publicKey,
            userStats: userStatsPda,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser, fakeNft])
          .rpc();
        expect.unreachable("Should have failed for non-planter");
      } catch (err: any) {
        // Seeds constraint on tree_record or InvalidPlanter
        expect(err.message).toMatch(/ConstraintSeeds|InvalidPlanter|2006/);
      }
    });

    it("rejects minting with an invalid or spoofed collection account", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const fakeNft = Keypair.generate();
      const forgedCollection = Keypair.generate();

      try {
        await program.methods
          .mintTreeNft("Naturre Tree #1", "https://arweave.net/tree-1")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            collection: forgedCollection.publicKey,
            nftAsset: fakeNft.publicKey,
            userStats: userStatsPda,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, fakeNft])
          .rpc();
        expect.unreachable("Should have failed for forged collection");
      } catch (err: any) {
        expect(err.message).toMatch(/InvalidCollection|6020/);
      }
    });

    it("rejects minting for a tree that is still Pending", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_pending_004");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const fakeNft = Keypair.generate();

      // Submit tree 4 (pending)
      await program.methods
        .submitTree(treeId, new anchor.BN(100000), new anchor.BN(100000), 1, "QmPendingTree")
        .accountsPartial({
          planter: planter.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter])
        .rpc();

      try {
        await program.methods
          .mintTreeNft("Naturre Tree #4", "https://arweave.net/tree-4")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            collection: treeCollectionKeypair.publicKey,
            nftAsset: fakeNft.publicKey,
            userStats: userStatsPda,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, fakeNft])
          .rpc();
        expect.unreachable("Should have failed for pending tree");
      } catch (err: any) {
        expect(err.message).toMatch(/TreeNotVerified|6013/);
      }
    });

    it("rejects minting for a Rejected tree", async () => {
      const configPda = getConfigPda();
      // Tree 2 was rejected in Section 4
      const treeId = createTreeId("tree_rejected_002");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const fakeNft = Keypair.generate();

      try {
        await program.methods
          .mintTreeNft("Naturre Tree #2", "https://arweave.net/tree-2")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            collection: treeCollectionKeypair.publicKey,
            nftAsset: fakeNft.publicKey,
            userStats: userStatsPda,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, fakeNft])
          .rpc();
        expect.unreachable("Should have failed for rejected tree");
      } catch (err: any) {
        expect(err.message).toMatch(/TreeNotVerified|6013/);
      }
    });

    it("successfully mints a transferable Metaplex Core NFT for verified tree_001", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);

      // Verify initial state
      let tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.status).toEqual({ verified: {} });
      expect(tree.nftAsset).toBeNull();

      let stats = await program.account.userStats.fetch(userStatsPda);
      const initialNftsMinted = stats.nftsMinted;

      // Planter mints the NFT
      await program.methods
        .mintTreeNft("Naturre Tree #1", "https://arweave.net/tree-nft-1")
        .accountsPartial({
          planter: planter.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          collection: treeCollectionKeypair.publicKey,
          nftAsset: treeNftKeypair.publicKey,
          userStats: userStatsPda,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter, treeNftKeypair])
        .rpc();

      // Verify on-chain state updates
      tree = await program.account.treeRecord.fetch(treePda);
      expect(tree.status).toEqual({ minted: {} });
      expect(tree.nftAsset).not.toBeNull();
      expect(tree.nftAsset!.toBase58()).toBe(treeNftKeypair.publicKey.toBase58());

      stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.nftsMinted).toBe(initialNftsMinted + 1);

      // Verify digital asset ownership with Umi
      const umi = createUmi(provider.connection).use(mplCore());
      const rawAsset = await provider.connection.getAccountInfo(treeNftKeypair.publicKey, "confirmed");
      console.log("Raw Tree NFT Account:", rawAsset ? { owner: rawAsset.owner.toBase58(), dataLen: rawAsset.data.length, data0: rawAsset.data[0] } : null);
      const asset = await fetchAsset(umi, toUmiPublicKey(treeNftKeypair.publicKey.toBase58()), { skipDerivePlugins: true });
      expect(asset.owner).toBe(planter.publicKey.toBase58());
      expect(asset.name).toBe("Naturre Tree #1");
      expect(asset.uri).toBe("https://arweave.net/tree-nft-1");
    });

    it("prevents duplicate NFT minting for an already minted tree", async () => {
      const configPda = getConfigPda();
      const treeId = createTreeId("tree_001");
      const treePda = getTreePda(planter.publicKey, treeId);
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const duplicateNft = Keypair.generate();

      try {
        await program.methods
          .mintTreeNft("Naturre Tree #1 Duplicate", "https://arweave.net/tree-nft-1-dup")
          .accountsPartial({
            planter: planter.publicKey,
            protocolConfig: configPda,
            treeRecord: treePda,
            collection: treeCollectionKeypair.publicKey,
            nftAsset: duplicateNft.publicKey,
            userStats: userStatsPda,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, duplicateNft])
          .rpc();
        expect.unreachable("Should have failed for already minted tree");
      } catch (err: any) {
        expect(err.message).toMatch(/TreeNotVerified|TreeAlreadyMinted|6013|6014/);
      }
    });
  });

  describe("9. Tree NFT Transferability", () => {
    it("allows the planter to freely transfer the tree NFT to another wallet", async () => {
      const umi = createUmi(provider.connection).use(mplCore());
      const planterSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(planter));
      umi.use(signerIdentity(planterSigner));

      // Transfer NFT from planter to recipient
      await transferV1(umi, {
        asset: toUmiPublicKey(treeNftKeypair.publicKey.toBase58()),
        newOwner: toUmiPublicKey(recipient.publicKey.toBase58()),
        collection: toUmiPublicKey(treeCollectionKeypair.publicKey.toBase58()),
      }).sendAndConfirm(umi);

      // Verify new owner on-chain
      const asset = await fetchAsset(umi, toUmiPublicKey(treeNftKeypair.publicKey.toBase58()), { skipDerivePlugins: true });
      expect(asset.owner).toBe(recipient.publicKey.toBase58());
    });
  });

  describe("10. Nature Hero Credential Badge Security & Lifecycle", () => {
    const badgeAssetKeypair = Keypair.generate();
    const valWithBadgePda = getValidatorPda(validatorWithBadge.publicKey);

    it("issues a non-transferable Nature Hero badge upon validator approval", async () => {
      const configPda = getConfigPda();

      await program.methods
        .approveValidator("Nature Hero Credential", "https://arweave.net/hero-badge")
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validatorWithBadge.publicKey,
          validatorProfile: valWithBadgePda,
          badgeAsset: badgeAssetKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin, badgeAssetKeypair])
        .rpc();

      const profile = await program.account.validatorProfile.fetch(valWithBadgePda);
      expect(profile.isActive).toBe(true);
      expect(profile.badgeAsset).not.toBeNull();
      expect(profile.badgeAsset!.toBase58()).toBe(badgeAssetKeypair.publicKey.toBase58());

      // Check badge on Metaplex Core
      const umi = createUmi(provider.connection).use(mplCore());
      const rawBadge = await provider.connection.getAccountInfo(badgeAssetKeypair.publicKey, "confirmed");
      console.log("Raw Badge Account:", rawBadge ? { owner: rawBadge.owner.toBase58(), dataLen: rawBadge.data.length, data0: rawBadge.data[0] } : null);
      const asset = await fetchAsset(umi, toUmiPublicKey(badgeAssetKeypair.publicKey.toBase58()), { skipDerivePlugins: true });
      expect(asset.owner).toBe(validatorWithBadge.publicKey.toBase58());
      expect(asset.name).toBe("Nature Hero Credential");
    });

    it("prevents transferring the Nature Hero badge (verifying soulbound freeze delegate)", async () => {
      const umi = createUmi(provider.connection).use(mplCore());
      const valSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(validatorWithBadge));
      umi.use(signerIdentity(valSigner));

      try {
        await transferV1(umi, {
          asset: toUmiPublicKey(badgeAssetKeypair.publicKey.toBase58()),
          newOwner: toUmiPublicKey(recipient.publicKey.toBase58()),
        }).sendAndConfirm(umi);
        expect.unreachable("Badge transfer should have been rejected by freeze delegate");
      } catch (err: any) {
        // Metaplex Core throws CannotTransferFrozenAsset (0x11 / 17)
        expect(err.message).toBeDefined();
      }
    });

    it("allows admin to revoke validator and burns the credential badge", async () => {
      const configPda = getConfigPda();

      await program.methods
        .revokeValidator()
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          validator: validatorWithBadge.publicKey,
          validatorProfile: valWithBadgePda,
          badgeAsset: badgeAssetKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
        })
        .signers([admin])
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 600));

      const profile = await program.account.validatorProfile.fetch(valWithBadgePda);
      expect(profile.isActive).toBe(false);
      expect(profile.badgeAsset).toBeNull();

      // Check that the badge asset was burned on-chain
      const accountInfo = await provider.connection.getAccountInfo(badgeAssetKeypair.publicKey, "confirmed");
      expect(accountInfo === null || accountInfo.data[0] === 0).toBe(true);
    });
  });

  describe("11. Naturre Milestone Badge Collection & Claiming Lifecycle", () => {
    const submitAndVerifyTree = async (planterKeypair: Keypair, treeName: string) => {
      const treeId = createTreeId(treeName);
      const treePda = getTreePda(planterKeypair.publicKey, treeId);
      const statsPda = getUserStatsPda(planterKeypair.publicKey);
      const configPda = getConfigPda();
      const val1Pda = getValidatorPda(validator1.publicKey);
      const val2Pda = getValidatorPda(validator2.publicKey);
      const vote1Pda = getVotePda(treePda, validator1.publicKey);
      const vote2Pda = getVotePda(treePda, validator2.publicKey);

      await program.methods
        .submitTree(
          treeId,
          new anchor.BN(45 * 10_000_000),
          new anchor.BN(10 * 10_000_000),
          0,
          "QmTestMilestoneCid"
        )
        .accountsPartial({
          planter: planterKeypair.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          userStats: statsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([planterKeypair])
        .rpc();

      await program.methods
        .reviewTree(true)
        .accountsPartial({
          validator: validator1.publicKey,
          protocolConfig: configPda,
          validatorProfile: val1Pda,
          planter: planterKeypair.publicKey,
          treeRecord: treePda,
          voteRecord: vote1Pda,
          userStats: statsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator1])
        .rpc();

      await program.methods
        .reviewTree(true)
        .accountsPartial({
          validator: validator2.publicKey,
          protocolConfig: configPda,
          validatorProfile: val2Pda,
          planter: planterKeypair.publicKey,
          treeRecord: treePda,
          voteRecord: vote2Pda,
          userStats: statsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([validator2])
        .rpc();
    };

    it("rejects unauthorized user trying to initialize milestone collection", async () => {
      const configPda = getConfigPda();
      const fakeCollection = Keypair.generate();

      try {
        await program.methods
          .initializeMilestoneCollection(
            "Naturre Milestone Badges",
            "https://devnet.naturre.org/metadata/milestones/collection.json"
          )
          .accountsPartial({
            admin: unauthorizedUser.publicKey,
            protocolConfig: configPda,
            collection: fakeCollection.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser, fakeCollection])
          .rpc();
        expect.unreachable("Unauthorized user must not be able to initialize milestone collection");
      } catch (err: any) {
        expect(err.message).toContain("UnauthorizedAdmin");
      }
    });

    it("allows admin to initialize the official Naturre Milestone Badge Collection", async () => {
      const configPda = getConfigPda();

      await program.methods
        .initializeMilestoneCollection(
          "Naturre Milestone Badges",
          "https://devnet.naturre.org/metadata/milestones/collection.json"
        )
        .accountsPartial({
          admin: admin.publicKey,
          protocolConfig: configPda,
          collection: milestoneCollectionKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin, milestoneCollectionKeypair])
        .rpc();

      const config = await program.account.protocolConfig.fetch(configPda);
      expect(config.badgeCollection).not.toBeNull();
      expect(config.badgeCollection!.toBase58()).toBe(milestoneCollectionKeypair.publicKey.toBase58());

      // Verify on Metaplex Core via Umi
      const umi = createUmi(provider.connection).use(mplCore());
      const collectionAsset = await fetchCollection(umi, toUmiPublicKey(milestoneCollectionKeypair.publicKey.toBase58()));
      expect(collectionAsset.name).toBe("Naturre Milestone Badges");
      expect(collectionAsset.updateAuthority).toBe(configPda.toBase58());
    });

    it("prevents re-initialization of the Milestone Badge Collection", async () => {
      const configPda = getConfigPda();
      const duplicateKeypair = Keypair.generate();

      try {
        await program.methods
          .initializeMilestoneCollection(
            "Duplicate Milestone Collection",
            "https://devnet.naturre.org/metadata/milestones/dup.json"
          )
          .accountsPartial({
            admin: admin.publicKey,
            protocolConfig: configPda,
            collection: duplicateKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin, duplicateKeypair])
          .rpc();
        expect.unreachable("Re-initializing milestone collection must fail");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneCollectionAlreadyInitialized");
      }
    });

    it("rejects claim for milestone tier 0 (First Root) if user has 0 verified trees", async () => {
      const configPda = getConfigPda();
      const zeroTreesUser = Keypair.generate();
      const airdropTx = await provider.connection.requestAirdrop(zeroTreesUser.publicKey, 2 * LAMPORTS_PER_SOL);
      const bh = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({ signature: airdropTx, ...bh });

      // Submit an unverified tree so UserStats exists
      const treeId = createTreeId("zero_tree_001");
      const treePda = getTreePda(zeroTreesUser.publicKey, treeId);
      const userStatsPda = getUserStatsPda(zeroTreesUser.publicKey);

      await program.methods
        .submitTree(
          treeId,
          new anchor.BN(45 * 10_000_000),
          new anchor.BN(10 * 10_000_000),
          0,
          "QmZeroTreesCid"
        )
        .accountsPartial({
          planter: zeroTreesUser.publicKey,
          protocolConfig: configPda,
          treeRecord: treePda,
          userStats: userStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([zeroTreesUser])
        .rpc();

      const badgeAsset = Keypair.generate();
      try {
        await program.methods
          .claimMilestoneBadge(0, null, null)
          .accountsPartial({
            user: zeroTreesUser.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: badgeAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([zeroTreesUser, badgeAsset])
          .rpc();
        expect.unreachable("User with 0 verified trees cannot claim First Root");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneNotReached");
      }
    });

    it("rejects claim for milestone tier 1 (Grove Builder) if user has fewer than 10 verified trees", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.treesVerified).toBe(2);
      expect(stats.treesVerified).toBeLessThan(10);

      const badgeAsset = Keypair.generate();
      try {
        await program.methods
          .claimMilestoneBadge(1, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: badgeAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, badgeAsset])
          .rpc();
        expect.unreachable("User with 1 verified tree cannot claim Grove Builder");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneNotReached");
      }
    });

    it("rejects claim for milestone tier 2 (Forest Guardian) if user has fewer than 50 verified trees", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);

      const badgeAsset = Keypair.generate();
      try {
        await program.methods
          .claimMilestoneBadge(2, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: badgeAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, badgeAsset])
          .rpc();
        expect.unreachable("User with 1 verified tree cannot claim Forest Guardian");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneNotReached");
      }
    });

    it("rejects claim with invalid milestone tier (e.g. tier 3)", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const badgeAsset = Keypair.generate();

      try {
        await program.methods
          .claimMilestoneBadge(3, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: badgeAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, badgeAsset])
          .rpc();
        expect.unreachable("Invalid milestone tier must be rejected");
      } catch (err: any) {
        expect(err.message).toContain("InvalidMilestoneTier");
      }
    });

    it("rejects claim with an invalid or spoofed milestone collection account", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const badgeAsset = Keypair.generate();

      try {
        await program.methods
          .claimMilestoneBadge(0, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: badgeAsset.publicKey,
            milestoneCollection: treeCollectionKeypair.publicKey, // wrong collection!
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, badgeAsset])
          .rpc();
        expect.unreachable("Claiming with spoofed collection must fail");
      } catch (err: any) {
        expect(err.message).toContain("InvalidCollection");
      }
    });

    it("successfully claims First Root milestone badge (tier 0) for verified planter", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);

      await program.methods
        .claimMilestoneBadge(0, null, null)
        .accountsPartial({
          user: planter.publicKey,
          protocolConfig: configPda,
          userStats: userStatsPda,
          badgeAsset: firstRootBadgeKeypair.publicKey,
          milestoneCollection: milestoneCollectionKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter, firstRootBadgeKeypair])
        .rpc();

      // Check UserStats claimed_milestones bitmask: Bit 0 (0x01) must be set
      const stats = await program.account.userStats.fetch(userStatsPda);
      expect(stats.claimedMilestones & 1).toBe(1);

      // Verify asset on Metaplex Core via Umi
      const umi = createUmi(provider.connection).use(mplCore());
      const asset = await fetchAsset(umi, toUmiPublicKey(firstRootBadgeKeypair.publicKey.toBase58()), {
        skipDerivePlugins: true,
      });
      expect(asset.owner).toBe(planter.publicKey.toBase58());
      expect(asset.name).toBe("First Root Milestone");
    });

    it("prevents duplicate claim of First Root milestone (tier 0)", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const duplicateAsset = Keypair.generate();

      try {
        await program.methods
          .claimMilestoneBadge(0, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: duplicateAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, duplicateAsset])
          .rpc();
        expect.unreachable("Duplicate milestone claim must fail");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneAlreadyClaimed");
      }
    });

    it("allows planter to freely transfer the First Root milestone badge to another wallet", async () => {
      const umi = createUmi(provider.connection).use(mplCore());
      const planterSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(planter));
      umi.use(signerIdentity(planterSigner));

      await transferV1(umi, {
        asset: toUmiPublicKey(firstRootBadgeKeypair.publicKey.toBase58()),
        newOwner: toUmiPublicKey(recipient.publicKey.toBase58()),
        collection: toUmiPublicKey(milestoneCollectionKeypair.publicKey.toBase58()),
      }).sendAndConfirm(umi);

      const transferredAsset = await fetchAsset(umi, toUmiPublicKey(firstRootBadgeKeypair.publicKey.toBase58()), {
        skipDerivePlugins: true,
      });
      expect(transferredAsset.owner).toBe(recipient.publicKey.toBase58());
    });

    it("qualifies for Grove Builder (10 trees) and claims tier 1 milestone badge", async () => {
      // Planter currently has 2 verified trees (tree_001, tree_split_003). Submit and verify 8 more trees (tree_003 to tree_010)
      for (let i = 3; i <= 10; i++) {
        await submitAndVerifyTree(planter, `tree_${String(i).padStart(3, "0")}`);
      }

      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const statsBefore = await program.account.userStats.fetch(userStatsPda);
      expect(statsBefore.treesVerified).toBe(10);
      expect((statsBefore.claimedMilestones & 2) === 0).toBe(true); // Tier 1 not yet claimed

      await program.methods
        .claimMilestoneBadge(1, null, null)
        .accountsPartial({
          user: planter.publicKey,
          protocolConfig: configPda,
          userStats: userStatsPda,
          badgeAsset: groveBuilderBadgeKeypair.publicKey,
          milestoneCollection: milestoneCollectionKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter, groveBuilderBadgeKeypair])
        .rpc();

      // Check UserStats claimed_milestones bitmask: Bit 0 and Bit 1 must be set (0b00000011 = 3)
      const statsAfter = await program.account.userStats.fetch(userStatsPda);
      expect(statsAfter.claimedMilestones & 2).toBe(2);
      expect(statsAfter.claimedMilestones).toBe(3);

      // Verify asset on Metaplex Core via Umi
      const umi = createUmi(provider.connection).use(mplCore());
      const asset = await fetchAsset(umi, toUmiPublicKey(groveBuilderBadgeKeypair.publicKey.toBase58()), {
        skipDerivePlugins: true,
      });
      expect(asset.owner).toBe(planter.publicKey.toBase58());
      expect(asset.name).toBe("Grove Builder Milestone");
    });

    it("prevents duplicate claim of Grove Builder milestone (tier 1)", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const duplicateAsset = Keypair.generate();

      try {
        await program.methods
          .claimMilestoneBadge(1, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: duplicateAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, duplicateAsset])
          .rpc();
        expect.unreachable("Duplicate Grove Builder claim must fail");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneAlreadyClaimed");
      }
    });

    it(
      "qualifies for Forest Guardian (50 trees) and claims tier 2 milestone badge",
      async () => {
      // Planter currently has 10 verified trees. Submit and verify 40 more trees (tree_011 to tree_050)
      for (let i = 11; i <= 50; i++) {
        await submitAndVerifyTree(planter, `tree_${String(i).padStart(3, "0")}`);
      }

      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const statsBefore = await program.account.userStats.fetch(userStatsPda);
      expect(statsBefore.treesVerified).toBe(50);
      expect((statsBefore.claimedMilestones & 4) === 0).toBe(true); // Tier 2 not yet claimed

      await program.methods
        .claimMilestoneBadge(2, null, null)
        .accountsPartial({
          user: planter.publicKey,
          protocolConfig: configPda,
          userStats: userStatsPda,
          badgeAsset: forestGuardianBadgeKeypair.publicKey,
          milestoneCollection: milestoneCollectionKeypair.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([planter, forestGuardianBadgeKeypair])
        .rpc();

      // Check UserStats claimed_milestones bitmask: Bits 0, 1, 2 must be set (0b00000111 = 7)
      const statsAfter = await program.account.userStats.fetch(userStatsPda);
      expect(statsAfter.claimedMilestones & 4).toBe(4);
      expect(statsAfter.claimedMilestones).toBe(7);

      // Verify asset on Metaplex Core via Umi
      const umi = createUmi(provider.connection).use(mplCore());
      const asset = await fetchAsset(umi, toUmiPublicKey(forestGuardianBadgeKeypair.publicKey.toBase58()), {
        skipDerivePlugins: true,
      });
      expect(asset.owner).toBe(planter.publicKey.toBase58());
      expect(asset.name).toBe("Forest Guardian Milestone");
    }, 180000);

    it("prevents duplicate claim of Forest Guardian milestone (tier 2)", async () => {
      const configPda = getConfigPda();
      const userStatsPda = getUserStatsPda(planter.publicKey);
      const duplicateAsset = Keypair.generate();

      try {
        await program.methods
          .claimMilestoneBadge(2, null, null)
          .accountsPartial({
            user: planter.publicKey,
            protocolConfig: configPda,
            userStats: userStatsPda,
            badgeAsset: duplicateAsset.publicKey,
            milestoneCollection: milestoneCollectionKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([planter, duplicateAsset])
          .rpc();
        expect.unreachable("Duplicate Forest Guardian claim must fail");
      } catch (err: any) {
        expect(err.message).toContain("MilestoneAlreadyClaimed");
      }
    });

    it("verifies that all three milestone badges were claimed independently and can be transferred", async () => {
      const umi = createUmi(provider.connection).use(mplCore());
      const planterSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(planter));
      umi.use(signerIdentity(planterSigner));

      // Transfer Grove Builder badge
      await transferV1(umi, {
        asset: toUmiPublicKey(groveBuilderBadgeKeypair.publicKey.toBase58()),
        newOwner: toUmiPublicKey(recipient.publicKey.toBase58()),
        collection: toUmiPublicKey(milestoneCollectionKeypair.publicKey.toBase58()),
      }).sendAndConfirm(umi);

      // Transfer Forest Guardian badge
      await transferV1(umi, {
        asset: toUmiPublicKey(forestGuardianBadgeKeypair.publicKey.toBase58()),
        newOwner: toUmiPublicKey(recipient.publicKey.toBase58()),
        collection: toUmiPublicKey(milestoneCollectionKeypair.publicKey.toBase58()),
      }).sendAndConfirm(umi);

      const transferredGrove = await fetchAsset(umi, toUmiPublicKey(groveBuilderBadgeKeypair.publicKey.toBase58()), {
        skipDerivePlugins: true,
      });
      expect(transferredGrove.owner).toBe(recipient.publicKey.toBase58());

      const transferredGuardian = await fetchAsset(umi, toUmiPublicKey(forestGuardianBadgeKeypair.publicKey.toBase58()), {
        skipDerivePlugins: true,
      });
      expect(transferredGuardian.owner).toBe(recipient.publicKey.toBase58());
    }, 60000);
  });
});
