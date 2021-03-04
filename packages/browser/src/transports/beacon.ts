import { eventToSentryRequest, sessionToSentryRequest } from '@sentry/core';
import { Event, Response, SentryRequest, Session, Status } from '@sentry/types';
import { getGlobalObject, SyncPromise } from '@sentry/utils';

import { BaseTransport } from './base';

const global = getGlobalObject() as Window;

/** `sendBeacon` based transport */
export class BeaconTransport extends BaseTransport {
  /**
   * @inheritDoc
   */
  public sendEvent(event: Event): PromiseLike<Response> {
    return this._sendRequest(eventToSentryRequest(event, this._api), event);
  }

  /**
   * @inheritDoc
   */
  public sendSession(session: Session): PromiseLike<Response> {
    return this._sendRequest(sessionToSentryRequest(session, this._api), session);
  }

  /**
   * @param sentryRequest Prepared SentryRequest to be delivered
   * @param originalPayload Original payload used to create SentryRequest
   */
  private _sendRequest(sentryRequest: SentryRequest, originalPayload: Event | Session): PromiseLike<Response> {
    const result = global.navigator.sendBeacon(sentryRequest.url, sentryRequest.body);
    return this._buffer.add(
      new SyncPromise<Response>((resolve, reject) => {
        if (result) {
          resolve({ status: Status.Success });
        } else {
          reject({
            status: Status.Failed,
            event: originalPayload,
            type: sentryRequest.type,
            reason: 'Failed to queue data for transfer',
          });
        }
      }),
    );
  }
}
