import Enumerable from '@emonkak/enumerable';

import '@emonkak/enumerable/extensions/firstOrDefault';
import '@emonkak/enumerable/extensions/join';
import '@emonkak/enumerable/extensions/select';
import '@emonkak/enumerable/extensions/selectMany';

import {
    AsyncEvent,
    Entry,
    Feed,
    FullContent,
    Notification,
    Siteinfo,
    SyncEvent,
    ViewMode
} from './types';

import {
    allCategories,
    allSubscriptions,
    allUnreadCounts,
    authCallback,
    createAuthUrl,
    exchangeToken,
    getFeed,
    getStreamContents
} from 'supports/feedly/api';

import * as feedly from 'supports/feedly/types';
import decodeResponseAsText from 'supports/decodeResponseAsText';
import stripTags from 'supports/stripTags';
import { LDRFullFeedData, WedataItem }  from 'supports/wedata/types';
import { getAutoPagerizeItems, getLDRFullFeedItems }  from 'supports/wedata/api';
import { getBookmarkCounts, getBookmarkEntry } from 'supports/hatena/bookmarkApi';

const DEFAULT_DISMISS_AFTER = 3000;

const DELAY = 500;

export function authenticate(): AsyncEvent {
    return (dispatch, getState) => {
        const { environment } = getState();

        async function handleRedirectUrl(urlString: string): Promise<void> {
            const response = authCallback(urlString);

            if (response.error) {
                sendNotification({
                    message: 'Authentication failed: ' + response.error,
                    kind: 'negative'
                })(dispatch, getState);

                return;
            }

            const token = await exchangeToken({
                code: response.code,
                client_id: environment.clientId,
                client_secret: environment.clientSecret,
                redirect_uri: environment.redirectUri,
                grant_type: 'authorization_code'
            });

            const credential = {
                authorizedAt: new Date().toISOString(),
                token
            };

            dispatch({
                type: 'AUTHENTICATED',
                credential
            });
        }

        const url = createAuthUrl({
            client_id: environment.clientId,
            redirect_uri: environment.redirectUri,
            response_type: 'code',
            scope: environment.scope
        });

        chrome.windows.create({ url, type: 'popup' }, (window: chrome.windows.Window) => {
            observeUrlChanging(window, (url: string) => {
                if (!url.startsWith(environment.redirectUri)) {
                    return;
                }

                chrome.windows.remove(window.id);

                handleRedirectUrl(url);
            });
        });
    };
}

function observeUrlChanging(window: chrome.windows.Window, callback: (url: string) => void): void {
    function handleUpdateTab(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void {
        if (tab.windowId === window.id && tab.status === 'complete' && tab.url != null) {
            callback(tab.url)
        }
    }

    function handleRemoveWindow(windowId: number): void {
        if (windowId === window.id) {
            unregisterListeners();
        }
    }

    function unregisterListeners(): void {
        chrome.tabs.onUpdated.removeListener(handleUpdateTab);
        chrome.windows.onRemoved.removeListener(handleRemoveWindow);
    }

    chrome.tabs.onUpdated.addListener(handleUpdateTab);
    chrome.windows.onRemoved.addListener(handleRemoveWindow);
}

export function readEntry(entryIds: string[], timestamp: Date): SyncEvent {
    return {
        type: 'ENTRY_READ',
        entryIds,
        readAt: timestamp.toISOString()
    };
}

export function clearReadEntries(): SyncEvent {
    return {
        type: 'READ_ENTRIES_CLEARED'
    };
}

export function saveReadEntries(entryIds: string[]): AsyncEvent {
    return (dispatch, getState) => {
        if (entryIds.length === 0) {
            return;
        }

        setTimeout(() => {
            const message = entryIds.length === 1
                ? `${entryIds.length} entry is marked as read.`
                : `${entryIds.length} entries are marked as read.`;

            dispatch({
                type: 'ENTRY_MARKED_AS_READ',
                entryIds
            });

            sendNotification({
                message,
                kind: 'positive',
                dismissAfter: DEFAULT_DISMISS_AFTER
            })(dispatch, getState);
        }, DELAY);
    };
}

export function fetchSubscriptions(): AsyncEvent {
    return async (dispatch, getState) => {
        dispatch({
            type: 'SUBSCRIPTIONS_FETCHING'
        });

        const { credential } = getState();

        if (credential) {
            const [categoriesResponse, subscriptionsResponse, unreadCountsResponse] = await Promise.all([
                allCategories(credential.token.access_token),
                allSubscriptions(credential.token.access_token),
                allUnreadCounts(credential.token.access_token)
            ]);

            const categories = categoriesResponse.map(category => ({
                categoryId: category.id,
                feedId: category.id,
                label: category.label
            }));

            const subscriptions = new Enumerable(subscriptionsResponse)
                .join(
                    unreadCountsResponse.unreadcounts,
                    (subscription) => subscription.id,
                    (unreadCount) => unreadCount.id,
                    (subscription, unreadCount) => ({ subscription, unreadCount })
                )
                .selectMany(({ subscription, unreadCount }) =>
                    subscription.categories.map((category) => ({
                        subscriptionId: subscription.id,
                        categoryId: category.id,
                        feedId: subscription.id,
                        title: subscription.title || '',
                        iconUrl: subscription.iconUrl || '',
                        unreadCount: unreadCount.count
                    }))
                )
                .toArray();

            dispatch({
                type: 'SUBSCRIPTIONS_FETCHED',
                categories,
                fetchedAt: new Date().toISOString(),
                subscriptions
            });
        }
    };
}

function convertEntry(item: feedly.Entry): Entry {
    return {
        entryId: item.id,
        author: item.author || '',
        summary: stripTags((item.summary ? item.summary.content : '') || (item.content ? item.content.content : '')),
        content: (item.content ? item.content.content : '') || (item.summary ? item.summary.content : ''),
        fullContents: {
            isLoaded: false,
            isLoading: false,
            items: [],
            nextPageUrl: ''
        },
        publishedAt: new Date(item.published).toISOString(),
        title: item.title,
        url: item.alternate[0].href,
        comments: {
            isLoaded: false,
            items: []
        },
        bookmarkUrl: 'http://b.hatena.ne.jp/entry/' + item.alternate[0].href,
        bookmarkCount: 0,
        origin: {
            feedId: item.origin.streamId,
            title: item.origin.title,
            url: item.origin.htmlUrl,
        },
        markAsRead: !item.unread,
        readAt: null
    };
}

export function fetchFeed(feedId: string): AsyncEvent {
    return async (dispatch, getState) => {
        dispatch({
            type: 'FEED_FETCHING',
            feedId: feedId
        });

        const { credential } = getState();
        if (!credential) {
            sendNotification({
                message: 'Not authenticated',
                kind: 'negative'
            })(dispatch, getState);

            return;
        }

        const { subscriptions } = getState();
        const subscription = new Enumerable(subscriptions.items)
            .firstOrDefault((subscription) => subscription.subscriptionId === feedId);

        let feed: Feed | null = null;

        if (feedId.startsWith('feed/')) {
            const [contentsResponse, feedResponse] = await Promise.all([
                getStreamContents(credential.token.access_token, {
                    streamId: feedId
                }),
                getFeed(credential.token.access_token, feedId)
            ]);

            feed = {
                feedId,
                title: feedResponse.title,
                description: feedResponse.description || '',
                url: feedResponse.website || '',
                subscribers: feedResponse.subscribers,
                velocity: feedResponse.velocity || 0,
                entries: contentsResponse.items.map(convertEntry),
                continuation: contentsResponse.continuation || null,
                isLoading: false,
                subscription
            };
        } else if (feedId.startsWith('user/')) {
            const category = new Enumerable(subscriptions.categories)
                .firstOrDefault((category) => category.categoryId === feedId);

            const contentsResponse = await getStreamContents(credential.token.access_token, {
                streamId: feedId
            });

            feed = {
                feedId,
                title: category ? category.label : '',
                description: '',
                url: '',
                subscribers: 0,
                velocity: 0,
                entries: contentsResponse.items.map(convertEntry),
                continuation: contentsResponse.continuation || null,
                isLoading: false,
                subscription
            };
        }

        if (feed) {
            dispatch({
                type: 'FEED_FETCHED',
                feed
            });

            const entryUrls = feed.entries
                    .filter((entry) => !!entry.url)
                    .map((entry) => entry.url);

            if (entryUrls.length > 0) {
                const bookmarkCounts = await getBookmarkCounts(entryUrls);

                dispatch({
                    type: 'BOOKMARK_COUNTS_FETCHED',
                    bookmarkCounts
                });
            }
        }
    };
}

export function fetchComments(entryId: string, url: string): AsyncEvent {
    return async (dispatch) => {
        const bookmarks = await getBookmarkEntry(url);

        if (bookmarks && bookmarks.bookmarks) {
            const comments = bookmarks.bookmarks
                .filter((bookmark) => bookmark.comment !== '')
                .map((bookmark) => ({
                    user: bookmark.user,
                    comment: bookmark.comment,
                    timestamp: bookmark.timestamp
                }));

            dispatch({
                type: 'COMMENTS_FETCHED',
                entryId,
                comments
            });
        } else {
            dispatch({
                type: 'COMMENTS_FETCHED',
                entryId,
                comments: []
            });
        }
    }
}

async function extractFullContent(url: string, siteinfo: Siteinfo): Promise<{ fullContent: FullContent | null, nextPageUrl: string | null }> {
    const response = await fetch(url);

    if (response.ok) {
        const responseText = await decodeResponseAsText(response);

        const parser = new DOMParser();
        const parsedDocument = parser.parseFromString(responseText, 'text/html');

        for (const item of siteinfo.items) {
            if (matches(item.url, response.url)) {
                let content = '';
                let nextPageUrl: string | null = null;

                const contentResult = document.evaluate(
                    item.contentPath,
                    parsedDocument.body,
                    null,
                    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                    null
                );

                for (
                    let node = contentResult.iterateNext();
                    node;
                    node = contentResult.iterateNext()
                ) {
                    if (node instanceof Element) {
                        content += node.outerHTML;
                    }
                }

                if (content) {
                    if (item.nextLinkPath) {
                        const nextLinkResult = document.evaluate(
                            item.nextLinkPath,
                            parsedDocument.body,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        );

                        const node = nextLinkResult.singleNodeValue;

                        if (node && node instanceof HTMLElement) {
                            const urlString = node.getAttribute('href');

                            if (urlString) {
                                nextPageUrl = new URL(urlString, response.url).toString();
                            }
                        }
                    }

                    return {
                        fullContent: { content, url: response.url },
                        nextPageUrl
                    };
                }
            }
        }
    }

    return { fullContent: null, nextPageUrl: null };
}

export function fetchFullContent(entryId: string, url: string): AsyncEvent {
    return async (dispatch, getState) => {
        dispatch({
            type: 'FULL_CONTENT_FETCHING',
            entryId
        });

        const { siteinfo } = getState();
        const { fullContent, nextPageUrl } = await extractFullContent(url, siteinfo);

        dispatch({
            type: 'FULL_CONTENT_FETCHED',
            entryId,
            fullContent,
            nextPageUrl
        });
    }
}

function matches(pattern: string, str: string): boolean {
    try {
        return new RegExp(pattern).test(str);
    } catch (error) {
        return false;
    }
}

export function sendNotification(notification: Notification): AsyncEvent {
    if (!notification.id) {
        notification.id = Date.now();
    }

    return (dispatch) => {
        dispatch({
            type: 'NOTIFICATION_SENT',
            notification
        });

        if (notification.dismissAfter) {
            setTimeout(() => {
                dispatch(dismissNotification(notification.id));
            }, notification.dismissAfter);
        }
    };
}

export function dismissNotification(id: any): SyncEvent {
    return {
        type: 'NOTIFICATION_DISMISSED',
        id
    };
}

export function changeViewMode(viewMode: ViewMode): SyncEvent {
    return {
        type: 'VIEW_MODE_CHANGED',
        viewMode
    };
}

const LDR_FULL_FEED_TYPE_PRIORITIES: { [key: string]: number } = {
    'SBM': 3,
    'IND': 2,
    'INDIVIDUAL': 2,
    'SUB': 1,
    'SUBGENERAL': 1,
    'GEN': 0,
    'GENERAL': 0
};

function compareLdrFullFeedItem(x: WedataItem<LDRFullFeedData>, y: WedataItem<LDRFullFeedData>): number {
    const p1 = LDR_FULL_FEED_TYPE_PRIORITIES[x.data.type];
    const p2 = LDR_FULL_FEED_TYPE_PRIORITIES[y.data.type];
    if (p1 === p2) {
        return 0;
    }
    return p1 < p2 ? 1 : -1;
}

export function updateSiteinfo(): AsyncEvent {
    return async (dispatch, getState) => {
        const [autoPagerizeItems, ldrFullFeedItems] = await Promise.all([
            getAutoPagerizeItems(),
            getLDRFullFeedItems()
        ]);

        const primaryItems = autoPagerizeItems
            .map((item) => ({
                url: item.data.url,
                contentPath: item.data.pageElement,
                nextLinkPath: item.data.nextLink
            }));
        const secondaryItems = ldrFullFeedItems
            .sort(compareLdrFullFeedItem)
            .map((item) => ({
                url: item.data.url,
                contentPath: item.data.xpath,
                nextLinkPath: ''
            }));

        const siteinfo = {
            items: primaryItems.concat(secondaryItems),
            lastUpdatedAt: new Date().toISOString()
        };

        dispatch({
            type: 'SITEINFO_UPDATED',
            siteinfo
        });

        sendNotification({
            message: 'Siteinfo Updated',
            kind: 'positive'
        })(dispatch, getState);
    };
}
