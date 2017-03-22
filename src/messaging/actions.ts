import rss from 'json/rss.json';
import { AsyncEvent, Category, Entry, Event, ViewMode, Notification, Subscription } from 'messaging/types';

const SUBSCRIPTIONS: Subscription[] = [
    {
        subscriptionId: 1,
        categoryId: 1,
        feedId: '1',
        title: 'Entry',
        unreadCount: 123,
    },
    {
        subscriptionId: 2,
        categoryId: 1,
        feedId: '2',
        title: 'Really Very Long Title Entry',
        unreadCount: 0,
    },
    {
        subscriptionId: 3,
        categoryId: 1,
        feedId: '3',
        title: 'Entry',
        unreadCount: 1234,
    },
    {
        subscriptionId: 4,
        categoryId: 2,
        feedId: '4',
        title: 'Entry',
        unreadCount: 123,
    }
];

const CATEGORIES: Category[] = [
    {
        categoryId: 1,
        feedId: '101',
        name: 'Bike'
    },
    {
        categoryId: 2,
        feedId: '102',
        name: 'Programing'
    }
];

const ENTRIES: Entry[] = rss.items.map((item: any) => ({
    entryId: item.guid,
    author: item.author,
    content: item.content,
    description: item.description,
    publishedAt: item.pubDate,
    popularity: Math.random() * 100,
    title: item.title,
    url: item.link,
    origin: {
        feedId: rss.feed.url,
        title: rss.feed.title,
        url: rss.feed.link,
    },
    keepUnread: false
}));

const DEFAULT_DISMISS_AFTER = 3000;

const DELAY = 500;

export function markEntryAsRead(entryId: string, timestamp: Date): Event {
    return {
        type: 'ENTRY_MARKED_AS_READ',
        entryId,
        readAt: timestamp.toISOString()
    };
}

export function clearReadEntries(): Event {
    return {
        type: 'READ_ENTRIES_CLEARED'
    };
}

export function keepEntryAsUnread(entryId: string): Event {
    return {
        type: 'ENTRY_KEPT_AS_UNREAD',
        entryId
    };
}

export function saveReadEntries(entries: Entry[]): AsyncEvent {
    return (dispatch, getState) => {
        if (entries.length === 0) {
            return;
        }

        setTimeout(() => {
            const message = entries.length === 1
                ? `${entries.length} entry is marked as read.`
                : `${entries.length} entries are marked as read.`;

            sendNotification({
                message,
                kind: 'positive',
                dismissAfter: DEFAULT_DISMISS_AFTER
            })(dispatch, getState);
        }, DELAY);
    };
}

export function fetchSubscriptions(): AsyncEvent {
    return dispatch => {
        setTimeout(() => {
            dispatch({
                type: 'CATEGORIES_FETCHED',
                categories: CATEGORIES
            });

            dispatch({
                type: 'SUBSCRIPTIONS_FETCHED',
                subscriptions: SUBSCRIPTIONS
            });
        }, DELAY);
    };
}

export function fetchFeed(feedId: string): AsyncEvent {
    return (dispatch) => {
        dispatch({
            type: 'FEED_FETCHING',
            feedId: feedId
        });

        setTimeout(() => {
            dispatch({
                type: 'FEED_FETCHED',
                feed: {
                    feedId,
                    title: 'Feed title here',
                    entries: ENTRIES.map(entry => ({
                        ...entry,
                        entryId: entry.entryId + '.' + Date.now()
                    })),
                    hasMoreEntries: true,
                    isLoading: false
                }
            });
        }, DELAY);
    };
}

export function unselectFeed(): Event {
    return {
        type: 'FEED_UNSELECTED'
    };
}

export function sendNotification(notification: Notification): AsyncEvent {
    if (!notification.id) {
        notification.id = Date.now();
    }

    return dispatch => {
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

export function dismissNotification(id: any): Event {
    return {
        type: 'NOTIFICATION_DISMISSED',
        id
    };
}

export function changeViewMode(viewMode: ViewMode): Event {
    return {
        type: 'VIEW_MODE_CHANGED',
        viewMode
    };
}
