/**
 * Copyright (C) 2016 Threema GmbH / SaltyRTC Contributors
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the `LICENSE.md` file for details.
 */

/// <reference path="jasmine.d.ts" />

import {Box} from "saltyrtc-client";
import {SecureDataChannel} from "../src/datachannel";
import {DataChannelNonce} from "../src/nonce";
import {WebRTCTask} from "../src/task";

const NONCE_LENGTH = 24;
const CHUNK_HEADER_LENGTH = 9;

class FakeDataChannel {
    public binaryType = 'arraybuffer';
}

class FakeSignaling {
    // Don't actually encrypt
    public encryptForPeer(data: Uint8Array, nonce: Uint8Array): saltyrtc.Box {
        return new Box(nonce, data, DataChannelNonce.TOTAL_LENGTH);
    };
}

class FakeTask {
    public getMaxPacketSize(): number {
        return 16384;
    }

    public getSignaling(): FakeSignaling {
        return new FakeSignaling();
    }
}

export default () => { describe('datachannel', function() {

    describe('SecureDataChannel', function() {

        describe('send', function() {

            beforeEach(() => {
                this.fakeDc = new FakeDataChannel as RTCDataChannel;
                this.fakeTask = new FakeTask() as WebRTCTask;
                this.sdc = new SecureDataChannel(this.fakeDc, this.fakeTask);
            });

            it('cannot send strings', () => {
                const send = () => this.sdc.send('hello');
                expect(send).toThrowError('SecureDataChannel can only handle binary data.');
            });

            it('cannot send blobs', () => {
                const send = () => this.sdc.send(new Blob());
                expect(send).toThrowError('SecureDataChannel does not currently support Blob data. Please pass in an ArrayBuffer or a typed array (e.g. Uint8Array).');
            });

            it('can send Uint8Arrays', () => {
                const data = new Uint8Array([1, 2, 3, 4]);
                this.fakeDc.send = (sending: Uint8Array) => {
                    expect(sending.slice(NONCE_LENGTH + CHUNK_HEADER_LENGTH)).toEqual(data);
                };
                this.sdc.send(data);
            });

            it('can send Uint16Arrays', () => {
                const data = new Uint16Array([258, 772]);
                this.fakeDc.send = (sending: Uint8Array) => {
                    const u16arr = new Uint16Array(sending.buffer.slice(NONCE_LENGTH + CHUNK_HEADER_LENGTH));
                    expect(u16arr).toEqual(data);
                };
                this.sdc.send(data);
            });

            it('can send Int32Arrays', () => {
                const data = new Int32Array([1024, -2048]);
                this.fakeDc.send = (sending: Uint8Array) => {
                    const i32arr = new Int32Array(sending.buffer.slice(NONCE_LENGTH + CHUNK_HEADER_LENGTH));
                    expect(i32arr).toEqual(data);
                };
                this.sdc.send(data);
            });

            it('can send Float64Arrays', () => {
                const data = new Float64Array([Math.PI, Math.E]);
                this.fakeDc.send = (sending: Uint8Array) => {
                    const f64arr = new Float64Array(sending.buffer.slice(NONCE_LENGTH + CHUNK_HEADER_LENGTH));
                    expect(f64arr).toEqual(data);
                };
                this.sdc.send(data);
            });

            it('can send limited DataViews', () => {
                const data = new Uint8Array([1, 2, 3, 4, 5, 6]);
                const view = new DataView(data.buffer, 2, 3);
                this.fakeDc.send = (sending: Uint8Array) => {
                    expect(sending.slice(NONCE_LENGTH + CHUNK_HEADER_LENGTH)).toEqual(new Uint8Array([3, 4, 5]));
                };
                this.sdc.send(view);
            });

            it('can send ArrayBuffers', () => {
                const data = new Uint8Array([1, 2, 3, 4]);
                this.fakeDc.send = (sending: Uint8Array) => {
                    expect(sending.slice(NONCE_LENGTH + CHUNK_HEADER_LENGTH)).toEqual(data);
                };
                this.sdc.send(data.buffer);
            });

            it('cannot send other types', () => {
                const send = () => this.sdc.send(1337);
                expect(send).toThrowError('Unknown data type. Please pass in an ArrayBuffer or a typed array (e.g. Uint8Array).');
            });

        });

    });

}); }
