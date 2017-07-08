import React from 'react';

import SubscribeDropdown from 'components/parts/SubscribeDropdown';
import { Category, Feed, Subscription } from 'messaging/types';
import { addToCategory, removeFromCategory, subscribe, unsubscribe } from 'messaging/subscriptions/actions';
import { createCategory } from 'messaging/categories/actions';

interface FeedHeaderProps {
    categories: Category[];
    feed: Feed;
    numEntries: number;
    onAddToCategory: typeof addToCategory;
    onCreateCategory: typeof createCategory;
    onRemoveFromCategory: typeof removeFromCategory;
    onSubscribe: typeof subscribe;
    onUnsubscribe: typeof unsubscribe;
    subscription: Subscription | null;
}

const FeedHeader: React.SFC<FeedHeaderProps> = ({
    categories,
    feed,
    numEntries,
    onAddToCategory,
    onCreateCategory,
    onRemoveFromCategory,
    onSubscribe,
    onUnsubscribe,
    subscription
}: FeedHeaderProps) => {
    return (
        <header className="stream-header">
            <div className="container">
                <div className="u-flex u-flex-align-items-center u-flex-justify-content-between">
                    <div className="u-margin-right-2">
                        <div className="list-inline list-inline-dotted">
                            <div className="list-inline-item u-text-muted"><span className="u-text-x-large">{numEntries}</span> entries</div>
                            <div className="list-inline-item u-text-muted"><span className="u-text-x-large">{feed.subscribers}</span> subscribers</div>
                        </div>
                        <div>{feed.description}</div>
                        <div><a target="_blank" href={feed.feedUrl}>{feed.feedUrl}</a></div>
                    </div>
                    <SubscribeDropdown
                        categories={categories}
                        feed={feed}
                        onAddToCategory={onAddToCategory}
                        onCreateCategory={onCreateCategory}
                        onRemoveFromCategory={onRemoveFromCategory}
                        onSubscribe={onSubscribe}
                        onUnsubscribe={onUnsubscribe}
                        subscription={subscription} />
                </div>
            </div>
        </header>
    )
};

export default FeedHeader;