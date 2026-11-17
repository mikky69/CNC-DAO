import { BorshCoder, EventParser } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import { NaturreEventName, NaturreEventPayload, IndexedEvent } from "./types"
import idl from "../../target/idl/naturre.json"

export class NaturreEventParser {
  private parser: EventParser

  constructor(programId: PublicKey, customIdl?: any) {
    const activeIdl = customIdl || (idl as any)
    const coder = new BorshCoder(activeIdl)
    this.parser = new EventParser(programId, coder)
  }

  /**
   * Parse Anchor events from Solana transaction log messages into typed IndexedEvents
   */
  public parseLogs(
    logs: string[],
    signature: string = "",
    slot: number = 0,
    blockTime: number = Math.floor(Date.now() / 1000)
  ): IndexedEvent[] {
    const results: IndexedEvent[] = []
    try {
      const generator = this.parser.parseLogs(logs)
      for (const event of generator) {
        results.push({
          signature,
          slot,
          blockTime,
          event: {
            name: event.name as NaturreEventName,
            data: event.data,
          },
        })
      }
    } catch (err) {
      // Return any events successfully parsed before encountering error
    }
    return results
  }

  /**
   * Parses raw events without transaction context
   */
  public parseRawEvents(logs: string[]): NaturreEventPayload[] {
    const events = this.parseLogs(logs)
    return events.map((e) => e.event)
  }
}

/**
 * Converts a 32-byte number array to a 64-character lowercase hex string
 */
export function treeIdBytesToHex(bytes: number[] | Uint8Array): string {
  return Buffer.from(bytes).toString("hex")
}

/**
 * Converts a 64-character hex string back to a 32-byte number array
 */
export function hexToTreeIdBytes(hex: string): number[] {
  const buf = Buffer.from(hex, "hex")
  return Array.from(buf)
}

/**
 * Maps the Anchor enum representation of TreeStatus to a string
 */
export function mapOnChainStatusToString(statusObj: any): "pending" | "verified" | "rejected" | "minted" {
  if (!statusObj) return "pending"
  if (typeof statusObj === "string") return statusObj as any
  if (statusObj.pending) return "pending"
  if (statusObj.verified) return "verified"
  if (statusObj.rejected) return "rejected"
  if (statusObj.minted) return "minted"
  return "pending"
}

/**
 * Extracts a numeric value from an Anchor BN or primitive number
 */
export function extractNumber(val: any): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return val
  if (typeof val.toNumber === "function") return val.toNumber()
  if (typeof val.toString === "function") return Number(val.toString())
  return Number(val)
}
