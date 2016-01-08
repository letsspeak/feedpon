/// <reference path="../../DefinitelyTyped/node/node-0.12.d.ts" />
/// <reference path="../../DefinitelyTyped/text-encoding/text-encoding.d.ts" />
/// <reference path="../typings/whatwg-fetch.d.ts" />

import { AnyEvent, IActionHandler } from '../shared/interfaces'
import { FullContentReceived } from '../constants/eventTypes'
import { GetFullContent } from '../constants/actionTypes'
import { IContentFinder } from '../services/contentFinder/interfaces'
import { IHttpClient } from '../services/http/interfaces'
import { Inject } from '../shared/di/annotations'

const CHARSET_REGEXP = new RegExp('charset=([\\w-]+)', 'i')
const QUOTED_CHARSET_REGEXP = new RegExp('charset=["\']?([\\w-]+)["\']?', 'i')

@Inject
export default class GetFullContentHandler implements IActionHandler<GetFullContent> {
    constructor(private contentFinder: IContentFinder,
                private httpClient: IHttpClient) {
    }

    async handle(action: GetFullContent, dispatch: (event: AnyEvent) => void): Promise<void> {
        const { url, streamId } = action
        const response = await this.httpClient.send(new Request(url))
        const html = await decodeAsString(response)

        const doc = parseHtml(html)
        const foundContent = await this.contentFinder.find(url, doc)

        // TODO: When full content is not found
        if (foundContent) {
            const { content, nextLink } = foundContent

            dispatch({
                eventType: FullContentReceived,
                fullContent: {
                    streamId,
                    url,
                    content: content.outerHTML,
                    nextLink: nextLink ? nextLink.getAttribute('href') : null
                }
            } as FullContentReceived)
        }
    }
}

async function decodeAsString(response: Response): Promise<string> {
    const buffer = await response.arrayBuffer()
    const encoding = detectEncodingFromHeaders(response.headers)
        || detectEncodingFromContent(buffer)
        || 'utf-8'
    const decoder = new TextDecoder(encoding)
    const bytes = new Uint8Array(buffer)
    return decoder.decode(bytes)
}

function detectEncodingFromHeaders(headers: Headers): string {
    const contentType = headers.get('Content-Type')
    if (contentType != '') {
        const matches = contentType.match(CHARSET_REGEXP)
        if (matches) {
            return matches[1]
        }
    }
    return null
}

function detectEncodingFromContent(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer, 0, 1024)
    try {
        const decoder = new TextDecoder()
        const content = decoder.decode(bytes)
        const matches = content.match(QUOTED_CHARSET_REGEXP)
        if (matches) {
            return matches[1]
        }
    } catch (e) {
    }
    return null
}

function parseHtml(str: string): HTMLDocument {
    const parser = new DOMParser()
    return parser.parseFromString(str, 'text/html')
}
