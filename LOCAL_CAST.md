# Local Cast (BLE, iOS)

AirDrop-style peer-to-peer image cast between two Adpal users in the same room. Local only, no backend, no tokens.

## User Experience

1. Sender taps **Cast** on an image, then **Send to nearby**.
2. A sheet appears listing nearby Adpal users, grouped as **Contacts** and **Everyone** (filter toggle, defaults to Contacts).
3. Sender picks a recipient. Recipient sees an accept/decline prompt showing the sender's name — no image preview.
4. On accept, the image transfers over BLE and renders on the recipient's E-ink case. On decline, nothing is delivered.
5. The recipient never sees the image on their phone screen; it exists only on the case surface.

Visibility is symmetric: a user only appears in others' sheets while their own Cast sheet (or receive mode) is open, mirroring AirDrop's "Contacts Only / Everyone / Off" model.

## Implementation Considerations

**Roles.** Each app instance runs both `CBCentralManager` and `CBPeripheralManager` over one custom GATT service. Either side can send or receive.

**Background behavior.** Declare `bluetooth-central` and `bluetooth-peripheral` background modes and register Core Bluetooth state restoration. Recipients backgrounded or locked can still be discovered, but expect 5–30s discovery latency vs. near-instant in foreground. Service UUID must be explicitly listed when scanning — `nil` scans miss backgrounded peers.

**Contact filtering without leaking the address book.** Advertise truncated hashes of the user's own phone/email under a daily rotating salt in the manufacturer-data field. Each scanner intersects advertised hashes with hashes of its own local contacts. No contact list ever leaves the device; salt rotation prevents long-term tracking.

**Trust.** Skip native iOS BLE pairing. Each install holds a Curve25519 keypair in Keychain; first contact performs ECDH and caches the shared secret per peer. All control and data traffic is app-encrypted (ChaCha20-Poly1305).

**Transfer.** Prefer L2CAP Channel-oriented Connection (iOS 11+) for stream-style throughput; fall back to chunked GATT notifications. A dithered 528×768 1-bit bitmap is ~50 KB and transfers in under a second on L2CAP.

**Seal/reveal.** Sender transmits encrypted bytes plus metadata first; the decryption key is sent only after the recipient accepts. On accept, the recipient app decrypts, pushes to the case via the existing pairing, and wipes plaintext from memory and disk. The image is never rendered on the phone screen.

**Abuse controls.** Per-peer rate limit on pending offers, persistent block list keyed by peer public key, and automatic revert from Everyone to Contacts Only after a short idle period.

**Permissions.** `NSBluetoothAlwaysUsageDescription` always required; `NSContactsUsageDescription` requested only when the user first enables the Contacts filter.

## Out of Scope

- Remote (non-BLE) casting
- Token rewards
- Group cast to multiple recipients in one action
- Android and web clients
