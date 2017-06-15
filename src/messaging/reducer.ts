import { State, Event } from 'messaging/types';

import categories from 'messaging/categories/reducer';
import combineReducers from 'utils/flux/combineReducers';
import credential from 'messaging/credential/reducer';
import notifications from 'messaging/notifications/reducer';
import search from 'messaging/search/reducer';
import sharedSiteinfo from 'messaging/sharedSiteinfo/reducer';
import streams from 'messaging/streams/reducer';
import subscriptions from 'messaging/subscriptions/reducer';
import trackingUrlPatterns from 'messaging/trackingUrlPatterns/reducer';
import user from 'messaging/user/reducer';
import userSiteinfo from 'messaging/userSiteinfo/reducer';
import ui from 'messaging/ui/reducer';

export default combineReducers<State, Event>({
    categories,
    credential,
    notifications,
    search,
    sharedSiteinfo,
    streams,
    subscriptions,
    trackingUrlPatterns,
    ui,
    user,
    userSiteinfo
});
